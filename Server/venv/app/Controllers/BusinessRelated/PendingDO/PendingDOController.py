import traceback
from datetime import datetime
from flask import jsonify, request
from app import app, db
import os
from sqlalchemy import text

from app.models.BusinessReleted.PendingDO.PendingDeliveryOrderModel import PendingDeliveryOrder

API_URL = os.getenv('API_URL')


def sync_pending_delivery_order_for_do(*, tenderdetailid, tenderid, doid, do_no,
                                        company_code, mill_code, mc, year_code,
                                        truck_no, driver_no, admin_user_id,
                                        bill_to_ac_code, bill_to_accoid,
                                        ship_to_ac_code, ship_to_accoid,
                                        mill_rate, ebuy_user_id,
                                        quantal, sale_rate, third_party_do=None):

    if not tenderdetailid:
        return

    tender_row = db.session.execute(
        text('''
            SELECT Grade, season,
                   gradeid, gradeCode, itemcode, ic, gstratecode,
                   Sauda_Date, Lifting_Date
            FROM dbo.qrytenderheaddetail
            WHERE tenderdetailid = :tenderdetailid
        '''),
        {'tenderdetailid': tenderdetailid}
    ).fetchone()
    if not tender_row:
        return

    now = datetime.now()
    quantal = quantal or 0
    sale_rate = sale_rate or 0

    field_values = {
        'tenderdetailid': tenderdetailid,
        'tenderid': tenderid,
        'ebuyUserID': ebuy_user_id,
        'company_code': company_code,
        'Sauda_Date': tender_row.Sauda_Date,
        'Lifting_Date': tender_row.Lifting_Date,
        'Grade': tender_row.Grade,
        'Season': tender_row.season,
        'Sale_Rate': sale_rate,
        'Purchase_Quintal': quantal,
        'Lifting_Quintal': quantal,
        'Amount': 0,
        'Narration': '',
        'BillTo_Ac_Code': bill_to_ac_code,
        'BillTo_Accoid': bill_to_accoid,
        'ShipTo_Ac_Code': ship_to_ac_code,
        'ShipTo_Accoid': ship_to_accoid,
        'gradeid': tender_row.gradeid,
        'gradeCode': tender_row.gradeCode,
        'MillRate': mill_rate,
        'TruckNo': truck_no,
        'DriverMobileNo': driver_no,
        'Item_Code': tender_row.itemcode,
        'ic': tender_row.ic,
        'Gst_Code': tender_row.gstratecode,
        'Mill_Code': mill_code,
        'mc': mc,
        'Year_Code': year_code,
        'AdminUserID': admin_user_id,
        'PersonId': 0,
        'doid': doid,
        'do_no': do_no,
        'Approved': 'Y',
        'DOc_Date': now,
        'Third_Party_Do': third_party_do,
    }

    # Matched by doid (unique per DO), not tenderdetailid - a single sauda
    # can be split across multiple DOs over time (e.g. 200 now, 300 later),
    # and each must get/keep its own mirror row rather than overwriting
    # whichever other DO's entry happens to share the same tenderdetailid.
    existing = PendingDeliveryOrder.query.filter_by(doid=doid).first()
    if existing:
        for key, value in field_values.items():
            setattr(existing, key, value)
    else:
        field_values['Adj_Quintal'] = 0
        field_values['Created_Date'] = now
        field_values['isLocked'] = False
        field_values['isDeleted'] = False
        db.session.add(PendingDeliveryOrder(**field_values))


@app.route(API_URL + "/get-pending-delivery-orders", methods=["GET"])
def get_pending_delivery_orders():
    try:
        query = text("""
            SELECT
                pendingDoid, tenderdetailid, tenderid, ebuyUserID,
                company_code, DOc_Date, Sauda_Date, Lifting_Date,
                Grade, Season, Sale_Rate, Purchase_Quintal,
                Lifting_Quintal, Adj_Quintal, Amount, Narration,
                BillTo_Ac_Code, BillTo_Accoid, ShipTo_Ac_Code, ShipTo_Accoid,
                Created_Date, gradeid, gradeCode, MillRate, TruckNo,
                DriverMobileNo, Item_Code, ic, Gst_Code,
                Mill_Code, mc, Approved, Year_Code
            FROM dbo.nt_1_PendingDeliveryOrder
            ORDER BY Created_Date DESC
        """)
        rows = db.session.execute(query).fetchall()
        data = [dict(row._mapping) for row in rows]
        return jsonify({"pending_orders": data}), 200
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/getByPendingDOId", methods=["GET"])
def getByPendingDOId():
    try:
        tenderdetailid = request.args.get('tenderdetailid')
        if tenderdetailid is None:
            return jsonify({'error': 'Missing tenderdetailid parameter'}), 400
        try:
            tenderdetailid = int(tenderdetailid)
        except ValueError:
            return jsonify({'error': 'Invalid tenderdetailid parameter'}), 400

        query = text("""
            SELECT
                pendingDoid, tenderdetailid, tenderid, ebuyUserID,
                company_code, DOc_Date, Sauda_Date, Lifting_Date,
                Grade, Season, Sale_Rate, Purchase_Quintal,
                Lifting_Quintal, Adj_Quintal, Amount, Narration,
                BillTo_Ac_Code, BillTo_Accoid, ShipTo_Ac_Code, ShipTo_Accoid,
                Created_Date, gradeid, gradeCode, MillRate, TruckNo,
                DriverMobileNo, Item_Code, ic, Gst_Code,
                Mill_Code, mc, Approved, Year_Code,
                pendingDoid AS orderid
            FROM dbo.nt_1_PendingDeliveryOrder
            WHERE tenderdetailid = :tenderdetailid
        """)
        row = db.session.execute(query, {'tenderdetailid': tenderdetailid}).fetchone()
        if row is None:
            return jsonify({'error': 'Record not found'}), 404
        return jsonify({"last_head_data": dict(row._mapping)}), 200
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/getdata-Pending_DO", methods=["GET"])
def getdata_Pending_DO():
    try:
        company_code = request.args.get('company_code')
        if not company_code:
            return jsonify({"error": "Missing company_code parameter"}), 400

        query = text("""
            SELECT TOP (100) PERCENT
                dbo.qrytenderdobalanceview.Tender_No,
                dbo.qrytenderdobalanceview.Tender_DateConverted  AS Tender_Date,
                dbo.qrytenderdobalanceview.buyername             AS Party2,
                dbo.qrytenderdobalanceview.buyerpartyname        AS Party,
                dbo.qrytenderdobalanceview.Mill_Rate,
                ISNULL(CONVERT(NVARCHAR(200), dbo.qrytenderdobalanceview.Grade), N'') +
                    CASE WHEN NULLIF(CONVERT(NVARCHAR(200), dbo.nt_1_systemmaster.System_Name_E), N'') IS NULL
                         THEN N''
                         ELSE N' - ' + CONVERT(NVARCHAR(200), dbo.nt_1_systemmaster.System_Name_E)
                    END                                          AS Grade,
                dbo.qrytenderdobalanceview.Sale_Rate,
                dbo.qrytenderdobalanceview.Buyer_Quantal,
                dbo.qrytenderdobalanceview.DESPATCH,
                dbo.qrytenderdobalanceview.BALANCE,
                dbo.qrytenderdobalanceview.tenderdoname          AS doname,
                dbo.qrytenderdobalanceview.Lifting_DateConverted AS Lifting_Date,
                dbo.qrytenderdobalanceview.ID,
                dbo.qrytenderdobalanceview.tenderdetailid,
                dbo.qrytenderdobalanceview.tenderid,
                dbo.qrytenderdobalanceview.Delivery_Type,
                dbo.qrytenderdobalanceview.shiptoname,
                dbo.qrytenderdobalanceview.tenderdoshortname,
                dbo.qrytenderdobalanceview.season,
                ISNULL(dbo.qrytenderdobalanceview.Purchase_Rate,
                       dbo.qrytenderdobalanceview.Party_Bill_Rate) AS Party_Bill_Rate,
                dbo.qrytenderdobalanceview.gradeid,
                dbo.qrytenderdobalanceview.gradeCode,
                CASE WHEN dbo.qrytenderdobalanceview.MillRate = 0
                     THEN dbo.qrytenderdobalanceview.Mill_Rate
                     ELSE dbo.qrytenderdobalanceview.MillRate
                END                                              AS MillRate,
                dbo.qrytenderdobalanceview.millshortname,
                dbo.qrytenderdobalanceview.Lifting_Date          AS LiftingDate,
                -- From PendingDeliveryOrder (only what is needed):
                dbo.nt_1_PendingDeliveryOrder.Purchase_Quintal,
                dbo.nt_1_PendingDeliveryOrder.Lifting_Quintal,
                dbo.nt_1_PendingDeliveryOrder.BillTo_Ac_Code,
                dbo.nt_1_PendingDeliveryOrder.BillTo_Accoid,
                dbo.nt_1_PendingDeliveryOrder.ShipTo_Ac_Code,
                dbo.nt_1_PendingDeliveryOrder.ShipTo_Accoid,
                dbo.nt_1_PendingDeliveryOrder.Created_Date,
                dbo.nt_1_PendingDeliveryOrder.TruckNo,
                dbo.nt_1_PendingDeliveryOrder.DriverMobileNo,
                dbo.nt_1_PendingDeliveryOrder.Approved,
                dbo.nt_1_PendingDeliveryOrder.doid       AS pending_doid,
                dbo.nt_1_PendingDeliveryOrder.do_no      AS pending_do_no,
                dbo.nt_1_PendingDeliveryOrder.Narration  AS Note,
                billTo.Ac_Name_E                                 AS BillTo_Name,
                shipTo.Ac_Name_E                                 AS ShipTo_Name,
                dbo.nt_1_PendingDeliveryOrder.pendingDoid
            FROM dbo.qrytenderdobalanceview
            INNER JOIN dbo.nt_1_PendingDeliveryOrder
                ON dbo.qrytenderdobalanceview.tenderdetailid = dbo.nt_1_PendingDeliveryOrder.tenderdetailid
            LEFT OUTER JOIN dbo.nt_1_systemmaster
                ON dbo.qrytenderdobalanceview.gradeid = dbo.nt_1_systemmaster.systemid
            LEFT JOIN dbo.nt_1_accountmaster billTo
                ON dbo.nt_1_PendingDeliveryOrder.BillTo_Ac_Code = billTo.Ac_Code
            LEFT JOIN dbo.nt_1_accountmaster shipTo
                ON dbo.nt_1_PendingDeliveryOrder.ShipTo_Ac_Code = shipTo.Ac_Code
            WHERE (dbo.qrytenderdobalanceview.BALANCE <> 0) AND Approved != 'Y' And isDeleted != '1' And isLocked != '1'
              AND (dbo.qrytenderdobalanceview.Company_Code = :company_code)
            ORDER BY dbo.qrytenderdobalanceview.Tender_No DESC
        """)
        rows = db.session.execute(query, {'company_code': company_code}).fetchall()
        return jsonify({"all_data": [dict(row._mapping) for row in rows]}), 200
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# Create / Update / Delete for nt_1_PendingDeliveryOrder.
#
# Request body for create-pending-delivery-order uses the target column names
# directly (Grade, Sale_Rate, BillTo_Ac_Code, etc.) - the caller is expected to
# map from whatever source it has (e.g. getTenderNo_Data's last_details_data
# row) onto these names before sending. Fields not resolvable from any
# existing API response (TruckNo, DriverMobileNo, Payment_Details, Narration,
# Adj_Quintal, AdminUserID, PersonId) are accepted directly from the request.
# ─────────────────────────────────────────────────────────────────────────────

_PENDING_DO_EDITABLE_FIELDS = [
    'tenderdetailid', 'tenderid', 'ebuyUserID', 'company_code',
    'Sauda_Date', 'Lifting_Date', 'Grade', 'Season', 'Sale_Rate',
    'Purchase_Quintal', 'Lifting_Quintal', 'Adj_Quintal', 'Amount',
    'Narration', 'BillTo_Ac_Code', 'BillTo_Accoid', 'ShipTo_Ac_Code',
    'ShipTo_Accoid', 'gradeid', 'gradeCode', 'MillRate', 'TruckNo',
    'DriverMobileNo', 'Item_Code', 'ic', 'Gst_Code', 'Mill_Code', 'mc',
    'Year_Code', 'Payment_Details', 'AdminUserID', 'PersonId',
]


@app.route(API_URL + "/create-pending-delivery-order", methods=["POST"])
def create_pending_delivery_order():
    try:
        data = request.get_json() or {}

        record_data = {k: data.get(k) for k in _PENDING_DO_EDITABLE_FIELDS if k in data}

        # Adj_Quintal has no source elsewhere - defaults to 0 unless supplied.
        if record_data.get('Adj_Quintal') is None:
            record_data['Adj_Quintal'] = 0

        # Amount = Sale_Rate * Lifting_Quintal unless the caller already
        # computed/overrode it.
        if record_data.get('Amount') is None:
            sale_rate = record_data.get('Sale_Rate') or 0
            lifting_quintal = record_data.get('Lifting_Quintal') or 0
            record_data['Amount'] = float(sale_rate) * float(lifting_quintal)

        # AdminUserID/PersonId both refer to the creating user - fall back to
        # whichever one was actually provided.
        if record_data.get('PersonId') is None:
            record_data['PersonId'] = record_data.get('AdminUserID')
        if record_data.get('AdminUserID') is None:
            record_data['AdminUserID'] = record_data.get('PersonId')

        now = datetime.now()
        record_data['DOc_Date'] = now
        record_data['Created_Date'] = now
        record_data['Approved'] = 'N'
        record_data['isLocked'] = False
        record_data['isDeleted'] = False

        new_pending_do = PendingDeliveryOrder(**record_data)
        db.session.add(new_pending_do)
        db.session.commit()

        return jsonify({
            "message": "Pending Delivery Order created successfully",
            "data": new_pending_do.to_dict(),
        }), 201
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/update-pending-delivery-order", methods=["PUT"])
def update_pending_delivery_order():
    try:
        pending_doid = request.args.get('pendingDoid')
        if not pending_doid:
            return jsonify({"error": "Missing pendingDoid parameter"}), 400

        existing = PendingDeliveryOrder.query.filter_by(pendingDoid=pending_doid).first()
        if not existing:
            return jsonify({"error": "Pending Delivery Order not found"}), 404

        data = request.get_json() or {}
        for field in _PENDING_DO_EDITABLE_FIELDS:
            if field in data:
                setattr(existing, field, data[field])

        db.session.commit()

        return jsonify({
            "message": "Pending Delivery Order updated successfully",
            "data": existing.to_dict(),
        }), 200
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/delete-pending-delivery-order", methods=["DELETE"])
def delete_pending_delivery_order():
    try:
        pending_doid = request.args.get('pendingDoid')
        if not pending_doid:
            return jsonify({"error": "Missing pendingDoid parameter"}), 400

        existing = PendingDeliveryOrder.query.filter_by(pendingDoid=pending_doid).first()
        if not existing:
            return jsonify({"error": "Pending Delivery Order not found"}), 404

        # Soft delete - the table already has an isDeleted flag and the
        # existing read queries already filter isDeleted != '1', so this
        # keeps the row for audit purposes instead of removing it outright.
        existing.isDeleted = True
        db.session.commit()

        return jsonify({"message": "Pending Delivery Order deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
