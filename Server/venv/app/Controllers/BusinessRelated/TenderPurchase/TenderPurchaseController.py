from datetime import datetime, timedelta, date
import traceback
from flask import Flask, jsonify, request
from app import app, db, socketio
from app.utils.CommonGLedgerFunctions import get_accoid
from app.models.BusinessReleted.TenderPurchase.TenderPurchaseModels import TenderHead, TenderDetails,TenderGradeDetails
from app.models.Transactions.UTR.UTREntryModels import UTRDetail
from app.models.BusinessReleted.DeliveryOrder.DeliveryOrderModels import DeliveryOrderHead
from app.models.Outword.CommissionBill.CommissionBillModel import CommissionBill
from sqlalchemy import func, text
from sqlalchemy.exc import SQLAlchemyError 
import os
import json
import requests
from app.models.BusinessReleted.TenderPurchase.TenserPurchaseSchema import TenderHeadSchema, TenderDetailsSchema
from app.utils.CommonGLedgerFunctions import fetch_auto_voucher_value, fetch_company_parameters
from app.utils.CommonSugarPurchaseStatusCheck import get_match_status 
from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry
from datetime import time
from zoneinfo import ZoneInfo
from app.Controllers.BusinessRelated.SaudaShifting.SaudaShiftingController import _serialize_remarks

API_URL = os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')
SERVER_NAME = "JK Live Tender Server"

app.config['SECRET_KEY'] = 'ABCDEFGHIJKLMNOPQRST'

EBUY_SUGAR_AC_CODE = os.getenv('EBUY_SUGAR_AC_CODE')

EBUY_AWAY_QUERY = '''
SELECT ISNULL(SUM(Buyer_Quantal), 0) AS away_qty
FROM dbo.nt_1_tenderdetails
WHERE ebuyid = :ebuyid AND tenderid <> :tenderid
'''


def _apply_ebuy_away_adjustment(rows):
    if not EBUY_SUGAR_AC_CODE:
        return rows
    for row in rows:
        if row.get('Buyer') is None or str(row.get('Buyer')) != str(EBUY_SUGAR_AC_CODE):
            continue
        away_row = db.session.execute(
            text(EBUY_AWAY_QUERY),
            {"ebuyid": row.get('tenderdetailid'), "tenderid": row.get('tenderid')}
        ).fetchone()
        away_qty = float(away_row.away_qty or 0) if away_row else 0.0
        if away_qty:
            row['Buyer_Quantal'] = float(row.get('Buyer_Quantal') or 0) - away_qty
            if 'balance' in row and row.get('balance') is not None:
                row['balance'] = float(row.get('balance') or 0) - away_qty
    return rows

# Global SQL Query
TASK_DETAILS_QUERY = '''
  SELECT Mill.Ac_Name_E AS MillName, dbo.nt_1_tender.Mill_Code, dbo.nt_1_tender.mc, dbo.nt_1_tender.ic, dbo.nt_1_tender.itemcode, dbo.qrymstitem.System_Name_E AS ItemName, dbo.nt_1_tender.Payment_To, 
                  dbo.nt_1_tender.pt, PaymentTo.Ac_Name_E AS PaymentToAcName, dbo.nt_1_tender.Tender_From, dbo.nt_1_tender.tf, TenderFrom.Ac_Name_E AS TenderFromAcName, dbo.nt_1_tender.Tender_DO, dbo.nt_1_tender.td, 
                  TenderDo.Ac_Name_E AS TenderDoAcName, dbo.nt_1_tender.Voucher_By, dbo.nt_1_tender.vb, VoucherBy.Ac_Name_E AS VoucherByAcName, dbo.nt_1_tender.Broker, dbo.nt_1_tender.bk, Broker.Ac_Name_E AS BrokerAcName, 
                  dbo.nt_1_tender.gstratecode, dbo.nt_1_gstratemaster.GST_Name, dbo.nt_1_gstratemaster.Rate AS GSTRate, dbo.qrytenderdetail.Tender_No, dbo.qrytenderdetail.Company_Code, dbo.qrytenderdetail.Buyer, 
                  dbo.qrytenderdetail.Buyer_Quantal, dbo.qrytenderdetail.Sale_Rate, dbo.qrytenderdetail.Commission_Rate, dbo.qrytenderdetail.Sauda_Date, dbo.qrytenderdetail.Sauda_DateConverted, dbo.qrytenderdetail.payment_date, 
                  dbo.qrytenderdetail.payment_dateConverted, dbo.qrytenderdetail.Narration, dbo.qrytenderdetail.ID, dbo.qrytenderdetail.Buyer_Party, dbo.qrytenderdetail.AutoID, dbo.qrytenderdetail.IsActive, dbo.qrytenderdetail.year_code, 
                  dbo.qrytenderdetail.Branch_Id, dbo.qrytenderdetail.Delivery_Type, dbo.qrytenderdetail.tenderid, dbo.qrytenderdetail.tenderdetailid, dbo.qrytenderdetail.buyerid, dbo.qrytenderdetail.buyerpartyid, dbo.qrytenderdetail.buyername, 
                  dbo.qrytenderdetail.buyergstno, dbo.qrytenderdetail.buyergststatecode, dbo.qrytenderdetail.buyerpartyname, dbo.qrytenderdetail.buyerpartygstno, dbo.qrytenderdetail.buyerpartygststatecode, dbo.qrytenderdetail.buyeridcityname, 
                  dbo.qrytenderdetail.buyeridcitypincode, dbo.qrytenderdetail.buyeridcitystate, dbo.qrytenderdetail.buyeridcitygststatecode, dbo.qrytenderdetail.buyerpartycityname, dbo.qrytenderdetail.buyerpartycitypincode, 
                  dbo.qrytenderdetail.buyerpartycitystate, dbo.qrytenderdetail.buyerpartycitygststatecode, dbo.qrytenderdetail.sub_broker, dbo.qrytenderdetail.sbr, dbo.qrytenderdetail.subbrokername, dbo.qrytenderdetail.subbrokercityname, 
                  dbo.qrytenderdetail.tcs_rate, dbo.qrytenderdetail.gst_rate, dbo.qrytenderdetail.tcs_amt, dbo.qrytenderdetail.gst_amt, dbo.qrytenderdetail.ShipTo, dbo.qrytenderdetail.CashDiff, dbo.qrytenderdetail.shiptoid, 
                  dbo.qrytenderdetail.ShipToname, dbo.qrytenderdetail.buyershortname, dbo.qrytenderdetail.buyerpartymobno, dbo.qrytenderdetail.ebuyid, ISNULL(SUM(dbo.nt_1_deliveryorder.quantal), 0) AS despatched,
                  ISNULL(dbo.qrytenderdetail.Buyer_Quantal - ISNULL(SUM(dbo.nt_1_deliveryorder.quantal), 0), 0) AS balance, dbo.qrytenderdetail.gradeid, dbo.qrytenderdetail.gradeCode, dbo.nt_1_tenderGradeDetails.gradeRate,
                  gradeDetails.System_Name_E AS detailGradeName, dbo.qrytenderdetail.Mill_Rate,dbo.qrytenderdetail.Purchase_Rate as detailPurchase_Rate, dbo.nt_1_tenderGradeDetails.Purchase_Rate,
                  dbo.qrytenderdetail.Buy_Us, dbo.qrytenderdetail.New_Tender_No, dbo.nt_1_tenderdetails.Sauda_Lifting_Date, dbo.nt_1_tenderdetails.Sauda_Type, dbo.nt_1_tenderdetails.Ex_Mill_Type
FROM     dbo.nt_1_tenderGradeDetails RIGHT OUTER JOIN
                  dbo.qrytenderdetail ON dbo.nt_1_tenderGradeDetails.tenderid = dbo.qrytenderdetail.tenderid AND dbo.nt_1_tenderGradeDetails.gradeid = dbo.qrytenderdetail.gradeid LEFT OUTER JOIN
                  dbo.nt_1_systemmaster AS gradeDetails ON dbo.nt_1_tenderGradeDetails.gradeid = gradeDetails.systemid LEFT OUTER JOIN
                  dbo.nt_1_deliveryorder ON dbo.qrytenderdetail.tenderdetailid = dbo.nt_1_deliveryorder.tenderdetailid LEFT OUTER JOIN
                  dbo.nt_1_tenderdetails ON dbo.qrytenderdetail.tenderdetailid = dbo.nt_1_tenderdetails.tenderdetailid RIGHT OUTER JOIN
                  dbo.nt_1_tender ON dbo.qrytenderdetail.tenderid = dbo.nt_1_tender.tenderid LEFT OUTER JOIN
                  dbo.nt_1_gstratemaster ON dbo.nt_1_tender.Company_Code = dbo.nt_1_gstratemaster.Company_Code AND dbo.nt_1_tender.gstratecode = dbo.nt_1_gstratemaster.Doc_no LEFT OUTER JOIN
                  dbo.qrymstaccountmaster AS Broker ON dbo.nt_1_tender.bk = Broker.accoid LEFT OUTER JOIN
                  dbo.qrymstaccountmaster AS VoucherBy ON dbo.nt_1_tender.vb = VoucherBy.accoid LEFT OUTER JOIN
                  dbo.qrymstaccountmaster AS TenderDo ON dbo.nt_1_tender.td = TenderDo.accoid LEFT OUTER JOIN
                  dbo.qrymstaccountmaster AS TenderFrom ON dbo.nt_1_tender.tf = TenderFrom.accoid LEFT OUTER JOIN
                  dbo.qrymstaccountmaster AS PaymentTo ON dbo.nt_1_tender.pt = PaymentTo.accoid LEFT OUTER JOIN
                  dbo.qrymstitem ON dbo.nt_1_tender.ic = dbo.qrymstitem.systemid LEFT OUTER JOIN
                  dbo.qrymstaccountmaster AS Mill ON dbo.nt_1_tender.mc = Mill.accoid
WHERE  (dbo.nt_1_tender.tenderid = :tenderid)
GROUP BY Mill.Ac_Name_E, dbo.nt_1_tender.Mill_Code, dbo.nt_1_tender.mc, dbo.nt_1_tender.ic, dbo.nt_1_tender.itemcode, dbo.qrymstitem.System_Name_E, dbo.nt_1_tender.Payment_To, dbo.nt_1_tender.pt, PaymentTo.Ac_Name_E, 
                  dbo.nt_1_tender.Tender_From, dbo.nt_1_tender.tf, TenderFrom.Ac_Name_E, dbo.nt_1_tender.Tender_DO, dbo.nt_1_tender.td, TenderDo.Ac_Name_E, dbo.nt_1_tender.Voucher_By, dbo.nt_1_tender.vb, VoucherBy.Ac_Name_E, 
                  dbo.nt_1_tender.Broker, dbo.nt_1_tender.bk, Broker.Ac_Name_E, dbo.nt_1_tender.gstratecode, dbo.nt_1_gstratemaster.GST_Name, dbo.nt_1_gstratemaster.Rate, dbo.qrytenderdetail.Tender_No, dbo.qrytenderdetail.Company_Code, 
                  dbo.qrytenderdetail.Buyer, dbo.qrytenderdetail.Buyer_Quantal, dbo.qrytenderdetail.Sale_Rate, dbo.qrytenderdetail.Commission_Rate, dbo.qrytenderdetail.Sauda_Date, dbo.qrytenderdetail.Sauda_DateConverted, 
                  dbo.qrytenderdetail.payment_date, dbo.qrytenderdetail.payment_dateConverted, dbo.qrytenderdetail.Narration, dbo.qrytenderdetail.ID, dbo.qrytenderdetail.Buyer_Party, dbo.qrytenderdetail.AutoID, dbo.qrytenderdetail.IsActive, 
                  dbo.qrytenderdetail.year_code, dbo.qrytenderdetail.Branch_Id, dbo.qrytenderdetail.Delivery_Type, dbo.qrytenderdetail.tenderid, dbo.qrytenderdetail.tenderdetailid, dbo.qrytenderdetail.buyerid, dbo.qrytenderdetail.buyerpartyid, 
                  dbo.qrytenderdetail.buyername, dbo.qrytenderdetail.buyergstno, dbo.qrytenderdetail.buyergststatecode, dbo.qrytenderdetail.buyerpartyname, dbo.qrytenderdetail.buyerpartygstno, dbo.qrytenderdetail.buyerpartygststatecode, 
                  dbo.qrytenderdetail.buyeridcityname, dbo.qrytenderdetail.buyeridcitypincode, dbo.qrytenderdetail.buyeridcitystate, dbo.qrytenderdetail.buyeridcitygststatecode, dbo.qrytenderdetail.buyerpartycityname, 
                  dbo.qrytenderdetail.buyerpartycitypincode, dbo.qrytenderdetail.buyerpartycitystate, dbo.qrytenderdetail.buyerpartycitygststatecode, dbo.qrytenderdetail.sub_broker, dbo.qrytenderdetail.sbr, dbo.qrytenderdetail.subbrokername, 
                  dbo.qrytenderdetail.subbrokercityname, dbo.qrytenderdetail.tcs_rate, dbo.qrytenderdetail.gst_rate, dbo.qrytenderdetail.tcs_amt, dbo.qrytenderdetail.gst_amt, dbo.qrytenderdetail.ShipTo, dbo.qrytenderdetail.CashDiff, 
                  dbo.qrytenderdetail.shiptoid, dbo.qrytenderdetail.ShipToname, dbo.qrytenderdetail.buyershortname, dbo.qrytenderdetail.buyerpartymobno, dbo.qrytenderdetail.ebuyid, dbo.qrytenderdetail.gradeid, dbo.qrytenderdetail.gradeCode,
                  dbo.nt_1_tenderGradeDetails.gradeRate, dbo.nt_1_tenderGradeDetails.gradeid, dbo.nt_1_tenderGradeDetails.gradeCode, gradeDetails.System_Name_E, dbo.qrytenderdetail.Mill_Rate,dbo.qrytenderdetail.Purchase_Rate, dbo.nt_1_tenderGradeDetails.Purchase_Rate,
                  dbo.qrytenderdetail.Buy_Us, dbo.qrytenderdetail.New_Tender_No, dbo.nt_1_tenderdetails.Sauda_Lifting_Date, dbo.nt_1_tenderdetails.Sauda_Type, dbo.nt_1_tenderdetails.Ex_Mill_Type
ORDER BY dbo.qrytenderdetail.ID
'''

#date Format Function
def format_dates(task):
    return {
        "Lifting_Date": task.Lifting_Date.strftime('%Y-%m-%d') if task.Lifting_Date else None,
         "Tender_Date": task.Tender_Date.strftime('%Y-%m-%d') if task.Tender_Date else None,
    }

def format_dates_details(row):
    if 'Sauda_Date' in row:
        row['Sauda_Date'] = row['Sauda_Date'].strftime('%Y-%m-%d') if row['Sauda_Date'] else None
    if 'payment_date' in row:
        row['payment_date'] = row['payment_date'].strftime('%Y-%m-%d') if row['payment_date'] else None
    if 'Sauda_Lifting_Date' in row:
        row['Sauda_Lifting_Date'] = row['Sauda_Lifting_Date'].strftime('%Y-%m-%d') if row['Sauda_Lifting_Date'] else None
    return row

#Fetching Dates for TenderPurchase 
def get_millPayment_Date(company_code, year_code):
    result = db.session.execute(
        text("SELECT Mill_Payment_date FROM nt_1_companyparameters WHERE company_code = :company_code AND year_code = :year_code"),
        {'company_code': company_code, 'year_code': year_code}
    ).fetchone()
    return result.Mill_Payment_date if result else None

# Define a function to compute the new lifting date
def compute_lifting_date(lifting_date_str, mill_payment_days):
    try:
        lifting_date_obj = datetime.strptime(lifting_date_str, "%Y-%m-%d").date()
        new_lifting_date = lifting_date_obj + timedelta(days=mill_payment_days)
        return new_lifting_date
    except ValueError:
        return None

# Define schemas
tender_head_schema = TenderHeadSchema()
tender_head_schemas = TenderHeadSchema(many=True)

tender_detail_schema = TenderDetailsSchema()
tender_detail_schemas = TenderDetailsSchema(many=True)

#GET All Data Show in Utility.
@app.route(API_URL+"/all_tender_data", methods=["GET"])
def all_tender_data():
    try:
        company_code = request.args.get('Company_Code')

        if not company_code:
            return jsonify({"error": "Bad request", "message": "Missing company_code parameter"}), 400

        sql_query = """
            SELECT ROW_NUMBER() OVER (ORDER BY Tender_No DESC) AS RowNumber,
                   Tender_No,
                   Tender_DateConverted AS Tender_Date,
                   millshortname,
                   Quantal,
                   Grade,
                   Mill_Rate,
                   paymenttoname,
                   tenderdoname,
                   season,
                   brokershortname,
                   Lifting_DateConverted AS Lifting_Date,
                   tenderid,
                   Mill_Code
            FROM qrytenderhead
            WHERE Company_Code = :company_code
            ORDER BY Tender_No DESC
        """
        result = db.session.execute(text(sql_query), {'company_code': company_code})

        columns = result.keys()
        data = [dict(zip(columns, row)) for row in result]

        response = {"Tender_Utility":data}

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

#Get the record by Tender No
@app.route(API_URL+'/getTenderByTenderNo', methods=["GET"])
def get_task_by_task_no():
    try:
        Tender_No = request.args.get('Tender_No')
        companyCode = request.args.get('Company_Code')
        if not Tender_No:
            return jsonify({"error": "Task number not provided"}), 400

        task_head = TenderHead.query.filter_by(Tender_No=Tender_No,Company_Code=companyCode).first()
        newtenderid = task_head.tenderid
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"tenderid": newtenderid})

        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        formatted_additional_data_rows = [format_dates_details(row) for row in additional_data_rows]
        formatted_additional_data_rows = _apply_ebuy_away_adjustment(formatted_additional_data_rows)

        grade_rows = TenderGradeDetails.query.filter_by(
            tenderid=newtenderid
        ).all()

        # 4) Serialize it however you like (e.g. marshmallow or manual dump)
        tender_grade_data = [
            {
              "gradeCode": gr.gradeCode,
              "gradeid":   gr.gradeid,
              "gradeRate": float(gr.gradeRate),
              'Purchase_Rate': float(gr.Purchase_Rate)
            }
            for gr in grade_rows
        ]

        response = {
            "last_tender_head_data": {
                **{column.name: getattr(task_head, column.name) for column in task_head.__table__.columns},
                  **format_dates(task_head),
            },
            "last_tender_details_data": formatted_additional_data_rows,
            "last_tender_grade_data": tender_grade_data,
            # Sauda Shifting remarks/references - see SaudaShiftingController.py.
            # Kept OUT of last_tender_head_data on purpose: that dict gets
            # spread into formData, which is sent back wholesale on save -
            # these aren't real nt_1_tender columns for the ORM to consume.
            **_serialize_remarks(task_head),
        }
        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#Insert the record in both the table also perform the oprtation add,update,delete.
@app.route(API_URL+"/insert_tender_head_detail", methods=["POST"])
def insert_tender_head_detail():
    try:
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']
        gradeRateData = data.get("gradeRateData", [])
        try:
            maxTender_No = db.session.query(db.func.max(TenderHead.Tender_No)).filter_by(Company_Code=headData['Company_Code']).scalar() or 0
            newTenderNo = maxTender_No + 1
            headData['Tender_No'] = newTenderNo
            new_head = TenderHead(**headData)
            new_head
            db.session.add(new_head)

            createdDetails = []
            updatedDetails = []
            deletedDetailIds = []

            max_detail_id = db.session.query(db.func.max(TenderDetails.ID)).filter_by(Tender_No=newTenderNo).scalar() or 0

            for index, item in enumerate(detailData, start=1):
    
               if 'rowaction' in item:
                    if item['rowaction'] == "add":
                        item['ID'] = max_detail_id + index
                        item['Tender_No'] = newTenderNo
                        del item['rowaction']
                        new_detail = TenderDetails(**item)
                        new_head.details.append(new_detail)
                        createdDetails.append(new_detail)

                    elif item['rowaction'] == "update":
                        tenderdetailid = item['tenderdetailid']
                        update_values = {k: v for k, v in item.items() if k not in ('tenderdetailid', 'tenderid')}
                        del update_values['rowaction']  
                        db.session.query(TenderDetails).filter(TenderDetails.tenderdetailid == tenderdetailid).update(update_values)
                        updatedDetails.append(tenderdetailid)

                    elif item['rowaction'] == "delete":
                        tenderdetailid = item['tenderdetailid']
                        detail_to_delete = db.session.query(TenderDetails).filter(TenderDetails.tenderdetailid == tenderdetailid).one_or_none()
        
                        if detail_to_delete:
                            db.session.delete(detail_to_delete)
                            deletedDetailIds.append(tenderdetailid)

            for grade in gradeRateData:
                if "gradeRate" in grade and grade["gradeRate"] is not None:
                    try:
                        rate_val = float(grade["gradeRate"])
                        Purchase_Rate = float(grade["Purchase_Rate"]) if "Purchase_Rate" in grade and grade["Purchase_Rate"] is not None else 0.0
                    except ValueError:
                        continue
                    if rate_val > 0:
                        new_grade_detail = TenderGradeDetails(
                            gradeCode=grade.get("gradeCode"),
                            gradeid=grade.get("gradeid"),
                            gradeRate=rate_val,
                            Purchase_Rate=Purchase_Rate,
                            tenderid=new_head.tenderid
                        )
                        db.session.add(new_grade_detail)

            db.session.commit()

            head_data = tender_head_schema.dump(new_head)
            added_details = [tender_detail_schema.dump(detail) for detail in createdDetails]

           # Sockert Emit
            # tenderid/Tender_No are duplicated at the top level (in addition to
            # inside `head`) so listeners can match against the currently-open
            # record without having to reach into the nested dump.
            socketio.emit('tender_added', json.loads(json.dumps({
                'tenderid': head_data.get('tenderid'),
                'Tender_No': head_data.get('Tender_No'),
                'head': head_data,
                'addedDetails': added_details,
                'updatedDetails': updatedDetails,
                'deletedDetailIds': deletedDetailIds
            }, default=str)))

            cash_diff = headData.get('CashDiff', 0)
            if cash_diff == 0:  
                return jsonify({
            "message": "Data processed successfully but no commission bill created due to zero CashDiff",
            "head": tender_head_schema.dump(new_head),
            "addedDetails": [tender_detail_schema.dump(detail) for detail in createdDetails],
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

            tran_type = "CV" if cash_diff < 0 else "LV"

            gstRate = 0.0
            gstratecode = headData.get('gstratecode')

            if gstratecode:
                try:
                    result = db.session.execute(text("""
                        SELECT TOP 1 Rate
                        FROM nt_1_gstratemaster
                        WHERE Company_Code = :Company_Code AND Doc_no = :Doc_no
                    """), {
                        "Company_Code": headData['Company_Code'],
                        "Doc_no": gstratecode
                    }).fetchone()

                    if result and result.Rate is not None:
                        gstRate = float(result.Rate)
                except Exception as e:
                    print("Failed to fetch GST rate from DB:", e)

            qntl = headData['Quantal'] 
            drpType = headData['type']
            millRate = float(headData.get('Mill_Rate', 0))  
            purchaseRate = float(headData.get('Purc_Rate', 0))  
            
            diffAmt = float(headData.get('CashDiff',0))  

            autoVoucher = fetch_auto_voucher_value(headData['Company_Code'], headData['Year_Code'])
            narration = ""
            if str(autoVoucher).strip().upper() == "YES" and (str(drpType).strip().upper() == "R" or str(drpType).strip().upper() == "W"):
                if purchaseRate > 0:
                    narration = f"Quintal: {qntl} Mill: {millRate} Purchase Rate: {purchaseRate}"

                taxMillAmt = float(qntl) * diffAmt  

                isGstCodematched = get_match_status(headData['Voucher_By'], headData['Company_Code'], headData['Year_Code'])

                cgstAmt = 0.00
                sgstAmt = 0.00
                igstAmt = 0.00

                cgstRate = 0.00
                sgstRate = 0.00
                igstRate = 0.00

                if isGstCodematched == "TRUE":
                    cgstRate = gstRate
                    sgstRate = gstRate
                    igstRate = 0.00
                    cgstAmt = taxMillAmt * cgstRate / 100 or 0.00
                    sgstAmt = taxMillAmt * sgstRate / 100 or 0.00
                else:
                    cgstRate = 0.00
                    sgstRate = 0.00
                    igstRate = gstRate
                    igstAmt = taxMillAmt * igstRate / 100 or 0.00

                voucherAmt = cgstAmt + sgstAmt + igstAmt + taxMillAmt
                commissionAmt = diffAmt 

                lvTcsRate = float(headData['TCS_Rate'])  
                lvTdsRate = float(headData['TDS_Rate'])  
                lvTcsAmt = lvTcsRate * voucherAmt /100 
                lvTdsAmt = lvTdsRate * voucherAmt /100

                lvTcsNetPayable = voucherAmt + lvTcsAmt 

                lvNetPayable = 0
                lvNetPayable = lvNetPayable - lvTdsAmt

                commission_data = {
                    "Company_Code": headData['Company_Code'],
                    "Tran_Type": tran_type,  
                    "Year_Code": headData['Year_Code'],
                    "doc_date": headData['Tender_Date'],  
                    "bill_amount": voucherAmt,  
                    "narration1": narration, 
                    "item_code": headData['itemcode'],
                    "ic": headData['ic'],
                    "ac_code": headData['Voucher_By'],
                    "ac": headData['vb'],
                    "bags": headData['Bags'],
                    "mill_code": headData['Mill_Code'],
                    "mc": headData['mc'],
                    "qntl": int(headData['Quantal']),
                    "packing": headData['Packing'],
                    "mill_rate": headData['Mill_Rate'],
                    "sale_rate": 0.00,
                    "purc_rate": headData['Purc_Rate'],
                    "link_no": 0,
                    "link_type": drpType,
                    "link_id": newTenderNo,
                    "unit_code": 0,
                    "broker_code": headData['Broker'],
                    "grade": headData['Grade'],
                    "transport_code": 0,
                    "commission_amount": commissionAmt,
                    "resale_rate": 0.00,
                    "resale_commission": 0.00,
                    "misc_amount": 0.00,
                    "texable_amount": taxMillAmt,
                    "gst_code": 1,
                    "cgst_rate": cgstRate,
                    "cgst_amount": cgstAmt,
                    "sgst_rate": sgstRate,
                    "sgst_amount": sgstAmt,
                    "igst_rate": igstRate,
                    "igst_amount": igstAmt,
                    "bill_amount": voucherAmt,
                    "uc": 0,
                    "bc": headData['bk'],
                    # "TCS_Rate": lvTcsRate,
                    # "TCS_Amt": lvTcsAmt,
                    "TCS_Rate": 0,
                    "TCS_Amt": 0,
                    "TCS_Net_Payable": lvTcsNetPayable,
                    # "TDS": lvTdsRate,
                    # "TDS_Per": lvTdsRate,
                    "TDS": 0.0,
                    "TDS_Per": 0.0,
                    "Tran_Type": tran_type,
                    # "TDSAmount": lvTdsAmt,
                    "TDSAmount": 0.0,
                    # "TDS_Ac": headData['Payment_To'],
                    "TDS_Ac": 0,
                    # "ta": headData['pt'],
                    "ta":0,
                    "Frieght_Rate":0,
                    "Frieght_amt":0,
                    "subtotal":taxMillAmt,
                    "BANK_COMMISSION":0.0,
                    # "IsTDS": "Y",
                }

                commission_response = requests.post(
                    (
                    f"{API_URL_SERVER}/create-RecordCommissionBill"
                    f"?Company_Code={headData['Company_Code']}&Tran_Type={tran_type}&Year_Code={headData['Year_Code']}"
                    ),
                    json=commission_data
                )
                if commission_response.status_code == 201:
                    commission_response_data = commission_response.json()
                    commissionId = commission_response_data.get("record", {}).get("commissionid")
                    docNo =  commission_response_data.get("record", {}).get("new_Record_data", {}).get("doc_no") 
                    tranType = commission_response_data.get("record", {}).get("new_Record_data", {}).get("Tran_Type")

                    db.session.query(TenderHead).filter_by(Tender_No=newTenderNo, Company_Code=headData['Company_Code'], Year_Code=headData['Year_Code']).update({"Voucher_No": docNo,"commissionid": commissionId, "Voucher_Type": tranType})
                    db.session.commit()
                else:
                    return jsonify({"error": "Failed to create Commission Bill", "message": commission_response.json()}), 500
                        
            return jsonify({
                "message": "Data Inserted successfully",
                "head": tender_head_schema.dump(new_head),
                "addedDetails": [tender_detail_schema.dump(detail) for detail in createdDetails],
                "updatedDetails": updatedDetails,
                "deletedDetailIds": deletedDetailIds
            }), 201  
        
        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": "Internal server error", "message": str(e)}), 500  

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500  
    

# #Update the record in both the table also perform the oprtation add,update,delete in detail section..
@app.route(API_URL+"/update_tender_purchase", methods=["PUT"])
def update_tender_purchase():
    try:
        tenderid = request.args.get('tenderid')
        if tenderid is None:
            return jsonify({"error": "Missing 'tenderid' parameter"}), 400  
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']
        gradeRateData = data.get("gradeRateData", [])

        company_code = headData.get('Company_Code')
        year_code = headData.get('Year_Code')
        user_id = headData.get('User_Id', 0)
        
        if 'User_Id' in headData:
            del headData['User_Id']

        existing_head = TenderHead.query.filter_by(tenderid=tenderid).first()

        if not existing_head:
            return jsonify({"error": "TenderHead with the given tenderid not found"}), 404

        # Quintal_changed = existing_head.Quantal != headData.get('Quantal', existing_head.Quantal)
        # Payment_To_changed = existing_head.Payment_To != headData.get('Payment_To', existing_head.Payment_To)
        # ItemCode_changed = existing_head.itemcode != headData.get('itemcode', existing_head.itemcode)

        Quintal_changed = (
            float(existing_head.Quantal) !=
            float(headData.get('Quantal', existing_head.Quantal) or 0)
        )

        Payment_To_changed = (
            str(existing_head.Payment_To) !=
            str(headData.get('Payment_To', existing_head.Payment_To) or '')
        )

        ItemCode_changed = (
            str(existing_head.itemcode) !=
            str(headData.get('itemcode', existing_head.itemcode) or '')
        )

        try:
            updatedHeadCount = db.session.query(TenderHead).filter(TenderHead.tenderid == tenderid).update(headData)
            
            createdDetails = []
            updatedDetails = []
            deletedDetailIds = []

            updated_tender_head = db.session.query(TenderHead).filter(TenderHead.tenderid == tenderid).one()
            tender_no = updated_tender_head.Tender_No

            new_payment_to = headData.get('Payment_To')
            new_pt = headData.get('pt')

            if new_payment_to is not None or new_pt is not None:
                id2_detail = db.session.query(TenderDetails).filter_by(
                    tenderid=tenderid,
                    ID=2
                ).first()

                if id2_detail:
                    if new_payment_to is not None:
                        id2_detail.Payment_To = new_payment_to
                    if new_pt is not None:
                        id2_detail.pt = new_pt

            for item in detailData:
                if item['rowaction'] == "add":
                    item['Tender_No'] = tender_no
                    item['tenderid'] = tenderid
                    if 'ID' not in item:
                        max_detail_id = db.session.query(db.func.max(TenderDetails.ID)).filter_by(Tender_No=tender_no).scalar() or 0
                        new_detail_id = max_detail_id + 1
                        item['ID'] = new_detail_id
                    del item['rowaction'] 
                    new_detail = TenderDetails(**item)
                    db.session.add(new_detail) 
                    createdDetails.append(item)

                elif item['rowaction'] == "update":
                    item['Tender_No'] = tender_no
                    item['tenderid'] = tenderid
                    tenderdetailid = item['tenderdetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('tenderdetailid', 'tenderid')}
                    del update_values['rowaction'] 
                    db.session.query(TenderDetails).filter(TenderDetails.tenderdetailid == tenderdetailid).update(update_values)
                    updatedDetails.append(tenderdetailid)

                elif item['rowaction'] == "delete":
                    tenderdetailid = item['tenderdetailid']
                    detail_to_delete = db.session.query(TenderDetails).filter(TenderDetails.tenderdetailid == tenderdetailid).one_or_none()
    
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(tenderdetailid)

            if gradeRateData:
                # Delete old grade details for this tender
                db.session.query(TenderGradeDetails).filter_by(tenderid=tenderid).delete()

                # Insert new grade details
                for grade in gradeRateData:
                    if "gradeRate" in grade and grade["gradeRate"] is not None:
                        try:
                            rate_val = float(grade["gradeRate"])
                            Purchase_Rate = float(grade["Purchase_Rate"]) if "Purchase_Rate" in grade and grade["Purchase_Rate"] is not None else 0.0
                        except ValueError:
                            continue
                        if rate_val > 0:
                            new_grade_detail = TenderGradeDetails(
                                gradeCode=grade.get("gradeCode"),
                                gradeid=grade.get("gradeid"),
                                gradeRate=rate_val,
                                Purchase_Rate=Purchase_Rate,
                                tenderid=tenderid
                            )
                            db.session.add(new_grade_detail)

            if existing_head and updatedHeadCount > 0 and (Quintal_changed or Payment_To_changed or ItemCode_changed):
                create_company_log_entry(
                    db=db,
                    ac_code=existing_head.Payment_To,
                    value=existing_head.Mill_Rate,
                    doc_no=existing_head.Tender_No,
                    doc_date=existing_head.Tender_Date,
                    item_code=existing_head.itemcode,
                    # updated_doc_date=head_data.get("doc_date"),
                    company_code=company_code,
                    year_code=year_code,
                    record_type='O',
                    record_no=tenderid,
                    user_id=user_id,
                    tran_type="TN",
                    bank_ac=0,
                    created_by=headData.get('Created_By'),
                    modified_by=headData.get('Modified_By'),
                    narration="",
                    quintal=existing_head.Quantal
                )

                create_company_log_entry(
                    db=db,
                    ac_code=headData.get("Payment_To"),
                    value=headData.get("Mill_Rate"),
                    doc_no=headData.get("Tender_No"),
                    doc_date=headData.get("Tender_Date"),
                    item_code=headData.get("itemcode"),
                    # updated_doc_date=head_data.get("doc_date"),
                    company_code=company_code,
                    year_code=year_code,
                    record_type='N',
                    record_no=tenderid,
                    user_id=user_id,
                    tran_type="TN",
                    bank_ac=0,
                    created_by=headData.get('Created_By'),
                    modified_by=headData.get('Modified_By'),
                    narration="",
                    quintal=headData.get("Quantal")
                )

            db.session.commit()
            socketio.emit("tender_updated", {"tenderid": tenderid, "Tender_No": existing_head.Tender_No})

            # cash_diff = headData.get('CashDiff', 0)
            # if cash_diff == 0:  
            #     return jsonify({
            #     "message": "Data Updated successfully",
            #     "updatedHeadCount": updatedHeadCount,
            #     "addedDetails": createdDetails,
            #     "updatedDetails": updatedDetails,
            #     "deletedDetailIds": deletedDetailIds
            # }), 200 

            # tran_type = "CV" if float(cash_diff) < 0 else "LV"
            
            # qntl = float(headData['Quantal'])
            # millRate = float(headData['Mill_Rate'])
            # purchaseRate = float(headData['Purc_Rate'])

            # diffAmt = float(cash_diff)
            # taxMillAmt = qntl * diffAmt
            # isGstCodematched = get_match_status(headData['Voucher_By'], headData['Company_Code'], headData['Year_Code'])

            # cgstRate = 2.5 if isGstCodematched == "TRUE" else 0.0
            # sgstRate = 2.5 if isGstCodematched == "TRUE" else 0.0
            # igstRate = 5.0 if isGstCodematched != "TRUE" else 0.0

            # cgstAmt = taxMillAmt * cgstRate / 100
            # sgstAmt = taxMillAmt * sgstRate / 100
            # igstAmt = taxMillAmt * igstRate / 100

            # voucherAmt = cgstAmt + sgstAmt + igstAmt + taxMillAmt

            # commissionAmt = diffAmt 
            # lvTcsRate = float(headData['TCS_Rate'])
            # lvTdsRate = float(headData['TDS_Rate'])
            # lvTcsAmt = lvTcsRate * voucherAmt /100
            # lvTdsAmt = lvTdsRate * voucherAmt /100

            # lvTcsNetPayable = voucherAmt + lvTcsAmt
            # lvNetPayable = lvTcsNetPayable - lvTdsAmt

            # commission_data = {
            #     "Company_Code": headData['Company_Code'],
            #     "Tran_Type": headData['Voucher_Type'], 
            #     "Year_Code": headData['Year_Code'],
            #     "doc_date": headData['Tender_Date'],
            #     "bill_amount": voucherAmt,
            #     "narration1": f"Qntl: {qntl}, Mill: {millRate}, Purc Rate: {purchaseRate}",
            #     "item_code": headData['itemcode'],
            #     "ac_code": headData['Voucher_By'],
            #     "ac": headData['vb'],
            #     "bags": headData['Bags'],
            #     "mill_code": headData['Mill_Code'],
            #     "mc": headData['mc'],
            #     "qntl": headData['Quantal'],
            #     "packing": headData['Packing'],
            #     "mill_rate": millRate,
            #     "purc_rate": purchaseRate,
            #     "link_id": tender_no,
            #     "link_type": headData['type'],
            #     "broker_code": headData['Broker'],
            #     "commission_amount": commissionAmt,
            #     "texable_amount": taxMillAmt,
            #     "cgst_rate": cgstRate,
            #     "cgst_amount": cgstAmt,
            #     "sgst_rate": sgstRate,
            #     "sgst_amount": sgstAmt,
            #     "igst_rate": igstRate,
            #     "igst_amount": igstAmt,
            #     "bill_amount": voucherAmt,
            #     # "TCS_Rate": lvTcsRate,
            #     # "TCS_Amt": lvTcsAmt,
            #     "TCS_Rate": 0,
            #     "TCS_Amt": 0,
            #    # "TDS": lvTdsRate,
            #     # "TDS_Per": lvTdsRate,
            #     "TDS": 0.0,
            #     "TDS_Per": 0.0,
            #     "Tran_Type": tran_type,
            #     # "TDSAmount": lvTdsAmt,
            #     "TDSAmount": 0.0,
            #     # "TDS_Ac": headData['Payment_To'],
            #     "TDS_Ac": 0,
            #     # "ta": headData['pt'],
            #     "ta":0,
            #     "BANK_COMMISSION":0.0,
            #     # "IsTDS": "Y"
            # }

            # commission_bill_exists = db.session.query(CommissionBill).filter_by(
            #     Company_Code=headData['Company_Code'],
            #     Tran_Type=headData['Voucher_Type'],
            #     Year_Code=headData['Year_Code'],
            #     doc_no=updated_tender_head.Voucher_No
            #     ).first()

            # # If commission_bill exists, then proceed with the API call
            # if commission_bill_exists:
            #     commission_response = requests.put(
            #     f"{API_URL_SERVER}/update-CommissionBill?Company_Code={headData['Company_Code']}&Tran_Type={headData['Voucher_Type']}&Year_Code={headData['Year_Code']}&doc_no={updated_tender_head.Voucher_No}",
            #     json=commission_data
            # )

            #     if commission_response.status_code != 200:
            #         return jsonify({"error": "Failed to update Commission Bill", "message": commission_response.json()}), 500

            db.session.commit()
            serialized_created_details = createdDetails 
        
            return jsonify({
                "message": "Data Updated successfully",
                "updatedHeadCount": updatedHeadCount,
                "addedDetails": serialized_created_details,
                "updatedDetails": updatedDetails,
                "deletedDetailIds": deletedDetailIds
            }), 200 

        except Exception as e:
            print(traceback.format_exc())
            db.session.rollback()
            return jsonify({"error": "Internal server error", "message": str(e)}), 500 

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500  

# #Delete record from datatabse based tenderid  
@app.route(API_URL+"/delete_TenderBytenderid", methods=["DELETE"])
def delete_TenderBytenderid():
    try:
        tenderid = request.args.get('tenderid')
        user_id = request.args.get('user_id', 0)
        with db.session.begin():
            deleted_head = TenderHead.query.filter_by(tenderid=tenderid).first()

            if deleted_head:
                db.session.query(TenderGradeDetails).filter_by(tenderid=tenderid).delete()
                deleted_user_rows = TenderDetails.query.filter_by(tenderid=tenderid).delete()
                deleted_task_rows = TenderHead.query.filter_by(tenderid=tenderid).delete()

                create_company_log_entry(
                    db=db,
                    ac_code=deleted_head.Payment_To,
                    value=deleted_head.Mill_Rate,
                    doc_no=deleted_head.Tender_No,
                    doc_date=deleted_head.Tender_Date,
                    item_code=deleted_head.itemcode,
                    # updated_doc_date=head_data.get("doc_date"),
                    company_code=deleted_head.Company_Code,
                    year_code=deleted_head.Year_Code,
                    record_type='D',
                    record_no=tenderid,
                    user_id=user_id,
                    tran_type="TN",
                    bank_ac=0,
                    created_by=deleted_head.Created_By,
                    modified_by=deleted_head.Modified_By,
                    narration="",
                    quintal=deleted_head.Quantal
                )

        db.session.commit()
        socketio.emit("tender_deleted", {
                "tenderid": tenderid })
        return jsonify({
            "message": f"Deleted {deleted_task_rows} Task row(s) and {deleted_user_rows} User row(s) successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL+"/get_last_tender_no_data", methods=["GET"])
def get_last_tender_no_data():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        last_tender_head = TenderHead.query.filter_by(Company_Code=company_code,Year_Code=year_code).order_by(TenderHead.tenderid.desc()).first()

        if not last_tender_head:
            return jsonify({"error": "No records found in last_tender_head table"}), 404

        last_tenderid = last_tender_head.tenderid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"tenderid": last_tenderid})
     
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
    
        last_tender_head_data = {
            **{column.name: getattr(last_tender_head, column.name) for column in last_tender_head.__table__.columns},
            **format_dates(last_tender_head), 
        }

        last_tender_details_data = additional_data_rows

        grade_rows = TenderGradeDetails.query.filter_by(
            tenderid=last_tenderid
        ).all()

        # 4) Serialize it however you like (e.g. marshmallow or manual dump)
        tender_grade_data = [
            {
              "gradeCode": gr.gradeCode,
              "gradeid":   gr.gradeid,
              "gradeRate": float(gr.gradeRate),
              'Purchase_Rate': float(gr.Purchase_Rate) 
            }
            for gr in grade_rows
        ]
        response = {
            "last_tender_head_data": last_tender_head_data,
            "last_tender_details_data": last_tender_details_data,
            "last_tender_grade_data":tender_grade_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# #Get First record from database in navigation...
@app.route(API_URL+"/getfirsttender_record_navigation", methods=["GET"])
def get_first_record_navigation():
    try:
        company_code = request.args.get('Company_Code')
    
        if not company_code:
            return jsonify({"error": "Company_Code query parameter is required"}), 400
        
        first_task = TenderHead.query.filter_by(Company_Code=company_code).order_by(TenderHead.tenderid.asc()).first()

        if not first_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        first_taskid = first_task.tenderid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"tenderid": first_taskid})

        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        formatted_additional_data_rows = [format_dates_details(row) for row in additional_data_rows]
       
        grade_rows = TenderGradeDetails.query.filter_by(
            tenderid=first_taskid
        ).all()

        # 4) Serialize it however you like (e.g. marshmallow or manual dump)
        tender_grade_data = [
            {
              "gradeCode": gr.gradeCode,
              "gradeid":   gr.gradeid,
              "gradeRate": float(gr.gradeRate),
              'Purchase_Rate': float(gr.Purchase_Rate) 
            }
            for gr in grade_rows
        ]
       
        response = {
            "first_tender_head_data": {
                **{column.name: getattr(first_task, column.name) for column in first_task.__table__.columns},
                **format_dates(first_task), 
            },
            "first_tender_details_data": formatted_additional_data_rows,
            "first_tender_grade_data": tender_grade_data,
            **_serialize_remarks(first_task),
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# #Get last Record from Database in navigation 
@app.route(API_URL+"/getlasttender_record_navigation", methods=["GET"])
def get_last_record_navigation():
    try:
        company_code = request.args.get('Company_Code')

        if not company_code:
            return jsonify({"error": "Company_Code  query parameter is required"}), 400
        
        last_task = TenderHead.query.filter_by(Company_Code=company_code).order_by(TenderHead.tenderid.desc()).first()

        if not last_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        last_taskid = last_task.tenderid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"tenderid": last_taskid})

        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        formatted_additional_data_rows = [format_dates_details(row) for row in additional_data_rows]

        grade_rows = TenderGradeDetails.query.filter_by(
            tenderid=last_taskid
        ).all()

        # 4) Serialize it however you like (e.g. marshmallow or manual dump)
        tender_grade_data = [
            {
              "gradeCode": gr.gradeCode,
              "gradeid":   gr.gradeid,
              "gradeRate": float(gr.gradeRate),
              'Purchase_Rate': float(gr.Purchase_Rate) 
            }
            for gr in grade_rows
        ]
      
      
        response = {
            "last_tender_head_data": {
                **{column.name: getattr(last_task, column.name) for column in last_task.__table__.columns},
                **format_dates(last_task),
                
            },
            "last_tender_details_data":
                formatted_additional_data_rows,
                "last_tender_grade_data" : tender_grade_data,
            **_serialize_remarks(last_task),
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# #Get Previous record by database 
@app.route(API_URL+"/getprevioustender_navigation", methods=["GET"])
def get_previous_task_navigation():
    try:
        company_code = request.args.get('Company_Code')
        current_task_no = request.args.get('CurrenttenderNo')

        if not company_code:
            return jsonify({"error": "Company_Code query parameter is required"}), 400
        
        if not current_task_no:
            return jsonify({"error": "Current Task No is required"}), 400

        previous_task = TenderHead.query.filter(
            TenderHead.Tender_No < current_task_no,
            TenderHead.Company_Code == company_code
        ).order_by(TenderHead.Tender_No.desc()).first()
    
        if not previous_task:
            return jsonify({"error": "No previous records found"}), 404

        previous_task_id = previous_task.tenderid
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"tenderid": previous_task_id})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        formatted_additional_data_rows = [format_dates_details(row) for row in additional_data_rows]

        grade_rows = TenderGradeDetails.query.filter_by(
            tenderid=previous_task_id
        ).all()

        # 4) Serialize it however you like (e.g. marshmallow or manual dump)
        tender_grade_data = [
            {
              "gradeCode": gr.gradeCode,
              "gradeid":   gr.gradeid,
              "gradeRate": float(gr.gradeRate),
              'Purchase_Rate': float(gr.Purchase_Rate) 
            }
            for gr in grade_rows
        ]

        response = {
            "previous_tender_head_data": {
                **{column.name: getattr(previous_task, column.name) for column in previous_task.__table__.columns},
                **format_dates(previous_task), 
            },
            "previous_tender_details_data":formatted_additional_data_rows,
            "previous_tender_grade_data":tender_grade_data,
            **_serialize_remarks(previous_task),
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# #Get Next record by database 
@app.route(API_URL+"/getnexttender_navigation", methods=["GET"])
def get_next_task_navigation():
    try:
        company_code = request.args.get('Company_Code')
        current_task_no = request.args.get('CurrenttenderNo')

        if not company_code:
            return jsonify({"error": "Company_Code query parameter is required"}), 400
        
        if not current_task_no:
            return jsonify({"error": "Current Tender No required"}), 400

        next_task = TenderHead.query.filter(TenderHead.Tender_No > current_task_no,TenderHead.Company_Code == company_code
           ).order_by(TenderHead.Tender_No.asc()).first()

        if not next_task:
            return jsonify({"error": "No next records found"}), 404

        next_task_id = next_task.tenderid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"tenderid": next_task_id})
        
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        formatted_additional_data_rows = [format_dates_details(row) for row in additional_data_rows]

        grade_rows = TenderGradeDetails.query.filter_by(
            tenderid=next_task_id
        ).all()

        # 4) Serialize it however you like (e.g. marshmallow or manual dump)
        tender_grade_data = [
            {
              "gradeCode": gr.gradeCode,
              "gradeid":   gr.gradeid,
              "gradeRate": float(gr.gradeRate),
              'Purchase_Rate': float(gr.Purchase_Rate) 
            }
            for gr in grade_rows
        ]
        
        response = {
            "next_tender_head_data": {
                **{column.name: getattr(next_task, column.name) for column in next_task.__table__.columns},
                **format_dates(next_task)
            },
            "next_tender_details_data": formatted_additional_data_rows,
            "next_tender_grade_data":tender_grade_data,
            **_serialize_remarks(next_task),
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500



import pytz

ist = pytz.timezone('Asia/Kolkata')
today_ist = datetime.now(ist).date()
EBUY_SUGAR_EXPIRY_HOUR = int(os.getenv('EBUY_SUGAR_EXPIRY_HOUR'))
EBUY_SUGAR_EXPIRY_MINUTE = int(os.getenv('EBUY_SUGAR_EXPIRY_MINUTE'))
EBUY_SUGAR_EXPIRY_SECONDS = int(os.getenv('EBUY_SUGAR_EXPIRY_SECONDS'))
expiry_datetime = ist.localize(datetime.combine(
    today_ist,
    time(EBUY_SUGAR_EXPIRY_HOUR, EBUY_SUGAR_EXPIRY_MINUTE, EBUY_SUGAR_EXPIRY_SECONDS)
))

# Add detail entry to a particular tender by Tender_No
@app.route(API_URL + "/add_tender_detail", methods=["POST"])
def add_detail_to_tender():
    try:
        data = request.get_json()
        detail_data = data.get('detailData')
        tender_no = detail_data.get('Tender_No')

        if not tender_no or not detail_data:
            return jsonify({"error": "Missing Tender_No or detailData parameter"}), 400

        tender_head = TenderHead.query.filter_by(Tender_No=tender_no).first()
        if not tender_head:
            return jsonify({"error": "Tender not found"}), 404

        tenderid = tender_head.tenderid

        max_detail_id = db.session.query(func.max(TenderDetails.ID)).filter_by(tenderid=tenderid).scalar() or 0
        new_detail_id = max_detail_id + 1

        detail_data['ID'] = new_detail_id
        detail_data['Tender_No'] = tender_no
        detail_data['tenderid'] = tenderid

        company_code = detail_data.get("Company_Code")

        detail_data["buyerid"] = get_accoid(detail_data.get("Buyer"), company_code)
        detail_data["shiptoid"] = get_accoid(detail_data.get("ShipTo"), company_code)
        detail_data["buyerpartyid"] = get_accoid(detail_data.get("Buyer_Party"), company_code)
        detail_data["sbr"] = get_accoid(detail_data.get("sub_broker"), company_code)
        detail_data["EbuySugarSaudaExpire_Time"] = expiry_datetime.time()

        new_detail = TenderDetails(**detail_data)
        db.session.add(new_detail)
        db.session.flush()  

        tender_details = TenderDetails.query.filter_by(tenderid=tenderid).order_by(TenderDetails.ID).all()

        if tender_details and len(tender_details) > 0:
            first_detail = tender_details[0]  

            try:
                first_qty = float(first_detail.Buyer_Quantal) 
                new_qty = float(new_detail.Buyer_Quantal)
                updated_qty = first_qty - new_qty

                first_detail.Buyer_Quantal = updated_qty
            except Exception as e:
                print(f"Error updating quantity: {e}")

        db.session.commit()
        socketio.emit("tender_updated", {"tenderid": tenderid, "Tender_No": tender_no})

        return jsonify({
            "message": "Detail entry added successfully",
            "detail": tender_detail_schema.dump(new_detail)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Stock Entry Tender Purchase DeliveryOrder
@app.route(API_URL + "/Stock_Entry_tender_purchase", methods=["PUT"])
def Stock_Entry_tender_purchase():
    try:
        tenderid = request.args.get('tenderid')
        tender_no = request.args.get('Tender_No')
        if not tenderid:
            return jsonify({"error": "Missing 'tenderid' parameter"}), 400
        
        data = request.get_json()
        detailData = data['detailData']
        createdDetails, updatedDetails, deletedDetailIds = [], [], []

        for item in detailData:
            try:
                if 'Sauda_Date' in item:
                    item['Sauda_Date'] = datetime.strptime(item['Sauda_Date'], '%Y-%m-%d').date()
                if 'Lifting_Date' in item:
                    item['Lifting_Date'] = datetime.strptime(item['Lifting_Date'], '%Y-%m-%d').date()
                if 'Sauda_Lifting_Date' in item:
                    item['Sauda_Lifting_Date'] = datetime.strptime(item['Sauda_Lifting_Date'], '%Y-%m-%d').date() if item['Sauda_Lifting_Date'] else None

                if item['rowaction'] == "add":
                    del item['rowaction']
                    item.update({'Tender_No': tender_no, 'tenderid': tenderid})
                    if 'ID' not in item:
                        item['ID'] = (db.session.query(db.func.max(TenderDetails.ID)).filter_by(tenderid=tenderid).scalar() or 0) + 1
                    new_detail = TenderDetails(**item)
                    db.session.add(new_detail)
                    db.session.flush()  
                    createdDetails.append(new_detail)

                elif item['rowaction'] == "update":
                    del item['rowaction']
                    db.session.query(TenderDetails).filter_by(tenderdetailid=item['tenderdetailid']).update({k: v for k, v in item.items() if k != 'tenderdetailid'})
                    updatedDetails.append(item['tenderdetailid'])

                elif item['rowaction'] == "delete":
                    detail_to_delete = db.session.query(TenderDetails).filter_by(tenderdetailid=item['tenderdetailid']).one()
                    db.session.delete(detail_to_delete)
                    deletedDetailIds.append(item['tenderdetailid'])

            except Exception as e:
                db.session.rollback()
                return jsonify({"error": "Error processing item", "message": str(e)}), 500

        db.session.commit()
        socketio.emit("tender_updated", {"tenderid": tenderid, "Tender_No": tender_no})
        return jsonify({
            "Message": "Data Inserted Successfully...",
            "addedDetails": tender_detail_schemas.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetails": deletedDetailIds
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#Fetching NextTender No
@app.route(API_URL + "/getNextTenderNo_SugarTenderPurchase", methods=["GET"])
def getNextTenderNo_SugarTenderPurchase():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        max_doc_no = db.session.query(func.max(TenderHead.Tender_No)).filter_by(Company_Code=Company_Code).scalar()

        if max_doc_no is None:
            next_doc_no = 1  
        else:
            next_doc_no = max_doc_no + 1  

        mill_payment_days = get_millPayment_Date(Company_Code, Year_Code)

        lifting_date = compute_lifting_date(datetime.utcnow().date().isoformat(), mill_payment_days) if mill_payment_days else None


        response = {
            "next_doc_no": next_doc_no,
            "lifting_date": lifting_date.isoformat() if lifting_date else None 
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#Fetching Self Account    
@app.route(API_URL +"/get_SelfAc", methods=['GET'])
def get_SelfAc():
    company_code = request.args.get('Company_Code')

    if not company_code:
        return jsonify({'error': 'Both Company_Code is required'}), 400
    try:
        company_code = int(company_code)
        
    except ValueError:
        return jsonify({'error': 'Company_Code  must be integer'}), 400

    query = text("select Ac_Name_E, Ac_Code, accoid from nt_1_accountmaster where Ac_Code = 2 and company_code = :company_code")
    result = db.session.execute(query, {'company_code': company_code}).fetchone()

    if result is None:
        return jsonify({'error': 'No data found for the given Company_Code'}), 404

    self_ac = result.Ac_Code
    Self_acName = result.Ac_Name_E

    accoid = get_accoid(self_ac,company_code)

    return jsonify({
        'SELF_AC': self_ac,
        'Self_acid':accoid,
        'Self_acName': Self_acName
        }), 200

#Fetching DispatchType From CompanyParameter
@app.route(API_URL+"/get_dispatch_type/<company_code>", methods=['GET'])
def get_dispatch_type(company_code):
    result = db.session.execute(
        text("SELECT dispatchType FROM nt_1_companyparameters WHERE company_code = :company_code"),
        {'company_code': company_code}
    ).fetchone()
    dispatch_type = result.dispatchType if result else None
    return jsonify({'dispatchType': dispatch_type})

@app.route(API_URL + '/check-tender-usage', methods=['GET'])
def check_tender_usage():
    try:
        tender_no = request.args.get('Tender_No')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        utr = UTRDetail.query.filter_by(
            lot_no=tender_no,
            Company_Code=company_code,
            Year_Code=year_code
        ).first()

        do = DeliveryOrderHead.query.filter_by(
            purc_no=tender_no,
            company_code=company_code,
            Year_Code=year_code
        ).first()

        do_count = DeliveryOrderHead.query.filter_by(
            purc_no=tender_no,
            company_code=company_code,
            Year_Code=year_code
        ).count()

        print('do_count',do_count)

        if utr:
            return jsonify({'isUsed': True, 'UTRNo': utr.doc_no})

        if do_count > 0:
            print('do_count',do_count)
            return jsonify({
                'isUsed': True,
                'DONo': do.doc_no if do else None,
                'DOCount': do_count
            })

        return jsonify({'isUsed': False})

        if do:
            if hasattr(do, 'tenderdetailid') and do.tenderdetailid:
                return jsonify({'isUsed': True, 'DONo': do.doc_no})
        
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500



@app.route(API_URL + "/getAmountcalculationDataTender", methods=["GET"])
def getAmountcalculationDataTender():
    try:
        Company_Code = request.args.get('CompanyCode')
        Paymentto = request.args.get('PaymentTo')
        Year_Code = request.args.get('Year_Code')
        
        if not all([Company_Code, Paymentto, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        company_parameters = fetch_company_parameters(Company_Code, Year_Code)
        Balancelimt = company_parameters.BalanceLimit
        PurchaseTDSRate=company_parameters.PurchaseTDSRate
        TCSRate=company_parameters.TCSRate
        SaleTDSRate=company_parameters.SaleTDSRate
        
        with db.session.begin_nested():
            PurchaseTDSApplicable = db.session.execute(
                    text('''
                        SELECT TDSApplicable
                        FROM qrymstaccountmaster
                        WHERE Company_Code = :Company_Code AND Ac_Code = :Payment_AC
                    '''),
                    {'Company_Code': Company_Code, 'Payment_AC': Paymentto}
                )
            PurchaseTDSApplicable_Data = PurchaseTDSApplicable.fetchone()
            if not PurchaseTDSApplicable_Data:
                return jsonify({"error": "Purchase TDS applicability not found"}), 404

        response = {
            "Balancelimt": Balancelimt,
             "PurchaseTDSApplicable":PurchaseTDSApplicable_Data.TDSApplicable,
             "PurchaseTDSRate":PurchaseTDSRate,
             "TCSRate":TCSRate,
             "SaleTDSRate":SaleTDSRate,
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500  
    

#Get Live Tenders
@app.route(API_URL + "/get_live_tenders", methods=["GET"])
def get_live_tenders():
    company_code = request.args.get('Company_Code')
    year_code = request.args.get('Year_Code')

     # Calculate current date inside the function for each request
    IST = ZoneInfo("Asia/Kolkata")
    now_ist = datetime.now(IST)
    current_date_str = now_ist.strftime("%Y-%m-%d")

    try:
        query = '''

SELECT  mill.Short_Name AS Mill, buyer.Ac_Name_E AS buyerName, paymentto.Ac_Name_E AS DO, dbo.nt_1_tenderdetails.Buyer_Quantal AS Qntl, dbo.nt_1_tender.season, dbo.nt_1_tenderdetails.Sale_Rate, 
                         CONVERT(varchar, dbo.nt_1_tenderdetails.Sauda_Date, 103) AS Sauda_Date, dbo.nt_1_tenderdetails.Sauda_Time, dbo.nt_1_tenderdetails.tenderdetailid, dbo.nt_1_tenderdetails.Tender_No, dbo.nt_1_tenderdetails.Buyer, 
                         dbo.nt_1_tenderdetails.Commission_Rate, dbo.nt_1_tenderdetails.Lifting_Date, dbo.nt_1_tenderdetails.Buyer_Party, dbo.nt_1_tenderdetails.ID, dbo.nt_1_tenderdetails.tenderid, dbo.nt_1_tenderdetails.buyerid, 
                         dbo.nt_1_tenderdetails.buyerpartyid, dbo.nt_1_tenderdetails.sub_broker, dbo.nt_1_tenderdetails.sbr, dbo.nt_1_tenderdetails.ShipTo, dbo.nt_1_tenderdetails.shiptoid, dbo.nt_1_tenderdetails.tcs_rate, 
                         dbo.nt_1_tenderdetails.gst_rate, shipTo.Ac_Name_E AS shipToName, Broker.Ac_Name_E AS brokername, SubBroker.Ac_Name_E AS subBrokerName, ISNULL(dbo.nt_1_tenderdetails.Mill_Rate, dbo.nt_1_tender.Mill_Rate) 
                         AS Mill_Rate, ISNULL(dbo.nt_1_systemmaster.System_Name_E, dbo.nt_1_tender.Grade) AS Grade, CASE WHEN ISNULL(dbo.nt_1_tenderdetails.Purchase_Rate, 0) = 0 THEN ISNULL(dbo.nt_1_tender.Purc_Rate, 0) 
                         ELSE dbo.nt_1_tenderdetails.Purchase_Rate END AS Purc_Rate, dbo.nt_1_tenderdetails.EbuySelectedParty, dbo.nt_1_tenderdetails.EbuySelectedAccoid, dbo.nt_1_accountmaster.Ac_Name_E AS selectedPartyName
FROM            dbo.nt_1_accountmaster AS paymentto INNER JOIN
                         dbo.nt_1_tender INNER JOIN
                         dbo.nt_1_accountmaster AS buyer INNER JOIN
                         dbo.nt_1_tenderdetails ON buyer.accoid = dbo.nt_1_tenderdetails.buyerid ON dbo.nt_1_tender.tenderid = dbo.nt_1_tenderdetails.tenderid INNER JOIN
                         dbo.nt_1_accountmaster AS mill ON dbo.nt_1_tender.mc = mill.accoid ON paymentto.accoid = dbo.nt_1_tender.pt INNER JOIN
                         dbo.nt_1_accountmaster AS shipTo ON dbo.nt_1_tenderdetails.shiptoid = shipTo.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS Broker ON dbo.nt_1_tenderdetails.buyerpartyid = Broker.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS SubBroker ON dbo.nt_1_tenderdetails.sbr = SubBroker.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_tenderdetails.EbuySelectedAccoid = dbo.nt_1_accountmaster.accoid LEFT OUTER JOIN
                         dbo.nt_1_systemmaster ON dbo.nt_1_tenderdetails.Company_Code = dbo.nt_1_systemmaster.Company_Code AND dbo.nt_1_tenderdetails.gradeid = dbo.nt_1_systemmaster.systemid
WHERE        (dbo.nt_1_tender.Company_Code = :company_code) AND (dbo.nt_1_tenderdetails.Buyer_Quantal <> 0) AND (dbo.nt_1_tenderdetails.ID <> 1) AND (CONVERT(date, dbo.nt_1_tenderdetails.Sauda_Date) = :current_date)
ORDER BY dbo.nt_1_tenderdetails.tenderdetailid DESC, Sauda_Date DESC, dbo.nt_1_tenderdetails.Sauda_Time DESC



        '''
        
        result = db.session.execute(text(query), {'company_code': company_code, 'year_code': year_code,'current_date': current_date_str})
        rows = result.fetchall()
        all_data = []
        for row in rows:
            row_dict = dict(row._mapping)
            
            sauda_time = row_dict.get('Sauda_Time')
            if isinstance(sauda_time, time):
                row_dict['Sauda_Time'] = sauda_time.strftime('%I:%M %p')
            
            all_data.append(row_dict)

        socketio.emit("server_name", {"name": SERVER_NAME})

        return jsonify({"all_data": all_data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500




@app.route(API_URL + "/get_live_tendersall", methods=["GET"])
def get_live_tendersall():
    company_code = request.args.get('Company_Code')
    year_code = request.args.get('Year_Code')

    try:
        query = '''

SELECT  mill.Short_Name AS Mill, buyer.Ac_Name_E AS buyerName, paymentto.Ac_Name_E AS DO, dbo.nt_1_tenderdetails.Buyer_Quantal AS Qntl, dbo.nt_1_tender.season, dbo.nt_1_tenderdetails.Sale_Rate, 
                         CONVERT(varchar, dbo.nt_1_tenderdetails.Sauda_Date, 103) AS Sauda_Date, dbo.nt_1_tenderdetails.Sauda_Time, dbo.nt_1_tenderdetails.tenderdetailid, dbo.nt_1_tenderdetails.Tender_No, dbo.nt_1_tenderdetails.Buyer, 
                         dbo.nt_1_tenderdetails.Commission_Rate, dbo.nt_1_tenderdetails.Lifting_Date, dbo.nt_1_tenderdetails.Buyer_Party, dbo.nt_1_tenderdetails.ID, dbo.nt_1_tenderdetails.tenderid, dbo.nt_1_tenderdetails.buyerid, 
                         dbo.nt_1_tenderdetails.buyerpartyid, dbo.nt_1_tenderdetails.sub_broker, dbo.nt_1_tenderdetails.sbr, dbo.nt_1_tenderdetails.ShipTo, dbo.nt_1_tenderdetails.shiptoid, dbo.nt_1_tenderdetails.tcs_rate, 
                         dbo.nt_1_tenderdetails.gst_rate, shipTo.Ac_Name_E AS shipToName, Broker.Ac_Name_E AS brokername, SubBroker.Ac_Name_E AS subBrokerName, ISNULL(dbo.nt_1_tenderdetails.Mill_Rate, dbo.nt_1_tender.Mill_Rate) 
                         AS Mill_Rate, ISNULL(dbo.nt_1_systemmaster.System_Name_E, dbo.nt_1_tender.Grade) AS Grade, CASE WHEN ISNULL(dbo.nt_1_tenderdetails.Purchase_Rate, 0) = 0 THEN ISNULL(dbo.nt_1_tender.Purc_Rate, 0) 
                         ELSE dbo.nt_1_tenderdetails.Purchase_Rate END AS Purc_Rate, dbo.nt_1_tenderdetails.EbuySelectedParty, dbo.nt_1_tenderdetails.EbuySelectedAccoid, dbo.nt_1_accountmaster.Ac_Name_E AS selectedPartyName
FROM            dbo.nt_1_accountmaster AS paymentto INNER JOIN
                         dbo.nt_1_tender INNER JOIN
                         dbo.nt_1_accountmaster AS buyer INNER JOIN
                         dbo.nt_1_tenderdetails ON buyer.accoid = dbo.nt_1_tenderdetails.buyerid ON dbo.nt_1_tender.tenderid = dbo.nt_1_tenderdetails.tenderid INNER JOIN
                         dbo.nt_1_accountmaster AS mill ON dbo.nt_1_tender.mc = mill.accoid ON paymentto.accoid = dbo.nt_1_tender.pt INNER JOIN
                         dbo.nt_1_accountmaster AS shipTo ON dbo.nt_1_tenderdetails.shiptoid = shipTo.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS Broker ON dbo.nt_1_tenderdetails.buyerpartyid = Broker.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS SubBroker ON dbo.nt_1_tenderdetails.sbr = SubBroker.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_tenderdetails.EbuySelectedAccoid = dbo.nt_1_accountmaster.accoid LEFT OUTER JOIN
                         dbo.nt_1_systemmaster ON dbo.nt_1_tenderdetails.Company_Code = dbo.nt_1_systemmaster.Company_Code AND dbo.nt_1_tenderdetails.gradeid = dbo.nt_1_systemmaster.systemid
WHERE        (dbo.nt_1_tender.Company_Code = :company_code) AND (dbo.nt_1_tender.Year_Code = :year_code) AND (dbo.nt_1_tenderdetails.Buyer_Quantal <> 0) AND (dbo.nt_1_tenderdetails.ID <> 1)
ORDER BY dbo.nt_1_tenderdetails.tenderdetailid DESC, Sauda_Date DESC, dbo.nt_1_tenderdetails.Sauda_Time DESC



        '''
        
        result = db.session.execute(text(query), {'company_code': company_code, 'year_code': year_code})
        rows = result.fetchall()
        all_data = []
        for row in rows:
            row_dict = dict(row._mapping)
            
            sauda_time = row_dict.get('Sauda_Time')
            if isinstance(sauda_time, time):
                row_dict['Sauda_Time'] = sauda_time.strftime('%I:%M %p')
            
            all_data.append(row_dict)

        socketio.emit("server_name", {"name": SERVER_NAME})

        return jsonify({"all_data": all_data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500




#Get Live Tenders
@app.route(API_URL + "/get_elive_tenders", methods=["GET"])
def get_elive_tenders():
    company_code = request.args.get('Company_Code')
    year_code = request.args.get('Year_Code')


    try:
        query = '''

SELECT  mill.Short_Name AS Mill, buyer.Ac_Name_E AS buyerName, paymentto.Ac_Name_E AS DO, dbo.nt_1_tenderdetails.Buyer_Quantal AS Qntl, dbo.nt_1_tender.season, dbo.nt_1_tenderdetails.Sale_Rate, 
                         CONVERT(varchar, dbo.nt_1_tenderdetails.Sauda_Date, 103) AS Sauda_Date, dbo.nt_1_tenderdetails.Sauda_Time, dbo.nt_1_tenderdetails.tenderdetailid, dbo.nt_1_tenderdetails.Tender_No, dbo.nt_1_tenderdetails.Buyer, 
                         dbo.nt_1_tenderdetails.Commission_Rate, dbo.nt_1_tenderdetails.Lifting_Date, dbo.nt_1_tenderdetails.Buyer_Party, dbo.nt_1_tenderdetails.ID, dbo.nt_1_tenderdetails.tenderid, dbo.nt_1_tenderdetails.buyerid, 
                         dbo.nt_1_tenderdetails.buyerpartyid, dbo.nt_1_tenderdetails.sub_broker, dbo.nt_1_tenderdetails.sbr, dbo.nt_1_tenderdetails.ShipTo, dbo.nt_1_tenderdetails.shiptoid, dbo.nt_1_tenderdetails.tcs_rate, 
                         dbo.nt_1_tenderdetails.gst_rate, shipTo.Ac_Name_E AS shipToName, Broker.Ac_Name_E AS brokername, SubBroker.Ac_Name_E AS subBrokerName, ISNULL(dbo.nt_1_tenderdetails.Mill_Rate, dbo.nt_1_tender.Mill_Rate) 
                         AS Mill_Rate, ISNULL(dbo.nt_1_systemmaster.System_Name_E, dbo.nt_1_tender.Grade) AS Grade, CASE WHEN ISNULL(dbo.nt_1_tenderdetails.Purchase_Rate, 0) = 0 THEN ISNULL(dbo.nt_1_tender.Purc_Rate, 0) 
                         ELSE dbo.nt_1_tenderdetails.Purchase_Rate END AS Purc_Rate, dbo.nt_1_tenderdetails.EbuySelectedParty, dbo.nt_1_tenderdetails.EbuySelectedAccoid, dbo.nt_1_accountmaster.Ac_Name_E AS selectedPartyName
FROM            dbo.nt_1_accountmaster AS paymentto INNER JOIN
                         dbo.nt_1_tender INNER JOIN
                         dbo.nt_1_accountmaster AS buyer INNER JOIN
                         dbo.nt_1_tenderdetails ON buyer.accoid = dbo.nt_1_tenderdetails.buyerid ON dbo.nt_1_tender.tenderid = dbo.nt_1_tenderdetails.tenderid INNER JOIN
                         dbo.nt_1_accountmaster AS mill ON dbo.nt_1_tender.mc = mill.accoid ON paymentto.accoid = dbo.nt_1_tender.pt INNER JOIN
                         dbo.nt_1_accountmaster AS shipTo ON dbo.nt_1_tenderdetails.shiptoid = shipTo.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS Broker ON dbo.nt_1_tenderdetails.buyerpartyid = Broker.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS SubBroker ON dbo.nt_1_tenderdetails.sbr = SubBroker.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_tenderdetails.EbuySelectedAccoid = dbo.nt_1_accountmaster.accoid LEFT OUTER JOIN
                         dbo.nt_1_systemmaster ON dbo.nt_1_tenderdetails.Company_Code = dbo.nt_1_systemmaster.Company_Code AND dbo.nt_1_tenderdetails.gradeid = dbo.nt_1_systemmaster.systemid
WHERE        (dbo.nt_1_tender.Company_Code = :company_code) AND (dbo.nt_1_tenderdetails.Buyer_Quantal <> 0) AND (dbo.nt_1_tenderdetails.ID <> 1)
ORDER BY dbo.nt_1_tenderdetails.tenderdetailid DESC, Sauda_Date DESC, dbo.nt_1_tenderdetails.Sauda_Time DESC



        '''
        
        result = db.session.execute(text(query), {'company_code': company_code, 'year_code': year_code,'current_date': current_date_str})
        rows = result.fetchall()
        all_data = []
        for row in rows:
            row_dict = dict(row._mapping)
            
            sauda_time = row_dict.get('Sauda_Time')
            if isinstance(sauda_time, time):
                row_dict['Sauda_Time'] = sauda_time.strftime('%I:%M %p')
            
            all_data.append(row_dict)

        socketio.emit("server_name", {"name": SERVER_NAME})

        return jsonify({"all_data": all_data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    


@app.route(API_URL + "/get_allTenders", methods=["GET"])
def get_allTenders():
    company_code = request.args.get('Company_Code')
    year_code = request.args.get('Year_Code')
    try:
        query = '''
SELECT DISTINCT 
                         TOP (100) PERCENT paymentto.Ac_Name_E AS DO, dbo.nt_1_tender.Grade, dbo.nt_1_tender.season, dbo.nt_1_tender.Mill_Rate, dbo.nt_1_tender.Purc_Rate, dbo.nt_1_tender.Tender_No, CONVERT(varchar, 
                         dbo.nt_1_tender.Tender_Date, 103) AS Tender_Date, mill.Ac_Name_E AS Mill_Name, dbo.nt_1_systemmaster.System_Name_E, CONVERT(varchar, dbo.nt_1_tender.Lifting_Date, 103) AS Lifting_Date, 
                         dbo.nt_1_tender.Payment_To, dbo.nt_1_tender.Quantal,dbo.nt_1_tender.Packing, dbo.nt_1_tender.Bags
FROM            dbo.nt_1_tender INNER JOIN
                         dbo.nt_1_tenderdetails ON dbo.nt_1_tender.tenderid = dbo.nt_1_tenderdetails.tenderid INNER JOIN
                         dbo.nt_1_accountmaster AS mill ON dbo.nt_1_tender.mc = mill.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS paymentto ON dbo.nt_1_tender.Company_Code = paymentto.company_code AND dbo.nt_1_tender.pt = paymentto.accoid INNER JOIN
                         dbo.nt_1_systemmaster ON dbo.nt_1_tender.itemcode = dbo.nt_1_systemmaster.System_Code AND dbo.nt_1_tender.ic = dbo.nt_1_systemmaster.systemid
WHERE        (dbo.nt_1_tender.Company_Code = :company_code) AND (dbo.nt_1_tender.Year_Code = :year_code)
ORDER BY Tender_No DESC


        '''
        
        result = db.session.execute(text(query), {'company_code': company_code, 'year_code': year_code})
        rows = result.fetchall()
        all_data = []
        for row in rows:
            row_dict = dict(row._mapping)
            
            sauda_time = row_dict.get('Sauda_Time')
            if isinstance(sauda_time, time):
                row_dict['Sauda_Time'] = sauda_time.strftime('%I:%M %p')
            
            all_data.append(row_dict)

        socketio.emit("get_allTenders")

        return jsonify({"get_allTenders": all_data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

@app.route(API_URL + '/check-tenderdetailid-usage', methods=['GET'])
def check_tenderdetailid_usage():
    try:
        tenderdetailid = request.args.get('TenderDetailID')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not tenderdetailid:
            return jsonify({'error': 'TenderDetailID is required'}), 400

        do = DeliveryOrderHead.query.filter_by(
            tenderdetailid=tenderdetailid,
            company_code=company_code,
            Year_Code=year_code
        ).first()

        if do:
            return jsonify({
                'isUsed': True,
                'message': f'TenderDetailID {tenderdetailid} is already used in DO No {do.doc_no}'
            })
        else:
            return jsonify({
                'isUsed': False,
                'message': f'TenderDetailID {tenderdetailid} is not used'
            })

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500
    


@app.route(API_URL + '/check-tenderid-usage', methods=['GET'])
def check_tenderid_usage():
    try:
        tenderid = request.args.get('tenderid')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not tenderid:
            return jsonify({'error': 'tenderid is required'}), 400

        do = DeliveryOrderHead.query.filter_by(
            tenderid=tenderid,
            company_code=company_code,
            Year_Code=year_code
        ).first()

        if do:
            return jsonify({
                'isUsed': True,
                'message': f'tenderid {tenderid} is already used in DO No {do.doc_no}'
            })
        else:
            return jsonify({
                'isUsed': False,
                'message': f'tenderid {tenderid} is not used'
            })

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500
    

@app.route(API_URL + '/get-sauda-book-utility', methods=['GET'])
def get_sauda_book_utility():
    try:
        company_code = request.args.get('Company_Code')

        if not company_code:
            return jsonify({"error": "Missing required query parameter: Company_Code"}), 400

        # ------------------ NEW SELF QUERY ------------------
        sql_query = text('''

SELECT   dbo.nt_1_tender.Tender_No, dbo.nt_1_tender.Company_Code, dbo.nt_1_tender.Quantal, ISNULL(SUM(dbo.qryebuysalesaudadetail.saudaqntl), 0) AS sqntl, 
                         ISNULL(SUM(dbo.qryebuysalesaudadetail.soldebuy), 0) AS esold, dbo.nt_1_tender.Quantal + ISNULL(SUM(dbo.qryebuysalesaudadetail.soldebuy), 0) - ISNULL(SUM(dbo.qryebuysalesaudadetail.saudaqntl), 0) AS selfqty, 
                         dbo.nt_1_accountmaster.Ac_Name_E AS millname, dbo.nt_1_accountmaster.Short_Name AS millshortname, dbo.nt_1_tender.Grade, dbo.nt_1_tender.Mill_Rate, dbo.nt_1_tender.Lifting_Date, 
                         nt_1_accountmaster_1.Ac_Name_E AS doname, nt_1_accountmaster_1.Short_Name AS doshortname, dbo.nt_1_tender.tenderid, dbo.nt_1_tenderGradeDetails.Purchase_Rate, dbo.nt_1_tenderGradeDetails.gradeRate, 
                         dbo.nt_1_tenderGradeDetails.gradeid, dbo.nt_1_tenderGradeDetails.gradeCode, dbo.nt_1_tender.mc, dbo.nt_1_tender.Mill_Code, dbo.nt_1_tender.Tender_Date, dbo.nt_1_systemmaster.System_Name_E AS gradename, 
                         dbo.nt_1_tender.itemcode, itemname.System_Name_E AS itemname, itemname.minRate, itemname.maxRate
FROM            dbo.nt_1_tender INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_tender.mc = dbo.nt_1_accountmaster.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_1 ON dbo.nt_1_tender.pt = nt_1_accountmaster_1.accoid INNER JOIN
                         dbo.nt_1_tenderGradeDetails ON dbo.nt_1_tender.tenderid = dbo.nt_1_tenderGradeDetails.tenderid INNER JOIN
                         dbo.nt_1_systemmaster ON dbo.nt_1_tenderGradeDetails.gradeid = dbo.nt_1_systemmaster.systemid INNER JOIN
                         dbo.nt_1_systemmaster AS itemname ON dbo.nt_1_tender.ic = itemname.systemid LEFT OUTER JOIN
                         dbo.qryebuysalesaudadetail ON dbo.nt_1_tender.tenderid = dbo.qryebuysalesaudadetail.tenderid
WHERE      dbo.nt_1_tender.Company_Code = :company_code
GROUP BY dbo.nt_1_tender.Tender_No, dbo.nt_1_tender.Company_Code, dbo.nt_1_tender.Quantal, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_accountmaster.Short_Name, dbo.nt_1_tender.Grade, dbo.nt_1_tender.Mill_Rate, 
                         dbo.nt_1_tender.Lifting_Date, nt_1_accountmaster_1.Ac_Name_E, nt_1_accountmaster_1.Short_Name, dbo.nt_1_tender.tenderid, dbo.nt_1_tenderGradeDetails.Purchase_Rate, dbo.nt_1_tenderGradeDetails.gradeRate, 
                         dbo.nt_1_tenderGradeDetails.gradeid, dbo.nt_1_tenderGradeDetails.gradeCode, dbo.nt_1_tender.mc, dbo.nt_1_tender.Mill_Code, dbo.nt_1_tender.Tender_Date, dbo.nt_1_systemmaster.System_Name_E, 
                         dbo.nt_1_tender.itemcode, itemname.System_Name_E, itemname.minRate, itemname.maxRate
HAVING        (dbo.nt_1_tender.Quantal + ISNULL(SUM(dbo.qryebuysalesaudadetail.soldebuy), 0) - ISNULL(SUM(dbo.qryebuysalesaudadetail.saudaqntl), 0) <> 0)
ORDER BY dbo.nt_1_tender.Lifting_Date DESC


        ''')

        with db.engine.connect() as connection:
            result = connection.execute(sql_query, {'company_code': company_code})
            rows = [dict(row._mapping) for row in result]

        if not rows:
            return jsonify({"SaudaBookUtility": []})

        # ------------------ GROUP GRADES BY TENDER ------------------
        def fmt_date(val):
            if val is None:
                return None
            return val.strftime('%Y-%m-%d') if hasattr(val, 'strftime') else str(val)[:10]

        tenders_map = {}
        for row in rows:
            tid = row['tenderid']
            if tid not in tenders_map:
                tenders_map[tid] = {
                    "Tender_No":    row["Tender_No"],
                    "Tender_Date":  fmt_date(row["Tender_Date"]),
                    "Company_Code": row["Company_Code"],
                    "Quantal":      row["Quantal"],
                    "sqntl":        row["sqntl"],
                    "esold":        row["esold"],
                    "selfqty":      row["selfqty"],
                    "BALANCE":      row["selfqty"],
                    "millname":     row["millname"],
                    "millshortname":row["millshortname"],
                    "Mill_Code":    row["Mill_Code"],
                    "mc":           row["mc"],
                    "Grade":        row["Grade"],
                    "Mill_Rate":    row["Mill_Rate"],
                    "Lifting_Date": fmt_date(row["Lifting_Date"]),
                    "doname":       row["doname"],
                    "doshortname":  row["doshortname"],
                    "tenderid":     row["tenderid"],
                    "Grades":       [],
                    "itemcode":     row["itemcode"],
                    "itemname":     row["itemname"],
                    "minRate":      row["minRate"],
                    "maxRate":      row["maxRate"]
                }
            tenders_map[tid]["Grades"].append({
                "gradeid":      row["gradeid"],
                "gradeCode":    row["gradeCode"],
                "gradeName":    row["gradename"],
                "gradeRate":    row["gradeRate"],
                "Purchase_Rate":row["Purchase_Rate"]
            })

        tenders = list(tenders_map.values())

        return jsonify({"SaudaBookUtility": tenders})

    except SQLAlchemyError as e:
        return jsonify({
            "error": "Failed to fetch data",
            "details": str(e)
        }), 500
    

@app.route(API_URL + "/update_tender_detail", methods=["PUT"])
def update_tender_detail():
    try:
        data = request.get_json()
        detail_data = data.get("detailData")

        tenderdetailid = detail_data.get("tenderdetailid")
        tender_no = detail_data.get("Tender_No")

        if not tenderdetailid or not tender_no:
            return jsonify({"error": "Missing tenderdetailid or Tender_No"}), 400

        # Fetch existing record
        existing_detail = TenderDetails.query.filter_by(tenderdetailid=tenderdetailid).first()
        if not existing_detail:
            return jsonify({"error": "Tender detail not found"}), 404

        tender_head = TenderHead.query.filter_by(Tender_No=tender_no).first()
        if not tender_head:
            return jsonify({"error": "Tender not found"}), 404

        tenderid = tender_head.tenderid

        # --- Handle quantity difference ---
        old_qty = float(existing_detail.Buyer_Quantal or 0)
        new_qty = float(detail_data.get("Buyer_Quantal") or 0)
        qty_diff = new_qty - old_qty

        # --- Clean and convert date fields ---
        for date_field in ["Sauda_Date", "Lifting_Date"]:
            if date_field in detail_data and detail_data[date_field]:
                try:
                    # Try parsing multiple formats safely
                    parsed_date = None
                    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%a, %d %b %Y %H:%M:%S %Z"):
                        try:
                            parsed_date = datetime.strptime(detail_data[date_field], fmt)
                            break
                        except ValueError:
                            continue
                    if parsed_date:
                        detail_data[date_field] = parsed_date.strftime("%Y-%m-%d")
                except Exception as e:
                    print(f"Error parsing {date_field}: {e}")

        # --- Update main record fields ---
        for key, value in detail_data.items():
            if hasattr(existing_detail, key):
                setattr(existing_detail, key, value)

        # --- Adjust self quantity (first detail row) ---
        first_detail = (
            TenderDetails.query.filter_by(tenderid=tenderid)
            .order_by(TenderDetails.ID.asc())
            .first()
        )

        if first_detail and first_detail.tenderdetailid != tenderdetailid:
            try:
                updated_self_qty = float(first_detail.Buyer_Quantal or 0) - qty_diff
                first_detail.Buyer_Quantal = updated_self_qty
            except Exception as e:
                print(f"Error adjusting self quantity: {e}")

        db.session.commit()

        socketio.emit("tender_updated", {
    "tenderdetailid": tenderdetailid,
    "Tender_No": tender_no
})
        return jsonify({"message": "Tender detail updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#get balance in sauda book utility
@app.route(API_URL + "/get-tender-balance", methods=["GET"])
def get_tender_balance():
    try:
        tenderid = request.args.get("tenderid", type=int)
        company_code = request.args.get("Company_Code", type=int)

        if not tenderid or not company_code:
            return jsonify({"error": "Missing parameters"}), 400

        sql = text("""
            SELECT 
                td.tenderdetailid,
                ISNULL(
                    td.Buyer_Quantal - ISNULL(SUM(do.quantal), 0),
                    0
                ) AS balance
            FROM dbo.nt_1_tenderdetails td
            LEFT JOIN dbo.nt_1_deliveryorder do
                ON td.tenderdetailid = do.tenderdetailid
                AND td.Company_Code = do.company_code
            WHERE td.tenderid = :tenderid
              AND td.Company_Code = :company_code
            GROUP BY td.tenderdetailid, td.Buyer_Quantal
        """)

        result = db.session.execute(
            sql,
            {"tenderid": tenderid, "company_code": company_code}
        ).fetchall()

        data = [
            {
                "tenderdetailid": row.tenderdetailid,
                "balance": float(row.balance)
            }
            for row in result
        ]

        return jsonify(data), 200

    except Exception as e:
        print("Traceback:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500
        

#Get DeliveryOrder Grades
@app.route(API_URL + '/get-deliveryorder-grades', methods=['GET'])
def get_deliveryorder_grades():
    try:
        tenderid = request.args.get('tenderid')
        company_code = request.args.get('Company_Code')
        
        if not tenderid or not company_code:
            return jsonify({"error": "Missing required query parameters: tenderid, Company_Code"}), 400
        
        sql_query = text('''
            SELECT 
                tenderid, 
                gradeid, 
                Year_Code, 
                company_code
            FROM nt_1_deliveryorder 
            WHERE purc_no <> 0 
                AND tenderid = :tenderid 
                AND company_code = :company_code
            GROUP BY tenderid, gradeid, Year_Code, company_code
            ORDER BY gradeid DESC
        ''')

        with db.engine.connect() as connection:
            result = connection.execute(
                sql_query,
                {
                    'tenderid': tenderid,
                    'company_code': company_code
                }
            )
            
            records = [dict(row._mapping) for row in result]
        
        if not records:
            return jsonify({"DeliveryOrderGrades": []})
        
        formatted_records = []
        for record in records:
            formatted_records.append({
                "tenderid": record["tenderid"],
                "gradeid": record["gradeid"],
                "Year_Code": record["Year_Code"],
                "Company_Code": record["company_code"]
            })
        
        return jsonify({"DeliveryOrderGrades": formatted_records})
        
    except SQLAlchemyError as e:
        return jsonify({
            "error": "Failed to fetch delivery order grades",
            "details": str(e)
        }), 500
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500
    


@app.route(API_URL + '/update-tender-detail-grade-data', methods=['PUT'])
def update_tender_detail_grade_data():
    try:
        tenderid = request.args.get('tenderid', type=int)
        
        if not all([tenderid]):
            return jsonify({
                "success": False,
                "error": "Missing required query parameters: tenderid, Company_Code"
            }), 400
        
        update_query = text('''
           UPDATE d
                SET 
                    d.Mill_Rate = g.gradeRate,
                    d.Purchase_Rate = g.Purchase_Rate
                FROM nt_1_tenderdetails d
                INNER JOIN nt_1_tenderGradeDetails g ON g.tenderid = d.tenderid AND g.gradeid = d.gradeid
                WHERE 
                    d.tenderid = :tenderid
        ''')
        
        with db.engine.connect() as connection:
            result = connection.execute(
                update_query,
                {
                    'tenderid': tenderid
                }
            )
            connection.commit()
            
            return jsonify({
                "success": True,
                "message": f"Updated {result.rowcount} record(s) in tender details from grade details",
                "updated_rows": result.rowcount
            })
            
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": "Database error",
            "details": str(e)
        }), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "details": str(e)
        }), 500



@app.route(API_URL + "/get-tender-data", methods=["GET"])
def get_tender_data():
    try:
        tender_nos = request.args.get("tender_nos")

        query1 = text('''
        SELECT dbo.nt_1_tender.Tender_No, dbo.nt_1_tender.Tender_Date, dbo.nt_1_tender.Lifting_Date, dbo.nt_1_accountmaster.Short_Name, dbo.nt_1_tender.Quantal, dbo.nt_1_tender.Mill_Rate, 
                  dbo.nt_1_tender.Party_Bill_Rate
FROM     dbo.nt_1_tender INNER JOIN
                  dbo.nt_1_accountmaster ON dbo.nt_1_tender.mc = dbo.nt_1_accountmaster.accoid
ORDER BY dbo.nt_1_tender.Tender_Date DESC
        ''')

        result1 = db.session.execute(query1).fetchall()
        data1 = [dict(row._mapping) for row in result1]

        data2 = []

        
        if tender_nos:
            tender_list = tuple(map(int, tender_nos.split(",")))
            query2 = text(f"""
        SELECT TOP (100) PERCENT dbo.nt_1_tenderdetails.Tender_No, dbo.nt_1_tenderdetails.gradeid, dbo.qrymstgrade.System_Name_E, SUM(dbo.nt_1_tenderdetails.Buyer_Quantal) AS NetQntl
FROM     dbo.nt_1_tenderdetails INNER JOIN
                  dbo.qrymstgrade ON dbo.nt_1_tenderdetails.gradeid = dbo.qrymstgrade.systemid
WHERE dbo.nt_1_tenderdetails.Tender_No IN :tender_list
GROUP BY dbo.nt_1_tenderdetails.Tender_No, dbo.nt_1_tenderdetails.gradeid, dbo.qrymstgrade.System_Name_E
ORDER BY dbo.nt_1_tenderdetails.Tender_No DESC
        """)

            result2 = db.session.execute(query2, {"tender_list": tender_list}).fetchall()
            data2 = [dict(row._mapping) for row in result2]

        return jsonify({
            "tender_master": data1,
            "tender_details": data2
        })

    except Exception as e:
        return jsonify({"error": str(e)})


@app.route(API_URL + "/tender-ebuy-popup", methods=["GET"])
def get_tender_ebuy_popup():
    try:
        tenderdetailid = request.args.get('tenderdetailid')
        tender_no      = request.args.get('tender_no')
        company_code   = request.args.get('Company_Code')
        if not tenderdetailid or not tender_no or not company_code:
            return jsonify({"error": "Missing parameters"}), 400

        query = text('''
            SELECT
                dbo.nt_1_tender.Tender_No,
                MILL.Short_Name,
                MILL.Ac_Name_E                                          AS MILLNAME,
                CONVERT(VARCHAR(10), dbo.nt_1_tender.Tender_Date, 103) AS Tender_Date,
                dbo.nt_1_tender.Grade,
                dbo.nt_1_tenderdetails.Buyer,
                BUYER.Ac_Name_E                                         AS buyername,
                dbo.nt_1_tenderdetails.Buyer_Quantal,
                dbo.nt_1_tenderdetails.Sale_Rate,
                CONVERT(VARCHAR(10), dbo.nt_1_tenderdetails.Sauda_Date,   103) AS Sauda_Date,
                CONVERT(VARCHAR(10), dbo.nt_1_tenderdetails.Lifting_Date, 103) AS Lifting_Date,
                dbo.nt_1_tenderdetails.tenderdetailid,
                dbo.qrymstgrade.System_Name_E                           AS detailgrade,
                dbo.nt_1_tenderdetails.ebuyid
            FROM dbo.nt_1_tender
            INNER JOIN dbo.nt_1_tenderdetails
                    ON dbo.nt_1_tender.tenderid       = dbo.nt_1_tenderdetails.tenderid
            INNER JOIN dbo.nt_1_accountmaster AS MILL
                    ON dbo.nt_1_tender.mc             = MILL.accoid
            INNER JOIN dbo.nt_1_accountmaster AS BUYER
                    ON dbo.nt_1_tenderdetails.buyerid = BUYER.accoid
            INNER JOIN dbo.qrymstgrade
                    ON dbo.nt_1_tenderdetails.gradeid = dbo.qrymstgrade.systemid
            WHERE dbo.nt_1_tender.Tender_No           = :tender_no
              AND dbo.nt_1_tenderdetails.ebuyid        = :tenderdetailid
              AND dbo.nt_1_tender.Company_Code         = :company_code
        ''')
        result = db.session.execute(query, {
            'tender_no':      int(tender_no),
            'tenderdetailid': int(tenderdetailid),
            'company_code':   int(company_code),
        }).fetchall()

        data = [dict(row._mapping) for row in result]
        return jsonify({"success": True, "data": data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
