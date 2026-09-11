from flask import Flask, jsonify, request, copy_current_request_context
from app import app, db
from app.models.Inword.ShetkariPurchase.ShetkariPurchaseModel import ShetkariPurchase,ShetkariPurchaseDetail  
from app.models.Reports.GLedeger.GLedgerModels import Gledger
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
import traceback
import requests
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getPurchaseAc,create_gledger_entry,send_gledger_entries,get_acShort_Name,get_ac_Name
from app.models.Inword.ShetkariPurchase.ShetkariPurchaseSchemas import ShetkariPurchaseHeadSchema, ShetkariPurchaseDetailSchema
from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry
from decimal import Decimal
import threading

# Define schemas
Sugar_head_Schema = ShetkariPurchaseHeadSchema()
Sugar_head_Schemas = ShetkariPurchaseHeadSchema(many=True)

Sugar_detail_Schema = ShetkariPurchaseDetailSchema()
Sugar_detail_Schemas = ShetkariPurchaseDetailSchema(many=True)

# Get the base URL from environment variables
API_URL= os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')

#format date Function
def format_dates(task):
    return {
        "Doc_Date": task.Doc_Date.strftime('%Y-%m-%d') if task.Doc_Date else None,
       
    }

#Add GLedger Enteries
trans_typeNew  = "SP"
DRCRHead = "C"
DRCRDetail ="D"
ac_code=0
ordercode=0
new_doc_no=0
narration=''

def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid,ordercode,narration,do_no=0,CASHCREDIT= None):
    if amount > 0:
        entry = create_gledger_entry(data, amount, drcr, ac_code, accoid,ordercode,trans_typeNew,new_doc_no,narration)
        entry['do_no'] = do_no
        entry['CASHCREDIT'] = CASHCREDIT

        entries.append(entry)

#Create GLedger Enteries
def create_gledger_entries(headData, detailData, doc_no):
    gledger_entries = []
    
    IGSTAmount = float(headData.get('IGST_Amount', 0) or 0)
    SGSTAmount = float(headData.get('SGST_Amount', 0) or 0)
    CGSTAmount = float(headData.get('CGST_Amount', 0) or 0)
    TCS_Amt = float(headData.get('TCS_Amt', 0) or 0)
    TDS_Amt = float(headData.get('TDS_Amt', 0) or 0)
    bill_amount = float(headData.get('Amount', 0) or 0)
    subTotal = float(headData.get('Taxable_Amount', 0) or 0)
    Cash_Credit = headData.get('Cash_Credit')
    Vatavamt = float(headData.get('Vatavamt', 0) or 0)
    postage = float(headData.get('postage', 0) or 0)

    
    Ac_Code = headData['Ac_Code']
    partyName = get_ac_Name(Ac_Code, headData['Company_Code'])
    LORRYNO = headData['LR_No']
   

    for item in detailData:
        Quantal = item.get('Qty')
       

    creditNarration = f"L: {LORRYNO} ## Qty: {Quantal}"
    debitNarration = f" {partyName} # L: {LORRYNO} # {Quantal}"
    TCSNarration = f"TCS #{partyName}{headData['Doc_No']}"
    TDSNarration = f"TDS #{partyName}{headData['Doc_No']}"
    

    company_parameters = fetch_company_parameters(headData.get('Company_Code'), headData.get('Year_Code'))
    ordercode = 0

    for amount, ac_code in [
        (IGSTAmount, company_parameters.PurchaseIGSTAc),
        (CGSTAmount, company_parameters.PurchaseCGSTAc),
        (SGSTAmount, company_parameters.PurchaseSGSTAc),
    ]:
        if amount > 0:
            ordercode += 1
            accoid = get_accoid(ac_code, headData.get('Company_Code'))
            add_gledger_entry(gledger_entries, headData, amount, DRCRDetail, ac_code, accoid, ordercode,debitNarration,0,Cash_Credit)

    if TCS_Amt > 0:
        ordercode += 1
        ac_code = headData['Ac_Code']
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, TCS_Amt, DRCRHead, ac_code, accoid, ordercode,TCSNarration,0,Cash_Credit)

        ordercode += 1
        ac_code = company_parameters.PurchaseTCSAc
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, TCS_Amt, DRCRDetail, ac_code, accoid, ordercode,TCSNarration,0,Cash_Credit)

    if TDS_Amt > 0:
        ordercode += 1
        ac_code = headData['Ac_Code']
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRDetail, ac_code, accoid, ordercode,TDSNarration,0,Cash_Credit)

        ordercode += 1
        ac_code = company_parameters.PurchaseTDSAc
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRHead, ac_code, accoid, ordercode,TDSNarration,0,Cash_Credit)

    if Vatavamt > 0:
        ordercode += 1
        ac_code = headData['Ac_Code']
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, Vatavamt, 'D', ac_code, accoid, ordercode,TDSNarration,0,Cash_Credit)

        ordercode += 1
        ac_code = company_parameters.COMMISSION_AC
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, Vatavamt, 'C', ac_code, accoid, ordercode,creditNarration,0,Cash_Credit)


    if postage != 0:
        if postage > 0:
            ordercode += 1
          
            ordercode += 1
            ac_code = company_parameters.POSTAGE_AC
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, Vatavamt, 'D', ac_code, accoid, ordercode,creditNarration,0,Cash_Credit)
        else :
           
            ordercode += 1
            ac_code = company_parameters.POSTAGE_AC
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, Vatavamt, 'C', ac_code, accoid, ordercode,creditNarration,0,Cash_Credit)
           
   
    add_gledger_entry(gledger_entries, headData, bill_amount,DRCRHead, headData['Ac_Code'], get_accoid(headData['Ac_Code'],headData['Company_Code']),ordercode,creditNarration,0,Cash_Credit)

    ic_value = ''
    purchase_ac_code = ''
    for item in detailData:
        ic_value = item.get('ic')
        if ic_value is None:
            continue  # skip if no ic

        purchase_ac_code = item.get('purcac')
        item_value = float(item.get('Value', 0))  # individual item amount

        if item_value > 0:  # only if this item has a value
            ordercode += 1
            ac_code = purchase_ac_code
            accoid = get_accoid(ac_code, headData['Company_Code'])
            
            add_gledger_entry(
                gledger_entries,
                headData,
                item_value,        # use per-item value, not global subTotal
                DRCRDetail,
                ac_code,
                accoid,
                ordercode,
                debitNarration,
                0,
                Cash_Credit
            )
    return gledger_entries

# Global SQL Query
TASK_DETAILS_QUERY = '''
SELECT        dbo.nt_1_shekaripurchase.Doc_No, dbo.nt_1_shekaripurchase.Cash_Credit, dbo.nt_1_shekaripurchase.Doc_Date, dbo.nt_1_shekaripurchase.Ac_Code, dbo.nt_1_shekaripurchase.Broker, 
                         dbo.nt_1_shekaripurchasedetails.detail_id, dbo.nt_1_shekaripurchasedetails.purchaseid, dbo.nt_1_shekaripurchasedetails.Item_Code, dbo.nt_1_shekaripurchasedetails.Brand_Code, dbo.nt_1_shekaripurchasedetails.Qty, 
                         dbo.nt_1_shekaripurchasedetails.Wt_Per, dbo.nt_1_shekaripurchasedetails.Wt_Qty, dbo.nt_1_shekaripurchasedetails.Rate, dbo.nt_1_shekaripurchasedetails.Value, dbo.nt_1_shekaripurchasedetails.GST_Code, 
                         dbo.nt_1_shekaripurchasedetails.SGST, dbo.nt_1_shekaripurchasedetails.CGST, dbo.nt_1_shekaripurchasedetails.IGST, dbo.nt_1_shekaripurchasedetails.Hamali_Rate, dbo.nt_1_shekaripurchasedetails.Hamali, 
                         dbo.nt_1_shekaripurchasedetails.purchasedetailid, dbo.nt_1_shekaripurchasedetails.Company_Code, dbo.nt_1_shekaripurchasedetails.Year_Code, dbo.nt_1_shekaripurchasedetails.ic, dbo.nt_1_shekaripurchasedetails.purcac,
                          dbo.nt_1_shekaripurchasedetails.pac, dbo.nt_1_shekaripurchasedetails.FrieghtperqntlDetail, dbo.nt_1_shekaripurchasedetails.Net_wt, dbo.qryItemMaster.System_Name_E AS ItemName, qryFrom.Ac_Name_E AS FromName, 
                         qryBroker.Ac_Name_E AS Broker_Name, dbo.nt_1_gstratemaster.GST_Name, dbo.qryBrand_Master.Marka AS Brand_Name, dbo.nt_1_gstratemaster.Rate AS GSTRate
FROM            dbo.qryItemMaster RIGHT OUTER JOIN
                         dbo.qryBrand_Master RIGHT OUTER JOIN
                         dbo.nt_1_shekaripurchasedetails ON dbo.qryBrand_Master.Code = dbo.nt_1_shekaripurchasedetails.Brand_Code AND 
                         dbo.qryBrand_Master.Company_Code = dbo.nt_1_shekaripurchasedetails.Company_Code LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_shekaripurchasedetails.GST_Code = dbo.nt_1_gstratemaster.Doc_no AND dbo.nt_1_shekaripurchasedetails.Company_Code = dbo.nt_1_gstratemaster.Company_Code ON 
                         dbo.qryItemMaster.Company_Code = dbo.nt_1_shekaripurchasedetails.Company_Code AND dbo.qryItemMaster.System_Code = dbo.nt_1_shekaripurchasedetails.Item_Code RIGHT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryBroker RIGHT OUTER JOIN
                         dbo.nt_1_shekaripurchase ON qryBroker.accoid = dbo.nt_1_shekaripurchase.bc ON dbo.nt_1_shekaripurchasedetails.purchaseid = dbo.nt_1_shekaripurchase.purchaseid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryFrom ON dbo.nt_1_shekaripurchase.ac = qryFrom.accoid
 WHERE    nt_1_shekaripurchase.purchaseid=:purchaseid
'''

# Get data from both tables SaleBill and SaleBilllDetail
@app.route(API_URL + "/getdata-shetkaripurchase", methods=["GET"])
def getdata_shetkaripurchase():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        cash_credit = request.args.get('tran_type')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = '''
        SELECT s.Doc_No, s.Doc_Date, s.Ac_Code, s.Broker, s.Truck_No,
               s.Taxable_Amount, s.Amount, s.Company_Code, s.Year_Code, 
               s.purchaseid, s.Bill_No, q.Ac_Name_E, q.accoid, s.Cash_Credit
        FROM dbo.nt_1_shekaripurchase s
        LEFT OUTER JOIN dbo.qrymstaccountmaster q ON s.ac = q.accoid
        WHERE s.Company_Code = :company_code
          AND s.Year_Code = :year_code
        '''

        params = {"company_code": company_code, "year_code": year_code}

        # Apply Cash_Credit filter only if not "AL"
        if cash_credit != "AL":
            query += " AND s.Cash_Credit = :cash_credit"
            params["cash_credit"] = cash_credit

        query += " ORDER BY s.Doc_No DESC"

        additional_data = db.session.execute(text(query), params)
        additional_data_rows = additional_data.fetchall()

        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'Doc_Date' in data:
                data['Doc_Date'] = data['Doc_Date'].strftime('%Y-%m-%d') if data['Doc_Date'] else None

        return jsonify({"shetkaripurchase_Head": all_data}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#Get data by getshetkaripurchasebyid  
@app.route(API_URL+"/getshetkaripurchasebyid", methods=["GET"])
def getshetkaripurchasebyid():
    try:
        doc_no = request.args.get('doc_no')
        Cash_Credit = request.args.get('Cash_Credit')
        if not doc_no:
            return jsonify({"error": "Document number not provided"}), 400
        
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code Or Year_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
            year_code = int(Year_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        task_head = ShetkariPurchase.query.filter_by(Doc_No=doc_no, Company_Code=Company_Code, Year_Code=Year_Code,Cash_Credit=Cash_Credit).first()

        newtaskid = task_head.purchaseid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": newtaskid})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "getData_shetkaripurchaseHead_data": {
                **{column.name: getattr(task_head, column.name) for column in task_head.__table__.columns},
                **format_dates(task_head),
            },
            "getData_shetkaripurchaseDetail_data": additional_data_rows
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#GET THE next doc no from the sugar purchase
@app.route(API_URL + "/get-next-doc-no-shetkaripurchaseBill", methods=["GET"])
def get_next_doc_no_shetkaripurchaseBill():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        Cash_Credit=request.args.get('Cash_Credit')
        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        max_doc_no = db.session.query(func.max(ShetkariPurchase.Doc_No)).filter_by(Company_Code=company_code, Year_Code=year_code,Cash_Credit=Cash_Credit).scalar()

        next_doc_no = max_doc_no + 1 if max_doc_no else 1
        response = {
            "next_doc_no": next_doc_no
        }
        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#INSERT record into the puchase Bill
@app.route(API_URL + "/insert_shetkaripurchase", methods=["POST"])
def insert_shetkaripurchase():
    try:
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']

        max_doc_no = db.session.query(func.max(ShetkariPurchase.Doc_No)).filter(ShetkariPurchase.Company_Code == headData['Company_Code'], ShetkariPurchase.Year_Code == headData['Year_Code'],ShetkariPurchase.Cash_Credit == headData['Cash_Credit']).scalar() or 0
        new_doc_no = max_doc_no + 1
        headData['Doc_No'] = new_doc_no

        new_head = ShetkariPurchase(**headData)
        db.session.add(new_head)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        for item in detailData:
            item['Doc_No'] = new_doc_no 
            rowaction = item.pop('rowaction', None)
            if rowaction == "add":
                new_detail = ShetkariPurchaseDetail(**item)
                new_head.details.append(new_detail) 
                createdDetails.append(new_detail)
            elif rowaction == "update":
                purchasedetailid = item['purchasedetailid']
                db.session.query(ShetkariPurchaseDetail).filter(ShetkariPurchaseDetail.purchasedetailid == purchasedetailid).update(item)
                updatedDetails.append(purchasedetailid)
            elif rowaction == "delete":
                purchasedetailid = item['purchasedetailid']
                detail_to_delete = db.session.query(ShetkariPurchaseDetail).filter(ShetkariPurchaseDetail.purchasedetailid == purchasedetailid).one_or_none()
                if detail_to_delete:
                    db.session.delete(detail_to_delete)
                    deletedDetailIds.append(purchasedetailid)

        db.session.commit()

        gledger_entries = create_gledger_entries(headData, detailData, new_doc_no)

        @copy_current_request_context
        def async_send_gledger():
            try:
                send_gledger_entries(headData, gledger_entries, trans_typeNew)
            except Exception as e:
                print(f"[Async Gledger Error] {e}")

        threading.Thread(target=async_send_gledger).start()

        # response = send_gledger_entries(headData, gledger_entries,trans_typeNew)

        # if response.status_code != 201:
        #     db.session.rollback()
            
        #     return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Data inserted successfully",
            "head": ShetkariPurchaseHeadSchema().dump(new_head),
            "addedDetails": ShetkariPurchaseDetailSchema(many=True).dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201 

    except Exception as e:
        db.session.rollback()
        print("Traceback", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

    
@app.route(API_URL + "/DeleteTransaction-shetkari", methods=["DELETE"])
def DeleteTransaction_shetkari():
    try:
        do_no = request.args.get('PURCNO')
        Company_Code = request.args.get("Company_Code")
        Year_Code = request.args.get("Year_Code")

        with db.session.begin():  # Start a transaction
            db.session.execute(
                text('''
                    DELETE FROM nt_1_deliveryorder 
                    WHERE doc_no = :Do_no AND Year_Code = :Year_Code AND company_code = :Company_Code
                '''),
                {'Company_Code': Company_Code, 'Year_Code': Year_Code, 'Do_no': do_no}
            )

            db.session.execute(
                text('''
                    DELETE FROM nt_1_dodetails 
                    WHERE doc_no = :Do_no AND Year_Code = :Year_Code AND company_code = :Company_Code
                '''),
                {'Company_Code': Company_Code, 'Year_Code': Year_Code, 'Do_no': do_no}
            )

            db.session.execute(
                text('''
                    DELETE FROM nt_1_gledger 
                    WHERE doc_no = :Do_no AND Year_Code = :Year_Code AND company_code = :Company_Code 
                    AND TRAN_TYPE = 'DO'
                '''),
                {'Company_Code': Company_Code, 'Year_Code': Year_Code, 'Do_no': do_no}
            )

        db.session.commit()

        return jsonify({"message": f"Transaction {do_no} deleted successfully."}), 200

    except Exception as e:
        db.session.rollback()
       
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Update records in the purchase Bill
@app.route(API_URL + "/update-shetkaripurchase", methods=["PUT"])
def update_shetkaripurchase():
    try:
        purchaseid = request.args.get('purchaseid')

        if purchaseid is None:
            return jsonify({"error": "Missing 'purchaseid' parameter"}), 400

        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']
        # transaction = db.session.begin_nested()

        company_code = headData.get('Company_Code')
        year_code = headData.get('Year_Code')
        
        tran_type = "SP" 
        
        if 'User_Id' in headData:
            del headData['User_Id']

        existing_head = ShetkariPurchase.query.filter_by(purchaseid=purchaseid).first()

        if not existing_head:
            return jsonify({"error": "shetkaripurchase with the given purchaseid not found"}), 404

        updatedHeadCount = db.session.query(ShetkariPurchase).filter(ShetkariPurchase.purchaseid == purchaseid).update(headData)
        
        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        updated_tender_head = db.session.query(ShetkariPurchase).filter(ShetkariPurchase.purchaseid == purchaseid).one()
        doc_no = updated_tender_head.Doc_No
        dono=0
        for item in detailData:
            if item['rowaction'] == "add":
                item['Doc_No'] = doc_no
                item['purchaseid'] = purchaseid
                del item['rowaction']
                new_detail = ShetkariPurchaseDetail(**item)
                db.session.add(new_detail)
                createdDetails.append(item)

            elif item['rowaction'] == "update":
                item['Doc_No'] = doc_no
                item['purchaseid'] = purchaseid
                if dono=="" and dono==0:
                    purchasedetailid = item['purchasedetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('purchasedetailid', 'purchaseid', 'rowaction')}
                    db.session.query(ShetkariPurchaseDetail).filter(ShetkariPurchaseDetail.purchasedetailid == purchasedetailid).update(update_values)
                    updatedDetails.append(purchasedetailid)
                else:
                    purchasedetailid = item['purchasedetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('purchasedetailid', 'purchaseid', 'rowaction')}
                    db.session.query(ShetkariPurchaseDetail).filter(ShetkariPurchaseDetail.purchaseid == purchaseid).update(update_values)
                    updatedDetails.append(purchasedetailid)   

            elif item['rowaction'] == "delete":
                purchasedetailid = item['purchasedetailid']
                detail_to_delete = db.session.query(ShetkariPurchaseDetail).filter(ShetkariPurchaseDetail.purchasedetailid == purchasedetailid).one_or_none()

                if detail_to_delete:
                    db.session.delete(detail_to_delete)
                    deletedDetailIds.append(purchasedetailid)

     
        db.session.commit()
    
        gledger_entries = create_gledger_entries(headData, detailData, doc_no)

        @copy_current_request_context
        def async_send_gledger():
            try:
                send_gledger_entries(headData, gledger_entries, trans_typeNew)
            except Exception as e:
                print(f"[Async Gledger Error] {e}")

        threading.Thread(target=async_send_gledger).start()

        # response = send_gledger_entries(headData, gledger_entries,trans_typeNew)

        # if response.status_code != 201:
        #     db.session.rollback()
        #     return jsonify({"error": "Failed to update gLedger record", "details": response.json()}), response.status_code

        return jsonify({"message": "Data Updated successfully", "createdDetails": createdDetails, "updatedDetails": updatedDetails, "deletedDetailIds": deletedDetailIds}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Delete record from Operation and also delet the Gledger Effect.  
# @app.route(API_URL + "/delete_data_shetkaripurchase", methods=["DELETE"])
# def delete_data_shetkaripurchase():
#     try:
#         purchaseid = request.args.get('purchaseid')
#         Company_Code = request.args.get('Company_Code')
#         doc_no = request.args.get('doc_no')
#         Year_Code = request.args.get('Year_Code')
#         tran_type = request.args.get('tran_type')
     
#         if not all([purchaseid, Company_Code, doc_no, Year_Code, tran_type]):
#             return jsonify({"error": "Missing required parameters"}), 400

#         with db.session.begin():
#             deleted_user_rows = shetkaripurchase.query.filter_by(purchaseid=purchaseid).delete()

#             deleted_task_rows = shetkaripurchaseDetail.query.filter_by(purchaseid=purchaseid).delete()

#         if deleted_user_rows > 0 and deleted_task_rows > 0:
#             query_params = {
#                 'Company_Code': Company_Code,
#                 'DOC_NO': doc_no,
#                 'Year_Code': Year_Code,
#                 'TRAN_TYPE': tran_type,
#             }

#             response = requests.delete(API_URL_SERVER +"/delete-Record-gLedger", params=query_params)
            
#             if response.status_code != 200:
#                 raise Exception("Failed to create record in gLedger")
#             db.session.commit()

#         return jsonify({
#             "message": f"Deleted {deleted_task_rows} Task row(s) and {deleted_user_rows} User row(s) successfully"
#         }), 200

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Delete record from Operation and also delet the Gledger Effect also implement Company Logs.
@app.route(API_URL + "/delete_data_shetkaripurchase", methods=["DELETE"])
def delete_data_shetkaripurchase():
    try:
        purchaseid = request.args.get('purchaseid')
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('Cash_Credit')
        User_Id = request.args.get('User_Id',0)
        Cash_Credit =request.args.get('Cash_Credit')
        if not all([purchaseid, Company_Code, doc_no, Year_Code, tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400

        deleted_purchase_head = ShetkariPurchase.query.filter_by(purchaseid=purchaseid).first()

        if not deleted_purchase_head:
            return jsonify({"error": "Purchase record not found"}), 404

        try:
            deleted_task_rows = ShetkariPurchaseDetail.query.filter_by(purchaseid=purchaseid).delete()
            deleted_user_rows = ShetkariPurchase.query.filter_by(purchaseid=purchaseid).delete()

            query_params = {
                'Company_Code': Company_Code,
                'DOC_NO': doc_no,
                'Year_Code': Year_Code,
                'TRAN_TYPE': tran_type,
                'purchaseid': purchaseid,
                'CASHCREDIT' :Cash_Credit
                
            }

            response = requests.delete(API_URL_SERVER + "/delete-Record-gLedger", params=query_params, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})

            if response.status_code != 200:
                raise Exception("Failed to delete record in gLedger")

            db.session.commit()

            return jsonify({
                "message": f"Deleted {deleted_user_rows} shetkaripurchase row(s) and {deleted_task_rows} shetkaripurchaseDetail row(s) successfully"
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Transaction failed", "message": str(e)}), 500

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Fetch the last Record on database by purchaseid
@app.route(API_URL+"/get-lastrecordshetkaripurchase", methods=["GET"])
def get_lastrecordshetkaripurchase():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        Cash_Credit =request.args.get('Cash_Credit')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        last_tender_head = ShetkariPurchase.query.filter_by(Company_Code=company_code,Year_Code=year_code,Cash_Credit = Cash_Credit).order_by(ShetkariPurchase.purchaseid.desc()).first()

        if not last_tender_head:
            return jsonify({"error": "No records found in last_tender_head table"}), 404

        last_tenderid = last_tender_head.purchaseid
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": last_tenderid})

        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
    
        last_tender_head_data = {
            **{column.name: getattr(last_tender_head, column.name) for column in last_tender_head.__table__.columns},
            **format_dates(last_tender_head), 
        }

        last_tender_details_data = additional_data_rows
        response = {
            "last_shetkaripurchasehead": last_tender_head_data,
            "last_shetkaripurchasedetail": last_tender_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Navigations API    
#Get First record from database 
@app.route(API_URL+"/get-firstshetkaripurchase-navigation", methods=["GET"])
def get_firstshetkaripurchase_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        Cash_Credit =request.args.get('Cash_Credit')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        first_task = ShetkariPurchase.query.filter_by(Company_Code=company_code,Year_Code=year_code,Cash_Credit=Cash_Credit).order_by(ShetkariPurchase.purchaseid.asc()).first()
        
        if not first_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        first_taskid = first_task.purchaseid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": first_taskid})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "first_shetkaripurchaseHead_data": {
                **{column.name: getattr(first_task, column.name) for column in first_task.__table__.columns},
                **format_dates(first_task), 
            },
            "first_shetkaripurchasedetail_data": additional_data_rows
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# #Get last Record from Database in navigation 
@app.route(API_URL+"/getlastshetkaripurchase-record-navigation", methods=["GET"])
def getlastshetkaripurchase_record_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        Cash_Credit =request.args.get('Cash_Credit')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400

        last_task = ShetkariPurchase.query.filter_by(Company_Code=company_code,Year_Code=year_code,Cash_Credit=Cash_Credit).order_by(ShetkariPurchase.purchaseid.desc()).first()

        if not last_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        last_taskid = last_task.purchaseid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": last_taskid})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
      
        response = {
            "last_shetkaripurchaseHead_data": {
                **{column.name: getattr(last_task, column.name) for column in last_task.__table__.columns},
                **format_dates(last_task),
            },
            "last_shetkaripurchasedetail_data": additional_data_rows
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# #Get Previous record by database 
@app.route(API_URL+"/getpreviousshetkaripurchase-navigation", methods=["GET"])
def getpreviousshetkaripurchase_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        current_doc_no = request.args.get('doc_no')
        Cash_Credit =request.args.get('Cash_Credit')
        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        if not current_doc_no:
            return jsonify({"error": "Current Task No is required"}), 400

        previous_task = ShetkariPurchase.query.filter(
            ShetkariPurchase.Doc_No < current_doc_no,
            ShetkariPurchase.Company_Code == company_code,
            ShetkariPurchase.Year_Code == year_code,
            ShetkariPurchase.Cash_Credit == Cash_Credit,

        ).order_by(ShetkariPurchase.Doc_No.desc()).first()
    
        if not previous_task:
            return jsonify({"error": "No previous records found"}), 404

        previous_purchaseid_id = previous_task.purchaseid
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": previous_purchaseid_id})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "previous_shetkaripurchaseHead_data": {
                **{column.name: getattr(previous_task, column.name) for column in previous_task.__table__.columns},
                **format_dates(previous_task), 
            },
            "previous_shetkaripurchasedetail_data":additional_data_rows
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# # #Get Next record by database 
@app.route(API_URL+"/getnextshetkaripurchase-navigation", methods=["GET"])
def getnextshetkaripurchase_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        current_doc_no = request.args.get('doc_no')
        Cash_Credit =request.args.get('Cash_Credit')
        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
    
        if not current_doc_no:
            return jsonify({"error": "Current doc No required"}), 400
        next_purchseid = ShetkariPurchase.query.filter(ShetkariPurchase.Doc_No > current_doc_no,ShetkariPurchase.Company_Code == company_code,
            ShetkariPurchase.Year_Code == year_code,
            ShetkariPurchase.Cash_Credit==Cash_Credit
            ).order_by(ShetkariPurchase.Doc_No.asc()).first()

        if not next_purchseid:
            return jsonify({"error": "No next records found"}), 404

        next_purchseid_id = next_purchseid.purchaseid
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": next_purchseid_id})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "next_shetkaripurchasehead_data": {
                **{column.name: getattr(next_purchseid, column.name) for column in next_purchseid.__table__.columns},
                **format_dates(next_purchseid)
            },
            "next_shetkaripurchasedetails_data": additional_data_rows
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Purchase Bill Report 
# @app.route(API_URL+"/generating_purchaseReport_report", methods=["GET"])
# def generating_purchaseReport_report():
#     try:
#         company_code = request.args.get('Company_Code')
#         year_code = request.args.get('Year_Code')
#         doc_no = request.args.get('doc_no')

#         if not company_code or not year_code or not doc_no:
#             return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

#         query = ('''SELECT        dbo.qrypurchaseheaddetail.doc_no, dbo.qrypurchaseheaddetail.Tran_Type, dbo.qrypurchaseheaddetail.PURCNO, dbo.qrypurchaseheaddetail.doc_date, dbo.qrypurchaseheaddetail.Ac_Code, 
#                          dbo.qrypurchaseheaddetail.Unit_Code, dbo.qrypurchaseheaddetail.mill_code, dbo.qrypurchaseheaddetail.FROM_STATION, dbo.qrypurchaseheaddetail.TO_STATION, dbo.qrypurchaseheaddetail.LORRYNO, 
#                          dbo.qrypurchaseheaddetail.BROKER, dbo.qrypurchaseheaddetail.wearhouse, dbo.qrypurchaseheaddetail.subTotal, dbo.qrypurchaseheaddetail.LESS_FRT_RATE, dbo.qrypurchaseheaddetail.freight, 
#                          dbo.qrypurchaseheaddetail.cash_advance, dbo.qrypurchaseheaddetail.bank_commission, dbo.qrypurchaseheaddetail.OTHER_AMT, dbo.qrypurchaseheaddetail.Bill_Amount, dbo.qrypurchaseheaddetail.Due_Days, 
#                          dbo.qrypurchaseheaddetail.NETQNTL, dbo.qrypurchaseheaddetail.Company_Code, dbo.qrypurchaseheaddetail.Year_Code, dbo.qrypurchaseheaddetail.Branch_Code, dbo.qrypurchaseheaddetail.Created_By, 
#                          dbo.qrypurchaseheaddetail.Modified_By, dbo.qrypurchaseheaddetail.Bill_No, dbo.qrypurchaseheaddetail.GstRateCode, dbo.qrypurchaseheaddetail.CGSTRate, dbo.qrypurchaseheaddetail.CGSTAmount, 
#                          dbo.qrypurchaseheaddetail.SGSTRate, dbo.qrypurchaseheaddetail.SGSTAmount, dbo.qrypurchaseheaddetail.IGSTRate, dbo.qrypurchaseheaddetail.IGSTAmount, dbo.qrypurchaseheaddetail.EWay_Bill_No, 
#                          dbo.qrypurchaseheaddetail.purchaseid, dbo.qrypurchaseheaddetail.ac, dbo.qrypurchaseheaddetail.uc, dbo.qrypurchaseheaddetail.mc, dbo.qrypurchaseheaddetail.bk, dbo.qrypurchaseheaddetail.suppliername, 
#                          dbo.qrypurchaseheaddetail.suppliergstno, dbo.qrypurchaseheaddetail.supplierstatecode, dbo.qrypurchaseheaddetail.unitname, dbo.qrypurchaseheaddetail.millname, dbo.qrypurchaseheaddetail.brokername, 
#                          dbo.qrypurchaseheaddetail.GST_Name, dbo.qrypurchaseheaddetail.gstrate, dbo.qrypurchaseheaddetail.detail_id, dbo.qrypurchaseheaddetail.Item_Code, dbo.qrypurchaseheaddetail.itemnarration, 
#                          dbo.qrypurchaseheaddetail.Quantal, dbo.qrypurchaseheaddetail.packing, dbo.qrypurchaseheaddetail.bags, dbo.qrypurchaseheaddetail.rate, dbo.qrypurchaseheaddetail.item_Amount, 
#                          dbo.qrypurchaseheaddetail.purchasedetailid, dbo.qrypurchaseheaddetail.ic, dbo.qrypurchaseheaddetail.itemname, dbo.qrypurchaseheaddetail.doc_dateConverted, dbo.qrypurchaseheaddetail.grade, 
#                          dbo.qrypurchaseheaddetail.mill_inv_date, dbo.qrypurchaseheaddetail.mill_inv_dateConverted, dbo.qrypurchaseheaddetail.millshortname, dbo.qrypurchaseheaddetail.Purcid, dbo.qrypurchaseheaddetail.SelfBal, 
#                          dbo.qrypurchaseheaddetail.Brand_Code, dbo.qrypurchaseheaddetail.Brand_Name, dbo.qrypurchaseheaddetail.GSTStateCode, dbo.qrypurchaseheaddetail.SupplierShortname, dbo.qrypurchaseheaddetail.TCS_Rate, 
#                          dbo.qrypurchaseheaddetail.TCS_Amt, dbo.qrypurchaseheaddetail.TCS_Net_Payable, dbo.qrypurchaseheaddetail.supplieraddress, dbo.qrypurchaseheaddetail.CompanyPan, dbo.qrypurchaseheaddetail.TDS_Amt, 
#                          dbo.qrypurchaseheaddetail.TDS_Rate, dbo.qrypurchaseheaddetail.partyCity, dbo.qrypurchaseheaddetail.BrokerShort, dbo.qrypurchaseheaddetail.supllierfssaino, dbo.qrypurchaseheaddetail.suppliertinno, 
#                          dbo.qrypurchaseheaddetail.supplierpan, dbo.qrypurchaseheaddetail.HSN, dbo.qrypurchaseheaddetail.Unit, dbo.company.Company_Name_E, dbo.company.Address_E, dbo.company.City_E, dbo.company.State_E, 
#                          dbo.company.PIN, dbo.company.Mobile_No, dbo.company.Pan_No, dbo.company.PHONE, dbo.company.FSSAI_No, dbo.nt_1_companyparameters.GSTStateCode AS Expr1, dbo.tblvoucherheadaddress.AL1, 
#                          dbo.tblvoucherheadaddress.AL2, dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other, dbo.tblvoucherheadaddress.BillFooter, dbo.tblvoucherheadaddress.bankdetail, 
#                          dbo.company.GST, dbo.company.TIN, dbo.accountingyear.year
# FROM            dbo.qrypurchaseheaddetail INNER JOIN
#                          dbo.nt_1_companyparameters ON dbo.qrypurchaseheaddetail.Company_Code = dbo.nt_1_companyparameters.Company_Code AND 
#                          dbo.qrypurchaseheaddetail.Year_Code = dbo.nt_1_companyparameters.Year_Code INNER JOIN
#                          dbo.tblvoucherheadaddress ON dbo.qrypurchaseheaddetail.Company_Code = dbo.tblvoucherheadaddress.Company_Code LEFT OUTER JOIN
#                          dbo.accountingyear ON dbo.qrypurchaseheaddetail.Company_Code = dbo.accountingyear.Company_Code AND dbo.qrypurchaseheaddetail.Year_Code = dbo.accountingyear.yearCode LEFT OUTER JOIN
#                          dbo.company ON dbo.qrypurchaseheaddetail.Company_Code = dbo.company.Company_Code
#                  where dbo.qrypurchaseheaddetail.Company_Code = :company_code and dbo.qrypurchaseheaddetail.Year_Code = :year_code and dbo.qrypurchaseheaddetail.doc_no = :doc_no
#                                  '''
#             )
#         additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code, "doc_no": doc_no})

#         additional_data_rows = additional_data.fetchall()
        
#         all_data = [dict(row._mapping) for row in additional_data_rows]


#         response = {
#             "all_data": all_data
#         }
#         return jsonify(response), 200

#     except Exception as e:
#         print(e)
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL+"/generating_ShetkariPurchase_report", methods=["GET"])
def generating_ShetkariPurchase_report():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no')
        tran_type=request.args.get('TranType')
        if not company_code or not year_code or not doc_no:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''
            SELECT        dbo.company.Company_Name_E, dbo.tblvoucherheadaddress.AL1, dbo.tblvoucherheadaddress.AL2, dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other, 
                         dbo.qryshetkaripurchaseheaddetails.*,dbo.tblvoucherheadaddress.bankdetail

            FROM   dbo.company RIGHT OUTER JOIN
                         dbo.qryshetkaripurchaseheaddetails ON dbo.company.Company_Code = dbo.qryshetkaripurchaseheaddetails.Company_Code LEFT OUTER JOIN
                         dbo.tblvoucherheadaddress ON dbo.company.Company_Code = dbo.tblvoucherheadaddress.Company_Code         
            WHERE        (dbo.qryshetkaripurchaseheaddetails.Doc_No = :doc_no) AND (dbo.qryshetkaripurchaseheaddetails.Cash_Credit = :TranType) AND 
                 (dbo.qryshetkaripurchaseheaddetails.Company_Code = :company_code) AND (dbo.qryshetkaripurchaseheaddetails.Year_Code = :year_code)
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code,
                      "year_code": year_code, "doc_no": doc_no,'TranType' :tran_type})

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
