import traceback
from flask import Flask, jsonify, request
from app import app, db, socketio
from app import app, db
from app.models.BusinessReleted.DeliveryOrder.DeliveryOrderModels import (
    DeliveryOrderHead, DeliveryOrderDetail,
)
from app.models.Reports.GLedeger.GLedgerModels import Gledger
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func
import os
import requests
import logging

from app.models.BusinessReleted.TenderPurchase.TenderPurchaseModels import (
    TenderHead, TenderDetails,
)
import asyncio
import aiohttp
from app.models.BusinessReleted.DeliveryOrder.DeliveryOrderSchema import (
    DeliveryOrderHeadSchema, DeliveryOrderDetailSchema,
)
from app.Controllers.BusinessRelated.PendingDO.PendingDOController import (
    sync_pending_delivery_order_for_do,
)
from app.Controllers.BusinessRelated.DeliveryOrder.CommonDeliveryOrder import (
    get_max_doc_no,
    async_post,
    async_put,
    async_delete,
    genrate_gledger_entries,
    get_balances_for_multiple_accounts,
    get_accoid_cached,
    get_ac_name_cached,
    clear_lookup_caches,
    rollback_gledger,
    rollback_purchase_bill,
    rollback_sale_bill,
    rollback_commission_bill,
    rollback_tender_stock,
)


from app.utils.CommonGLedgerFunctions import (
    fetch_company_parameters,
    get_accoid,
    getPurchaseAc,
    getSaleAc,
    get_acShort_Name,
    get_ac_Name,
)


from app.models.Outword.CommissionBill.CommissionBillModel import CommissionBill

from app.models.Outword.SaleBill.SaleBillModels import SaleBillHead, SaleBillDetail
from app.models.Inword.PurchaseBill.PurchaseBillModels import SugarPurchase, SugarPurchaseDetail
from app.utils.CommonGLedgerFunctions import (
    fetch_company_parameters,
    get_accoid,
    getPurchaseAc,
    getSaleAc,
    get_acShort_Name,
    get_ac_Name,
)


from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry
from decimal import Decimal
 
API_URL = os.getenv('API_URL')
API_SERVER = os.getenv('API_URL_SERVER')
 
# ── schemas ──────────────────────────────────────────────────────────────────
task_head_schema = DeliveryOrderHeadSchema()
task_head_schemas = DeliveryOrderHeadSchema(many=True)
task_detail_schema = DeliveryOrderDetailSchema()
task_detail_schemas = DeliveryOrderDetailSchema(many=True)
 
# ── fields to strip before persisting headData ───────────────────────────────
_REMOVE_HEAD_KEYS = [
    'TaxableAmountForSB', 'cgstrate', 'sgstrate', 'igstrate', 'cgstamt',
    'sgstamt', 'igstamt', 'SaleDetail_Rate', 'SB_freight', 'SB_SubTotal',
    'SB_Less_Frt_Rate', 'TotalGstSaleBillAmount', 'Roundoff', 'SBTCSAmt',
    'Net_Payble', 'SBTDSAmt', 'save', 'sale', 'item_Amount', 'SB_Ac_Code',
    'SB_Unit_Code', 'PS_CGSTAmount', 'PS_SGSTAmount', 'PS_IGSTAmount',
    'PS_CGSTRATE', 'PS_SGSTRATE', 'PS_IGSTRATE', 'TOTALPurchase_Amount',
    'PSTCS_Amt', 'PSTDS_Amt', 'PSNetPayble', 'PS_SelfBal', 'PS_amount',
    'lblgetpasscodename', 'lblvoucherByname', 'Gst_Rate', 'AutopurchaseBill',
    'LV_CGSTAmount', 'LV_SGSTAmount', 'LV_IGSTAmount', 'LV_TotalAmount',
    'LV_TCSRate', 'LV_NETPayble', 'LV_TCSAmt', 'LV_TDSRate', 'LV_TDSAmt',
    'LV_Igstrate', 'LV_Cgstrate', 'LV_taxableamount', 'LV_Sgstrate',
    'LV_Commision_Amt', 'LV_tender_Commision_Amt', 'gstratename', 'Gstrate',
    'lblitemname', 'newbroker', 'lblbrokername', 'lblMemoGSTRatename',
    'newMemoGSTRate', 'SaleBillByName', 'VoucherByName', 'MillByName',
    'GetPassByName', 'voucherTitle', 'salebillTitle', 'brokerTitle',
    'getpassTitle', 'carporatenameTitle', 'newcarporate_ac', 'PDSType',
    'PDSParty', 'bill_to', 'PDSUnit', 'lblsalebilltoname', 'newGETPASSCODE',
    'lblBilltostatename', 'CarporatestatecodeGSTStateCode', 'VoucherByCode',
    'SaleBillByCode', 'voucherbystatename',
]
 
TASK_DETAILS_QUERY = '''
SELECT        dbo.nt_1_deliveryorder.mill_code, dbo.nt_1_deliveryorder.transport,
              dbo.nt_1_deliveryorder.GETPASSCODE, dbo.nt_1_deliveryorder.SaleBillTo,
              dbo.nt_1_deliveryorder.mc, dbo.nt_1_deliveryorder.gp,
              dbo.nt_1_deliveryorder.st, dbo.nt_1_deliveryorder.sb,
              dbo.nt_1_deliveryorder.tc,
              mill.Ac_Code AS millacode, mill.Ac_Name_E AS millname, mill.accoid AS millacid,
              shipto.accoid AS shiptoacid, shipto.Ac_Code AS shiptoaccode,
              salebillto.accoid AS salebillacid, salebillto.Ac_Code AS salebillaccode,
              salebillto.Ac_Name_E AS salebillname,
              transport.accoid AS transportacid, transport.Ac_Code AS transportaccode,
              transport.Ac_Name_E AS transportname,
              getpass.accoid AS getpassacid, getpass.Ac_Code AS getpassAccode,
              getpass.Ac_Name_E AS getpassname,
              nt_1_systemmaster_1.System_Code AS Item_Code,
              nt_1_systemmaster_1.System_Name_E AS itemname,
              dbo.nt_1_deliveryorder.ic, dbo.nt_1_deliveryorder.itemcode,
              nt_1_systemmaster_1.systemid,
              dbo.nt_1_deliveryorder.gstid, gstrate.gstid AS gst_Id,
              dbo.nt_1_deliveryorder.GstRateCode, gstrate.Doc_no AS gstdocno,
              gstrate.Rate AS Gstrate,
              dbo.nt_1_deliveryorder.TDSAc, dbo.nt_1_deliveryorder.TDSAcId,
              tdsac.accoid, tdsac.Ac_Code AS tdsaccode, tdsac.Ac_Name_E AS tdsacname,
              dbo.nt_1_deliveryorder.bk, dbo.nt_1_deliveryorder.broker,
              broker.accoid AS brokerid, broker.Ac_Code AS brokeraccode,
              broker.Ac_Name_E AS brokername,
              dbo.nt_1_deliveryorder.CashDiffAc, dbo.nt_1_deliveryorder.CashDiffAcId,
              cashdiffac.Ac_Code AS cashdiffaccode,
              cashdiffac.Ac_Name_E AS cashdiffacname, cashdiffac.accoid AS Expr1,
              dbo.nt_1_deliveryorder.brandcode, dbo.Brand_Master.Code,
              dbo.Brand_Master.Marka AS brandname,
              dbo.nt_1_dodetails.Bank_Code,
              bank.accoid AS bankacid, bank.Ac_Code AS bankaccode,
              bank.Ac_Name_E AS bankname,
              dbo.nt_1_dodetails.detail_Id, dbo.nt_1_dodetails.ddType,
              dbo.nt_1_dodetails.Narration, dbo.nt_1_dodetails.Amount,
              dbo.nt_1_dodetails.UTR_NO, dbo.nt_1_dodetails.DO_No,
              dbo.nt_1_dodetails.UtrYearCode, dbo.nt_1_dodetails.LTNo,
              dbo.nt_1_dodetails.doid, dbo.nt_1_dodetails.dodetailid,
              dbo.nt_1_dodetails.bc, dbo.nt_1_dodetails.utrdetailid,
              dbo.nt_1_dodetails.UtrCompanyCode,
              dbo.nt_1_deliveryorder.Vasuli_Ac, dbo.nt_1_deliveryorder.va,
              vasuliac.accoid AS vasuliacid, vasuliac.Ac_Code AS vasuliaccode,
              vasuliac.Ac_Name_E AS vasuliacname,
              dbo.nt_1_deliveryorder.MillGSTStateCode,
              millstatecode.State_Name AS millstatename,
              millstatecode.State_Code AS millstatecode,
              dbo.nt_1_deliveryorder.VoucherbyGstStateCode,
              voucherbystatecode.State_Code AS voucherbystatecode,
              voucherbystatecode.State_Name AS vaoucherbystatename,
              dbo.nt_1_deliveryorder.SalebilltoGstStateCode,
              salebillstatecode.State_Code AS salebilltostatecode,
              salebillstatecode.State_Name AS salebilltostatename,
              dbo.nt_1_deliveryorder.TransportGSTStateCode,
              transportstatecode.State_Code AS transportstatecode,
              transportstatecode.State_Name AS transportstatename,
              dbo.nt_1_deliveryorder.GetpassGstStateCode,
              getpassstatename.State_Code AS getpassstatecode,
              getpassstatename.State_Name AS getpassstatename,
              voucherby.Ac_Code AS voucherbyaccode,
              voucherby.Ac_Name_E AS voucherbyname,
              dbo.nt_1_deliveryorder.vb, dbo.nt_1_deliveryorder.voucher_by,
              voucherby.accoid AS voucherbyacic,
              dbo.nt_1_deliveryorder.docd, DO.accoid AS DOaccodeid,
              DO.Ac_Code AS DOacCode, DO.Ac_Name_E AS DOName,
              dbo.nt_1_deliveryorder.DO,
              dbo.nt_1_deliveryorder.MemoGSTRate,
              memogstrate.Doc_no AS memogstdocno, memogstrate.Rate AS memorategst,
              gstrate.GST_Name AS gstratename, dbo.nt_1_tender.AutoPurchaseBill,
              dbo.nt_1_deliveryorder.godownCode, dbo.nt_1_deliveryorder.godownId,
              dbo.nt_1_deliveryorder.ebuy_narration,
              dbo.nt_1_systemmaster.System_Name_E AS godownName,
              carpprateac.Ac_Name_E as carporateacname,
              dbo.nt_1_deliveryorder.carporate_ac, dbo.nt_1_deliveryorder.ca,
              carpprateac.GSTStateCode AS carporatestatecode,
              dbo.gststatemaster.State_Name AS carpporatestateame,
              dbo.carporatehead.selling_type
FROM   dbo.Brand_Master RIGHT OUTER JOIN
       dbo.nt_1_accountmaster AS vasuliac RIGHT OUTER JOIN
       dbo.gststatemaster AS voucherbystatecode RIGHT OUTER JOIN
       dbo.carporatehead RIGHT OUTER JOIN
       dbo.nt_1_deliveryorder ON dbo.carporatehead.doc_no = dbo.nt_1_deliveryorder.Carporate_Sale_No
       LEFT OUTER JOIN dbo.nt_1_accountmaster AS carpprateac ON dbo.nt_1_deliveryorder.ca = carpprateac.accoid
       LEFT OUTER JOIN dbo.nt_1_accountmaster AS salebillto ON dbo.nt_1_deliveryorder.sb = salebillto.accoid
       LEFT OUTER JOIN dbo.nt_1_accountmaster AS transport ON dbo.nt_1_deliveryorder.tc = transport.accoid
       LEFT OUTER JOIN dbo.nt_1_tender ON dbo.nt_1_deliveryorder.company_code = dbo.nt_1_tender.Company_Code
           AND dbo.nt_1_deliveryorder.purc_no = dbo.nt_1_tender.Tender_No
       LEFT OUTER JOIN dbo.nt_1_gstratemaster AS gstrate
           ON dbo.nt_1_deliveryorder.company_code = gstrate.Company_Code
           AND dbo.nt_1_deliveryorder.GstRateCode = gstrate.Doc_no
       LEFT OUTER JOIN dbo.nt_1_gstratemaster AS memogstrate
           ON dbo.nt_1_deliveryorder.company_code = memogstrate.Company_Code
           AND dbo.nt_1_deliveryorder.MemoGSTRate = memogstrate.Doc_no
       LEFT OUTER JOIN dbo.nt_1_accountmaster AS DO ON dbo.nt_1_deliveryorder.docd = DO.accoid
       LEFT OUTER JOIN dbo.nt_1_accountmaster AS voucherby ON dbo.nt_1_deliveryorder.vb = voucherby.accoid
       LEFT OUTER JOIN dbo.gststatemaster AS getpassstatename
           ON dbo.nt_1_deliveryorder.GetpassGstStateCode = getpassstatename.State_Code
       LEFT OUTER JOIN dbo.gststatemaster AS transportstatecode
           ON dbo.nt_1_deliveryorder.TransportGSTStateCode = transportstatecode.State_Code
       LEFT OUTER JOIN dbo.gststatemaster AS salebillstatecode
           ON dbo.nt_1_deliveryorder.SalebilltoGstStateCode = salebillstatecode.State_Code
       ON voucherbystatecode.State_Code = dbo.nt_1_deliveryorder.VoucherbyGstStateCode
       LEFT OUTER JOIN dbo.gststatemaster AS millstatecode
           ON dbo.nt_1_deliveryorder.MillGSTStateCode = millstatecode.State_Code
       ON vasuliac.accoid = dbo.nt_1_deliveryorder.va
       LEFT OUTER JOIN dbo.nt_1_accountmaster AS bank RIGHT OUTER JOIN
       dbo.nt_1_dodetails ON bank.accoid = dbo.nt_1_dodetails.bc
       ON dbo.nt_1_deliveryorder.doid = dbo.nt_1_dodetails.doid
       ON dbo.Brand_Master.Code = dbo.nt_1_deliveryorder.brandcode
       LEFT OUTER JOIN dbo.gststatemaster INNER JOIN
       dbo.nt_1_accountmaster AS cashdiffac ON dbo.gststatemaster.State_Code = cashdiffac.GSTStateCode
       ON dbo.nt_1_deliveryorder.CashDiffAcId = cashdiffac.accoid
       LEFT OUTER JOIN dbo.nt_1_accountmaster AS broker ON dbo.nt_1_deliveryorder.bk = broker.accoid
       LEFT OUTER JOIN dbo.nt_1_accountmaster AS tdsac ON dbo.nt_1_deliveryorder.TDSAcId = tdsac.accoid
       LEFT OUTER JOIN dbo.nt_1_accountmaster AS mill ON dbo.nt_1_deliveryorder.mc = mill.accoid
       LEFT OUTER JOIN dbo.nt_1_accountmaster AS shipto ON dbo.nt_1_deliveryorder.st = shipto.accoid
       LEFT OUTER JOIN dbo.nt_1_accountmaster AS getpass ON dbo.nt_1_deliveryorder.gp = getpass.accoid
       LEFT OUTER JOIN dbo.nt_1_systemmaster AS nt_1_systemmaster_1
           ON dbo.nt_1_deliveryorder.ic = nt_1_systemmaster_1.systemid
       LEFT OUTER JOIN dbo.nt_1_systemmaster
           ON dbo.nt_1_deliveryorder.godownId = dbo.nt_1_systemmaster.systemid
WHERE  (nt_1_systemmaster_1.System_Type = 'I')
  AND  (dbo.nt_1_deliveryorder.doid = :doid)
'''
 
 
def format_dates(task):
    return {
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
        "Purchase_Date": task.Purchase_Date.strftime('%Y-%m-%d') if task.Purchase_Date else None,
        "mill_inv_date": task.mill_inv_date.strftime('%Y-%m-%d') if task.mill_inv_date else None,
        "newsbdate": task.newsbdate.strftime('%Y-%m-%d') if task.newsbdate else None,
        "EwayBillValidDate": task.EwayBillValidDate.strftime('%Y-%m-%d') if task.EwayBillValidDate else None,
        "Do_DATE": task.Do_DATE.strftime('%Y-%m-%d') if task.Do_DATE else None,
        "reached_date": task.reached_date.strftime('%Y-%m-%d') if task.reached_date else None,
    }
 
 
def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid,
                      DRCR_HEAD, ordercode, narration,
                      drcr_head=0, gcid=0, ca_narration=None):
    if amount != 0:
        entry = create_gledger_entry(
            data, amount, drcr, ac_code, accoid, narration, DRCR_HEAD, ordercode
        )
        entry['CA_NARRATION'] = ca_narration
        entries.append(entry)
 
 
# ─────────────────────────────────────────────────────────────────────────────
#  GET next doc_no
# ─────────────────────────────────────────────────────────────────────────────
 
@app.route(API_URL + "/getNextDocNo_DeliveryOrder", methods=["GET"])
def getNextDocNo_DeliveryOrder():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400
        max_doc_no = db.session.query(func.max(DeliveryOrderHead.doc_no)).filter_by(
            company_code=Company_Code, Year_Code=Year_Code
        ).scalar()
        next_doc_no = (max_doc_no + 1) if max_doc_no else 1
        return jsonify({"next_doc_no": next_doc_no}), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
 
 
# ─────────────────────────────────────────────────────────────────────────────
#  LIST
# ─────────────────────────────────────────────────────────────────────────────
 
@app.route(API_URL + "/getdata-DO", methods=["GET"])
def getdata_DO():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400
 
        query = '''
            SELECT dbo.nt_1_deliveryorder.doc_no, dbo.nt_1_deliveryorder.doc_date,
                   dbo.nt_1_deliveryorder.purc_no, dbo.nt_1_deliveryorder.tenderdetailid,
                   dbo.nt_1_deliveryorder.quantal, dbo.nt_1_deliveryorder.sale_rate,
                   dbo.nt_1_deliveryorder.Tender_Commission, dbo.nt_1_deliveryorder.tran_type,
                   dbo.nt_1_deliveryorder.truck_no, dbo.nt_1_deliveryorder.SB_No,
                   dbo.nt_1_deliveryorder.EWay_Bill_No, dbo.nt_1_deliveryorder.doid,
                   mill.Short_Name AS millName, transport.Short_Name AS transportName,
                   saleBillTo.Short_Name AS saleBillName, shipTo.Short_Name AS shipToName,
                   dbo.nt_1_deliveryorder.Delivery_Type,
                   shipTo.cityname AS shipToCityName, saleBillTo.cityname AS sbCityName,
                   dbo.nt_1_deliveryorder.MM_Rate, dbo.nt_1_deliveryorder.desp_type,
                   dbo.nt_1_deliveryorder.mill_rate
            FROM dbo.nt_1_deliveryorder
            INNER JOIN dbo.nt_1_accountmaster AS mill ON dbo.nt_1_deliveryorder.mc = mill.accoid
            LEFT OUTER JOIN dbo.qrymstaccountmaster AS saleBillTo ON dbo.nt_1_deliveryorder.sb = saleBillTo.accoid
            LEFT OUTER JOIN dbo.qrymstaccountmaster AS shipTo ON dbo.nt_1_deliveryorder.st = shipTo.accoid
            LEFT OUTER JOIN dbo.nt_1_accountmaster AS transport ON dbo.nt_1_deliveryorder.tc = transport.accoid
            WHERE dbo.nt_1_deliveryorder.company_code = :company_code
              AND dbo.nt_1_deliveryorder.Year_Code = :year_code
            ORDER BY doc_no DESC
        '''
        rows = db.session.execute(
            text(query), {"company_code": company_code, "year_code": year_code}
        ).fetchall()
        all_data = [dict(r._mapping) for r in rows]
        for d in all_data:
            if d.get('doc_date'):
                d['doc_date'] = d['doc_date'].strftime('%Y-%m-%d')
        return jsonify({"all_data": all_data}), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
 
 
# ─────────────────────────────────────────────────────────────────────────────
#  GET by doc_no
# ─────────────────────────────────────────────────────────────────────────────
 
@app.route(API_URL + "/DOByid", methods=["GET"])
def getDOByid():
    try:
        doc_no = request.args.get('doc_no')
        company_code = request.args.get('company_code')
        Year_Code = request.args.get('Year_Code')
        if not all([company_code, Year_Code, doc_no]):
            return jsonify({'error': 'Missing parameters'}), 400
        company_code = int(company_code)
        Year_Code = int(Year_Code)
 
        DO_head = DeliveryOrderHead.query.filter_by(
            doc_no=doc_no, company_code=company_code, Year_Code=Year_Code
        ).first()
 
        rows = db.session.execute(
            text(TASK_DETAILS_QUERY), {"doid": DO_head.doid}
        ).fetchall()
 
        head_data = {c.name: getattr(DO_head, c.name) for c in DO_head.__table__.columns}
        head_data.update(format_dates(DO_head))
 
        balances = get_balances_for_multiple_accounts(
            [str(DO_head.mill_code), str(DO_head.SaleBillTo), str(DO_head.voucher_by)],
            company_code, Year_Code,
        )
        return jsonify({
            "last_head_data": head_data,
            "last_details_data": [dict(r._mapping) for r in rows],
            "balance_data": balances,
        }), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# insert_DeliveryOrder — fully inlined, optimized, single DB transaction
#
# OPTIMIZATIONS:
#   1. _get_company_parameters() — lightweight SELECT only needed fields
#      + module-level cache (no repeat DB hit for same company+year)
#   2. ps_cp / sb_cp reuse same company_parameters object (no extra calls)
#   3. _REMOVE_HEAD_KEYS_SET — frozenset for O(1) lookup + dict comprehension
#   4. max_detail_id query removed (new DO always has 0 details)
#   5. Duplicate checks combined into one query
#
# EXECUTION ORDER:
#   STEP 1 → DO Head + Details + DO gLedger
#   STEP 2 → PurchaseBill Head + Details + PS gLedger   (DI only)
#   STEP 3 → SaleBill Head + Details + SB gLedger       (DI only)
#   STEP 4 → CommissionBill Head + CB gLedger           (non-DI only)
#   STEP 5 → TenderStock                                (HTTP PUT)
#   STEP 6 → Single commit
# ═══════════════════════════════════════════════════════════════════════════════

# ── module-level company parameters cache ─────────────────────────────────────
# Keyed by (company_code, year_code) — cleared on server restart only.
# Company parameters change very rarely; safe to cache per process.
_cp_cache = {}

def _get_company_parameters(company_code, year_code):

    cache_key = (str(company_code), str(year_code))
    if cache_key in _cp_cache:
        return _cp_cache[cache_key]

    cp_row = db.session.execute(
        text("""
            SELECT TOP 1
                SELF_AC, AutoVoucher,
                CGSTAc, SGSTAc, IGSTAc,
                PurchaseCGSTAc, PurchaseSGSTAc, PurchaseIGSTAc,
                PurchaseTCSAc,  PurchaseTDSAc,
                SaleTCSAc,      SaleTDSAc,
                RoundOff,       Freight_Receivable_Ac,
                OTHER_AMOUNT_AC, COMMISSION_AC,
                Freight_Ac,
                CGST_RCM_Ac, SGST_RCM_Ac, IGST_RCM_Ac
            FROM nt_1_companyparameters
            WHERE Company_Code = :company_code
              AND Year_Code    = :year_code
        """),
        {'company_code': company_code, 'year_code': year_code}
    ).fetchone()

    from types import SimpleNamespace
    result = SimpleNamespace(
        SELF_AC               = cp_row.SELF_AC,
        AutoVoucher           = cp_row.AutoVoucher,
        CGSTAc                = cp_row.CGSTAc,
        SGSTAc                = cp_row.SGSTAc,
        IGSTAc                = cp_row.IGSTAc,
        PurchaseCGSTAc        = cp_row.PurchaseCGSTAc,
        PurchaseSGSTAc        = cp_row.PurchaseSGSTAc,
        PurchaseIGSTAc        = cp_row.PurchaseIGSTAc,
        PurchaseTCSAc         = cp_row.PurchaseTCSAc,
        PurchaseTDSAc         = cp_row.PurchaseTDSAc,
        SaleTCSAc             = cp_row.SaleTCSAc,
        SaleTDSAc             = cp_row.SaleTDSAc,
        RoundOff              = cp_row.RoundOff,
        Freight_Receivable_Ac = cp_row.Freight_Receivable_Ac,
        OTHER_AMOUNT_AC       = cp_row.OTHER_AMOUNT_AC,
        COMMISSION_AC         = cp_row.COMMISSION_AC,
        Freight_Ac            = cp_row.Freight_Ac,
        CGST_RCM_Ac           = cp_row.CGST_RCM_Ac,
        SGST_RCM_Ac           = cp_row.SGST_RCM_Ac,
        IGST_RCM_Ac           = cp_row.IGST_RCM_Ac,
    )
    _cp_cache[cache_key] = result
    return result


# ── module-level frozenset for O(1) key removal ────────────────────────────────
_REMOVE_HEAD_KEYS_SET = frozenset(_REMOVE_HEAD_KEYS)


def _to_int_or_none(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


@app.route(API_URL + "/insert-DeliveryOrder", methods=["POST"])
async def insert_DeliveryOrder():

    clear_lookup_caches()

    # =========================================================================
    # ROLLBACK STATE
    # =========================================================================
    new_doc_no           = None
    do_gledger_created   = False
    ps_doc_no_created    = None
    ps_id_created        = None
    sb_doc_no_created    = None
    sb_id_created        = None
    cb_doc_no_created    = None
    cb_tran_type_created = None

    # =========================================================================
    # ROLLBACK HELPERS — direct SQL DELETE, no HTTP
    # =========================================================================
    def _rb_do_gledger():
        db.session.execute(
            text("DELETE FROM nt_1_gledger WHERE doc_no=:d AND company_code=:c AND Year_Code=:y AND TRAN_TYPE=:t"),
            {'d': new_doc_no, 'c': headData['company_code'], 'y': headData['Year_Code'], 't': headData['tran_type']}
        )

    def _rb_purchase_bill(ps_doc_no_val, ps_id_val):
        db.session.execute(
            text("DELETE FROM nt_1_gledger WHERE doc_no=:d AND company_code=:c AND Year_Code=:y AND TRAN_TYPE='PS'"),
            {'d': ps_doc_no_val, 'c': headData['company_code'], 'y': headData['Year_Code']}
        )
        db.session.execute(
            text("DELETE FROM nt_1_sugarpurchasedetails WHERE purchaseid=:pid"),
            {'pid': ps_id_val}
        )
        db.session.execute(
            text("DELETE FROM nt_1_sugarpurchase WHERE purchaseid=:pid AND company_code=:c AND Year_Code=:y"),
            {'pid': ps_id_val, 'c': headData['company_code'], 'y': headData['Year_Code']}
        )

    def _rb_sale_bill(sb_doc_no_val, sb_id_val):
        db.session.execute(
            text("DELETE FROM nt_1_gledger WHERE doc_no=:d AND company_code=:c AND Year_Code=:y AND TRAN_TYPE='SB'"),
            {'d': sb_doc_no_val, 'c': headData['company_code'], 'y': headData['Year_Code']}
        )
        db.session.execute(
            text("DELETE FROM nt_1_sugarsaledetails WHERE saleid=:sid"),
            {'sid': sb_id_val}
        )
        db.session.execute(
            text("DELETE FROM nt_1_sugarsale WHERE saleid=:sid AND Company_Code=:c AND Year_Code=:y"),
            {'sid': sb_id_val, 'c': headData['company_code'], 'y': headData['Year_Code']}
        )

    def _rb_commission_bill(cb_doc_no_val, cb_tran_type_val):
        db.session.execute(
            text("DELETE FROM nt_1_gledger WHERE doc_no=:d AND company_code=:c AND Year_Code=:y AND TRAN_TYPE=:t"),
            {'d': cb_doc_no_val, 'c': headData['company_code'], 'y': headData['Year_Code'], 't': cb_tran_type_val}
        )
        db.session.execute(
            text("DELETE FROM commission_bill WHERE doc_no=:d AND Company_Code=:c AND Year_Code=:y AND Tran_Type=:t"),
            {'d': cb_doc_no_val, 'c': headData['company_code'], 'y': headData['Year_Code'], 't': cb_tran_type_val}
        )

    def _do_full_rollback():
        try:
            if cb_doc_no_created:
                _rb_commission_bill(cb_doc_no_created, cb_tran_type_created)
            if sb_id_created:
                _rb_sale_bill(sb_doc_no_created, sb_id_created)
            if ps_id_created:
                _rb_purchase_bill(ps_doc_no_created, ps_id_created)
            if do_gledger_created:
                _rb_do_gledger()
        except Exception as rb_err:
            print(f"[ROLLBACK SQL ERROR] {rb_err}\n{traceback.format_exc()}")
        finally:
            db.session.rollback()

    # =========================================================================
    # MAIN FLOW
    # =========================================================================
    try:
        data          = request.get_json()
        new_sale_data = data['headData']
        detailData    = data['detailData']

        # ── FIX 3: dict comprehension + frozenset — replaces copy() + pop loop
        headData = {k: v for k, v in new_sale_data.items() if k not in _REMOVE_HEAD_KEYS_SET}
        # Mirrored into nt_1_PendingDeliveryOrder.Third_Party_Do wherever this DO
        # gets synced into that table below.
        _bank_code = _to_int_or_none(detailData[0].get('Bank_Code')) if detailData else None

        # ─────────────────────────────────────────────────────────────────────
        # DUPLICATE CHECK 1 — PurchaseBill
        # Condition: MillInvoiceNo + mill_code already has a PS record
        # ─────────────────────────────────────────────────────────────────────
        if new_sale_data.get('AutopurchaseBill') == "Y" and headData.get('desp_type') == "DI":
            mill_invoice_no = (headData.get('MillInvoiceNo') or '').strip()
            if mill_invoice_no:
                existing_ps = db.session.execute(
                    text("""
                        SELECT TOP 1 doc_no, PURCNO
                        FROM nt_1_sugarpurchase
                        WHERE mill_code    = :mill_code
                          AND Bill_No      = :bill_no
                          AND Company_Code = :company_code
                          AND Year_Code    = :year_code
                          AND Tran_Type    = 'PS'
                    """),
                    {
                        'mill_code':    headData['mill_code'],
                        'bill_no':      mill_invoice_no,
                        'company_code': headData['company_code'],
                        'year_code':    headData['Year_Code'],
                    }
                ).fetchone()

                if existing_ps:
                    return jsonify({
                        "error":              "Duplicate PurchaseBill",
                        "message":            f"PurchaseBill for MillInvoiceNo={mill_invoice_no} already exists (PS doc_no={existing_ps.doc_no}, DO doc_no={existing_ps.PURCNO}). Please refresh.",
                        "existing_ps_doc_no": existing_ps.doc_no,
                        "existing_do_no":     existing_ps.PURCNO,
                    }), 409

        # ─────────────────────────────────────────────────────────────────────
        # STEP 1 — Atomic DO doc_no + persist DO head + details
        # ─────────────────────────────────────────────────────────────────────
        result = db.session.execute(
            text("""
                SELECT COALESCE(MAX(doc_no), 0) AS max_no
                FROM nt_1_deliveryorder WITH (UPDLOCK, HOLDLOCK)
                WHERE company_code = :company_code
                  AND Year_Code    = :year_code
            """),
            {'company_code': headData['company_code'], 'year_code': headData['Year_Code']}
        ).fetchone()
        new_doc_no         = result.max_no + 1
        headData['doc_no'] = new_doc_no

        # ─────────────────────────────────────────────────────────────────────
        # DUPLICATE CHECK 2 — DO doc_no already in PS (PURCNO) or SB (DO_No)
        # Only condition: ps.PURCNO = d.doc_no
        # ─────────────────────────────────────────────────────────────────────
        if new_sale_data.get('AutopurchaseBill') == "Y" and headData.get('desp_type') == "DI":

            existing_ps_for_do = db.session.execute(
                text("""
                    SELECT TOP 1 doc_no AS ps_doc_no
                    FROM nt_1_sugarpurchase
                    WHERE PURCNO       = :do_doc_no
                      AND Company_Code = :company_code
                      AND Year_Code    = :year_code
                      AND Tran_Type    = 'PS'
                """),
                {
                    'do_doc_no':    new_doc_no,
                    'company_code': headData['company_code'],
                    'year_code':    headData['Year_Code'],
                }
            ).fetchone()

            if existing_ps_for_do:
                return jsonify({
                    "error":          "Duplicate PurchaseBill",
                    "message":        f"Delivery Order No {new_doc_no} already has Purchase Bill No {existing_ps_for_do.ps_doc_no}. Please refresh.",
                    "existing_do_no": new_doc_no,
                    "existing_ps_no": existing_ps_for_do.ps_doc_no,
                }), 409

            existing_sb_for_do = db.session.execute(
                text("""
                    SELECT TOP 1 doc_no AS sb_doc_no
                    FROM nt_1_sugarsale
                    WHERE DO_No        = :do_doc_no
                      AND Company_Code = :company_code
                      AND Year_Code    = :year_code
                """),
                {
                    'do_doc_no':    new_doc_no,
                    'company_code': headData['company_code'],
                    'year_code':    headData['Year_Code'],
                }
            ).fetchone()

            if existing_sb_for_do:
                return jsonify({
                    "error":          "Duplicate SaleBill",
                    "message":        f"Delivery Order No {new_doc_no} already has Sale Bill No {existing_sb_for_do.sb_doc_no}. Please refresh.",
                    "existing_do_no": new_doc_no,
                    "existing_sb_no": existing_sb_for_do.sb_doc_no,
                }), 409

        # ── persist DO head ───────────────────────────────────────────────────
        new_head = DeliveryOrderHead(**headData)
        db.session.add(new_head)
        db.session.flush()

        # ── persist DO details ────────────────────────────────────────────────
        # FIX 4: max_detail_id query removed — new DO always has 0 details
        createdDetails, updatedDetails, deletedDetailIds = [], [], []
        for index, item in enumerate(detailData, start=1):
            if item.get('rowaction') == "add":
                item_copy = {k: v for k, v in item.items() if k != 'rowaction'}
                item_copy['detail_Id'] = index
                item_copy['doc_no']    = new_doc_no
                new_detail = DeliveryOrderDetail(**item_copy)
                new_head.details.append(new_detail)
                createdDetails.append(new_detail)
        db.session.flush()

        # ── If this DO originated from a PendingDeliveryOrder, mark it approved ──
        # headData['orderid'] = headData['pendingDoid'] = PendingDeliveryOrder.pendingDoid (PK)
        _pending_doc_id = headData.get('pendingDoid') or headData.get('orderid')
        if _pending_doc_id:
            # Approving an existing pending request: touch ONLY Approved/doid/
            # do_no on that specific row - leave its original Quantal etc.
            # untouched, since it reflects what was actually requested.
            db.session.execute(
                text("""
                    UPDATE dbo.nt_1_PendingDeliveryOrder
                    SET Approved = 'Y',
                        doid     = :doid,
                        do_no    = :do_no,
                        Third_Party_Do = :third_party_do
                    WHERE pendingDoid = :pendingDoid
                """),
                {
                    'doid':       new_head.doid,
                    'do_no':      new_doc_no,
                    'third_party_do': _bank_code,
                    'pendingDoid': int(_pending_doc_id),
                }
            )
        else:
            # No existing pending request was being approved - this is a
            # fresh/manual DO (e.g. a further split of an already-partially-
            # fulfilled sauda). Give it its own pending-entry mirror instead
            # of touching any other DO's row that happens to share the same
            # tenderdetailid.
            sync_pending_delivery_order_for_do(
                tenderdetailid=new_head.tenderdetailid,
                tenderid=new_head.tenderid,
                doid=new_head.doid,
                do_no=new_doc_no,
                company_code=headData['company_code'],
                mill_code=headData.get('mill_code'),
                mc=new_head.mc,
                year_code=headData['Year_Code'],
                truck_no=new_head.truck_no,
                driver_no=new_head.driver_no,
                admin_user_id=headData.get('User_Id'),
                bill_to_ac_code=new_head.SaleBillTo,
                bill_to_accoid=new_head.sb,
                ship_to_ac_code=new_head.voucher_by,
                ship_to_accoid=new_head.vb,
                mill_rate=new_head.mill_rate,
                ebuy_user_id=new_head.broker,
                quantal=new_head.quantal,
                sale_rate=new_head.sale_rate,
                third_party_do=_bank_code,
            )

        # ── FIX 1: lightweight company parameters — cached, single SELECT ─────
        company_parameters = _get_company_parameters(
            headData['company_code'], headData['Year_Code']
        )
        getpasscode = headData['GETPASSCODE']
        selfac      = company_parameters.SELF_AC

        # ═════════════════════════════════════════════════════════════════════
        # STEP 1 — DO gLedger builder + direct INSERT
        # ═════════════════════════════════════════════════════════════════════
        def _make_do_gledger_entry(data, amount, drcr, ac_code, accoid, narration, DRCR_HEAD, ordercode):
            return {
                "TRAN_TYPE":        data['tran_type'],
                "DOC_NO":           new_doc_no,
                "DOC_DATE":         data['doc_date'],
                "AC_CODE":          ac_code,
                "AMOUNT":           amount,
                "COMPANY_CODE":     headData['company_code'],
                "YEAR_CODE":        data['Year_Code'],
                "ORDER_CODE":       12,
                "DRCR":             drcr,
                "UNIT_Code":        0,
                "NARRATION":        narration,
                "TENDER_ID":        0, "TENDER_ID_DETAIL": 0, "VOUCHER_ID": 0,
                "DRCR_HEAD":        0, "ADJUSTED_AMOUNT":  0,
                "Branch_Code":      1,
                "SORT_TYPE":        data['tran_type'],
                "SORT_NO":          new_doc_no,
                "vc": 0, "progid": 0, "tranid": 0, "saleid": 0,
                "ac":               accoid,
                "do_no":            new_doc_no,
            }

        def _add_do_gledger(entries, data, amount, drcr, ac_code, accoid,
                            DRCR_HEAD, ordercode, narration,
                            drcr_head=0, gcid=0, ca_narration=None):
            if amount != 0:
                e = _make_do_gledger_entry(data, amount, drcr, ac_code, accoid,
                                           narration, DRCR_HEAD, ordercode)
                e['CA_NARRATION'] = ca_narration
                entries.append(e)

        do_gledger_entries = await genrate_gledger_entries(
            headData, company_parameters, getpasscode, selfac,
            new_doc_no, _add_do_gledger, new_sale_data,
        )
        if do_gledger_entries:
            db.session.execute(
                text("""
                    INSERT INTO nt_1_gledger
                        (TRAN_TYPE, DOC_NO, DOC_DATE, AC_CODE, AMOUNT, COMPANY_CODE,
                         YEAR_CODE, ORDER_CODE, DRCR, UNIT_Code, NARRATION,
                         TENDER_ID, TENDER_ID_DETAIL, VOUCHER_ID, DRCR_HEAD,
                         ADJUSTED_AMOUNT, Branch_Code, SORT_TYPE, SORT_NO,
                         vc, progid, tranid, saleid, ac, do_no, CA_NARRATION)
                    VALUES
                        (:TRAN_TYPE, :DOC_NO, :DOC_DATE, :AC_CODE, :AMOUNT, :COMPANY_CODE,
                         :YEAR_CODE, :ORDER_CODE, :DRCR, :UNIT_Code, :NARRATION,
                         :TENDER_ID, :TENDER_ID_DETAIL, :VOUCHER_ID, :DRCR_HEAD,
                         :ADJUSTED_AMOUNT, :Branch_Code, :SORT_TYPE, :SORT_NO,
                         :vc, :progid, :tranid, :saleid, :ac, :do_no, :CA_NARRATION)
                """),
                do_gledger_entries
            )
        do_gledger_created = True

        desp_type    = headData['desp_type']
        Autopurchase = new_sale_data.get('AutopurchaseBill')
        SELFAC       = company_parameters.SELF_AC
        GETPASSCODE  = headData["GETPASSCODE"]
        salebillto   = headData["SaleBillTo"]
        PS_SelfBal   = "Y" if (GETPASSCODE == SELFAC and salebillto == SELFAC) else "N"
        purchaseno   = 0

        if desp_type == "DI":

            # ═════════════════════════════════════════════════════════════════
            # STEP 2 — PurchaseBill Head + Details + PS gLedger   (DI only)
            # ═════════════════════════════════════════════════════════════════
            if Autopurchase == "Y":
                item_for_pb = detailData[0] if detailData else {}

                # ── 2a. Build PS head data ────────────────────────────────
                pb_head = {
                    "doc_no":          headData["voucher_no"],
                    "Tran_Type":       "PS",
                    "PURCNO":          new_doc_no,
                    "doc_date":        headData["Purchase_Date"],
                    "Ac_Code":         item_for_pb.get('Bank_Code'),
                    "Unit_Code":       0,
                    "mill_code":       headData["mill_code"],
                    "FROM_STATION":    "",
                    "TO_STATION":      "",
                    "LORRYNO":         headData["truck_no"],
                    "ac":              item_for_pb.get('bc'),
                    "mc":              headData['mc'],
                    "Company_Code":    headData["company_code"],
                    "Year_Code":       headData["Year_Code"],
                    "BROKER":          headData['broker'],
                    "subTotal":        new_sale_data["PS_amount"],
                    "LESS_FRT_RATE":   0,
                    "freight":         0,
                    "cash_advance":    0,
                    "bank_commission": 0,
                    "OTHER_AMT":       0,
                    "Bill_Amount":     new_sale_data['TOTALPurchase_Amount'],
                    "Due_Days":        1,
                    "NETQNTL":         headData['quantal'],
                    "Created_By":      headData['Created_By'],
                    "Modified_By":     headData['Modified_By'],
                    "Bill_No":         headData['MillInvoiceNo'],
                    "GstRateCode":     headData['GstRateCode'],
                    "CGSTRate":        new_sale_data['PS_CGSTRATE'],
                    "CGSTAmount":      new_sale_data['PS_CGSTAmount'],
                    "SGSTRate":        new_sale_data['PS_SGSTRATE'],
                    "SGSTAmount":      new_sale_data['PS_SGSTAmount'],
                    "IGSTRate":        new_sale_data['PS_IGSTRATE'],
                    "IGSTAmount":      new_sale_data['PS_IGSTAmount'],
                    "EWay_Bill_No":    headData['EWay_Bill_No'],
                    "uc":              0,
                    "bk":              headData['bk'],
                    "grade":           headData['grade'],
                    "mill_inv_date":   headData['mill_inv_date'],
                    "Purcid":          0,
                    "SelfBal":         PS_SelfBal,
                    "TCS_Rate":        headData['TCS_Rate'],
                    "TCS_Amt":         new_sale_data["PSTCS_Amt"],
                    "TCS_Net_Payable": new_sale_data["PSNetPayble"],
                    "purchaseidnew":   0,
                    "TDS_Amt":         new_sale_data["PSTDS_Amt"],
                    "TDS_Rate":        headData['PurchaseTDSRate'],
                    "Retail_Stock":    "N",
                    "gstid":           headData['gstid'],
                    "Unit":            headData['UnitType'],
                }
                pb_details = [{
                    "rowaction":    "add",
                    "detail_id":    1,
                    "Tran_Type":    "PS",
                    "item_code":    headData['itemcode'],
                    "narration":    "abc",
                    "Quantal":      headData['quantal'],
                    "packing":      headData['packing'],
                    "bags":         headData['bags'],
                    "rate":         headData['PurchaseRate'],
                    "item_Amount":  new_sale_data['PS_amount'],
                    "Company_Code": headData["company_code"],
                    "Year_Code":    headData["Year_Code"],
                    "ic":           headData['ic'],
                    "Brand_Code":   headData['brandcode'],
                    "Created_By":   headData['Created_By'],
                }]

                # ── 2b. Atomic PS doc_no ──────────────────────────────────
                ps_result = db.session.execute(
                    text("""
                        SELECT COALESCE(MAX(doc_no), 0) AS max_no
                        FROM nt_1_sugarpurchase WITH (UPDLOCK, HOLDLOCK)
                        WHERE Company_Code = :company_code
                          AND Year_Code    = :year_code
                    """),
                    {'company_code': pb_head['Company_Code'], 'year_code': pb_head['Year_Code']}
                ).fetchone()
                ps_doc_no         = ps_result.max_no + 1
                pb_head['doc_no'] = ps_doc_no

                # ── 2c. Persist PS head ───────────────────────────────────
                new_ps_head = SugarPurchase(**pb_head)
                db.session.add(new_ps_head)
                db.session.flush()

                # ── 2d. Persist PS details ────────────────────────────────
                for item in pb_details:
                    item['doc_no']     = ps_doc_no
                    item['purchaseid'] = new_ps_head.purchaseid
                    rowaction = item.pop('rowaction', None)
                    if rowaction == "add":
                        new_detail = SugarPurchaseDetail(**item)
                        new_ps_head.details.append(new_detail)
                db.session.flush()

                # ── 2e. PS gLedger amounts ────────────────────────────────
                ps_IGSTAmount  = float(pb_head.get('IGSTAmount', 0) or 0)
                ps_SGSTAmount  = float(pb_head.get('SGSTAmount', 0) or 0)
                ps_CGSTAmount  = float(pb_head.get('CGSTAmount', 0) or 0)
                ps_TCS_Amt     = float(pb_head.get('TCS_Amt', 0) or 0)
                ps_TDS_Amt     = float(pb_head.get('TDS_Amt', 0) or 0)
                ps_bill_amount = float(pb_head.get('Bill_Amount', 0) or 0)
                ps_subTotal    = float(pb_head.get('subTotal', 0) or 0)
                ps_OTHER_AMT   = float(pb_head.get('OTHER_AMT', 0) or 0)

                ps_millSN  = get_acShort_Name(pb_head['mill_code'], pb_head['Company_Code'])
                ps_party   = get_ac_Name(pb_head['Ac_Code'], pb_head['Company_Code'])
                ps_LORRYNO = pb_head['LORRYNO']
                ps_grade   = pb_head['grade']
                ps_Quantal = float(pb_details[0].get('Quantal', 0) or 0) if pb_details else 0
                ps_iAmt    = float(pb_details[0].get('item_Amount', 0) or 0) if pb_details else 0
                ps_rate    = ps_iAmt / ps_Quantal if ps_Quantal else 0

                ps_creditNar  = f"{ps_millSN} # L :{ps_LORRYNO} # G :{ps_grade} # {ps_Quantal} # R : {ps_rate}"
                ps_debitNar   = f"{ps_millSN} # {ps_party} # L :{ps_LORRYNO} # G :{ps_grade} # {ps_Quantal} # R : {ps_rate}"
                ps_TCSNar     = f"TCS #{ps_party}{ps_doc_no}"
                ps_TDSNar     = f"TDS #{ps_party}{ps_doc_no}"
                ps_GeneralCA  = f"{ps_party} P B No {ps_doc_no}"
                ps_TDSPartyCA = f"{ps_party} P B No {ps_doc_no}"
                ps_TDSTDSAcCA = f"TDS P B No {ps_doc_no}"
                ps_PartyCA    = f"P B No {ps_doc_no}"

                # FIX 2: reuse company_parameters — no extra DB call
                ps_cp      = company_parameters
                ps_gledger = []

                def _ps_gl(amount, drcr, ac_code, ca_narration=None):
                    if float(amount) <= 0:
                        return
                    accoid = get_accoid(ac_code, pb_head['Company_Code'])
                    ps_gledger.append({
                        "TRAN_TYPE":        "PS",          "DOC_NO":           ps_doc_no,
                        "DOC_DATE":         pb_head['doc_date'],
                        "AC_CODE":          ac_code,       "AMOUNT":           amount,
                        "COMPANY_CODE":     pb_head['Company_Code'],
                        "YEAR_CODE":        pb_head['Year_Code'],
                        "ORDER_CODE":       0,             "DRCR":             drcr,
                        "UNIT_Code":        0,
                        "NARRATION":        ps_creditNar if drcr == 'C' else ps_debitNar,
                        "TENDER_ID":        0,             "TENDER_ID_DETAIL": 0,
                        "VOUCHER_ID":       0,             "DRCR_HEAD":        0,
                        "ADJUSTED_AMOUNT":  0,             "Branch_Code":      1,
                        "SORT_TYPE":        "PS",          "SORT_NO":          ps_doc_no,
                        "vc": 0, "progid": 0, "tranid": 0, "saleid":           0,
                        "ac":               accoid,        "do_no":            new_doc_no,
                        "CA_NARRATION":     ca_narration,
                    })

                # ── 2f. Build PS gLedger ──────────────────────────────────
                if ps_bill_amount > 0:
                    _ps_gl(ps_bill_amount, 'C', pb_head['Ac_Code'], ps_PartyCA)
                ic_val = pb_details[0].get('ic') if pb_details else None
                if ic_val and ps_subTotal > 0:
                    _ps_gl(ps_subTotal, 'D', getPurchaseAc(ic_val), ps_GeneralCA)
                for amt, ac in [(ps_IGSTAmount, ps_cp.PurchaseIGSTAc),
                                (ps_CGSTAmount, ps_cp.PurchaseCGSTAc),
                                (ps_SGSTAmount, ps_cp.PurchaseSGSTAc)]:
                    if amt > 0:
                        _ps_gl(amt, 'D', ac, ps_GeneralCA)
                if ps_TCS_Amt > 0:
                    _ps_gl(ps_TCS_Amt, 'C', pb_head['Ac_Code'],  ps_TCSNar)
                    _ps_gl(ps_TCS_Amt, 'D', ps_cp.PurchaseTCSAc, ps_TCSNar)
                if ps_TDS_Amt > 0:
                    _ps_gl(ps_TDS_Amt, 'D', pb_head['Ac_Code'],  ps_TDSTDSAcCA)
                    _ps_gl(ps_TDS_Amt, 'C', ps_cp.PurchaseTDSAc, ps_TDSPartyCA)
                if ps_OTHER_AMT != 0:
                    if ps_OTHER_AMT > 0:
                        _ps_gl(ps_OTHER_AMT,      'D', ps_cp.OTHER_AMOUNT_AC, ps_PartyCA)
                    else:
                        _ps_gl(abs(ps_OTHER_AMT), 'C', ps_cp.OTHER_AMOUNT_AC, ps_PartyCA)

                # ── 2g. Insert PS gLedger ─────────────────────────────────
                if ps_gledger:
                    db.session.execute(
                        text("""
                            INSERT INTO nt_1_gledger
                                (TRAN_TYPE, DOC_NO, DOC_DATE, AC_CODE, AMOUNT, COMPANY_CODE,
                                 YEAR_CODE, ORDER_CODE, DRCR, UNIT_Code, NARRATION,
                                 TENDER_ID, TENDER_ID_DETAIL, VOUCHER_ID, DRCR_HEAD,
                                 ADJUSTED_AMOUNT, Branch_Code, SORT_TYPE, SORT_NO,
                                 vc, progid, tranid, saleid, ac, do_no, CA_NARRATION)
                            VALUES
                                (:TRAN_TYPE, :DOC_NO, :DOC_DATE, :AC_CODE, :AMOUNT, :COMPANY_CODE,
                                 :YEAR_CODE, :ORDER_CODE, :DRCR, :UNIT_Code, :NARRATION,
                                 :TENDER_ID, :TENDER_ID_DETAIL, :VOUCHER_ID, :DRCR_HEAD,
                                 :ADJUSTED_AMOUNT, :Branch_Code, :SORT_TYPE, :SORT_NO,
                                 :vc, :progid, :tranid, :saleid, :ac, :do_no, :CA_NARRATION)
                        """),
                        ps_gledger
                    )

                # ── 2h. Update DO head with PS reference ──────────────────
                ps_doc_no_created     = ps_doc_no
                ps_id_created         = new_ps_head.purchaseid
                new_head.voucher_no   = ps_doc_no_created
                new_head.voucher_type = "PS"
                new_head.purchaseid   = ps_id_created
                purchaseno            = ps_doc_no_created

            # ═════════════════════════════════════════════════════════════════
            # STEP 3 — SaleBill Head + Details + SB gLedger   (DI only)
            # ═════════════════════════════════════════════════════════════════
            autovaoucher = company_parameters.AutoVoucher
            if autovaoucher == "YES":
                if (desp_type != "DO"
                        and str(salebillto) not in ("0", "2")
                        and salebillto != SELFAC):

                    sb_no_existing = str(headData.get('SB_No', 0) or 0)
                    if sb_no_existing == '0':

                        sb_ac_code   = new_sale_data.get('SB_Ac_Code')
                        sb_unit_code = new_sale_data.get('SB_Unit_Code')

                        if not sb_ac_code:
                            _do_full_rollback()
                            return jsonify({"error": "SB_Ac_Code missing in request"}), 400

                        SB_Ac_Codeaccoid   = get_accoid_cached(sb_ac_code,   headData['company_code'])
                        SB_Unit_Codeaccoid = get_accoid_cached(sb_unit_code, headData['company_code']) if sb_unit_code else 0

                        salecarporatebillto = (
                            headData['carporate_ac']
                            if headData.get('carporate_ac') and headData['carporate_ac'] != 0
                            else sb_ac_code
                        )
                        salecarporatebilltoid = (
                            headData.get('ca')
                            if headData.get('carporate_ac') and headData['carporate_ac'] != 0
                            else new_sale_data.get('sb')
                        )

                        # ── 3a. Build SB head data ────────────────────────────
                        sb_head = {
                            "Tran_Type":         "SB",
                            "PURCNO":            purchaseno,
                            "doc_date":          headData["doc_date"],
                            "Ac_Code":           sb_ac_code,
                            "Unit_Code":         sb_unit_code,
                            "mill_code":         headData["mill_code"],
                            "FROM_STATION":      "",
                            "TO_STATION":        "",
                            "LORRYNO":           headData["truck_no"],
                            "ac":                SB_Ac_Codeaccoid,
                            "mc":                headData['mc'],
                            "Company_Code":      headData["company_code"],
                            "Year_Code":         headData["Year_Code"],
                            "BROKER":            headData['broker'],
                            "subTotal":          new_sale_data['SB_SubTotal'],
                            "LESS_FRT_RATE":     new_sale_data['SB_Less_Frt_Rate'],
                            "freight":           new_sale_data['SB_freight'],
                            "cash_advance":      0,
                            "bank_commission":   0,
                            "OTHER_AMT":         new_sale_data['SB_Other_Amount'],
                            "Bill_Amount":       new_sale_data['TotalGstSaleBillAmount'],
                            "Due_Days":          1,
                            "NETQNTL":           headData['quantal'],
                            "Modified_By":       headData['Modified_By'],
                            "Created_By":        headData['Created_By'],
                            "GstRateCode":       headData['GstRateCode'],
                            "CGSTRate":          new_sale_data['cgstrate'],
                            "CGSTAmount":        new_sale_data['cgstamt'],
                            "SGSTRate":          new_sale_data['sgstrate'],
                            "SGSTAmount":        new_sale_data['sgstamt'],
                            "IGSTRate":          new_sale_data['igstrate'],
                            "IGSTAmount":        new_sale_data['igstamt'],
                            "EWay_Bill_No":      headData['EWay_Bill_No'],
                            "uc":                SB_Unit_Codeaccoid,
                            "bk":                headData['bk'],
                            "Purcid":            0,
                            "saleidnew":         0,
                            "TCS_Rate":          headData['Sale_TCS_Rate'],
                            "TCS_Amt":           new_sale_data['SBTCSAmt'],
                            "TCS_Net_Payable":   new_sale_data["Net_Payble"],
                            "TDS_Amt":           new_sale_data['SBTDSAmt'],
                            "TDS_Rate":          headData['SaleTDSRate'],
                            "gstid":             headData['gstid'],
                            "TaxableAmount":     new_sale_data['TaxableAmountForSB'],
                            "EWayBill_Chk":      headData["EWayBillChk"],
                            "MillInvoiceNo":     headData["MillInvoiceNo"],
                            "RoundOff":          new_sale_data['Roundoff'],
                            "Transport_Code":    headData["transport"],
                            "tc":                headData["tc"],
                            "DoNarrtion":        headData["narration3"],
                            "newsbno":           0,
                            "einvoiceno":        headData["einvoiceno"],
                            "ackno":             headData['ackno'],
                            "Delivery_type":     headData["Delivery_Type"],
                            "Bill_To":           salecarporatebillto,
                            "bt":                salecarporatebilltoid,
                            "EwayBillValidDate": headData['doc_date'],
                            "IsDeleted":         1,
                            "SBNarration":       headData["SBNarration"],
                            "DO_No":             new_doc_no,
                            "Unit":              headData['UnitType'],
                        }
                        sb_details = [{
                            "rowaction":    "add",
                            "detail_id":    1,
                            "Tran_Type":    "SB",
                            "item_code":    headData['itemcode'],
                            "narration":    "abc",
                            "Quantal":      headData['quantal'],
                            "packing":      headData['packing'],
                            "bags":         headData['bags'],
                            "rate":         new_sale_data['SaleDetail_Rate'],
                            "item_Amount":  new_sale_data['item_Amount'],
                            "Company_Code": headData["company_code"],
                            "Year_Code":    headData["Year_Code"],
                            "ic":           headData['ic'],
                            "Brand_Code":   headData['brandcode'],
                        }]

                        # ── 3b. Atomic SB doc_no ──────────────────────────────
                        dono_sb = sb_head.get('DO_No')
                        if dono_sb is None or dono_sb != 0:
                            sb_doc_no         = 0
                            sb_head['doc_no'] = 0
                        else:
                            sb_result = db.session.execute(
                                text("""
                                    SELECT COALESCE(MAX(doc_no), 0) AS max_no
                                    FROM nt_1_sugarsale WITH (UPDLOCK, HOLDLOCK)
                                    WHERE Company_Code = :company_code
                                      AND Year_Code    = :year_code
                                      AND Tran_Type    = :tran_type
                                """),
                                {'company_code': sb_head['Company_Code'], 'year_code': sb_head['Year_Code'], 'tran_type': sb_head['Tran_Type']}
                            ).fetchone()
                            sb_doc_no         = sb_result.max_no + 1
                            sb_head['doc_no'] = sb_doc_no

                        # ── 3c. Persist SB head ───────────────────────────────
                        new_sb_head = SaleBillHead(**sb_head)
                        db.session.add(new_sb_head)
                        db.session.flush()
                        sb_head['saleid'] = new_sb_head.saleid

                        # ── 3d. Persist SB details ────────────────────────────
                        for item in sb_details:
                            item['doc_no'] = sb_doc_no
                            item['saleid'] = new_sb_head.saleid
                            rowaction = item.pop('rowaction', None)
                            if rowaction == "add":
                                new_detail = SaleBillDetail(**item)
                                new_sb_head.details.append(new_detail)
                        db.session.flush()

                        # ── 3e. SB gLedger amounts ────────────────────────────
                        sb_tax = {
                            'CGSTAmount':   float(sb_head.get('CGSTAmount',   0) or 0),
                            'SGSTAmount':   float(sb_head.get('SGSTAmount',   0) or 0),
                            'IGSTAmount':   float(sb_head.get('IGSTAmount',   0) or 0),
                            'TCS_Amt':      float(sb_head.get('TCS_Amt',      0) or 0),
                            'TDS_Amt':      float(sb_head.get('TDS_Amt',      0) or 0),
                            'Bill_Amount':  float(sb_head.get('Bill_Amount',  0) or 0),
                            'cash_advance': float(sb_head.get('cash_advance', 0) or 0),
                            'RoundOff':     float(sb_head.get('RoundOff',     0) or 0),
                            'subTotal':     float(sb_head.get('subTotal',     0) or 0),
                            'freight':      float(sb_head.get('freight',      0) or 0),
                        }

                        # FIX 2: reuse company_parameters — no extra DB call
                        sb_cp      = company_parameters
                        sb_saleid  = new_sb_head.saleid
                        sb_accode  = sb_head['Ac_Code']
                        sb_unitcode= sb_head['Unit_Code']
                        sb_millSN  = get_acShort_Name(sb_head['mill_code'], sb_head['Company_Code'])
                        sb_acSN    = get_acShort_Name(sb_accode,            sb_head['Company_Code'])

                        sb_saleacNar    = f"{sb_millSN} Qntl: {sb_head['NETQNTL']} L: {sb_head['LORRYNO']} SB: {sb_acSN}"
                        sb_transportNar = f"Qntl: {sb_head.get('NETQNTL','')} {sb_head.get('cash_advance','')} {sb_millSN} {get_acShort_Name(sb_head.get('Transport_Code',''), sb_head['Company_Code'])} L: {sb_head.get('LORRYNO','')}"
                        sb_freightNar   = f"Qntl: {sb_head.get('NETQNTL','')} Freight Amount: {sb_head.get('freight','')}"
                        sb_TDSNar       = f"TDS: {get_acShort_Name(sb_accode, sb_head['Company_Code'])} Doc_No: {sb_head['doc_no']}"
                        sb_TCSNar       = f"TCS: {get_acShort_Name(sb_accode, sb_head['Company_Code'])} Doc_No: {sb_head['doc_no']}"
                        sb_GeneralCA    = f"{sb_acSN} S B No {sb_head['doc_no']}"
                        sb_TDSPartyCA   = f"{sb_acSN} S B No {sb_head['doc_no']}"
                        sb_TDSTDSAcCA   = f"TDS S B No {sb_head['doc_no']}"
                        sb_PartyCA      = f"S B No {sb_head['doc_no']}"

                        if sb_accode == sb_unitcode:
                            sb_creditNar = f"{sb_millSN}{sb_head.get('NETQNTL','')} L: {sb_head.get('LORRYNO','')} PB{sb_head.get('PURCNO','')} R: {sb_details[0].get('rate','') if sb_details else ''}"
                        else:
                            sb_creditNar = f"{sb_millSN}{sb_head.get('NETQNTL','')} L: {sb_head.get('LORRYNO','')} PB{sb_head.get('PURCNO','')} R: {sb_details[0].get('rate','') if sb_details else ''} Shiptoname: {get_acShort_Name(sb_head.get('Unit_Code',''), sb_head['Company_Code'])}"

                        sb_gledger   = []
                        sb_ordercode = [0]

                        def _sb_gl(ac_code, amount, drcr, narration, ca_narration=None):
                            if amount == 0:
                                return
                            sb_ordercode[0] += 1
                            accoid = get_accoid(ac_code, sb_head['Company_Code'])
                            sb_gledger.append({
                                "TRAN_TYPE":        "SB",          "DOC_NO":           sb_doc_no,
                                "DOC_DATE":         sb_head['doc_date'],
                                "AC_CODE":          ac_code,       "AMOUNT":           amount,
                                "COMPANY_CODE":     sb_head['Company_Code'],
                                "YEAR_CODE":        sb_head['Year_Code'],
                                "ORDER_CODE":       sb_ordercode[0], "DRCR":           drcr,
                                "UNIT_Code":        0,             "NARRATION":        narration,
                                "TENDER_ID":        0,             "TENDER_ID_DETAIL": 0,
                                "VOUCHER_ID":       0,             "DRCR_HEAD":        0,
                                "ADJUSTED_AMOUNT":  0,             "Branch_Code":      1,
                                "SORT_TYPE":        "SB",          "SORT_NO":          sb_doc_no,
                                "vc": 0, "progid": 0, "tranid": 0,
                                "saleid":           sb_saleid,     "ac":               accoid,
                                "do_no":            new_doc_no,    "CA_NARRATION":     ca_narration,
                            })

                        # ── 3f. Build SB gLedger ──────────────────────────────
                        if sb_tax['Bill_Amount'] > 0:
                            _sb_gl(sb_accode,                                                      sb_tax['Bill_Amount'],  'D', sb_creditNar,    sb_PartyCA)
                            _sb_gl(getSaleAc(sb_details[0].get('ic') if sb_details else None),    sb_tax['subTotal'],     'C', sb_saleacNar,    sb_GeneralCA)
                        if sb_tax['CGSTAmount'] > 0:
                            _sb_gl(sb_cp.CGSTAc,              sb_tax['CGSTAmount'],  'C', sb_creditNar,    sb_GeneralCA)
                        if sb_tax['SGSTAmount'] > 0:
                            _sb_gl(sb_cp.SGSTAc,              sb_tax['SGSTAmount'],  'C', sb_creditNar,    sb_GeneralCA)
                        if sb_tax['IGSTAmount'] > 0:
                            _sb_gl(sb_cp.IGSTAc,              sb_tax['IGSTAmount'],  'C', sb_creditNar,    sb_GeneralCA)
                        if sb_tax['TCS_Amt'] > 0:
                            _sb_gl(sb_accode,                 sb_tax['TCS_Amt'],     'D', sb_TCSNar,       sb_TCSNar)
                            _sb_gl(sb_cp.SaleTCSAc,           sb_tax['TCS_Amt'],     'C', sb_TCSNar,       sb_TCSNar)
                        if sb_tax['TDS_Amt'] > 0:
                            _sb_gl(sb_accode,                 sb_tax['TDS_Amt'],     'C', sb_TDSNar,       sb_TDSTDSAcCA)
                            _sb_gl(sb_cp.SaleTDSAc,           sb_tax['TDS_Amt'],     'D', sb_TDSNar,       sb_TDSPartyCA)
                        if sb_tax['cash_advance'] > 0:
                            _sb_gl(sb_head['Transport_Code'], sb_tax['cash_advance'], 'C', sb_transportNar, sb_PartyCA)
                        if sb_tax['freight'] > 0:
                            _sb_gl(sb_cp.Freight_Receivable_Ac, sb_tax['freight'],   'C', sb_freightNar,   sb_PartyCA)
                        if sb_tax['RoundOff'] != 0:
                            drcr_ro = 'C' if sb_tax['RoundOff'] > 0 else 'D'
                            _sb_gl(sb_cp.RoundOff, abs(sb_tax['RoundOff']), drcr_ro, sb_creditNar,         sb_PartyCA)

                        # ── 3g. Insert SB gLedger ─────────────────────────────
                        if sb_gledger:
                            db.session.execute(
                                text("""
                                    INSERT INTO nt_1_gledger
                                        (TRAN_TYPE, DOC_NO, DOC_DATE, AC_CODE, AMOUNT, COMPANY_CODE,
                                         YEAR_CODE, ORDER_CODE, DRCR, UNIT_Code, NARRATION,
                                         TENDER_ID, TENDER_ID_DETAIL, VOUCHER_ID, DRCR_HEAD,
                                         ADJUSTED_AMOUNT, Branch_Code, SORT_TYPE, SORT_NO,
                                         vc, progid, tranid, saleid, ac, do_no, CA_NARRATION)
                                    VALUES
                                        (:TRAN_TYPE, :DOC_NO, :DOC_DATE, :AC_CODE, :AMOUNT, :COMPANY_CODE,
                                         :YEAR_CODE, :ORDER_CODE, :DRCR, :UNIT_Code, :NARRATION,
                                         :TENDER_ID, :TENDER_ID_DETAIL, :VOUCHER_ID, :DRCR_HEAD,
                                         :ADJUSTED_AMOUNT, :Branch_Code, :SORT_TYPE, :SORT_NO,
                                         :vc, :progid, :tranid, :saleid, :ac, :do_no, :CA_NARRATION)
                                """),
                                sb_gledger
                            )

                        # ── 3h. Update DO head with SB reference ──────────────
                        sb_doc_no_created = sb_doc_no
                        sb_id_created     = new_sb_head.saleid
                        new_head.SB_No    = sb_doc_no_created
                        new_head.saleid   = sb_id_created

        # ═════════════════════════════════════════════════════════════════════
        # STEP 4 — CommissionBill Head + CB gLedger   (non-DI only)
        # ═════════════════════════════════════════════════════════════════════
        else:
            lv_amt = float(new_sale_data.get('LV_Commision_Amt') or 0)
            if lv_amt != 0.0:
                tran_type_cb = "CV" if lv_amt < 0 else "LV"

                cb_data = {
                    "Tran_Type":         headData['voucher_type'],
                    "doc_date":          headData["doc_date"],
                    "link_no":           new_doc_no,
                    "link_type":         "",
                    "link_id":           0,
                    "ac_code":           headData['SaleBillTo'],
                    "unit_code":         headData['GETPASSCODE'],
                    "broker_code":       headData['broker'],
                    "qntl":              headData['quantal'],
                    "packing":           headData["packing"],
                    "bags":              headData['bags'],
                    "grade":             headData['grade'],
                    "transport_code":    headData["transport"],
                    "mill_rate":         headData["mill_rate"],
                    "sale_rate":         headData['sale_rate'],
                    "purc_rate":         0,
                    "commission_amount": new_sale_data['LV_Commision_Amt'],
                    "resale_rate":       headData["Tender_Commission"],
                    "resale_commission": new_sale_data['LV_tender_Commision_Amt'],
                    "texable_amount":    new_sale_data['LV_taxableamount'],
                    "gst_code":          headData["GstRateCode"],
                    "cgst_rate":         new_sale_data['LV_Cgstrate'],
                    "cgst_amount":       new_sale_data['LV_CGSTAmount'],
                    "sgst_rate":         new_sale_data['LV_Sgstrate'],
                    "sgst_amount":       new_sale_data['LV_SGSTAmount'],
                    "igst_rate":         new_sale_data['LV_Igstrate'],
                    "igst_amount":       new_sale_data['LV_IGSTAmount'],
                    "bill_amount":       new_sale_data['LV_TotalAmount'],
                    "Company_Code":      headData["company_code"],
                    "Year_Code":         headData["Year_Code"],
                    "Created_By":        headData["Created_By"],
                    "ac":  headData["sb"], "uc": headData["gp"],
                    "bc":  headData["bk"], "tc": headData["tc"],
                    "mill_code":         headData["mill_code"],
                    "mc":                headData["mc"],
                    "narration1": "", "narration2": "", "narration3": "", "narration4": "",
                    "TCS_Rate":          headData["Sale_TCS_Rate"],
                    "TCS_Amt":           new_sale_data['LV_TCSAmt'],
                    "TCS_Net_Payable":   new_sale_data['LV_NETPayble'],
                    "HSN":               "",
                    "item_code":         headData["itemcode"],
                    "ic":                headData["ic"],
                    "Frieght_Rate":      headData["MM_Rate"],
                    "Frieght_amt":       headData["Memo_Advance"],
                    "subtotal":          headData["diff_amount"],
                    "IsTDS":             headData["TDSCut"],
                    "TDS_Ac":            headData["TDSAc"],
                    "TDS_Per":           headData["TDSRate"],
                    "TDSAmount":         new_sale_data["LV_TDSAmt"],
                    "TDS":               headData["TDSRate"],
                    "ta":                headData["TDSAcId"],
                    'Branch_Code':       0,
                    'BANK_COMMISSION':   0,
                }

                # ── 4b. Atomic CB doc_no ──────────────────────────────────────
                max_cb = db.session.execute(
                    text("""
                        SELECT COALESCE(MAX(doc_no), 0) AS max_no
                        FROM commission_bill WITH (UPDLOCK, HOLDLOCK)
                        WHERE Company_Code = :company_code
                          AND Tran_Type    = :tran_type
                          AND Year_Code    = :year_code
                    """),
                    {'company_code': headData['company_code'], 'tran_type': tran_type_cb, 'year_code': headData['Year_Code']}
                ).fetchone()
                cb_data['doc_no']       = max_cb.max_no + 1
                cb_data['Company_Code'] = headData['company_code']
                cb_data['Tran_Type']    = tran_type_cb
                cb_data['Year_Code']    = headData['Year_Code']

                # ── 4c. Persist CB head ───────────────────────────────────────
                new_cb = CommissionBill(**cb_data)
                db.session.add(new_cb)
                db.session.flush()
                cb_doc_no    = cb_data['doc_no']
                commissionid = new_cb.commissionid

                # FIX 2: reuse company_parameters — no extra DB call
                cb_cp         = company_parameters
                cb_acSN       = get_acShort_Name(cb_data['ac_code'], headData['company_code'])
                cb_tdsacSN    = get_acShort_Name(cb_data['TDS_Ac'],  headData['company_code'])
                cb_GeneralCA  = f"{cb_acSN} Voucher No {cb_doc_no}"
                cb_TDSPartyCA = f"{cb_tdsacSN} Voucher No {cb_doc_no}"
                cb_TDSTDSAcCA = f"{cb_acSN} Voucher No {cb_doc_no}"
                cb_PartyCA    = f"Voucher No {cb_doc_no}"

                cb_bill_amt = float(cb_data.get('bill_amount',       0) or 0)
                cb_cgst     = float(cb_data.get('cgst_amount',       0) or 0)
                cb_sgst     = float(cb_data.get('sgst_amount',       0) or 0)
                cb_igst     = float(cb_data.get('igst_amount',       0) or 0)
                cb_tcs      = float(cb_data.get('TCS_Amt',           0) or 0)
                cb_tds      = float(cb_data.get('TDSAmount',         0) or 0)
                cb_tdsac    = cb_data.get('TDS_Ac')
                cb_resale   = float(cb_data.get('resale_commission',  0) or 0)
                cb_texable  = float(cb_data.get('texable_amount',     0) or 0)
                cb_freight  = float(cb_data.get('Frieght_amt',        0) or 0)
                cb_dono     = cb_data.get('link_id', 0)
                cb_drcr_main = 'D' if cb_bill_amt > 0 else 'C'

                cb_gledger = []
                cb_order   = [0]

                def _cb_gl(amount, drcr, ac_code, ca_narration=None):
                    if float(amount) == 0:
                        return
                    cb_order[0] += 1
                    accoid = get_accoid(ac_code, headData['company_code'])
                    cb_gledger.append({
                        "TRAN_TYPE":        tran_type_cb,   "DOC_NO":           cb_doc_no,
                        "DOC_DATE":         cb_data['doc_date'],
                        "AC_CODE":          ac_code,        "AMOUNT":           abs(amount),
                        "COMPANY_CODE":     headData['company_code'],
                        "YEAR_CODE":        headData['Year_Code'],
                        "ORDER_CODE":       cb_order[0],    "DRCR":             drcr,
                        "UNIT_Code":        0,              "NARRATION":        cb_data.get('narration1', ''),
                        "TENDER_ID":        0,              "TENDER_ID_DETAIL": 0,
                        "VOUCHER_ID":       0,              "DRCR_HEAD":        0,
                        "ADJUSTED_AMOUNT":  0,              "Branch_Code":      1,
                        "SORT_TYPE":        tran_type_cb,   "SORT_NO":          cb_doc_no,
                        "vc": 0, "progid": 0, "tranid": 0,  "saleid":           0,
                        "ac":               accoid,         "do_no":            new_doc_no,
                        "CA_NARRATION":     ca_narration,
                    })

                _cb_gl(abs(cb_bill_amt), cb_drcr_main, cb_data['ac_code'], cb_PartyCA)
                if cb_dono == 0:
                    if cb_freight > 0:
                        _cb_gl(cb_freight,      'C', cb_cp.SGSTAc,     cb_PartyCA)
                    elif cb_freight < 0:
                        _cb_gl(abs(cb_freight), 'D', cb_cp.Freight_Ac, cb_PartyCA)
                if cb_bill_amt > 0:
                    _cb_gl(cb_texable - cb_resale, 'C', cb_cp.COMMISSION_AC, cb_PartyCA)
                    if cb_cgst > 0: _cb_gl(cb_cgst, 'C', cb_cp.CGSTAc,      cb_GeneralCA)
                    if cb_sgst > 0: _cb_gl(cb_sgst, 'C', cb_cp.SGSTAc,      cb_GeneralCA)
                    if cb_igst > 0: _cb_gl(cb_igst, 'C', cb_cp.IGSTAc,      cb_GeneralCA)
                    if cb_tcs  > 0:
                        _cb_gl(cb_tcs, 'C', cb_cp.SaleTCSAc,       f"Being Commission Bill:{cb_doc_no}")
                        _cb_gl(cb_tcs, 'D', cb_data['ac_code'],    f"Being Commission Bill:{cb_doc_no}")
                elif cb_bill_amt != 0:
                    _cb_gl(abs(cb_texable - cb_resale), 'D', cb_cp.COMMISSION_AC, cb_PartyCA)
                    if cb_cgst != 0: _cb_gl(abs(cb_cgst), 'D', cb_cp.PurchaseCGSTAc, cb_GeneralCA)
                    if cb_sgst != 0: _cb_gl(abs(cb_sgst), 'D', cb_cp.PurchaseSGSTAc, cb_GeneralCA)
                    if cb_igst != 0: _cb_gl(abs(cb_igst), 'D', cb_cp.PurchaseIGSTAc, cb_GeneralCA)
                    if cb_tcs  != 0:
                        _cb_gl(abs(cb_tcs), 'C', cb_cp.SaleTCSAc,       f"Being Commission Bill:{cb_doc_no}")
                        _cb_gl(abs(cb_tcs), 'D', cb_data['ac_code'],    f"Being Commission Bill:{cb_doc_no}")
                if cb_tds != 0:
                    if cb_tds > 0:
                        _cb_gl(cb_tds,      'C', cb_data['ac_code'], cb_TDSPartyCA)
                        _cb_gl(cb_tds,      'D', cb_tdsac,           cb_TDSTDSAcCA)
                    else:
                        _cb_gl(abs(cb_tds), 'D', cb_data['ac_code'], cb_TDSPartyCA)
                        _cb_gl(abs(cb_tds), 'C', cb_tdsac,           cb_TDSTDSAcCA)
                if cb_resale != 0:
                    _cb_gl(abs(cb_resale), 'C' if cb_resale > 0 else 'D', cb_cp.COMMISSION_AC, cb_PartyCA)

                if cb_gledger:
                    db.session.execute(
                        text("""
                            INSERT INTO nt_1_gledger
                                (TRAN_TYPE, DOC_NO, DOC_DATE, AC_CODE, AMOUNT, COMPANY_CODE,
                                 YEAR_CODE, ORDER_CODE, DRCR, UNIT_Code, NARRATION,
                                 TENDER_ID, TENDER_ID_DETAIL, VOUCHER_ID, DRCR_HEAD,
                                 ADJUSTED_AMOUNT, Branch_Code, SORT_TYPE, SORT_NO,
                                 vc, progid, tranid, saleid, ac, do_no, CA_NARRATION)
                            VALUES
                                (:TRAN_TYPE, :DOC_NO, :DOC_DATE, :AC_CODE, :AMOUNT, :COMPANY_CODE,
                                 :YEAR_CODE, :ORDER_CODE, :DRCR, :UNIT_Code, :NARRATION,
                                 :TENDER_ID, :TENDER_ID_DETAIL, :VOUCHER_ID, :DRCR_HEAD,
                                 :ADJUSTED_AMOUNT, :Branch_Code, :SORT_TYPE, :SORT_NO,
                                 :vc, :progid, :tranid, :saleid, :ac, :do_no, :CA_NARRATION)
                        """),
                        cb_gledger
                    )

                cb_doc_no_created    = cb_doc_no
                cb_tran_type_created = tran_type_cb
                new_head.voucher_no   = cb_doc_no_created
                new_head.commisionid  = commissionid
                new_head.voucher_type = cb_tran_type_created

        # ═════════════════════════════════════════════════════════════════════
        # STEP 5 — TenderStock   (HTTP PUT — external service)
        # ═════════════════════════════════════════════════════════════════════
        tender_no   = headData["purc_no"]
        tender_head = TenderHead.query.filter_by(Tender_No=tender_no).first()
        if not tender_head:
            _do_full_rollback()
            return jsonify({"error": "Tender not found"}), 404

        tenderid = tender_head.tenderid
        max_detail_id_t = (
            db.session.query(func.max(TenderDetails.ID))
            .filter_by(tenderid=tenderid).scalar() or 0
        )
        new_detail_id = max_detail_id_t + 1

        detail_rec = db.session.execute(
            text("SELECT * FROM nt_1_tenderdetails WHERE ID=1 AND tenderid=:tenderid"),
            {'tenderid': tenderid},
        ).fetchone()

        if not detail_rec:
            _do_full_rollback()
            return jsonify({"error": "Tender details not found"}), 404

        result_list    = [dict(detail_rec._mapping)]
        buyer_quantal  = result_list[0].get('Buyer_Quantal')
        selfquantalid  = result_list[0].get('tenderdetailid')
        TenderStockQty = float(buyer_quantal) - float(headData["quantal"])
        purcorder      = headData["purc_order"]

        if purcorder == 1:
            create_TenderStock_entry = {
                "detailData": [
                    {
                        "rowaction":       "add",
                        "Tender_No":       headData["purc_no"],
                        "Buyer":           headData['SaleBillTo'],
                        "Buyer_Quantal":   headData["quantal"],
                        "Sale_Rate":       headData["sale_rate"],
                        "Commission_Rate": headData["Tender_Commission"],
                        "Sauda_Date":      headData["doc_date"],
                        "Lifting_Date":    headData["doc_date"],
                        "ID":              new_detail_id,
                        "Buyer_Party":     headData["broker"],
                        "Delivery_Type":   headData["Delivery_Type"],
                        "tenderid":        tenderid,
                        "buyerid":         headData["sb"],
                        "buyerpartyid":    headData["bk"],
                        "sub_broker":      headData["broker"],
                        "sbr":             headData["bk"],
                        "ShipTo":          headData["voucher_by"],
                        "shiptoid":        headData["vb"],
                        "Company_Code":    headData["company_code"],
                        "year_code":       headData["Year_Code"],
                    },
                    {
                        "rowaction":       "update",
                        "Tender_No":       headData["purc_no"],
                        "Buyer_Quantal":   TenderStockQty,
                        "ID":              1,
                        "tenderid":        tenderid,
                        "tenderdetailid":  selfquantalid,
                    },
                ],
            }
            resp, status = await async_put(
                API_SERVER + "/Stock_Entry_tender_purchase",
                params={'tenderid': tenderid, 'Tender_No': headData["purc_no"]},
                json=create_TenderStock_entry,
            )
            if status != 200:
                _do_full_rollback()
                return jsonify({"error": "Failed to create TenderStock", "details": resp}), status

            added_ts = resp.get('addedDetails', [])
            if not added_ts:
                _do_full_rollback()
                return jsonify({"error": "TenderStock addedDetails missing"}), 500

            tenderdetailid = added_ts[0].get('tenderdetailid')
            if tenderdetailid is None:
                _do_full_rollback()
                return jsonify({"error": "tenderdetailid missing in response"}), 500

            new_head.tenderdetailid = tenderdetailid
            db.session.execute(
                text("""
                    UPDATE nt_1_deliveryorder
                    SET purc_order=:max_detail_id, tenderdetailid=:tenderdetailid
                    WHERE doc_no=:doc_no AND Year_Code=:Year_code AND company_code=:Company_code
                """),
                {
                    'tenderdetailid': int(tenderdetailid),
                    'max_detail_id':  int(new_detail_id),
                    'doc_no':         str(new_doc_no),
                    'Company_code':   str(headData['company_code']),
                    'Year_code':      str(headData['Year_Code']),
                },
            )

        # ═════════════════════════════════════════════════════════════════════
        # STEP 6 — Single commit
        # ═════════════════════════════════════════════════════════════════════

        _pending_doc_id = headData.get('pendingDoid') or headData.get('orderid')
        if _pending_doc_id:
            db.session.execute(
                text("""
                    UPDATE dbo.nt_1_PendingDeliveryOrder
                    SET Approved = 'Y',
                        Third_Party_Do = :third_party_do
                    WHERE pendingDoid = :pendingDoid
                """),
                {
                    'third_party_do': _bank_code,
                    'pendingDoid': int(_pending_doc_id),
                }
            )

        # ═════════════════════════════════════════════════════════════════════
        # STEP 7 — Single commit
        # ═════════════════════════════════════════════════════════════════════
        db.session.commit()

        socketio.emit('delivery_order_added', {
            'doid':         new_head.doid,
            'doc_no':       str(new_doc_no),
            'company_code': str(headData['company_code']),
            'year_code':    str(headData['Year_Code']),
        })

        return jsonify({
            "message":          "Data Inserted successfully",
            "head":             task_head_schema.dump(new_head),
            "addedDetails":     task_detail_schemas.dump(createdDetails),
            "updatedDetails":   updatedDetails,
            "deletedDetailIds": deletedDetailIds,
        }), 201

    except Exception as e:
        print(f"[UNHANDLED ERROR] insert_DeliveryOrder: {e}\n{traceback.format_exc()}")
        _do_full_rollback()
        return jsonify({
            "error":     "Internal server error",
            "message":   str(e),
            "traceback": traceback.format_exc(),
        }), 500




# ═══════════════════════════════════════════════════════════════════════════════
# update_DeliveryOrder — fully inlined, optimized, single DB transaction
#
# OPTIMIZATIONS:
#   1. _get_company_parameters() — lightweight SELECT only needed fields
#      + module-level cache (no repeat DB hit for same company+year)
#   2. ps_cp / sb_cp / cb_cp reuse same company_parameters object
#   3. Single bulk gLedger DELETE by do_no (all sub-entries at once)
#
# EXECUTION ORDER:
#   STEP 1 → DO Head + Details update
#   STEP 2 → Bulk gLedger DELETE by do_no (DO+PS+SB+CB all at once)
#   STEP 3 → DO gLedger insert new
#   STEP 4 → PurchaseBill update + PS gLedger insert    (DI only)
#   STEP 5 → SaleBill update + SB gLedger insert        (DI only)
#   STEP 6 → CommissionBill update + CB gLedger insert  (non-DI only)
#   STEP 7 → TenderStock update                         (HTTP PUT)
#   STEP 8 → Single commit
# ═══════════════════════════════════════════════════════════════════════════════

@app.route(API_URL + "/update-DeliveryOrder", methods=["PUT"])
async def update_DeliveryOrder():
    clear_lookup_caches()

    try:
        # SET LOCK_TIMEOUT — prevent SQL Server blocking indefinitely
        db.session.execute(text("SET LOCK_TIMEOUT 20000"))

        doid = request.args.get('doid')
        if doid is None:
            return jsonify({"error": "Missing 'doid' parameter"}), 400

        data          = request.get_json()
        new_sale_data = data['headData']
        headData      = {k: v for k, v in new_sale_data.items() if k not in _REMOVE_HEAD_KEYS_SET}
        detailData    = data['detailData']
        # Mirrored into nt_1_PendingDeliveryOrder.Third_Party_Do below.
        _bank_code = _to_int_or_none(detailData[0].get('Bank_Code')) if detailData else None

        if not headData.get('tran_type'):
            return jsonify({"error": "tran_type is required"}), 400

        company_code = headData.get('company_code')
        year_code    = headData.get('Year_Code')
        user_id      = headData.get('User_Id', 0)

        existing_head = DeliveryOrderHead.query.filter_by(doid=doid).first()
        if not existing_head:
            return jsonify({"error": "DeliveryOrderHead not found"}), 404

        # ── change-detection for company log ──────────────────────────────────
        changed = (
            existing_head.voucher_by   != headData.get('voucher_by',     existing_head.voucher_by)
            or float(existing_head.sale_rate)       != float(headData.get('sale_rate',       existing_head.sale_rate)       or 0)
            or float(existing_head.quantal)         != float(headData.get('quantal',         existing_head.quantal)         or 0)
            or float(existing_head.PurchaseRate)    != float(headData.get('PurchaseRate',    existing_head.PurchaseRate)    or 0)
            or float(existing_head.SaleTDSRate)     != float(headData.get('SaleTDSRate',     existing_head.SaleTDSRate)     or 0)
            or float(existing_head.PurchaseTDSRate) != float(headData.get('PurchaseTDSRate', existing_head.PurchaseTDSRate) or 0)
        )
        if changed:
            create_company_log_entry(
                db=db, ac_code=existing_head.voucher_by, value=0,
                doc_no=existing_head.doc_no, doc_date=existing_head.doc_date,
                item_code=existing_head.itemcode, company_code=company_code,
                year_code=year_code, record_type='O', record_no=doid,
                user_id=user_id, tran_type=headData['tran_type'], bank_ac=0,
                created_by=existing_head.Created_By,
                modified_by=existing_head.Modified_By, narration="",
                quintal=existing_head.quantal, sale_rate=existing_head.sale_rate,
                purchase_rate=existing_head.PurchaseRate,
                sale_tds=existing_head.SaleTDSRate,
                purchase_tds=existing_head.PurchaseTDSRate,
            )
            create_company_log_entry(
                db=db, ac_code=headData.get("voucher_by"), value=0,
                doc_no=headData.get("doc_no"), doc_date=headData.get("doc_date"),
                item_code=headData.get("itemcode"), company_code=company_code,
                year_code=year_code, record_type='N', record_no=doid,
                user_id=user_id, tran_type=headData['tran_type'], bank_ac=0,
                created_by=headData.get('Created_By'),
                modified_by=headData.get('Modified_By'), narration="",
                quintal=headData.get("quantal"), sale_rate=headData.get("sale_rate"),
                purchase_rate=headData.get("PurchaseRate"),
                sale_tds=headData.get("SaleTDSRate"),
                purchase_tds=headData.get("PurchaseTDSRate"),
            )

        # ═════════════════════════════════════════════════════════════════════
        # STEP 1 — DO Head + Details update
        # ═════════════════════════════════════════════════════════════════════

        # ── 1a. Update DO head ────────────────────────────────────────────────
        updated_head = db.session.query(DeliveryOrderHead).filter_by(doid=doid).first()
        if not updated_head:
            db.session.rollback()
            return jsonify({"error": "Delivery Order not found"}), 404

        for key, value in headData.items():
            if key != 'User_Id':
                setattr(updated_head, key, value)

        updateddoc_no = updated_head.doc_no

        # ── 1b. Update DO details ─────────────────────────────────────────────
        createdDetails, updatedDetails, deletedDetailIds = [], [], []
        max_detail_id = (
            db.session.query(db.func.max(DeliveryOrderDetail.detail_Id))
            .filter_by(doid=doid).scalar() or 0
        )

        for item in detailData:
            item_copy = dict(item)
            rowaction = item_copy.pop('rowaction', None)
            if rowaction == "add":
                item_copy['doc_no']    = updateddoc_no
                item_copy['doid']      = doid
                item_copy['detail_Id'] = max_detail_id + 1
                max_detail_id += 1
                db.session.add(DeliveryOrderDetail(**item_copy))
                createdDetails.append(item_copy)
            elif rowaction in ("update", "Normal"):
                item_copy['doc_no'] = updateddoc_no
                tid = item_copy.pop('dodetailid')
                db.session.query(DeliveryOrderDetail).filter_by(dodetailid=tid).update(item_copy)
                updatedDetails.append(tid)
            elif rowaction == "delete":
                tid = item_copy['dodetailid']
                db.session.query(DeliveryOrderDetail).filter_by(dodetailid=tid).delete()
                deletedDetailIds.append(tid)

        db.session.flush()

        # ── 1c. Lightweight company parameters — cached, single SELECT ────────
        # FIX 1: _get_company_parameters replaces fetch_company_parameters
        # Saves ~370ms per call; cached so PS/SB/CB reuse same object (FIX 2)
        company_parameters = _get_company_parameters(company_code, year_code)
        SELFAC             = company_parameters.SELF_AC
        PS_SelfBal         = (
            "Y" if (headData["GETPASSCODE"] == SELFAC and headData["SaleBillTo"] == SELFAC)
            else "N"
        )
        desp_type = headData['desp_type']

        # ═════════════════════════════════════════════════════════════════════
        # STEP 2 — Bulk gLedger DELETE by do_no
        # do_no = DO doc_no saved in ALL gLedger entries (DO+PS+SB+CB)
        # Single query deletes everything related to this DO
        # ═════════════════════════════════════════════════════════════════════
        db.session.execute(
            text("""
                DELETE FROM nt_1_gledger
                WHERE do_no        = :do_no
                  AND company_code = :company_code
                  AND Year_Code    = :year_code
            """),
            {
                'do_no':        updateddoc_no,
                'company_code': company_code,
                'year_code':    year_code,
            }
        )

        # ═════════════════════════════════════════════════════════════════════
        # STEP 3 — DO gLedger insert new
        # ═════════════════════════════════════════════════════════════════════

        # ── 3a. DO gLedger builder helpers ────────────────────────────────────
        def _make_do_gledger_entry(data, amount, drcr, ac_code, accoid, narration, DRCR_HEAD, ordercode):
            return {
                "TRAN_TYPE":        data['tran_type'],
                "DOC_NO":           data['doc_no'],
                "DOC_DATE":         data['doc_date'],
                "AC_CODE":          ac_code,
                "AMOUNT":           amount,
                "COMPANY_CODE":     headData['company_code'],
                "YEAR_CODE":        data['Year_Code'],
                "ORDER_CODE":       12,
                "DRCR":             drcr,
                "UNIT_Code":        0,
                "NARRATION":        narration,
                "TENDER_ID":        0, "TENDER_ID_DETAIL": 0, "VOUCHER_ID": 0,
                "DRCR_HEAD":        0, "ADJUSTED_AMOUNT":  0,
                "Branch_Code":      1,
                "SORT_TYPE":        data['tran_type'],
                "SORT_NO":          data['doc_no'],
                "vc": 0, "progid": 0, "tranid": 0, "saleid": 0,
                "ac":               accoid,
                "do_no":            data['doc_no'],
            }

        def _add_do_gledger(entries, data, amount, drcr, ac_code, accoid,
                            DRCR_HEAD, ordercode, narration,
                            drcr_head=0, gcid=0, ca_narration=None):
            if amount != 0:
                e = _make_do_gledger_entry(data, amount, drcr, ac_code, accoid,
                                           narration, DRCR_HEAD, ordercode)
                e['CA_NARRATION'] = ca_narration
                entries.append(e)

        # ── 3b. Generate + insert new DO gLedger ──────────────────────────────
        do_gledger_entries = await genrate_gledger_entries(
            headData, company_parameters,
            headData['GETPASSCODE'], company_parameters.SELF_AC,
            updateddoc_no, _add_do_gledger, new_sale_data,
        )
        if do_gledger_entries:
            db.session.execute(
                text("""
                    INSERT INTO nt_1_gledger
                        (TRAN_TYPE, DOC_NO, DOC_DATE, AC_CODE, AMOUNT, COMPANY_CODE,
                         YEAR_CODE, ORDER_CODE, DRCR, UNIT_Code, NARRATION,
                         TENDER_ID, TENDER_ID_DETAIL, VOUCHER_ID, DRCR_HEAD,
                         ADJUSTED_AMOUNT, Branch_Code, SORT_TYPE, SORT_NO,
                         vc, progid, tranid, saleid, ac, do_no, CA_NARRATION)
                    VALUES
                        (:TRAN_TYPE, :DOC_NO, :DOC_DATE, :AC_CODE, :AMOUNT, :COMPANY_CODE,
                         :YEAR_CODE, :ORDER_CODE, :DRCR, :UNIT_Code, :NARRATION,
                         :TENDER_ID, :TENDER_ID_DETAIL, :VOUCHER_ID, :DRCR_HEAD,
                         :ADJUSTED_AMOUNT, :Branch_Code, :SORT_TYPE, :SORT_NO,
                         :vc, :progid, :tranid, :saleid, :ac, :do_no, :CA_NARRATION)
                """),
                do_gledger_entries
            )

        if desp_type == 'DI':

            # ═════════════════════════════════════════════════════════════════
            # STEP 4 — PurchaseBill update + PS gLedger insert    (DI only)
            # Note: old PS gLedger already deleted in STEP 2 (by do_no)
            # ═════════════════════════════════════════════════════════════════
            if headData.get('voucher_no') and str(headData.get('voucher_no', 0)) != "0":

                ps_doc_no     = headData["voucher_no"]
                ps_purchaseid = headData["purchaseid"]

                # ── 4a. Build PS head update data ─────────────────────────────
                pb_head_update = {
                    "doc_no":          ps_doc_no,
                    "Tran_Type":       "PS",
                    "PURCNO":          headData['doc_no'],
                    "doc_date":        headData["Purchase_Date"],
                    "Ac_Code":         next((i['Bank_Code'] for i in detailData if 'Bank_Code' in i), None),
                    "Unit_Code":       0,
                    "mill_code":       headData["mill_code"],
                    "FROM_STATION":    "",
                    "TO_STATION":      "",
                    "LORRYNO":         headData["truck_no"],
                    "ac":              next((i.get('bc') for i in detailData if 'bc' in i), None),
                    "mc":              headData['mc'],
                    "Company_Code":    company_code,
                    "Year_Code":       year_code,
                    "BROKER":          headData['broker'],
                    "subTotal":        new_sale_data['PS_amount'],
                    "LESS_FRT_RATE":   0,
                    "freight":         0,
                    "cash_advance":    0,
                    "bank_commission": 0,
                    "OTHER_AMT":       0,
                    "Bill_Amount":     new_sale_data['TOTALPurchase_Amount'],
                    "Due_Days":        1,
                    "NETQNTL":         headData['quantal'],
                    "Modified_By":     headData['Modified_By'],
                    "Bill_No":         headData['MillInvoiceNo'],
                    "GstRateCode":     headData['GstRateCode'],
                    "CGSTRate":        new_sale_data['PS_CGSTRATE'],
                    "CGSTAmount":      new_sale_data['PS_CGSTAmount'],
                    "SGSTRate":        new_sale_data['PS_SGSTRATE'],
                    "SGSTAmount":      new_sale_data['PS_SGSTAmount'],
                    "IGSTRate":        new_sale_data['PS_IGSTRATE'],
                    "IGSTAmount":      new_sale_data['PS_IGSTAmount'],
                    "EWay_Bill_No":    headData['EWay_Bill_No'],
                    "uc":              0,
                    "bk":              headData['bk'],
                    "grade":           headData['grade'],
                    "mill_inv_date":   headData['mill_inv_date'],
                    "Purcid":          0,
                    "SelfBal":         PS_SelfBal,
                    "TCS_Rate":        headData['TCS_Rate'],
                    "TCS_Amt":         new_sale_data["PSTCS_Amt"],
                    "TCS_Net_Payable": new_sale_data["PSNetPayble"],
                    "purchaseidnew":   0,
                    "TDS_Amt":         new_sale_data["PSTDS_Amt"],
                    "TDS_Rate":        headData['PurchaseTDSRate'],
                    "Retail_Stock":    "N",
                    "gstid":           headData['gstid'],
                    "Unit":            headData['UnitType'],
                }

                # ── 4b. Update PS head ────────────────────────────────────────
                existing_ps = SugarPurchase.query.filter_by(purchaseid=ps_purchaseid).first()
                if existing_ps:
                    for key, value in pb_head_update.items():
                        if key != 'User_Id':
                            setattr(existing_ps, key, value)
                    db.session.flush()

                    # ── 4c. Update PS detail ──────────────────────────────────
                    existing_ps_detail = SugarPurchaseDetail.query.filter_by(
                        purchaseid=ps_purchaseid
                    ).first()
                    if existing_ps_detail:
                        ps_detail_update = {
                            "Tran_Type":    "PS",
                            "item_code":    headData['itemcode'],
                            "narration":    "abc",
                            "Quantal":      headData['quantal'],
                            "packing":      headData['packing'],
                            "bags":         headData['bags'],
                            "rate":         headData['PurchaseRate'],
                            "item_Amount":  new_sale_data['PS_amount'],
                            "Company_Code": company_code,
                            "Year_Code":    year_code,
                            "ic":           headData['ic'],
                            "Brand_Code":   headData['brandcode'],
                            "doc_no":       ps_doc_no,
                            "purchaseid":   ps_purchaseid,
                            "Modified_By":  headData['Modified_By'],
                        }
                        for key, value in ps_detail_update.items():
                            setattr(existing_ps_detail, key, value)
                    db.session.flush()

                    # ── 4d. Build new PS gLedger entries ──────────────────────
                    ps_IGSTAmount  = float(pb_head_update.get('IGSTAmount', 0) or 0)
                    ps_SGSTAmount  = float(pb_head_update.get('SGSTAmount', 0) or 0)
                    ps_CGSTAmount  = float(pb_head_update.get('CGSTAmount', 0) or 0)
                    ps_TCS_Amt     = float(pb_head_update.get('TCS_Amt', 0) or 0)
                    ps_TDS_Amt     = float(pb_head_update.get('TDS_Amt', 0) or 0)
                    ps_bill_amount = float(pb_head_update.get('Bill_Amount', 0) or 0)
                    ps_subTotal    = float(pb_head_update.get('subTotal', 0) or 0)
                    ps_OTHER_AMT   = float(pb_head_update.get('OTHER_AMT', 0) or 0)

                    ps_millSN  = get_acShort_Name(pb_head_update['mill_code'], company_code)
                    ps_party   = get_ac_Name(pb_head_update['Ac_Code'], company_code)
                    ps_LORRYNO = pb_head_update['LORRYNO']
                    ps_grade   = pb_head_update['grade']
                    ps_Quantal = float(headData.get('quantal', 0) or 0)
                    ps_iAmt    = float(new_sale_data.get('PS_amount', 0) or 0)
                    ps_rate    = ps_iAmt / ps_Quantal if ps_Quantal else 0

                    ps_creditNar  = f"{ps_millSN} # L :{ps_LORRYNO} # G :{ps_grade} # {ps_Quantal} # R : {ps_rate}"
                    ps_debitNar   = f"{ps_millSN} # {ps_party} # L :{ps_LORRYNO} # G :{ps_grade} # {ps_Quantal} # R : {ps_rate}"
                    ps_TCSNar     = f"TCS #{ps_party}{ps_doc_no}"
                    ps_TDSNar     = f"TDS #{ps_party}{ps_doc_no}"
                    ps_GeneralCA  = f"{ps_party} P B No {ps_doc_no}"
                    ps_TDSPartyCA = f"{ps_party} P B No {ps_doc_no}"
                    ps_TDSTDSAcCA = f"TDS P B No {ps_doc_no}"
                    ps_PartyCA    = f"P B No {ps_doc_no}"

                    # FIX 2: reuse company_parameters — no extra DB call
                    ps_cp      = company_parameters
                    ps_gledger = []

                    def _ps_gl(amount, drcr, ac_code, ca_narration=None):
                        if float(amount) <= 0:
                            return
                        accoid = get_accoid(ac_code, company_code)
                        ps_gledger.append({
                            "TRAN_TYPE":        "PS",          "DOC_NO":           ps_doc_no,
                            "DOC_DATE":         pb_head_update['doc_date'],
                            "AC_CODE":          ac_code,       "AMOUNT":           amount,
                            "COMPANY_CODE":     company_code,  "YEAR_CODE":        year_code,
                            "ORDER_CODE":       0,             "DRCR":             drcr,
                            "UNIT_Code":        0,
                            "NARRATION":        ps_creditNar if drcr == 'C' else ps_debitNar,
                            "TENDER_ID":        0,             "TENDER_ID_DETAIL": 0,
                            "VOUCHER_ID":       0,             "DRCR_HEAD":        0,
                            "ADJUSTED_AMOUNT":  0,             "Branch_Code":      1,
                            "SORT_TYPE":        "PS",          "SORT_NO":          ps_doc_no,
                            "vc": 0, "progid": 0, "tranid": 0, "saleid":           0,
                            "ac":               accoid,        "do_no":            updateddoc_no,
                            "CA_NARRATION":     ca_narration,
                        })

                    if ps_bill_amount > 0:
                        _ps_gl(ps_bill_amount, 'C', pb_head_update['Ac_Code'], ps_PartyCA)
                    ic_val = headData.get('ic')
                    if ic_val and ps_subTotal > 0:
                        _ps_gl(ps_subTotal, 'D', getPurchaseAc(ic_val), ps_GeneralCA)
                    for amt, ac in [(ps_IGSTAmount, ps_cp.PurchaseIGSTAc),
                                    (ps_CGSTAmount, ps_cp.PurchaseCGSTAc),
                                    (ps_SGSTAmount, ps_cp.PurchaseSGSTAc)]:
                        if amt > 0:
                            _ps_gl(amt, 'D', ac, ps_GeneralCA)
                    if ps_TCS_Amt > 0:
                        _ps_gl(ps_TCS_Amt, 'C', pb_head_update['Ac_Code'], ps_TCSNar)
                        _ps_gl(ps_TCS_Amt, 'D', ps_cp.PurchaseTCSAc,      ps_TCSNar)
                    if ps_TDS_Amt > 0:
                        _ps_gl(ps_TDS_Amt, 'D', pb_head_update['Ac_Code'], ps_TDSTDSAcCA)
                        _ps_gl(ps_TDS_Amt, 'C', ps_cp.PurchaseTDSAc,      ps_TDSPartyCA)
                    if ps_OTHER_AMT != 0:
                        if ps_OTHER_AMT > 0:
                            _ps_gl(ps_OTHER_AMT,      'D', ps_cp.OTHER_AMOUNT_AC, ps_PartyCA)
                        else:
                            _ps_gl(abs(ps_OTHER_AMT), 'C', ps_cp.OTHER_AMOUNT_AC, ps_PartyCA)

                    # ── 4e. Insert new PS gLedger ─────────────────────────────
                    if ps_gledger:
                        db.session.execute(
                            text("""
                                INSERT INTO nt_1_gledger
                                    (TRAN_TYPE, DOC_NO, DOC_DATE, AC_CODE, AMOUNT, COMPANY_CODE,
                                     YEAR_CODE, ORDER_CODE, DRCR, UNIT_Code, NARRATION,
                                     TENDER_ID, TENDER_ID_DETAIL, VOUCHER_ID, DRCR_HEAD,
                                     ADJUSTED_AMOUNT, Branch_Code, SORT_TYPE, SORT_NO,
                                     vc, progid, tranid, saleid, ac, do_no, CA_NARRATION)
                                VALUES
                                    (:TRAN_TYPE, :DOC_NO, :DOC_DATE, :AC_CODE, :AMOUNT, :COMPANY_CODE,
                                     :YEAR_CODE, :ORDER_CODE, :DRCR, :UNIT_Code, :NARRATION,
                                     :TENDER_ID, :TENDER_ID_DETAIL, :VOUCHER_ID, :DRCR_HEAD,
                                     :ADJUSTED_AMOUNT, :Branch_Code, :SORT_TYPE, :SORT_NO,
                                     :vc, :progid, :tranid, :saleid, :ac, :do_no, :CA_NARRATION)
                            """),
                            ps_gledger
                        )

            # ═════════════════════════════════════════════════════════════════
            # STEP 5 — SaleBill update + SB gLedger insert        (DI only)
            # Note: old SB gLedger already deleted in STEP 2 (by do_no)
            # ═════════════════════════════════════════════════════════════════
            if (company_parameters.AutoVoucher == "YES"
                    and headData["desp_type"] != "DO"
                    and str(headData["SaleBillTo"]) not in ("0", "2")
                    and headData["SaleBillTo"] != str(company_parameters.SELF_AC)):

                salecarporatebillto = (
                    headData['carporate_ac']
                    if headData['carporate_ac'] != 0
                    else new_sale_data['SB_Ac_Code']
                )
                salecarporatebilltoid = (
                    headData['ca']
                    if headData['carporate_ac'] != 0
                    else new_sale_data.get('sb')
                )
                SB_Ac_Codeaccoid   = get_accoid_cached(new_sale_data['SB_Ac_Code'],  company_code)
                SB_Unit_Codeaccoid = get_accoid_cached(new_sale_data['SB_Unit_Code'], company_code)

                sb_saleid = headData['saleid']
                sb_doc_no = headData["SB_No"]

                # ── 5a. Build SB head update data ─────────────────────────────
                sb_head_update = {
                    "doc_no":            sb_doc_no,
                    "Tran_Type":         "SB",
                    "PURCNO":            new_sale_data.get("voucher_no"),
                    "doc_date":          headData["doc_date"],
                    "Ac_Code":           new_sale_data['SB_Ac_Code'],
                    "Unit_Code":         new_sale_data['SB_Unit_Code'],
                    "mill_code":         headData["mill_code"],
                    "FROM_STATION":      "",
                    "TO_STATION":        "",
                    "LORRYNO":           headData["truck_no"],
                    "ac":                SB_Ac_Codeaccoid,
                    "mc":                headData['mc'],
                    "Company_Code":      company_code,
                    "Year_Code":         year_code,
                    "BROKER":            headData['broker'],
                    "subTotal":          new_sale_data['SB_SubTotal'],
                    "LESS_FRT_RATE":     new_sale_data['SB_Less_Frt_Rate'],
                    "freight":           new_sale_data['SB_freight'],
                    "cash_advance":      0,
                    "bank_commission":   0,
                    "OTHER_AMT":         new_sale_data['SB_Other_Amount'],
                    "Bill_Amount":       new_sale_data['TotalGstSaleBillAmount'],
                    "Due_Days":          1,
                    "NETQNTL":           headData['quantal'],
                    "Modified_By":       headData['Modified_By'],
                    "GstRateCode":       headData['GstRateCode'],
                    "CGSTRate":          new_sale_data['cgstrate'],
                    "CGSTAmount":        new_sale_data['cgstamt'],
                    "SGSTRate":          new_sale_data['sgstrate'],
                    "SGSTAmount":        new_sale_data['sgstamt'],
                    "IGSTRate":          new_sale_data['igstrate'],
                    "IGSTAmount":        new_sale_data['igstamt'],
                    "EWay_Bill_No":      headData['EWay_Bill_No'],
                    "uc":                SB_Unit_Codeaccoid,
                    "bk":                headData['bk'],
                    "Purcid":            0,
                    "saleidnew":         0,
                    "TCS_Rate":          headData['Sale_TCS_Rate'],
                    "TCS_Amt":           new_sale_data['SBTCSAmt'],
                    "TCS_Net_Payable":   new_sale_data["Net_Payble"],
                    "TDS_Amt":           new_sale_data['SBTDSAmt'],
                    "TDS_Rate":          headData['SaleTDSRate'],
                    "gstid":             headData['gstid'],
                    "TaxableAmount":     new_sale_data['TaxableAmountForSB'],
                    "EWayBill_Chk":      headData["EWayBillChk"],
                    "MillInvoiceNo":     headData["MillInvoiceNo"],
                    "RoundOff":          new_sale_data['Roundoff'],
                    "Transport_Code":    headData["transport"],
                    "tc":                headData["tc"],
                    "DoNarrtion":        headData["narration3"],
                    "newsbno":           0,
                    "einvoiceno":        headData["einvoiceno"],
                    "ackno":             headData['ackno'],
                    "Delivery_type":     headData["Delivery_Type"],
                    "Bill_To":           salecarporatebillto,
                    "bt":                salecarporatebilltoid,
                    "EwayBillValidDate": headData['doc_date'],
                    "IsDeleted":         1,
                    "SBNarration":       headData["SBNarration"],
                    "DO_No":             headData['doc_no'],
                    "Unit":              headData['UnitType'],
                }

                # ── 5b. Update SB head ────────────────────────────────────────
                existing_sb = SaleBillHead.query.filter_by(saleid=sb_saleid).first()
                if existing_sb:
                    for key, value in sb_head_update.items():
                        if key != 'User_Id':
                            setattr(existing_sb, key, value)
                    db.session.flush()

                    # ── 5c. Update SB detail ──────────────────────────────────
                    existing_sb_detail = SaleBillDetail.query.filter_by(
                        saleid=sb_saleid
                    ).first()
                    if existing_sb_detail:
                        sb_detail_update = {
                            "Tran_Type":    "SB",
                            "item_code":    headData['itemcode'],
                            "narration":    "abc",
                            "Quantal":      headData['quantal'],
                            "packing":      headData['packing'],
                            "bags":         headData['bags'],
                            "rate":         new_sale_data['SaleDetail_Rate'],
                            "item_Amount":  new_sale_data['item_Amount'],
                            "Company_Code": company_code,
                            "Year_Code":    year_code,
                            "ic":           headData['ic'],
                            "Brand_Code":   headData['brandcode'],
                            "doc_no":       sb_doc_no,
                            "saleid":       sb_saleid,
                        }
                        for key, value in sb_detail_update.items():
                            setattr(existing_sb_detail, key, value)
                    db.session.flush()

                    # ── 5d. Build new SB gLedger entries ──────────────────────
                    sb_tax = {
                        'CGSTAmount':   float(sb_head_update.get('CGSTAmount',   0) or 0),
                        'SGSTAmount':   float(sb_head_update.get('SGSTAmount',   0) or 0),
                        'IGSTAmount':   float(sb_head_update.get('IGSTAmount',   0) or 0),
                        'TCS_Amt':      float(sb_head_update.get('TCS_Amt',      0) or 0),
                        'TDS_Amt':      float(sb_head_update.get('TDS_Amt',      0) or 0),
                        'Bill_Amount':  float(sb_head_update.get('Bill_Amount',  0) or 0),
                        'cash_advance': float(sb_head_update.get('cash_advance', 0) or 0),
                        'RoundOff':     float(sb_head_update.get('RoundOff',     0) or 0),
                        'subTotal':     float(sb_head_update.get('subTotal',     0) or 0),
                        'freight':      float(sb_head_update.get('freight',      0) or 0),
                    }

                    # FIX 2: reuse company_parameters — no extra DB call
                    sb_cp       = company_parameters
                    sb_saleid_  = sb_saleid
                    sb_accode   = sb_head_update['Ac_Code']
                    sb_unitcode = sb_head_update['Unit_Code']
                    sb_millSN   = get_acShort_Name(sb_head_update['mill_code'], company_code)
                    sb_acSN     = get_acShort_Name(sb_accode,                   company_code)

                    sb_saleacNar    = f"{sb_millSN} Qntl: {sb_head_update['NETQNTL']} L: {sb_head_update['LORRYNO']} SB: {sb_acSN}"
                    sb_transportNar = f"Qntl: {sb_head_update.get('NETQNTL','')} {sb_head_update.get('cash_advance','')} {sb_millSN} {get_acShort_Name(sb_head_update.get('Transport_Code',''), company_code)} L: {sb_head_update.get('LORRYNO','')}"
                    sb_freightNar   = f"Qntl: {sb_head_update.get('NETQNTL','')} Freight Amount: {sb_head_update.get('freight','')}"
                    sb_TDSNar       = f"TDS: {get_acShort_Name(sb_accode, company_code)} Doc_No: {sb_doc_no}"
                    sb_TCSNar       = f"TCS: {get_acShort_Name(sb_accode, company_code)} Doc_No: {sb_doc_no}"
                    sb_GeneralCA    = f"{sb_acSN} S B No {sb_doc_no}"
                    sb_TDSPartyCA   = f"{sb_acSN} S B No {sb_doc_no}"
                    sb_TDSTDSAcCA   = f"TDS S B No {sb_doc_no}"
                    sb_PartyCA      = f"S B No {sb_doc_no}"

                    if sb_accode == sb_unitcode:
                        sb_creditNar = f"{sb_millSN}{sb_head_update.get('NETQNTL','')} L: {sb_head_update.get('LORRYNO','')} PB{sb_head_update.get('PURCNO','')} R: {new_sale_data.get('SaleDetail_Rate','')}"
                    else:
                        sb_creditNar = f"{sb_millSN}{sb_head_update.get('NETQNTL','')} L: {sb_head_update.get('LORRYNO','')} PB{sb_head_update.get('PURCNO','')} R: {new_sale_data.get('SaleDetail_Rate','')} Shiptoname: {get_acShort_Name(sb_head_update.get('Unit_Code',''), company_code)}"

                    sb_gledger   = []
                    sb_ordercode = [0]

                    def _sb_gl(ac_code, amount, drcr, narration, ca_narration=None):
                        if amount == 0:
                            return
                        sb_ordercode[0] += 1
                        accoid = get_accoid(ac_code, company_code)
                        sb_gledger.append({
                            "TRAN_TYPE":        "SB",          "DOC_NO":           sb_doc_no,
                            "DOC_DATE":         sb_head_update['doc_date'],
                            "AC_CODE":          ac_code,       "AMOUNT":           amount,
                            "COMPANY_CODE":     company_code,  "YEAR_CODE":        year_code,
                            "ORDER_CODE":       sb_ordercode[0], "DRCR":           drcr,
                            "UNIT_Code":        0,             "NARRATION":        narration,
                            "TENDER_ID":        0,             "TENDER_ID_DETAIL": 0,
                            "VOUCHER_ID":       0,             "DRCR_HEAD":        0,
                            "ADJUSTED_AMOUNT":  0,             "Branch_Code":      1,
                            "SORT_TYPE":        "SB",          "SORT_NO":          sb_doc_no,
                            "vc": 0, "progid": 0, "tranid": 0,
                            "saleid":           sb_saleid_,    "ac":               accoid,
                            "do_no":            updateddoc_no, "CA_NARRATION":     ca_narration,
                        })

                    if sb_tax['Bill_Amount'] > 0:
                        _sb_gl(sb_accode,                                  sb_tax['Bill_Amount'],  'D', sb_creditNar,    sb_PartyCA)
                        _sb_gl(getSaleAc(headData.get('ic')),              sb_tax['subTotal'],     'C', sb_saleacNar,    sb_GeneralCA)
                    if sb_tax['CGSTAmount'] > 0:
                        _sb_gl(sb_cp.CGSTAc,   sb_tax['CGSTAmount'],       'C', sb_creditNar,    sb_GeneralCA)
                    if sb_tax['SGSTAmount'] > 0:
                        _sb_gl(sb_cp.SGSTAc,   sb_tax['SGSTAmount'],       'C', sb_creditNar,    sb_GeneralCA)
                    if sb_tax['IGSTAmount'] > 0:
                        _sb_gl(sb_cp.IGSTAc,   sb_tax['IGSTAmount'],       'C', sb_creditNar,    sb_GeneralCA)
                    if sb_tax['TCS_Amt'] > 0:
                        _sb_gl(sb_accode,      sb_tax['TCS_Amt'],          'D', sb_TCSNar,       sb_TCSNar)
                        _sb_gl(sb_cp.SaleTCSAc, sb_tax['TCS_Amt'],         'C', sb_TCSNar,       sb_TCSNar)
                    if sb_tax['TDS_Amt'] > 0:
                        _sb_gl(sb_accode,      sb_tax['TDS_Amt'],          'C', sb_TDSNar,       sb_TDSTDSAcCA)
                        _sb_gl(sb_cp.SaleTDSAc, sb_tax['TDS_Amt'],         'D', sb_TDSNar,       sb_TDSPartyCA)
                    if sb_tax['cash_advance'] > 0:
                        _sb_gl(sb_head_update['Transport_Code'], sb_tax['cash_advance'], 'C', sb_transportNar, sb_PartyCA)
                    if sb_tax['freight'] > 0:
                        _sb_gl(sb_cp.Freight_Receivable_Ac, sb_tax['freight'], 'C', sb_freightNar, sb_PartyCA)
                    if sb_tax['RoundOff'] != 0:
                        drcr_ro = 'C' if sb_tax['RoundOff'] > 0 else 'D'
                        _sb_gl(sb_cp.RoundOff, abs(sb_tax['RoundOff']), drcr_ro, sb_creditNar, sb_PartyCA)

                    # ── 5e. Insert new SB gLedger ─────────────────────────────
                    if sb_gledger:
                        db.session.execute(
                            text("""
                                INSERT INTO nt_1_gledger
                                    (TRAN_TYPE, DOC_NO, DOC_DATE, AC_CODE, AMOUNT, COMPANY_CODE,
                                     YEAR_CODE, ORDER_CODE, DRCR, UNIT_Code, NARRATION,
                                     TENDER_ID, TENDER_ID_DETAIL, VOUCHER_ID, DRCR_HEAD,
                                     ADJUSTED_AMOUNT, Branch_Code, SORT_TYPE, SORT_NO,
                                     vc, progid, tranid, saleid, ac, do_no, CA_NARRATION)
                                VALUES
                                    (:TRAN_TYPE, :DOC_NO, :DOC_DATE, :AC_CODE, :AMOUNT, :COMPANY_CODE,
                                     :YEAR_CODE, :ORDER_CODE, :DRCR, :UNIT_Code, :NARRATION,
                                     :TENDER_ID, :TENDER_ID_DETAIL, :VOUCHER_ID, :DRCR_HEAD,
                                     :ADJUSTED_AMOUNT, :Branch_Code, :SORT_TYPE, :SORT_NO,
                                     :vc, :progid, :tranid, :saleid, :ac, :do_no, :CA_NARRATION)
                            """),
                            sb_gledger
                        )

        # ═════════════════════════════════════════════════════════════════════
        # STEP 6 — CommissionBill update + CB gLedger insert  (non-DI only)
        # Note: old CB gLedger already deleted in STEP 2 (by do_no)
        # ═════════════════════════════════════════════════════════════════════
        else:
            cb_voucher_no   = headData['voucher_no']
            cb_voucher_type = headData['voucher_type']

            commission_bill_exists = db.session.query(CommissionBill).filter_by(
                Company_Code=company_code,
                Tran_Type=cb_voucher_type,
                Year_Code=year_code,
                doc_no=cb_voucher_no,
            ).first()

            if commission_bill_exists:

                # ── 6a. Build CB update data ──────────────────────────────────
                cb_update_data = {
                    "Tran_Type":         cb_voucher_type,
                    "doc_date":          headData["doc_date"],
                    "link_no":           updateddoc_no,
                    "link_type":         "",
                    "link_id":           0,
                    "ac_code":           headData['SaleBillTo'],
                    "unit_code":         headData['GETPASSCODE'],
                    "broker_code":       headData['broker'],
                    "qntl":              headData['quantal'],
                    "packing":           headData["packing"],
                    "bags":              headData['bags'],
                    "grade":             headData['grade'],
                    "transport_code":    headData["transport"],
                    "mill_rate":         headData["mill_rate"],
                    "sale_rate":         headData['sale_rate'],
                    "purc_rate":         0,
                    "commission_amount": new_sale_data['LV_Commision_Amt'],
                    "resale_rate":       headData["Tender_Commission"],
                    "resale_commission": new_sale_data['LV_tender_Commision_Amt'],
                    "texable_amount":    new_sale_data['LV_taxableamount'],
                    "gst_code":          headData["GstRateCode"],
                    "cgst_rate":         new_sale_data['LV_Cgstrate'],
                    "cgst_amount":       new_sale_data['LV_CGSTAmount'],
                    "sgst_rate":         new_sale_data['LV_Sgstrate'],
                    "sgst_amount":       new_sale_data['LV_SGSTAmount'],
                    "igst_rate":         new_sale_data['LV_Igstrate'],
                    "igst_amount":       new_sale_data['LV_IGSTAmount'],
                    "bill_amount":       new_sale_data['LV_TotalAmount'],
                    "Company_Code":      company_code,
                    "Year_Code":         year_code,
                    "ac":  headData["sb"], "uc": headData["gp"],
                    "bc":  headData["bk"], "tc": headData["tc"],
                    "mill_code":         headData["mill_code"],
                    "mc":                headData["mc"],
                    "narration1": "", "narration2": "", "narration3": "", "narration4": "",
                    "TCS_Rate":          headData["Sale_TCS_Rate"],
                    "TCS_Amt":           new_sale_data['LV_TCSAmt'],
                    "TCS_Net_Payable":   new_sale_data['LV_NETPayble'],
                    "HSN":               "",
                    "item_code":         headData["itemcode"],
                    "ic":                headData["ic"],
                    "Frieght_Rate":      headData["MM_Rate"],
                    "Frieght_amt":       headData["Memo_Advance"],
                    "subtotal":          headData["diff_amount"],
                    "IsTDS":             headData["TDSCut"],
                    "TDS_Ac":            headData["TDSAc"],
                    "TDS_Per":           headData["TDSRate"],
                    "TDSAmount":         new_sale_data["LV_TDSAmt"],
                    "TDS":               headData["TDSRate"],
                    "ta":                headData["TDSAcId"],
                    'Branch_Code':       0,
                    'BANK_COMMISSION':   0,
                }

                # ── 6b. Update CB head ────────────────────────────────────────
                for key, value in cb_update_data.items():
                    if key != 'User_Id':
                        setattr(commission_bill_exists, key, value)
                db.session.flush()

                # ── 6c. Build new CB gLedger entries ──────────────────────────
                # FIX 2: reuse company_parameters — no extra DB call
                cb_cp         = company_parameters
                cb_acSN       = get_acShort_Name(cb_update_data['ac_code'], company_code)
                cb_tdsacSN    = get_acShort_Name(cb_update_data['TDS_Ac'],  company_code)
                cb_GeneralCA  = f"{cb_acSN} Voucher No {cb_voucher_no}"
                cb_TDSPartyCA = f"{cb_tdsacSN} Voucher No {cb_voucher_no}"
                cb_TDSTDSAcCA = f"{cb_acSN} Voucher No {cb_voucher_no}"
                cb_PartyCA    = f"Voucher No {cb_voucher_no}"

                cb_bill_amt = float(cb_update_data.get('bill_amount',       0) or 0)
                cb_cgst     = float(cb_update_data.get('cgst_amount',       0) or 0)
                cb_sgst     = float(cb_update_data.get('sgst_amount',       0) or 0)
                cb_igst     = float(cb_update_data.get('igst_amount',       0) or 0)
                cb_tcs      = float(cb_update_data.get('TCS_Amt',           0) or 0)
                cb_tds      = float(cb_update_data.get('TDSAmount',         0) or 0)
                cb_tdsac    = cb_update_data.get('TDS_Ac')
                cb_resale   = float(cb_update_data.get('resale_commission',  0) or 0)
                cb_texable  = float(cb_update_data.get('texable_amount',     0) or 0)
                cb_freight  = float(cb_update_data.get('Frieght_amt',        0) or 0)
                cb_dono     = cb_update_data.get('link_id', 0)
                cb_drcr_main = 'D' if cb_bill_amt > 0 else 'C'

                cb_gledger = []
                cb_order   = [0]

                def _cb_gl(amount, drcr, ac_code, ca_narration=None):
                    if float(amount) == 0:
                        return
                    cb_order[0] += 1
                    accoid = get_accoid(ac_code, company_code)
                    cb_gledger.append({
                        "TRAN_TYPE":        cb_voucher_type,  "DOC_NO":           cb_voucher_no,
                        "DOC_DATE":         cb_update_data['doc_date'],
                        "AC_CODE":          ac_code,          "AMOUNT":           abs(amount),
                        "COMPANY_CODE":     company_code,     "YEAR_CODE":        year_code,
                        "ORDER_CODE":       cb_order[0],      "DRCR":             drcr,
                        "UNIT_Code":        0,                "NARRATION":        cb_update_data.get('narration1', ''),
                        "TENDER_ID":        0,                "TENDER_ID_DETAIL": 0,
                        "VOUCHER_ID":       0,                "DRCR_HEAD":        0,
                        "ADJUSTED_AMOUNT":  0,                "Branch_Code":      1,
                        "SORT_TYPE":        cb_voucher_type,  "SORT_NO":          cb_voucher_no,
                        "vc": 0, "progid": 0, "tranid": 0,    "saleid":           0,
                        "ac":               accoid,           "do_no":            updateddoc_no,
                        "CA_NARRATION":     ca_narration,
                    })

                _cb_gl(abs(cb_bill_amt), cb_drcr_main, cb_update_data['ac_code'], cb_PartyCA)
                if cb_dono == 0:
                    if cb_freight > 0:
                        _cb_gl(cb_freight,      'C', cb_cp.SGSTAc,     cb_PartyCA)
                    elif cb_freight < 0:
                        _cb_gl(abs(cb_freight), 'D', cb_cp.Freight_Ac, cb_PartyCA)
                if cb_bill_amt > 0:
                    _cb_gl(cb_texable - cb_resale, 'C', cb_cp.COMMISSION_AC, cb_PartyCA)
                    if cb_cgst > 0: _cb_gl(cb_cgst, 'C', cb_cp.CGSTAc,      cb_GeneralCA)
                    if cb_sgst > 0: _cb_gl(cb_sgst, 'C', cb_cp.SGSTAc,      cb_GeneralCA)
                    if cb_igst > 0: _cb_gl(cb_igst, 'C', cb_cp.IGSTAc,      cb_GeneralCA)
                    if cb_tcs  > 0:
                        _cb_gl(cb_tcs, 'C', cb_cp.SaleTCSAc,            f"Being Commission Bill:{cb_voucher_no}")
                        _cb_gl(cb_tcs, 'D', cb_update_data['ac_code'],  f"Being Commission Bill:{cb_voucher_no}")
                elif cb_bill_amt != 0:
                    _cb_gl(abs(cb_texable - cb_resale), 'D', cb_cp.COMMISSION_AC, cb_PartyCA)
                    if cb_cgst != 0: _cb_gl(abs(cb_cgst), 'D', cb_cp.PurchaseCGSTAc, cb_GeneralCA)
                    if cb_sgst != 0: _cb_gl(abs(cb_sgst), 'D', cb_cp.PurchaseSGSTAc, cb_GeneralCA)
                    if cb_igst != 0: _cb_gl(abs(cb_igst), 'D', cb_cp.PurchaseIGSTAc, cb_GeneralCA)
                    if cb_tcs  != 0:
                        _cb_gl(abs(cb_tcs), 'C', cb_cp.SaleTCSAc,           f"Being Commission Bill:{cb_voucher_no}")
                        _cb_gl(abs(cb_tcs), 'D', cb_update_data['ac_code'], f"Being Commission Bill:{cb_voucher_no}")
                if cb_tds != 0:
                    if cb_tds > 0:
                        _cb_gl(cb_tds,      'C', cb_update_data['ac_code'], cb_TDSPartyCA)
                        _cb_gl(cb_tds,      'D', cb_tdsac,                  cb_TDSTDSAcCA)
                    else:
                        _cb_gl(abs(cb_tds), 'D', cb_update_data['ac_code'], cb_TDSPartyCA)
                        _cb_gl(abs(cb_tds), 'C', cb_tdsac,                  cb_TDSTDSAcCA)
                if cb_resale != 0:
                    _cb_gl(abs(cb_resale), 'C' if cb_resale > 0 else 'D', cb_cp.COMMISSION_AC, cb_PartyCA)

                # ── 6d. Insert new CB gLedger ─────────────────────────────────
                if cb_gledger:
                    db.session.execute(
                        text("""
                            INSERT INTO nt_1_gledger
                                (TRAN_TYPE, DOC_NO, DOC_DATE, AC_CODE, AMOUNT, COMPANY_CODE,
                                 YEAR_CODE, ORDER_CODE, DRCR, UNIT_Code, NARRATION,
                                 TENDER_ID, TENDER_ID_DETAIL, VOUCHER_ID, DRCR_HEAD,
                                 ADJUSTED_AMOUNT, Branch_Code, SORT_TYPE, SORT_NO,
                                 vc, progid, tranid, saleid, ac, do_no, CA_NARRATION)
                            VALUES
                                (:TRAN_TYPE, :DOC_NO, :DOC_DATE, :AC_CODE, :AMOUNT, :COMPANY_CODE,
                                 :YEAR_CODE, :ORDER_CODE, :DRCR, :UNIT_Code, :NARRATION,
                                 :TENDER_ID, :TENDER_ID_DETAIL, :VOUCHER_ID, :DRCR_HEAD,
                                 :ADJUSTED_AMOUNT, :Branch_Code, :SORT_TYPE, :SORT_NO,
                                 :vc, :progid, :tranid, :saleid, :ac, :do_no, :CA_NARRATION)
                        """),
                        cb_gledger
                    )

        # ═════════════════════════════════════════════════════════════════════
        # STEP 7 — TenderStock update    (HTTP PUT — external service)
        # ═════════════════════════════════════════════════════════════════════
        if headData.get("purc_order") == 1:
            tender_head_u = db.session.query(TenderHead).filter_by(
                Tender_No=headData["purc_no"]
            ).first()
            if not tender_head_u:
                db.session.rollback()
                return jsonify({"error": "Tender not found"}), 404

            tenderid_u = tender_head_u.tenderid
            detail_rec_u = db.session.execute(
                text("SELECT * FROM nt_1_tenderdetails WHERE ID=1 AND tenderid=:tenderid"),
                {'tenderid': tenderid_u},
            ).fetchone()
            if not detail_rec_u:
                db.session.rollback()
                return jsonify({"error": "Tender details not found"}), 404

            TenderStockQty_u = float(detail_rec_u.Buyer_Quantal) - float(headData["quantal"])
            create_TenderStock_u = {
                "detailData": [
                    {
                        "rowaction":       "add",
                        "Tender_No":       headData["purc_no"],
                        "Buyer":           headData['SaleBillTo'],
                        "Buyer_Quantal":   headData["quantal"],
                        "Sale_Rate":       headData["sale_rate"],
                        "Commission_Rate": headData["Tender_Commission"],
                        "Sauda_Date":      headData["doc_date"],
                        "Lifting_Date":    headData["doc_date"],
                        "ID":              max_detail_id + 1,
                        "Buyer_Party":     headData["broker"],
                        "Delivery_Type":   headData["Delivery_Type"],
                        "tenderid":        tenderid_u,
                        "buyerid":         headData["sb"],
                        "buyerpartyid":    headData["bk"],
                        "sub_broker":      headData["broker"],
                        "sbr":             headData["bk"],
                        "ShipTo":          headData["voucher_by"],
                        "shiptoid":        headData["vb"],
                        "Company_Code":    company_code,
                        "year_code":       year_code,
                    },
                    {
                        "rowaction":       "update",
                        "Tender_No":       headData["purc_no"],
                        "Buyer_Quantal":   TenderStockQty_u,
                        "ID":              1,
                        "tenderid":        tenderid_u,
                        "tenderdetailid":  detail_rec_u.tenderdetailid,
                    },
                ],
            }
            resp, status = await async_put(
                API_SERVER + "/Stock_Entry_tender_purchase",
                params={'tenderid': tenderid_u, 'Tender_No': headData["purc_no"]},
                json=create_TenderStock_u,
            )
            if status != 200:
                db.session.rollback()
                return jsonify({"error": "Failed to update Tender Stock", "details": resp}), status

            added_ts_u = resp.get('addedDetails', [])
            if added_ts_u:
                tenderdetailid_u           = added_ts_u[0].get('tenderdetailid')
                headData['tenderdetailid'] = tenderdetailid_u
                db.session.execute(
                    text("""
                        UPDATE nt_1_deliveryorder
                        SET purc_order = :mid, tenderdetailid = :tdid
                        WHERE doid = :doid
                    """),
                    {'tdid': tenderdetailid_u, 'mid': max_detail_id + 1, 'doid': doid},
                )

        # ── Mirror this DO into nt_1_PendingDeliveryOrder (Approved='Y') ───────
        sync_pending_delivery_order_for_do(
            tenderdetailid=headData.get('tenderdetailid', updated_head.tenderdetailid),
            tenderid=headData.get('tenderid', updated_head.tenderid),
            doid=doid,
            do_no=updateddoc_no,
            company_code=company_code,
            mill_code=headData.get('mill_code', updated_head.mill_code),
            mc=updated_head.mc,
            year_code=year_code,
            truck_no=updated_head.truck_no,
            driver_no=updated_head.driver_no,
            admin_user_id=user_id,
            bill_to_ac_code=updated_head.SaleBillTo,
            bill_to_accoid=updated_head.sb,
            ship_to_ac_code=updated_head.voucher_by,
            ship_to_accoid=updated_head.vb,
            mill_rate=updated_head.mill_rate,
            ebuy_user_id=updated_head.broker,
            quantal=updated_head.quantal,
            sale_rate=updated_head.sale_rate,
            third_party_do=_bank_code,
        )

        # ═════════════════════════════════════════════════════════════════════
        # STEP 8 — Single commit
        # ═════════════════════════════════════════════════════════════════════
        db.session.commit()

        socketio.emit('delivery_order_updated', {
            'doid':         doid,
            'company_code': str(company_code),
            'year_code':    str(year_code),
        })


        return jsonify({
            "message":          "Data updated successfully",
            "head":             1,
            "addedDetails":     createdDetails,
            "updatedDetails":   updatedDetails,
            "deletedDetailIds": deletedDetailIds,
        }), 200

    except asyncio.TimeoutError:
        print("[TIMEOUT] update_DeliveryOrder: HTTP sub-call timed out")
        db.session.rollback()
        return jsonify({
            "error":   "Gateway Timeout",
            "message": (
                "The request exceeded the allowed time limit. "
                "The delivery order update was rolled back."
            ),
        }), 504

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error":     "Internal server error",
            "message":   str(e),
            "traceback": traceback.format_exc(),
        }), 500

 
 
# ─────────────────────────────────────────────────────────────────────────────
#  DELETE
# ─────────────────────────────────────────────────────────────────────────────
 
@app.route(API_URL + "/delete_data_by_doid", methods=["DELETE"])
def delete_data_by_doid():
    doid = request.args.get('doid')
    Company_Code = request.args.get('company_code')
    doc_no = request.args.get('doc_no')
    Year_Code = request.args.get('Year_Code')
    user_id = request.args.get('User_Id')
 
    if not all([doid, Company_Code, doc_no, Year_Code]):
        return jsonify({"error": "Missing required parameters"}), 400
 
    try:
        with db.session.begin():
            do_head = db.session.query(DeliveryOrderHead).filter_by(doid=doid).one_or_none()
            if not do_head:
                return jsonify({"message": "DO record not found"}), 404
 
            sale_id = do_head.saleid
            purch_id = do_head.purchaseid
            voucherDocNo = do_head.voucher_no
            commisionid = do_head.commisionid
            voucher_type = do_head.voucher_type
 
            create_company_log_entry(
                db=db, ac_code=do_head.voucher_by, value=0,
                doc_no=doc_no, doc_date=do_head.doc_date,
                item_code=do_head.itemcode, company_code=Company_Code,
                year_code=Year_Code, record_type='D', record_no=doid,
                user_id=user_id, tran_type=do_head.tran_type, bank_ac=0,
                created_by=do_head.Created_By, modified_by=do_head.Modified_By,
                narration="", quintal=do_head.quantal,
                sale_rate=do_head.sale_rate, purchase_rate=do_head.PurchaseRate,
                sale_tds=do_head.SaleTDSRate, purchase_tds=do_head.PurchaseTDSRate,
            )
 
            # Captured before the details get deleted below - mirrored into
            # nt_1_PendingDeliveryOrder.Third_Party_Do in the same reset.
            first_detail = DeliveryOrderDetail.query.filter_by(doid=doid).order_by(DeliveryOrderDetail.detail_Id).first()
            bank_code = first_detail.Bank_Code if first_detail else None

            DeliveryOrderDetail.query.filter_by(doid=doid).delete()

            # Reset linked PendingDeliveryOrder so it reappears as pending in eBuySugar
            db.session.execute(text('''
                UPDATE nt_1_PendingDeliveryOrder
                SET Approved = 'N',
                    doid     = NULL,
                    do_no    = NULL,
                    Third_Party_Do = :bank_code
                WHERE doid = :doid
            '''), {'doid': doid, 'bank_code': bank_code})
 
            result = db.session.execute(text('''
                UPDATE nt_1_deliveryorder
                SET purc_no=0, purc_order=0, voucher_no=0, voucher_type='',
                    tenderdetailid=NULL, UTR_Year_Code=NULL,
                    Carporate_Sale_No=NULL, cs=NULL, memo_no=0, tenderid=0
                WHERE doid=:doid AND Company_Code=:Company_Code AND Year_Code=:Year_Code
            '''), {'doid': doid, 'Company_Code': Company_Code, 'Year_Code': Year_Code})
            updated_do_head = result.rowcount
 
        if updated_do_head > 0:
            requests.delete(
                API_SERVER + "/delete-Record-gLedger",
                params={
                    'Company_Code': Company_Code,
                    'DOC_NO': doc_no,
                    'Year_Code': Year_Code,
                    'TRAN_TYPE': "DO",
                },
                cookies=request.cookies,
                headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')},
            )
            if purch_id:
                requests.delete(
                    API_SERVER + "/delete_data_SugarPurchase",
                    params={
                        'Company_Code': Company_Code,
                        'doc_no': voucherDocNo,
                        'Year_Code': Year_Code,
                        'purchaseid': purch_id,
                        'tran_type': "PS",
                    },
                    cookies=request.cookies,
                    headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')},
                )
            if commisionid:
                with db.session.begin():
                    db.session.execute(text('''
                        DELETE FROM nt_1_gledger
                        WHERE TRAN_TYPE=:vt AND DOC_NO=:vno
                          AND COMPANY_CODE=:cc AND YEAR_CODE=:yc
                    '''), {'vt': voucher_type, 'vno': voucherDocNo,
                           'cc': Company_Code, 'yc': Year_Code})
                    db.session.execute(text('''
                        DELETE FROM commission_bill WHERE commissionid=:cid
                    '''), {'cid': commisionid})
            if sale_id:
                with db.session.begin():
                    db.session.execute(text('''
                        DELETE FROM nt_1_gledger
                        WHERE TRAN_TYPE='SB' AND saleid=:sid
                    '''), {'sid': sale_id})
                    db.session.execute(text('''
                        UPDATE nt_1_sugarsale SET IsDeleted=0 WHERE saleid=:sid
                    '''), {'sid': sale_id})

            socketio.emit('delivery_order_deleted', {
                'doid':         doid,
                'doc_no':       doc_no,
                'company_code': Company_Code,
                'year_code':    Year_Code,
            })
 
            return jsonify({"message": "DO and related records deleted successfully."}), 200
        return jsonify({"message": "DO head update failed or not found."}), 404
 
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Database error", "message": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
 
 
# ─────────────────────────────────────────────────────────────────────────────
#  NAVIGATION helpers (unchanged logic, just formatted)
# ─────────────────────────────────────────────────────────────────────────────
 
def _do_response(do_obj, company_code, year_code):
    rows = db.session.execute(
        text(TASK_DETAILS_QUERY), {"doid": do_obj.doid}
    ).fetchall()
    head = {c.name: getattr(do_obj, c.name) for c in do_obj.__table__.columns}
    head.update(format_dates(do_obj))
    balances = get_balances_for_multiple_accounts(
        [str(do_obj.mill_code), str(do_obj.SaleBillTo), str(do_obj.voucher_by)],
        company_code, year_code,
    )
    return {
        "last_head_data": head,
        "last_details_data": [dict(r._mapping) for r in rows],
        "balance_data": balances,
    }
 
 
@app.route(API_URL + "/get-firstDO-navigation", methods=["GET"])
def get_firstDO_navigation():
    try:
        cc, yc = request.args.get('company_code'), request.args.get('Year_Code')
        rec = (DeliveryOrderHead.query
               .filter_by(company_code=cc, Year_Code=yc)
               .order_by(DeliveryOrderHead.doid.asc()).first())
        if not rec:
            return jsonify({"error": "No records found"}), 404
        return jsonify(_do_response(rec, cc, yc)), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
 
 
@app.route(API_URL + "/get-lastDO-navigation", methods=["GET"])
def get_lastDO_navigation():
    try:
        cc, yc = request.args.get('company_code'), request.args.get('Year_Code')
        rec = (DeliveryOrderHead.query
               .filter_by(company_code=cc, Year_Code=yc)
               .order_by(DeliveryOrderHead.doc_no.desc()).first())
        if not rec:
            return jsonify({"error": "No records found"}), 404
        return jsonify(_do_response(rec, cc, yc)), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
 
 
@app.route(API_URL + "/get-previousDO-navigation", methods=["GET"])
def get_previousDO_navigation():
    try:
        cc, yc = request.args.get('company_code'), request.args.get('Year_Code')
        cur = request.args.get('currentDocNo')
        rec = (DeliveryOrderHead.query
               .filter(DeliveryOrderHead.doc_no < cur)
               .filter_by(company_code=cc, Year_Code=yc)
               .order_by(DeliveryOrderHead.doc_no.desc()).first())
        if not rec:
            return jsonify({"error": "No previous records found"}), 404
        return jsonify(_do_response(rec, cc, yc)), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
 
 
@app.route(API_URL + "/get-nextDO-navigation", methods=["GET"])
def get_nextDO_navigation():
    try:
        cc, yc = request.args.get('company_code'), request.args.get('Year_Code')
        cur = request.args.get('currentDocNo')
        rec = (DeliveryOrderHead.query
               .filter(DeliveryOrderHead.doc_no > cur)
               .filter_by(company_code=cc, Year_Code=yc)
               .order_by(DeliveryOrderHead.doc_no.asc()).first())
        if not rec:
            return jsonify({"error": "No next records found"}), 404
        return jsonify(_do_response(rec, cc, yc)), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
 
 
@app.route(API_URL + "/getAmountcalculationData", methods=["GET"])
def get_amount_calculation_data():
    try:
        Company_Code = request.args.get('CompanyCode')
        SalebilltoAc = request.args.get('SalebilltoAc')
        Year_Code = request.args.get('Year_Code')
        purcno = request.args.get('purcno')
        if not all([Company_Code, SalebilltoAc, Year_Code, purcno]):
            return jsonify({"error": "Missing required parameters."}), 400
        result = db.session.execute(
            text("""
                EXEC sp_GetAmountCalculationData
                    @CompanyCode=:CompanyCode,
                    @SalebilltoAc=:SalebilltoAc,
                    @Year_Code=:Year_Code,
                    @purcno=:purcno
            """),
            {'CompanyCode': Company_Code, 'SalebilltoAc': SalebilltoAc,
             'Year_Code': Year_Code, 'purcno': purcno},
        ).fetchone()
        if not result:
            return jsonify({"error": "No data returned"}), 404
        return jsonify({
            "Balancelimt": result.Balancelimt,
            "PSAmt": result.PSAmt,
            "PurchaseTDSApplicable": result.PurchaseTDSApplicable,
            "PurchaseTDSAmount": result.PurchaseTDSAmount,
            "PurchaseSubTotalAmount": result.PurchaseSubTotalAmount,
            "SaleTDSApplicable": result.SaleTDSApplicable,
            "SBAmt": result.SBAmt,
            "SaleTDSAmount": result.SaleTDSAmount,
            "PurchaseTDSRate": result.PurchaseTDSRate,
            "TCSRate": result.TCSRate,
            "SaleTDSRate": result.SaleTDSRate,
        }), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Our DO Report
@app.route(API_URL+"/generating_ourDO_report", methods=["GET"])
def generating_ourDO_report():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no')

        if not company_code or not year_code or not doc_no:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT        dbo.nt_1_deliveryorder.tran_type, dbo.nt_1_deliveryorder.doc_no, dbo.nt_1_deliveryorder.desp_type, dbo.nt_1_deliveryorder.doc_date, CONVERT(varchar(10), dbo.nt_1_deliveryorder.doc_date, 103) AS doc_dateConverted, 
                         dbo.nt_1_deliveryorder.mill_code, dbo.nt_1_deliveryorder.grade, dbo.nt_1_deliveryorder.quantal, dbo.nt_1_deliveryorder.packing, dbo.nt_1_deliveryorder.bags, dbo.nt_1_deliveryorder.mill_rate, 
                         dbo.nt_1_deliveryorder.sale_rate, dbo.nt_1_deliveryorder.Tender_Commission, dbo.nt_1_deliveryorder.diff_rate, dbo.nt_1_deliveryorder.diff_amount, dbo.nt_1_deliveryorder.amount, dbo.nt_1_deliveryorder.DO, 
                         dbo.nt_1_deliveryorder.voucher_by, dbo.nt_1_deliveryorder.broker, dbo.nt_1_deliveryorder.company_code, dbo.nt_1_deliveryorder.Year_Code, dbo.nt_1_deliveryorder.Branch_Code, dbo.nt_1_deliveryorder.purc_no, 
                         dbo.nt_1_deliveryorder.purc, dbo.nt_1_deliveryorder.purc_order, dbo.nt_1_deliveryorder.purc_type, dbo.nt_1_deliveryorder.truck_no, dbo.nt_1_deliveryorder.transport, dbo.nt_1_deliveryorder.less, 
                         dbo.nt_1_deliveryorder.less_amount, dbo.nt_1_deliveryorder.final_amout, dbo.nt_1_deliveryorder.vasuli, dbo.nt_1_deliveryorder.narration1, dbo.nt_1_deliveryorder.narration2, dbo.nt_1_deliveryorder.narration3, 
                         dbo.nt_1_deliveryorder.narration4, dbo.nt_1_deliveryorder.narration5, dbo.nt_1_deliveryorder.excise_rate, dbo.nt_1_deliveryorder.memo_no, dbo.nt_1_deliveryorder.freight, dbo.nt_1_deliveryorder.adv_freight1, 
                         dbo.nt_1_deliveryorder.driver_no, dbo.nt_1_deliveryorder.driver_Name, dbo.nt_1_deliveryorder.voucher_no, dbo.nt_1_deliveryorder.voucher_type, dbo.nt_1_deliveryorder.GETPASSCODE, 
                         dbo.nt_1_deliveryorder.tender_Remark, dbo.nt_1_deliveryorder.vasuli_rate, dbo.nt_1_deliveryorder.vasuli_amount, dbo.nt_1_deliveryorder.to_vasuli, dbo.nt_1_deliveryorder.naka_delivery, dbo.nt_1_deliveryorder.send_sms, 
                         dbo.nt_1_deliveryorder.Itag, dbo.nt_1_deliveryorder.Ac_Code, dbo.nt_1_deliveryorder.FreightPerQtl, dbo.nt_1_deliveryorder.Freight_Amount, dbo.nt_1_deliveryorder.Freight_RateMM, dbo.nt_1_deliveryorder.Freight_AmountMM,
                          dbo.nt_1_deliveryorder.Memo_Advance, dbo.nt_1_deliveryorder.Paid_Rate1, dbo.nt_1_deliveryorder.Paid_Amount1, dbo.nt_1_deliveryorder.Paid_Narration1, dbo.nt_1_deliveryorder.Paid_Rate2, 
                         dbo.nt_1_deliveryorder.Paid_Amount2, dbo.nt_1_deliveryorder.Paid_Narration2, dbo.nt_1_deliveryorder.Paid_Rate3, dbo.nt_1_deliveryorder.Paid_Amount3, dbo.nt_1_deliveryorder.Paid_Narration3, 
                         dbo.nt_1_deliveryorder.MobileNo, dbo.nt_1_deliveryorder.Created_By, dbo.nt_1_deliveryorder.Modified_By, dbo.nt_1_deliveryorder.UTR_No, dbo.nt_1_deliveryorder.UTR_Year_Code, 
                         dbo.nt_1_deliveryorder.Carporate_Sale_No, dbo.nt_1_deliveryorder.Carporate_Sale_Year_Code, dbo.nt_1_deliveryorder.Delivery_Type, dbo.nt_1_deliveryorder.WhoseFrieght, dbo.nt_1_deliveryorder.SB_No, 
                         dbo.nt_1_deliveryorder.Invoice_No, dbo.nt_1_deliveryorder.vasuli_rate1, dbo.nt_1_deliveryorder.vasuli_amount1, dbo.nt_1_deliveryorder.Party_Commission_Rate, dbo.nt_1_deliveryorder.MM_CC, 
                         dbo.nt_1_deliveryorder.MM_Rate, dbo.nt_1_deliveryorder.Voucher_Brokrage, dbo.nt_1_deliveryorder.Voucher_Service_Charge, dbo.nt_1_deliveryorder.Voucher_RateDiffRate, dbo.nt_1_deliveryorder.Voucher_RateDiffAmt, 
                         dbo.nt_1_deliveryorder.Voucher_BankCommRate, dbo.nt_1_deliveryorder.Voucher_BankCommAmt, dbo.nt_1_deliveryorder.Voucher_Interest, dbo.nt_1_deliveryorder.Voucher_TransportAmt, 
                         dbo.nt_1_deliveryorder.Voucher_OtherExpenses, dbo.nt_1_deliveryorder.CheckPost, dbo.nt_1_deliveryorder.SaleBillTo, dbo.nt_1_deliveryorder.Pan_No, dbo.nt_1_deliveryorder.Vasuli_Ac, dbo.nt_1_deliveryorder.LoadingSms, 
                         dbo.nt_1_deliveryorder.GstRateCode, dbo.nt_1_deliveryorder.GetpassGstStateCode, dbo.nt_1_deliveryorder.VoucherbyGstStateCode, dbo.nt_1_deliveryorder.SalebilltoGstStateCode, dbo.nt_1_deliveryorder.GstAmtOnMR, 
                         dbo.nt_1_deliveryorder.GstAmtOnSR, dbo.nt_1_deliveryorder.GstExlSR, dbo.nt_1_deliveryorder.GstExlMR, dbo.nt_1_deliveryorder.MillGSTStateCode, dbo.nt_1_deliveryorder.TransportGSTStateCode, 
                         dbo.nt_1_deliveryorder.EWay_Bill_No, dbo.nt_1_deliveryorder.Distance, dbo.nt_1_deliveryorder.EWayBillChk, dbo.nt_1_deliveryorder.MillInvoiceNo, dbo.nt_1_deliveryorder.Purchase_Date, CONVERT(varchar(10), 
                         dbo.nt_1_deliveryorder.Purchase_Date, 103) AS Purchase_DateConverted, dbo.nt_1_deliveryorder.doid, dbo.nt_1_deliveryorder.mc, dbo.nt_1_deliveryorder.gp, dbo.nt_1_deliveryorder.st, dbo.nt_1_deliveryorder.sb, 
                         dbo.nt_1_deliveryorder.tc, dbo.nt_1_deliveryorder.itemcode, dbo.nt_1_deliveryorder.cs, dbo.nt_1_deliveryorder.ic, dbo.nt_1_deliveryorder.tenderdetailid, dbo.nt_1_deliveryorder.bk, dbo.nt_1_deliveryorder.docd, 
                         qrymstmillcode.Ac_Name_E AS millname, qrymstmillcode.Address_E AS milladress, qrymstmillcode.Gst_No AS millgstno, qrymstmillcode.Email_Id AS millDisplayEmail, qrymstmillcode.CompanyPan AS millpanno,
                         qrymstmillcode.cityname AS millcityname, qrymstmillcode.citypincode AS millcitypincode, qrymstmillcode.citystate AS millcitystate, qrymstmillcode.citygststatecode AS millgststatecodemster, 
                         qrymstgetpass.Ac_Name_E AS getpassname, qrymstgetpass.Address_E AS getpassaddress, qrymstgetpass.Gst_No AS getpassgstno, qrymstgetpass.CompanyPan AS getpasspanno, 
                         qrymstgetpass.cityname AS getpasscityname, qrymstgetpass.citypincode AS getpasscitypincode, qrymstgetpass.citystate AS getpasscitystate, qrymstgetpass.citygststatecode AS getpasscitygststatecode, 
                         qrymstshipto.Ac_Name_E AS shiptoname, qrymstshipto.Address_E AS shiptoaddress, qrymstshipto.Gst_No AS shiptogstno, qrymstshipto.CompanyPan AS shiptopanno, qrymstshipto.cityname AS shiptocityname,
                         qrymstshipto.citypincode AS shiptocitypincode, qrymstshipto.citystate AS shiptocitystate, qrymstshipto.citygststatecode AS shiptogststatecode, qrymstsalebill.Ac_Name_E AS salebillname,
                         qrymstsalebill.Address_E AS salebilladdress, qrymstsalebill.Gst_No AS salebillgstno, qrymstsalebill.CompanyPan AS salebillpanno, qrymstsalebill.cityname AS salebillcityname,
                         qrymstsalebill.citypincode AS salebillcitypincode, qrymstsalebill.citystate AS salebillcitystate, qrymstsalebill.citygststatecode AS salebillcitygststatecode, qrymsttransportcode.Ac_Name_E AS transportname,
                         qrymsttransportcode.Address_E AS transportaddress, qrymsttransportcode.CompanyPan AS transportpanno, qrymstbrokercode.Ac_Name_E AS brokername, qrymstdo.Ac_Name_E AS doname,
                         qrymstbrokercode.Address_E AS doaddress, qrymsttransportcode.Gst_No AS transportgstno, qrymstdo.Gst_No AS dogstno, qrymstdo.CompanyPan AS dopanno, qrymstdo.cityname AS docityname, 
                         qrymstdo.citypincode AS docitypincode, qrymstdo.citystate AS docitystate, qrymstdo.citygststatecode AS docitygststatecode, dbo.qrymstitem.System_Name_E AS itemname, dbo.qrymstitem.HSN, 
                         qrymstmillcode.Short_Name AS millshortname, qrygetpassstatemaster.State_Name AS getpassstatename, qryshiptostatemaster.State_Name AS shiptostatename, gstmstmill.State_Name AS gstmillstatename, 
                         gstmstsellbill.State_Name AS gststatesellbillname, gstmsttransport.State_Name AS gststatetransportname, dbo.nt_1_gstratemaster.GST_Name, dbo.nt_1_deliveryorder.vb, dbo.nt_1_deliveryorder.va, 
                         qrymstvoucherby.Ac_Name_E AS voucherbyname, qrymstvasuliacc.Ac_Name_E AS vasuliacname, qrymstshipto.Mobile_No AS shiptomobno, qrymstshipto.FSSAI AS shiptofssai, qrymstshipto.ECC_No AS shiptoeccno, 
                         qrymsttransportcode.Mobile_No AS transportmobile, qrymstgetpass.Mobile_No AS getpassmobno, qrymstgetpass.Cst_no AS getpasscstno, qrymstgetpass.FSSAI AS getpassfssai, 
                         qrymstvoucherby.Address_E AS vouvherbyaddress, qrymstvoucherby.cityname AS voucherbycityname, qrymstvoucherby.citystate AS voucherbycitystate, qrymstvoucherby.Cst_no AS voucherbycstno, 
                         qrymstvoucherby.Gst_No AS voucherbygstno, qrymstvoucherby.CompanyPan AS voucherbypan, qrymstvoucherby.Mobile_No AS shiptomobileno, qrymstmillcode.Mobile_No AS millmobno, 
                         qrymstsalebill.Mobile_No AS billtomobileto, qrymstbrokercode.Mobile_No AS brokermobno, dbo.nt_1_deliveryorder.carporate_ac, dbo.nt_1_deliveryorder.ca, qrycarporateac.Ac_Name_E AS carporateacname, 
                         qrycarporateac.Gst_No AS carporateacgstno, qrycarporateac.citygststatecode AS carporateacstatecode, qrymstvoucherby.citygststatecode AS voucherbystatecode, qrymsttransportcode.citygststatecode AS transportstatecode,
                         dbo.nt_1_deliveryorder.mill_inv_date, CONVERT(varchar(10), dbo.nt_1_deliveryorder.mill_inv_date, 103) AS mill_inv_dateConverted, dbo.nt_1_deliveryorder.mill_rcv, qrymstsalebill.Short_Name AS billtoshortname, 
                         qrymstshipto.Short_Name AS shiptoshortname, qrymsttransportcode.Short_Name AS transportshortname, qrymstdo.Short_Name AS doshortname, qrymstvoucherby.Short_Name AS voucherbyshortname, 
                         qrymstgetpass.Short_Name AS getpassshortname, dbo.nt_1_deliveryorder.MillEwayBill, dbo.nt_1_deliveryorder.TCS_Rate, dbo.nt_1_deliveryorder.Sale_TCS_Rate, dbo.nt_1_deliveryorder.Mill_AmtWO_TCS, 
                         dbo.nt_1_deliveryorder.newsbno, CONVERT(varchar(10), dbo.nt_1_deliveryorder.newsbdate, 103) AS newsbdate, dbo.nt_1_deliveryorder.einvoiceno, dbo.nt_1_deliveryorder.ackno, dbo.nt_1_deliveryorder.brandcode, 
                         dbo.Brand_Master.Marka, dbo.nt_1_deliveryorder.Cash_diff, dbo.nt_1_deliveryorder.CashDiffAc, dbo.nt_1_deliveryorder.TDSAc, dbo.nt_1_deliveryorder.CashDiffAcId, dbo.nt_1_deliveryorder.TDSAcId, 
                         dbo.nt_1_deliveryorder.TDSRate, dbo.nt_1_deliveryorder.TDSAmt, qryTDS.Ac_Name_E AS TDSName, qrycashdiif.Ac_Name_E AS CAshdiffName, dbo.nt_1_deliveryorder.TDSCut, dbo.nt_1_deliveryorder.tenderid, 
                         dbo.nt_1_tender.Payment_To, dbo.nt_1_deliveryorder.MemoGSTRate, qrymstshipto.Pincode, dbo.nt_1_deliveryorder.RCMCGSTAmt, dbo.nt_1_deliveryorder.RCMSGSTAmt, dbo.nt_1_deliveryorder.RCMIGSTAmt, 
                         dbo.nt_1_deliveryorder.saleid, qrymstgetpass.Pincode AS getpasspin, dbo.nt_1_tender.season, nt_1_accountmaster_1.Short_Name AS paymentshortname, nt_1_accountmaster_1.Email_Id AS paymentToEmail, dbo.nt_1_deliveryorder.RCMNumber, CONVERT(varchar(10),
                         dbo.nt_1_deliveryorder.EwayBillValidDate, 103) AS EwayBillValidDate, dbo.nt_1_deliveryorder.SaleTDSRate, dbo.nt_1_deliveryorder.PurchaseTDSRate, dbo.nt_1_deliveryorder.PurchaseRate, 
                         dbo.nt_1_deliveryorder.SBNarration, ' ' AS WordinAmount, dbo.nt_1_tender.Tender_Date, dbo.nt_1_deliveryorder.narration1 AS utrnarration, qrymstdo.Address_E AS DoAdd, qrymstgetpass.Tan_no AS getpasstan_no, 
                         qrymstshipto.Tan_no AS shiptotan_no, qrymstdo.FSSAI AS dofssaino, qrycashdiif.cityname AS cashdiifcity, dbo.nt_1_deliveryorder.MailSend, dbo.nt_1_deliveryorder.ISEInvoice, dbo.nt_1_deliveryorder.IsPayment, 
                         CONVERT(varchar(10), dbo.nt_1_deliveryorder.Do_DATE, 103) AS Do_Date_Conv, dbo.nt_1_sugarsale.saleid AS saleidtable, qrymstaccountmaster_1.Ac_Name_E AS saleBillToName, 
                         qrymstaccountmaster_1.Pincode AS saleBillToPinCode, qrymstaccountmaster_1.Gst_No AS saleBillToGSTNo, qrymstaccountmaster_1.FSSAI AS saleBillToFSSAI, qrymstaccountmaster_1.GSTStateCode, 
                         qrymstaccountmaster_1.cityname AS saleBillToCityName, qrymstaccountmaster_1.CompanyPan AS saleBillToPan, qrymstaccountmaster_1.State_Name AS saleBillToStateName, 
                         qrymstaccountmaster_1.Address_E AS saleBillToAddress, dbo.qrydodetail.Narration, dbo.qrydodetail.Amount AS UTRAmount, dbo.qrydodetail.UTRDate, dbo.qrydodetail.totUTRAmt, dbo.company.Company_Name_E, 
                         dbo.company.Address_E, dbo.company.City_E, dbo.company.State_E, dbo.company.PIN, dbo.company.Mobile_No, dbo.company.FSSAI_No, dbo.company.GST, dbo.tblvoucherheadaddress.AL1, dbo.tblvoucherheadaddress.AL2, 
                         dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other, dbo.tblvoucherheadaddress.BillFooter, dbo.tblvoucherheadaddress.bankdetail, dbo.nt_1_tender.Sell_Note_No, 
                         dbo.qrydodetail.Company_Code AS Expr1, dbo.qrydodetail.bankname, dbo.qrydodetail.bankcityname, dbo.qrymstaccountmaster.Address_E AS bankaddress, dbo.qrymstaccountmaster.Pincode AS bankpincode, 
                         dbo.qrymstaccountmaster.Tin_No AS banktinno, dbo.qrymstaccountmaster.Gst_No AS bankgstno, dbo.qrymstaccountmaster.State_Name AS bankstate, dbo.qrymstaccountmaster.CompanyPan AS bankpan, 
                         dbo.qrymstaccountmaster.FSSAI AS bankFSSAI, dbo.company.Pan_No AS companyPan, dbo.qrymstaccountmaster.GSTStateCode AS bankGSTStateCode, dbo.nt_1_companyparameters.GSTStateCode AS companyGSTStateCode, 
                         qrymstmillcode.whatsup_no AS MillWpNo, dbo.qrymstaccountmaster.Email_Id AS bankEmail, dbo.qrymstaccountmaster.whatsup_no AS bankWpNo, qrymstmillcode.State_Name AS millStateName, 
                         CashDiffAcWhtsAppNumber.whatsup_no AS CashDiffMobileNo, dbo.nt_1_accountmaster.whatsup_no AS SaleBillToWhatsAppNo
FROM            dbo.nt_1_companyparameters INNER JOIN
                         dbo.nt_1_deliveryorder INNER JOIN
                         dbo.qrymstaccountmaster AS qrymstaccountmaster_1 ON dbo.nt_1_deliveryorder.sb = qrymstaccountmaster_1.accoid ON dbo.nt_1_companyparameters.Company_Code = dbo.nt_1_deliveryorder.company_code AND 
                         dbo.nt_1_companyparameters.Year_Code = dbo.nt_1_deliveryorder.Year_Code INNER JOIN
                         dbo.nt_1_accountmaster AS CashDiffAcWhtsAppNumber ON dbo.nt_1_deliveryorder.CashDiffAcId = CashDiffAcWhtsAppNumber.accoid INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_deliveryorder.sb = dbo.nt_1_accountmaster.accoid LEFT OUTER JOIN
                         dbo.qrydodetail LEFT OUTER JOIN
                         dbo.qrymstaccountmaster ON dbo.qrydodetail.bc = dbo.qrymstaccountmaster.accoid ON dbo.nt_1_deliveryorder.doid = dbo.qrydodetail.doid LEFT OUTER JOIN
                         dbo.nt_1_sugarsale ON dbo.nt_1_deliveryorder.Year_Code = dbo.nt_1_sugarsale.Year_Code AND dbo.nt_1_deliveryorder.company_code = dbo.nt_1_sugarsale.Company_Code AND 
                         dbo.nt_1_deliveryorder.doc_no = dbo.nt_1_sugarsale.DO_No LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_1 RIGHT OUTER JOIN
                         dbo.nt_1_tender ON nt_1_accountmaster_1.accoid = dbo.nt_1_tender.pt ON dbo.nt_1_deliveryorder.purc_no = dbo.nt_1_tender.Tender_No AND 
                         dbo.nt_1_deliveryorder.company_code = dbo.nt_1_tender.Company_Code LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryTDS ON dbo.nt_1_deliveryorder.TDSAcId = qryTDS.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrycashdiif ON dbo.nt_1_deliveryorder.CashDiffAcId = qrycashdiif.accoid LEFT OUTER JOIN
                         dbo.Brand_Master ON dbo.nt_1_deliveryorder.company_code = dbo.Brand_Master.Company_Code AND dbo.nt_1_deliveryorder.brandcode = dbo.Brand_Master.Code LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymsttransportcode ON dbo.nt_1_deliveryorder.tc = qrymsttransportcode.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrycarporateac ON dbo.nt_1_deliveryorder.ca = qrycarporateac.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstvasuliacc ON dbo.nt_1_deliveryorder.va = qrymstvasuliacc.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstvoucherby ON dbo.nt_1_deliveryorder.vb = qrymstvoucherby.accoid LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_deliveryorder.GstRateCode = dbo.nt_1_gstratemaster.Doc_no AND dbo.nt_1_deliveryorder.company_code = dbo.nt_1_gstratemaster.Company_Code LEFT OUTER JOIN
                         dbo.qrymstitem ON dbo.nt_1_deliveryorder.ic = dbo.qrymstitem.systemid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstdo ON dbo.nt_1_deliveryorder.docd = qrymstdo.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstbrokercode ON qrymstbrokercode.accoid = dbo.nt_1_deliveryorder.bk LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstsalebill ON dbo.nt_1_deliveryorder.sb = qrymstsalebill.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstshipto LEFT OUTER JOIN
                         dbo.gststatemaster AS qryshiptostatemaster ON qryshiptostatemaster.State_Code = qrymstshipto.GSTStateCode ON dbo.nt_1_deliveryorder.st = qrymstshipto.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstgetpass LEFT OUTER JOIN
                         dbo.gststatemaster AS qrygetpassstatemaster ON qrygetpassstatemaster.State_Code = qrymstgetpass.GSTStateCode ON dbo.nt_1_deliveryorder.gp = qrymstgetpass.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstmillcode LEFT OUTER JOIN
                         dbo.gststatemaster AS gstmstmill ON qrymstmillcode.GSTStateCode = gstmstmill.State_Code ON qrymstmillcode.accoid = dbo.nt_1_deliveryorder.mc LEFT OUTER JOIN
                         dbo.gststatemaster AS gstmstsellbill ON qrymstsalebill.GSTStateCode = gstmstsellbill.State_Code LEFT OUTER JOIN
                         dbo.gststatemaster AS gstmsttransport ON qrymsttransportcode.GSTStateCode = gstmsttransport.State_Code RIGHT OUTER JOIN
                         dbo.tblvoucherheadaddress LEFT OUTER JOIN
                         dbo.company ON dbo.tblvoucherheadaddress.Company_Code = dbo.company.Company_Code ON dbo.nt_1_deliveryorder.company_code = dbo.company.Company_Code
                 where dbo.nt_1_deliveryorder.Company_Code = :company_code and dbo.nt_1_deliveryorder.Year_Code = :year_code and dbo.nt_1_deliveryorder.doc_no = :doc_no
                           
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code, "doc_no": doc_no})

        additional_data_rows = additional_data.fetchall()
    
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' in data and data['doc_date'] is not None:
                data['doc_date'] = data['doc_date'].strftime('%d/%m/%Y')
            else:
                data['doc_date'] = None

            if 'Purchase_Date' in data and data['Purchase_Date'] is not None:
                data['Purchase_Date'] = data['Purchase_Date'].strftime('%d/%m/%Y')
            else:
                data['Purchase_Date'] = None

            if 'mill_inv_date' in data and data['mill_inv_date'] is not None:
                data['mill_inv_date'] = data['mill_inv_date'].strftime('%d/%m/%Y')
            else:
                data['mill_inv_date'] = None

            if 'Tender_Date' in data and data['Tender_Date'] is not None:
                data['Tender_Date'] = data['Tender_Date'].strftime('%d/%m/%Y')
            else:
                data['Tender_Date'] = None

            if 'UTRDate' in data and data['UTRDate'] is not None:
                data['UTRDate'] = data['UTRDate'].strftime('%d/%m/%Y')
            else:
                data['UTRDate'] = None

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Check Multiple DO (same truck_no, doc_date, mill_rate, mill_code, SB_No=0)
@app.route(API_URL+"/check-multiple-do", methods=["GET"])
def check_multiple_do():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no')

        if not company_code or not year_code or not doc_no:
            return jsonify({"error": "Missing parameters"}), 400

        # Fetch key fields of the current DO
        current_query = text("""
            SELECT doc_date, truck_no, mill_rate, mill_code
            FROM NT_1_deliveryorder
            WHERE doc_no = :doc_no AND company_code = :company_code AND Year_Code = :year_code
        """)
        current_row = db.session.execute(current_query, {
            "doc_no": doc_no,
            "company_code": company_code,
            "year_code": year_code
        }).fetchone()

        if not current_row:
            return jsonify({"count": 1, "docs": []}), 200

        # Find all DOs matching same truck/date/rate/mill with SB_No=0
        multi_query = text("""
            SELECT doc_no, quantal
            FROM NT_1_deliveryorder
            WHERE doc_date = :doc_date
              AND truck_no = :truck_no
              AND mill_rate = :mill_rate
              AND SB_No = 0
              AND mill_code = :mill_code
              AND company_code = :company_code
              AND Year_Code = :year_code
            AND purc_no != 0
            ORDER BY doc_no
        """)
        rows = db.session.execute(multi_query, {
            "doc_date": current_row.doc_date,
            "truck_no": current_row.truck_no,
            "mill_rate": current_row.mill_rate,
            "mill_code": current_row.mill_code,
            "company_code": company_code,
            "year_code": year_code
        }).fetchall()

        docs = [{"doc_no": row.doc_no, "quantal": float(row.quantal or 0)} for row in rows]
        return jsonify({"count": len(docs), "docs": docs}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Pending SB List
@app.route(API_URL+"/pending_SBList", methods=["GET"])
def pending_SBList():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''

SELECT dbo.qrydohead.doc_no AS DO_NO, dbo.qrydohead.doc_dateConverted AS doc_Date, dbo.qrydohead.Do_Date_Conv AS Do_Date, dbo.qrydohead.quantal, dbo.qrydohead.salebillname, 
                         dbo.qrydohead.millname, dbo.qrydohead.truck_no, dbo.qrydohead.millshortname, dbo.qrymstgrademaster.System_Name_E AS Grade
FROM            dbo.qrydohead INNER JOIN
                         dbo.qrymstgrademaster ON dbo.qrydohead.gradeCode = dbo.qrymstgrademaster.System_Code
WHERE        (dbo.qrydohead.SB_No IS NULL) AND (dbo.qrydohead.desp_type <> 'DO') AND (dbo.qrydohead.purc_no <> 0) AND (dbo.qrydohead.SaleBillTo <> 0) AND (dbo.qrydohead.SaleBillTo <> 2) AND 
                         (dbo.qrydohead.SaleBillTo <> dbo.qrydohead.GETPASSCODE) AND (dbo.qrydohead.company_code = :company_code) AND (dbo.qrydohead.Year_Code = :year_code) OR
                         (dbo.qrydohead.SB_No = 0) AND (dbo.qrydohead.desp_type <> 'DO') AND (dbo.qrydohead.purc_no <> 0) AND (dbo.qrydohead.SaleBillTo <> 0) AND (dbo.qrydohead.SaleBillTo <> 2) AND 
                         (dbo.qrydohead.SaleBillTo <> dbo.qrydohead.GETPASSCODE) AND (dbo.qrydohead.company_code = :company_code) AND (dbo.qrydohead.Year_Code = :year_code)
ORDER BY dbo.qrydohead.millname, DO_NO


                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/update_pending_docdates", methods=["POST"])
def update_pending_docdates():
    try:
        data = request.get_json()
        changedate = data.get("changedate")
        company_code = data.get("Company_Code")
        year_code = data.get("Year_Code")

        if not all([changedate, company_code, year_code]):
            return jsonify({"error": "Missing required parameters"}), 400


        qry = '''
            SELECT doid as DO_NO, doc_no, voucher_no, saleidtable
            FROM qrydohead
            WHERE (SB_NO IS NULL OR SB_NO = 0)
              AND desp_type != 'DO'
              AND purc_no != 0
              AND SaleBillTo != 0 AND SaleBillTo != 2 AND SaleBillTo != GETPASSCODE
              AND Company_Code = :company_code AND Year_Code = :year_code
        '''

        result = db.session.execute(text(qry), {
            "company_code": company_code,
            "year_code": year_code
        }).fetchall()

        if not result:
            return jsonify({"message": "No records found"}), 404

        # Step 2: Collect clean IDs (skip None)
        dono = []
        doc_no = []
        psno = []
        saleid = []

        for row in result:
            if row.DO_NO is not None:
                dono.append(str(row.DO_NO))
            if row.doc_no is not None:
                doc_no.append(str(row.doc_no))
            if row.voucher_no is not None:
                psno.append(str(row.voucher_no))
            if row.saleidtable is not None:
                saleid.append(str(row.saleidtable))

        # Step 3: Ensure lists are not empty
        if not any([dono, doc_no, psno, saleid]):
            return jsonify({"message": "No valid data found to update"}), 400

        # Step 4: Run updates
        if dono:
            db.session.execute(text(f"""
                UPDATE nt_1_deliveryorder
                SET doc_date = :changedate, Purchase_Date = :changedate
                WHERE doid IN ({','.join(dono)})
            """), {"changedate": changedate})

        if saleid:
            db.session.execute(text(f"""
                UPDATE nt_1_sugarsale
                SET doc_date = :changedate
                WHERE saleid IN ({','.join(saleid)})
            """), {"changedate": changedate})

        if psno:
            db.session.execute(text(f"""
                UPDATE nt_1_sugarpurchase
                SET doc_date = :changedate
                WHERE doc_no IN ({','.join(psno)})
                  AND Company_Code = :company_code AND Year_Code = :year_code
            """), {"changedate": changedate, "company_code": company_code, "year_code": year_code})

            db.session.execute(text(f"""
                UPDATE nt_1_gledger
                SET doc_date = :changedate
                WHERE TRAN_TYPE = 'PS'
                  AND doc_no IN ({','.join(psno)})
                  AND Company_Code = :company_code AND Year_Code = :year_code
            """), {"changedate": changedate, "company_code": company_code, "year_code": year_code})

        if saleid:
            db.session.execute(text(f"""
                UPDATE nt_1_gledger
                SET doc_date = :changedate
                WHERE TRAN_TYPE = 'SB'
                  AND saleid IN ({','.join(saleid)})
                  AND Company_Code = :company_code AND Year_Code = :year_code
            """), {"changedate": changedate, "company_code": company_code, "year_code": year_code})

        if doc_no:
            db.session.execute(text(f"""
                UPDATE nt_1_gledger
                SET doc_date = :changedate
                WHERE TRAN_TYPE = 'DO'
                  AND doc_no IN ({','.join(doc_no)})
                  AND Company_Code = :company_code AND Year_Code = :year_code
            """), {"changedate": changedate, "company_code": company_code, "year_code": year_code})

        # Final commit
        db.session.commit()
        return jsonify({"message": "Document dates updated successfully!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


#Genrate Profarma invoice
@app.route(API_URL+"/generating_proforma_invoice", methods=["GET"])
def generating_proforma_invoice():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no')

        if not company_code or not year_code or not doc_no:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT        dbo.qrysalehead.doc_no, dbo.qrysalehead.PURCNO, dbo.qrysalehead.doc_date, dbo.qrysalehead.Ac_Code, dbo.qrysalehead.Unit_Code, dbo.qrysalehead.mill_code, dbo.qrysalehead.FROM_STATION, 
                         dbo.qrysalehead.TO_STATION, dbo.qrysalehead.LORRYNO, dbo.qrysalehead.BROKER, dbo.qrysalehead.wearhouse, dbo.qrysalehead.subTotal, dbo.qrysalehead.LESS_FRT_RATE, dbo.qrysalehead.freight, 
                         dbo.qrysalehead.cash_advance, dbo.qrysalehead.bank_commission, dbo.qrysalehead.OTHER_AMT, dbo.qrysalehead.Bill_Amount, dbo.qrysalehead.Due_Days, dbo.qrysalehead.NETQNTL, dbo.qrysalehead.Company_Code, 
                         dbo.qrysalehead.Year_Code, dbo.qrysalehead.Branch_Code, dbo.qrysalehead.Created_By, dbo.qrysalehead.Modified_By, dbo.qrysalehead.Tran_Type, dbo.qrysalehead.DO_No, dbo.qrysalehead.Transport_Code, 
                         ISNULL(dbo.qrysalehead.RateDiff,0) AS RateDiff, dbo.qrysalehead.ASN_No, dbo.qrysalehead.GstRateCode, dbo.qrysalehead.CGSTRate, dbo.qrysalehead.CGSTAmount, dbo.qrysalehead.SGSTRate, dbo.qrysalehead.SGSTAmount, 
                         dbo.qrysalehead.IGSTRate, dbo.qrysalehead.IGSTAmount, dbo.qrysalehead.TaxableAmount, dbo.qrysalehead.EWay_Bill_No, dbo.qrysalehead.EWayBill_Chk, dbo.qrysalehead.MillInvoiceNo, dbo.qrysalehead.RoundOff, 
                         dbo.qrysalehead.saleid, dbo.qrysalehead.ac, dbo.qrysalehead.uc, dbo.qrysalehead.mc, dbo.qrysalehead.bk, dbo.qrysalehead.billtoname, dbo.qrysalehead.billtoaddress, dbo.qrysalehead.billtogstno, 
                         dbo.qrysalehead.billtopanno, dbo.qrysalehead.billtopin, dbo.qrysalehead.billtopincode, dbo.qrysalehead.billtocitystate, dbo.qrysalehead.billtogststatecode, dbo.qrysalehead.shiptoname, dbo.qrysalehead.shiptoaddress, 
                         dbo.qrysalehead.shiptogstno, dbo.qrysalehead.shiptopanno, dbo.qrysalehead.shiptocityname, dbo.qrysalehead.shiptocitypincode, dbo.qrysalehead.shiptocitystate, dbo.qrysalehead.shiptogststatecode, 
                         dbo.qrysalehead.billtoemail, dbo.qrysalehead.shiptoemail, dbo.qrysalehead.millname, dbo.qrysalehead.brokername, dbo.qrysalehead.GST_Name, dbo.qrysalehead.gstrate, dbo.qrysaledetail.detail_id AS itemcode, 
                         dbo.qrysaledetail.item_code, dbo.qrysaledetail.narration, dbo.qrysaledetail.Quantal, dbo.qrysaledetail.packing, dbo.qrysaledetail.bags, dbo.qrysaledetail.rate AS salerate, dbo.qrysaledetail.item_Amount, dbo.qrysaledetail.ic, 
                         dbo.qrysaledetail.saledetailid, dbo.qrysaledetail.itemname, dbo.qrysaledetail.HSN, dbo.qrysalehead.doc_dateConverted, dbo.qrysalehead.tc, dbo.qrysalehead.transportname, dbo.qrysalehead.transportmobile, 
                         dbo.qrysalehead.billtomobileto, dbo.qrysalehead.GSTStateCode AS partygststatecode, dbo.qrysalehead.shiptostatecode, dbo.qrysalehead.DoNarrtion, dbo.qrysalehead.TCS_Rate, dbo.qrysalehead.TCS_Amt, 
                         dbo.qrysalehead.TCS_Net_Payable, dbo.qrysalehead.newsbno, dbo.qrysalehead.newsbdate, dbo.qrysalehead.einvoiceno, dbo.qrysalehead.ackno, dbo.qrysalehead.Delivery_type, dbo.qrysalehead.millshortname, 
                         dbo.qrysalehead.billtostatename, dbo.qrysalehead.shiptoshortname, dbo.qrysalehead.shiptomobileno, dbo.qrysalehead.shiptotinno, dbo.qrysalehead.shiptolocallicno, dbo.qrysaledetail.Brand_Code, CONVERT(varchar, 
                         dbo.qrysalehead.EwayBillValidDate, 103) AS EwayBillValidDate, dbo.qrysalehead.FSSAI_BillTo, dbo.qrysalehead.FSSAI_ShipTo, dbo.qrysalehead.BillToTanNo, dbo.qrysalehead.ShipToTanNo, dbo.qrysalehead.TDS_Rate, 
                         dbo.qrysalehead.TDS_Amt, dbo.qrysalehead.IsDeleted, dbo.qrysalehead.SBNarration, dbo.qrysalehead.QRCode, dbo.qrysalehead.MillFSSAI_No, dbo.qrysaledetail.Brand_Name, '' AS FreightPerQtl, 
                         dbo.company.State_E AS companyStateName, dbo.nt_1_companyparameters.GSTStateCode AS companyGSTStateCode, dbo.qrysalehead.grade, dbo.tblvoucherheadaddress.bankdetail, dbo.company.GST AS companyGSTNo, 
                         dbo.company.City_E AS companyCity, dbo.company.FSSAI_No AS companyFSSAI, dbo.company.Pan_No AS companyPan, dbo.company.TIN AS companyTIN, dbo.tblvoucherheadaddress.AL1, dbo.tblvoucherheadaddress.AL2, 
                         dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other, dbo.tblvoucherheadaddress.BillFooter, dbo.company.Company_Name_E, dbo.qrysalehead.season, 
                         dbo.qrysalehead.driver_no, dbo.company.PHONE, dbo.carporatehead.created_by AS Expr1, dbo.carporatehead.pono, dbo.accountingyear.year, dbo.qrysalehead.Carporate_Sale_No AS carporateSaleDoc, 
                         dbo.qrysalehead.CarporateBillToGst_No, dbo.qrysalehead.CarporateBillToEmailID, dbo.qrysalehead.Carporate_Tanno, dbo.qrysalehead.CarporateState_Code, dbo.qrysalehead.Carporate_Pan, 
                         dbo.qrysalehead.Carporate_Address, dbo.qrysalehead.CarporateBillTo_Name, dbo.qrysalehead.Mobile_No AS carporateBillToMobileNo, dbo.qrysalehead.cityname AS carporateBillToCityName, 
                         dbo.qrysalehead.Pincode AS carporateBillToPincode, dbo.qrysalehead.State_Name AS carporateBillToStateName, dbo.qrysalehead.FSSAI AS carporateBillToFSSAI, dbo.qrysalehead.sale_rate AS DOSalerate, 
                         dbo.qrysalehead.Tender_Commission, dbo.carporatehead.selling_type, dbo.qrysalehead.BillToWpNo, dbo.qrysalehead.TransportWpNo, dbo.qrysalehead.ShipToWpNo, dbo.qrysalehead.CarporateBillToWpNo, 
                         dbo.qrysalehead.RefWpNo, dbo.qrysalehead.RefMail, dbo.qrysalehead.TransportEmail,dbo.qrysalehead.millstatename, dbo.qrysalehead.millstatecode
FROM            dbo.nt_1_companyparameters INNER JOIN
                         dbo.tblvoucherheadaddress ON dbo.nt_1_companyparameters.Company_Code = dbo.tblvoucherheadaddress.Company_Code INNER JOIN
                         dbo.accountingyear ON dbo.nt_1_companyparameters.Company_Code = dbo.accountingyear.Company_Code AND dbo.nt_1_companyparameters.Year_Code = dbo.accountingyear.yearCode RIGHT OUTER JOIN
                         dbo.carporatehead RIGHT OUTER JOIN
                         dbo.qrysalehead ON dbo.carporatehead.doc_no = dbo.qrysalehead.Carporate_Sale_No AND dbo.carporatehead.company_code = dbo.qrysalehead.Company_Code ON 
                         dbo.nt_1_companyparameters.Year_Code = dbo.qrysalehead.Year_Code AND dbo.nt_1_companyparameters.Company_Code = dbo.qrysalehead.Company_Code LEFT OUTER JOIN
                         dbo.qrysaledetail ON dbo.qrysalehead.saleid = dbo.qrysaledetail.saleid FULL OUTER JOIN
                         dbo.company ON dbo.qrysalehead.Company_Code = dbo.company.Company_Code
                 where dbo.qrysalehead.Company_Code = :company_code and dbo.qrysalehead.Year_Code = :year_code and dbo.qrysalehead.DO_No = :doc_no
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code, "doc_no": doc_no})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' in data:
                data['doc_date'] = data['doc_date'].strftime('%Y-%m-%d') if data['doc_date'] else None
        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

@app.route(API_URL + "/get_paymentToForTender", methods=['GET'])
def get_payment_to_for_tender():
    company_code = request.args.get('Company_Code')
    year_code = request.args.get('Year_Code')
    tender_no = request.args.get('Tender_No')

    result = db.session.execute(
        text("""
            SELECT Payment_To 
            FROM nt_1_tender 
            WHERE Company_Code = :company_code 
              AND Year_Code = :year_code 
              AND Tender_No = :tender_no
        """),
        {
            'company_code': company_code,
            'year_code': year_code,
            'tender_no': tender_no
        }
    ).fetchone()

    payment_to = result[0] if result else None  

    return jsonify({'Payment_To': payment_to})
