"""
Sauda Shifting - a standalone feature to move a sauda (tender detail) entry
from one tender to another via drag-and-drop, without disturbing the
existing Tender Purchase / Sauda Book Utility controllers.

The tenderdetailid primary key is left untouched on shift - it's referenced
(as a plain, app-enforced, non-FK integer column) by Delivery Order,
Pending Delivery Order and Receipt/Payment records, so reassigning it to a
new value would silently orphan all of those. Only `tenderid`/`Tender_No`
(which tender the entry belongs to) and `ID` (the entry's per-tender serial
number, recomputed as max(ID for target tender) + 1, the same convention
already used when a sauda is first created) are changed. Every other field
on the row - buyer, rate, quantity, dates, etc. - is left exactly as-is.

Tender balance is never a stored column anywhere in this app (confirmed in
TenderPurchaseController.py's own balance queries) - it's always computed
live as Buyer_Quantal minus dispatched Delivery Order quantity, summed per
tender. So moving a row's tenderid and re-querying both tenders is by
itself a correct balance update - both sides just need to be re-fetched
after a shift.
"""
import os
import json
from datetime import datetime, timedelta, timezone
from flask import jsonify, request
from sqlalchemy import text
from app import app, db, socketio
from app.models.BusinessReleted.TenderPurchase.TenderPurchaseModels import TenderHead, TenderDetails, TenderGradeDetails
from app.models.BusinessReleted.DeliveryOrder.DeliveryOrderModels import DeliveryOrderHead
from sqlalchemy import or_

API_URL = os.getenv('API_URL')

EBUY_SUGAR_AC_CODE = os.getenv('EBUY_SUGAR_AC_CODE')


SHIFTING_DETAILS_QUERY = '''
SELECT td.tenderdetailid, td.ID, td.tenderid, td.Tender_No, td.Company_Code, td.year_code,
       td.Buyer, td.Buyer_Quantal, td.Sale_Rate, td.Purchase_Rate, td.Commission_Rate,
       td.Sauda_Date, td.Lifting_Date, td.Narration, td.gradeCode, td.gradeid,
       buyerAcc.Ac_Name_E AS buyername, buyerPartyAcc.Ac_Name_E AS buyerpartyname,
       gradeMaster.System_Name_E AS gradeName,
       ISNULL((SELECT SUM(do.quantal) FROM dbo.nt_1_deliveryorder do WHERE do.tenderdetailid = td.tenderdetailid), 0) AS Despatched
FROM dbo.nt_1_tenderdetails td
LEFT OUTER JOIN dbo.qrymstaccountmaster buyerAcc ON td.buyerid = buyerAcc.accoid
LEFT OUTER JOIN dbo.qrymstaccountmaster buyerPartyAcc ON td.buyerpartyid = buyerPartyAcc.accoid
LEFT OUTER JOIN dbo.nt_1_systemmaster gradeMaster ON td.gradeid = gradeMaster.systemid
WHERE td.tenderid = :tenderid AND td.ID <> 1
ORDER BY td.ID
'''

HEAD_NAMES_QUERY = '''
SELECT Mill.Ac_Name_E AS MillName, PaymentTo.Ac_Name_E AS PaymentToName
FROM dbo.nt_1_tender t
LEFT OUTER JOIN dbo.qrymstaccountmaster Mill ON t.mc = Mill.accoid
LEFT OUTER JOIN dbo.qrymstaccountmaster PaymentTo ON t.pt = PaymentTo.accoid
WHERE t.tenderid = :tenderid
'''


SELF_BALANCE_QUERY = '''
SELECT t.Quantal,
       ISNULL(SUM(v.soldebuy), 0) AS soldebuy,
       ISNULL(SUM(v.saudaqntl), 0) AS saudaqntl
FROM dbo.nt_1_tender t
LEFT OUTER JOIN dbo.qryebuysalesaudadetail v ON t.tenderid = v.tenderid
WHERE t.tenderid = :tenderid
GROUP BY t.Quantal
'''

EBUY_AWAY_QUERY = '''
SELECT ISNULL(SUM(Buyer_Quantal), 0) AS away_qty
FROM dbo.nt_1_tenderdetails
WHERE ebuyid = :ebuyid AND tenderid <> :tenderid
'''

ACCOUNT_NAME_QUERY = '''
SELECT Ac_Name_E FROM dbo.qrymstaccountmaster WHERE accoid = :accoid
'''

GRADE_SHORT_NAME_QUERY = '''
SELECT System_Name_E FROM dbo.nt_1_systemmaster WHERE systemid = :gradeid
'''

IST = timezone(timedelta(hours=5, minutes=30))


def _account_name(accoid):
    if not accoid:
        return None
    row = db.session.execute(text(ACCOUNT_NAME_QUERY), {"accoid": accoid}).fetchone()
    return row.Ac_Name_E if row else None


def _grade_short_name(gradeid):
    if not gradeid:
        return None
    row = db.session.execute(text(GRADE_SHORT_NAME_QUERY), {"gradeid": gradeid}).fetchone()
    return row.System_Name_E if row else None


def _load_remark(head):
    """head.Remark is a single NVARCHAR(MAX) JSON blob: {"Shift": [...],
    "Received": [...]}. Empty/invalid/missing all resolve to an empty
    structure rather than raising, since this field is purely additive."""
    if not head.Remark:
        return {"Shift": [], "Received": []}
    try:
        data = json.loads(head.Remark)
    except (TypeError, ValueError):
        return {"Shift": [], "Received": []}
    data.setdefault("Shift", [])
    data.setdefault("Received", [])
    return data


def _append_shift_entry(source_head, target_head, tenderdetailid, quantity, gradeid, shifted_by, shifted_at, sale_rate):
    remark = _load_remark(source_head)
    remark["Shift"].append({
        "Tender_No": target_head.Tender_No,
        "tenderdetailid": tenderdetailid,
        "Grade": _grade_short_name(gradeid),
        "Quantity": quantity,
        "Sale_Rate": sale_rate,
        "ShiftedOn": shifted_at.strftime('%Y-%m-%d'),
        "ShiftedTime": shifted_at.strftime('%H:%M:%S'),
        "ShiftedBy": shifted_by,
        "Payment_To": _account_name(target_head.pt),
    })
    source_head.Remark = json.dumps(remark)


def _append_received_entry(source_head, target_head, tenderdetailid, quantity, gradeid, shifted_by, shifted_at, sale_rate):
    remark = _load_remark(target_head)
    remark["Received"].append({
        "Tender_No": source_head.Tender_No,
        "tenderdetailid": tenderdetailid,
        "Grade": _grade_short_name(gradeid),
        "Quantity": quantity,
        "Sale_Rate": sale_rate,
        "ShiftedOn": shifted_at.strftime('%Y-%m-%d'),
        "ShiftedTime": shifted_at.strftime('%H:%M:%S'),
        "ShiftedBy": shifted_by,
        "Payment_To": _account_name(source_head.pt),
    })
    target_head.Remark = json.dumps(remark)


def _serialize_remarks(head):
    """Exposed under the same ShiftedOut/ReceivedIn API keys the frontend
    already reads (built from SaudaShiftLog before) - only where this data
    lives underneath changed, not the response shape."""
    remark = _load_remark(head)
    shifted_out = []
    for i, entry in enumerate(remark["Shift"]):
        shifted_out.append({
            "id": f"shift-{head.tenderid}-{i}",
            **entry,
            "remark": f"{entry.get('Quantity', 0):g} Quintal shifted to Tender {entry.get('Tender_No')} - Payment as per this Tender's Date/Quintal.",
        })
    received_in = []
    for i, entry in enumerate(remark["Received"]):
        received_in.append({
            "id": f"received-{head.tenderid}-{i}",
            **entry,
            "reference_remark": f"{entry.get('Quantity', 0):g} Quintal received from Tender {entry.get('Tender_No')} - Payment as per that Tender's Date/Quintal.",
        })
    return {"ShiftedOut": shifted_out, "ReceivedIn": received_in}


def _compute_self_balance(tenderid):
    self_row = db.session.execute(text(SELF_BALANCE_QUERY), {"tenderid": tenderid}).fetchone()
    if not self_row:
        return 0.0
    self_data = dict(self_row._mapping)
    return (
        float(self_data.get('Quantal') or 0)
        + float(self_data.get('soldebuy') or 0)
        - float(self_data.get('saudaqntl') or 0)
    )


def _serialize_head(head):
    data = {column.name: getattr(head, column.name) for column in head.__table__.columns}
    if data.get('Tender_Date'):
        data['Tender_Date'] = data['Tender_Date'].strftime('%Y-%m-%d')
    if data.get('Lifting_Date'):
        data['Lifting_Date'] = data['Lifting_Date'].strftime('%Y-%m-%d')

    names_row = db.session.execute(text(HEAD_NAMES_QUERY), {"tenderid": head.tenderid}).fetchone()
    if names_row:
        names = dict(names_row._mapping)
        data['MillName'] = names.get('MillName')
        data['PaymentToName'] = names.get('PaymentToName')

    return data


def _serialize_tender_for_shifting(tenderid):
    head = TenderHead.query.filter_by(tenderid=tenderid).first()
    if not head:
        return None

    rows = db.session.execute(text(SHIFTING_DETAILS_QUERY), {"tenderid": tenderid}).fetchall()
    details = []
    total_balance = 0.0
    for row in rows:
        r = dict(row._mapping)
        buyer_quantal = float(r.get('Buyer_Quantal') or 0)
        is_ebuy_row = r.get('Buyer') is not None and str(r.get('Buyer')) == str(EBUY_SUGAR_AC_CODE)
        if is_ebuy_row:
            away_row = db.session.execute(
                text(EBUY_AWAY_QUERY), {"ebuyid": r.get('tenderdetailid'), "tenderid": tenderid}
            ).fetchone()
            away_qty = float(away_row.away_qty or 0) if away_row else 0.0
            buyer_quantal -= away_qty

        despatched = float(r.get('Despatched') or 0)
        balance = buyer_quantal - despatched
        total_balance += balance
        details.append({
            "tenderdetailid": r.get('tenderdetailid'),
            "ID": r.get('ID'),
            "tenderid": r.get('tenderid'),
            "Tender_No": r.get('Tender_No'),
            "Company_Code": r.get('Company_Code'),
            "year_code": r.get('year_code'),
            "Buyer": r.get('Buyer'),
            "IsEbuySugarEntry": is_ebuy_row,
            "Buyer_Quantal": buyer_quantal,
            "Sale_Rate": float(r.get('Sale_Rate')) if r.get('Sale_Rate') is not None else None,
            "Purchase_Rate": float(r.get('Purchase_Rate')) if r.get('Purchase_Rate') is not None else None,
            "Commission_Rate": float(r.get('Commission_Rate')) if r.get('Commission_Rate') is not None else None,
            "Sauda_Date": r.get('Sauda_Date').strftime('%Y-%m-%d') if r.get('Sauda_Date') else None,
            "Lifting_Date": r.get('Lifting_Date').strftime('%Y-%m-%d') if r.get('Lifting_Date') else None,
            "Narration": r.get('Narration'),
            "BuyerName": r.get('buyername'),
            "BuyerPartyName": r.get('buyerpartyname'),
            "gradeCode": r.get('gradeCode'),
            "gradeid": r.get('gradeid'),
            "GradeName": f"{r.get('gradeCode')} - {r.get('gradeName')}" if r.get('gradeid') else None,
            "Despatched": despatched,
            "Balance": balance,
        })

    self_balance = _compute_self_balance(tenderid)

    return {
        "head": _serialize_head(head),
        "details": details,
        "TotalBalance": total_balance,
        "SelfBalance": self_balance,
        **_serialize_remarks(head),
    }


def _grade_exists_in_tender(target_tenderid, gradeid):
    """Whether nt_1_tenderGradeDetails (per-tender) already has this grade
    set up in the target tender. A shift is blocked, not auto-fixed, when
    it doesn't - see the grade check in shift_sauda_entry."""
    if not gradeid:
        return True
    return TenderGradeDetails.query.filter_by(
        tenderid=target_tenderid, gradeid=gradeid
    ).first() is not None


@app.route(API_URL + '/get-tender-for-shifting', methods=['GET'])
def get_tender_for_shifting():
    try:
        tender_no = request.args.get('Tender_No')
        company_code = request.args.get('Company_Code')
        if not tender_no or not company_code:
            return jsonify({'error': 'Tender_No and Company_Code are required'}), 400

        head = TenderHead.query.filter_by(Tender_No=tender_no, Company_Code=company_code).first()
        if not head:
            return jsonify({'error': f'No tender found for Tender No {tender_no}'}), 404

        return jsonify(_serialize_tender_for_shifting(head.tenderid)), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500


@app.route(API_URL + '/shift-sauda-entry', methods=['POST'])
def shift_sauda_entry():
    try:
        data = request.get_json()
        tenderdetailid = data.get('tenderdetailid')
        target_tenderid = data.get('target_tenderid')
        shifted_by = data.get('shifted_by') or 'Unknown'

        if not tenderdetailid or not target_tenderid:
            return jsonify({'error': 'tenderdetailid and target_tenderid are required'}), 400

        detail = TenderDetails.query.filter_by(tenderdetailid=tenderdetailid).first()
        if not detail:
            return jsonify({'error': f'Sauda entry {tenderdetailid} not found'}), 404

        if detail.ID == 1:
            return jsonify({'error': "This is the tender's own base entry and cannot be shifted"}), 400

        if EBUY_SUGAR_AC_CODE and str(detail.Buyer) == str(EBUY_SUGAR_AC_CODE):
            return jsonify({'error': 'eBuy Sugar entries cannot be shifted directly - shift the real buyer entry sold against it instead'}), 400

        if detail.tenderid == target_tenderid:
            return jsonify({'error': 'Source and target tender are the same'}), 400

        target_head = TenderHead.query.filter_by(tenderid=target_tenderid).first()
        if not target_head:
            return jsonify({'error': 'Target tender not found'}), 404

        existing_do = DeliveryOrderHead.query.filter(
            or_(
                DeliveryOrderHead.tenderdetailid == tenderdetailid,
                DeliveryOrderHead.tenderdetailid1 == tenderdetailid,
            )
        ).first()
        if existing_do:
            return jsonify({
                'error': f'This sauda entry already has Delivery Order No {existing_do.doc_no} created against it and cannot be shifted'
            }), 409

        source_tenderid = detail.tenderid
        source_head = TenderHead.query.filter_by(tenderid=source_tenderid).first()
        if not source_head:
            return jsonify({'error': 'Source tender not found'}), 404

        # Mill Match - both tenders must be against the same mill.
        if source_head.mc != target_head.mc:
            return jsonify({'error': 'Mill is different for these two tenders - cannot shift between them'}), 400

        # Main Grade Match - the tender-level Grade of both tenders must match.
        if (source_head.Grade or '') != (target_head.Grade or ''):
            return jsonify({'error': 'Main grade is different for these two tenders - cannot shift between them'}), 400

        # Tender Detail Grade Check - the shifted sauda's own grade must
        # already exist in the destination tender (no longer auto-created).
        if not _grade_exists_in_tender(target_tenderid, detail.gradeid):
            return jsonify({'error': 'This Grade is not present in other tender Please add and then Shift this sauda.'}), 400

        # Quantity Validation - can't shift more than the destination
        # tender's own current self quantity.
        shifted_qty = float(detail.Buyer_Quantal or 0)
        target_self_balance = _compute_self_balance(target_tenderid)
        if shifted_qty > target_self_balance:
            return jsonify({
                'error': f'Destination tender self quantity ({target_self_balance:g}) is less than the quantity being shifted ({shifted_qty:g})'
            }), 400

        max_id = db.session.query(db.func.max(TenderDetails.ID)).filter_by(tenderid=target_tenderid).scalar() or 0

        detail.tenderid = target_tenderid
        detail.Tender_No = target_head.Tender_No
        detail.Company_Code = target_head.Company_Code
        detail.year_code = target_head.Year_Code
        detail.ID = max_id + 1

        shifted_at = datetime.now(IST)
        sale_rate = float(detail.Sale_Rate) if detail.Sale_Rate is not None else None
        _append_shift_entry(source_head, target_head, tenderdetailid, shifted_qty, detail.gradeid, shifted_by, shifted_at, sale_rate)
        _append_received_entry(source_head, target_head, tenderdetailid, shifted_qty, detail.gradeid, shifted_by, shifted_at, sale_rate)

        db.session.commit()

        source_data = _serialize_tender_for_shifting(source_tenderid)
        target_data = _serialize_tender_for_shifting(target_tenderid)

        socketio.emit('sauda_shifted', {
            'tenderdetailid': tenderdetailid,
            'source_tenderid': source_tenderid,
            'target_tenderid': target_tenderid,
        })

        return jsonify({
            'message': 'Sauda entry shifted successfully',
            'source': source_data,
            'target': target_data,
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500
