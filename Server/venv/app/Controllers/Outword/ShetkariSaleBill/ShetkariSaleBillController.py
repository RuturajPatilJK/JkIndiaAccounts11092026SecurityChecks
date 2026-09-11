from flask import Flask, jsonify, request, copy_current_request_context
from app import app, db
from app.models.Outword.ShetkariSaleBill.ShetkariSaleBillModel import ShetkariSaleBillHead,ShetkariSaleBillDetail  
from app.models.Reports.GLedeger.GLedgerModels import Gledger
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
import traceback
import requests
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getPurchaseAc,create_gledger_entry,send_gledger_entries,get_acShort_Name,get_ac_Name
from app.models.Outword.ShetkariSaleBill.ShetkariSaleBillSchemas import ShetkariSaleBillHeadSchema, ShetkariSaleBillDetailSchema
from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry
from decimal import Decimal
import threading

# Define schemas
Sugar_head_Schema = ShetkariSaleBillHeadSchema()
Sugar_head_Schemas = ShetkariSaleBillHeadSchema(many=True)

Sugar_detail_Schema = ShetkariSaleBillDetailSchema()
Sugar_detail_Schemas = ShetkariSaleBillDetailSchema(many=True)

# Get the base URL from environment variables
API_URL= os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')

#format date Function
def format_dates(task):
    return {
        "Doc_Date": task.Doc_Date.strftime('%Y-%m-%d') if task.Doc_Date else None,
        "EwayBillValidDate": task.EwayBillValidDate.strftime('%Y-%m-%d') if task.EwayBillValidDate else None,
       
    }

#Add GLedger Enteries
trans_typeNew  = "FB"
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
       

    creditNarration = f"L :{LORRYNO} ## Qty: {Quantal}"
    debitNarration = f" {partyName} # L :{LORRYNO} # {Quantal}"
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

        purchase_ac_code = item.get('saleac')
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
SELECT        dbo.ShetkariSale_Head.Doc_No, dbo.ShetkariSale_Head.Cash_Credit, dbo.ShetkariSale_Head.Doc_Date, dbo.ShetkariSale_Head.Ac_Code, dbo.ShetkariSale_Head.Broker, dbo.ShetkariSale_Detail.detail_id, 
                         dbo.ShetkariSale_Detail.Sale_Id, dbo.ShetkariSale_Detail.Item_Code, dbo.ShetkariSale_Detail.Brand_Code, dbo.ShetkariSale_Detail.Qty, dbo.ShetkariSale_Detail.Wt_Per, dbo.ShetkariSale_Detail.Wt_Qty, 
                         dbo.ShetkariSale_Detail.Rate, dbo.ShetkariSale_Detail.Value, dbo.ShetkariSale_Detail.GST_Code, dbo.ShetkariSale_Detail.SGST, dbo.ShetkariSale_Detail.CGST, dbo.ShetkariSale_Detail.IGST, 
                         dbo.ShetkariSale_Detail.Hamali_Rate, dbo.ShetkariSale_Detail.Hamali, dbo.ShetkariSale_Detail.SaleDetail_Id, dbo.ShetkariSale_Detail.Company_Code, dbo.ShetkariSale_Detail.Year_Code, dbo.ShetkariSale_Detail.ic, 
                         dbo.ShetkariSale_Detail.saleac, dbo.ShetkariSale_Detail.sac, dbo.ShetkariSale_Detail.purchaseyearcode, dbo.ShetkariSale_Detail.Net_wt, dbo.qryItemMaster.System_Name_E AS ItemName, 
                         qryFrom.Ac_Name_E AS FromName, qryBroker.Ac_Name_E AS Broker_Name, dbo.nt_1_gstratemaster.GST_Name, dbo.qryBrand_Master.Marka AS Brand_Name, dbo.nt_1_gstratemaster.Rate AS GSTRate
FROM            dbo.qryItemMaster RIGHT OUTER JOIN
                         dbo.qryBrand_Master RIGHT OUTER JOIN
                         dbo.ShetkariSale_Detail ON dbo.qryBrand_Master.Code = dbo.ShetkariSale_Detail.Brand_Code AND dbo.qryBrand_Master.Company_Code = dbo.ShetkariSale_Detail.Company_Code LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.ShetkariSale_Detail.GST_Code = dbo.nt_1_gstratemaster.Doc_no AND dbo.ShetkariSale_Detail.Company_Code = dbo.nt_1_gstratemaster.Company_Code ON 
                         dbo.qryItemMaster.Company_Code = dbo.ShetkariSale_Detail.Company_Code AND dbo.qryItemMaster.System_Code = dbo.ShetkariSale_Detail.Item_Code RIGHT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryBroker RIGHT OUTER JOIN
                         dbo.ShetkariSale_Head ON qryBroker.accoid = dbo.ShetkariSale_Head.bc ON dbo.ShetkariSale_Detail.Sale_Id = dbo.ShetkariSale_Head.Sale_Id LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryFrom ON dbo.ShetkariSale_Head.ac = qryFrom.accoid
WHERE    dbo.ShetkariSale_Detail.Sale_Id=:Sale_Id
'''

# Get data from both tables SaleBill and SaleBilllDetail
@app.route(API_URL + "/getdata-ShetkariSaleBillHead", methods=["GET"])
def getdata_ShetkariSaleBillHead():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        cash_credit = request.args.get('tran_type')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = '''
  SELECT        dbo.ShetkariSale_Head.Doc_No, dbo.ShetkariSale_Head.Cash_Credit, dbo.ShetkariSale_Head.Ac_Code, qryFrom.Ac_Name_E AS FromName, dbo.ShetkariSale_Head.Broker, dbo.ShetkariSale_Head.Doc_Date, 
                         dbo.ShetkariSale_Head.Amount, dbo.ShetkariSale_Head.EWay_Bill_No,  dbo.ShetkariSale_Head.Sale_Id,qryFrom.Gst_No,dbo.ShetkariSale_Head.Ack_No
FROM            dbo.ShetkariSale_Head LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryFrom ON dbo.ShetkariSale_Head.ac = qryFrom.accoid  
                           WHERE 
            dbo.ShetkariSale_Head.Company_Code = :company_code 
            AND dbo.ShetkariSale_Head.Year_Code = :year_code
           
        
        '''
        params = {"company_code": company_code, "year_code": year_code}

        if cash_credit != "AL":
            query += " AND dbo.ShetkariSale_Head.Cash_Credit = :cash_credit"
            params["cash_credit"] = cash_credit

        query += " order by dbo.ShetkariSale_Head.Doc_No desc"

        additional_data = db.session.execute(text(query), params)
        additional_data_rows = additional_data.fetchall()


        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'Doc_Date' in data:
                data['Doc_Date'] = data['Doc_Date'].strftime('%Y-%m-%d') if data['Doc_Date'] else None

        response = {"ShetkariSaleBillHead_Head":all_data}
        return jsonify(response), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Get data by getShetkariSaleBillHeadbyid  
@app.route(API_URL+"/getShetkariSaleBillHeadbyid", methods=["GET"])
def getShetkariSaleBillHeadbyid():
    try:
        doc_no = request.args.get('doc_no')

        if not doc_no:
            return jsonify({"error": "Document number not provided"}), 400
        
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        Cash_Credit=request.args.get('Cash_Credit')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code Or Year_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
            year_code = int(Year_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        task_head = ShetkariSaleBillHead.query.filter_by(Doc_No=doc_no, Company_Code=Company_Code, Year_Code=Year_Code,Cash_Credit=Cash_Credit   ).first()

        newtaskid = task_head.Sale_Id

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Sale_Id": newtaskid})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "getData_ShetkariSaleBillHeadHead_data": {
                **{column.name: getattr(task_head, column.name) for column in task_head.__table__.columns},
                **format_dates(task_head),
            },
            "getData_ShetkariSaleBillDetail_data": additional_data_rows
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#GET THE next doc no from the sugar purchase
@app.route(API_URL + "/get-next-doc-no-ShetkariSaleBillHeadBill", methods=["GET"])
def get_next_doc_no_ShetkariSaleBillHeadBill():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        Cash_Credit=request.args.get('Cash_Credit')
        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        max_doc_no = db.session.query(func.max(ShetkariSaleBillHead.Doc_No)).filter_by(Company_Code=company_code, Year_Code=year_code,Cash_Credit=Cash_Credit).scalar()

        next_doc_no = max_doc_no + 1 if max_doc_no else 1
        response = {
            "next_doc_no": next_doc_no
        }
        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#INSERT record into the puchase Bill
@app.route(API_URL + "/insert_ShetkariSaleBillHead", methods=["POST"])
def insert_ShetkariSaleBillHead():
    try:
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']

        max_doc_no = db.session.query(func.max(ShetkariSaleBillHead.Doc_No)).filter(ShetkariSaleBillHead.Company_Code == headData['Company_Code'], ShetkariSaleBillHead.Year_Code == headData['Year_Code'],ShetkariSaleBillHead.Cash_Credit == headData['Cash_Credit']).scalar() or 0
        new_doc_no = max_doc_no + 1
        headData['Doc_No'] = new_doc_no

        new_head = ShetkariSaleBillHead(**headData)
        db.session.add(new_head)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        for item in detailData:
            item['Doc_No'] = new_doc_no 
            rowaction = item.pop('rowaction', None)
            if rowaction == "add":
                new_detail = ShetkariSaleBillDetail(**item)
                new_head.details.append(new_detail) 
                createdDetails.append(new_detail)
            elif rowaction == "update":
                SaleDetail_Id = item['SaleDetail_Id']
                db.session.query(ShetkariSaleBillDetail).filter(ShetkariSaleBillDetail.SaleDetail_Id == SaleDetail_Id).update(item)
                updatedDetails.append(SaleDetail_Id)
            elif rowaction == "delete":
                SaleDetail_Id = item['SaleDetail_Id']
                detail_to_delete = db.session.query(ShetkariSaleBillDetail).filter(ShetkariSaleBillDetail.SaleDetail_Id == SaleDetail_Id).one_or_none()
                if detail_to_delete:
                    db.session.delete(detail_to_delete)
                    deletedDetailIds.append(SaleDetail_Id)

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
            "head": ShetkariSaleBillHeadSchema().dump(new_head),
            "addedDetails": ShetkariSaleBillDetailSchema(many=True).dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201 

    except Exception as e:
        db.session.rollback()
        print("Traceback", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

    
@app.route(API_URL + "/DeleteTransaction-shetkariSaleBill", methods=["DELETE"])
def DeleteTransaction_shetkariSalBill():
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
@app.route(API_URL + "/update-ShetkariSaleBillHead", methods=["PUT"])
def update_ShetkariSaleBillHead():
    try:
        Sale_Id = request.args.get('Sale_Id')

        if Sale_Id is None:
            return jsonify({"error": "Missing 'Sale_Id' parameter"}), 400

        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']
        # transaction = db.session.begin_nested()

        company_code = headData.get('Company_Code')
        year_code = headData.get('Year_Code')
        
        tran_type = "SP" 
        
        if 'User_Id' in headData:
            del headData['User_Id']

        existing_head = ShetkariSaleBillHead.query.filter_by(Sale_Id=Sale_Id).first()

        if not existing_head:
            return jsonify({"error": "ShetkariSaleBillHead with the given Sale_Id not found"}), 404

        
        
        updatedHeadCount = db.session.query(ShetkariSaleBillHead).filter(ShetkariSaleBillHead.Sale_Id == Sale_Id).update(headData)
        
        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        updated_tender_head = db.session.query(ShetkariSaleBillHead).filter(ShetkariSaleBillHead.Sale_Id == Sale_Id).one()
        print('<<<<<<<<<',updated_tender_head)
        doc_no = updated_tender_head.Doc_No
        dono=0
        for item in detailData:
            if item['rowaction'] == "add":
                item['Doc_No'] = doc_no
                item['Sale_Id'] = Sale_Id
                del item['rowaction']
                new_detail = ShetkariSaleBillDetail(**item)
                db.session.add(new_detail)
                createdDetails.append(item)

            elif item['rowaction'] == "update":
                item['Doc_No'] = doc_no
                item['Sale_Id'] = Sale_Id
                if dono=="" and dono==0:
                    SaleDetail_Id = item['SaleDetail_Id']
                    update_values = {k: v for k, v in item.items() if k not in ('SaleDetail_Id', 'Sale_Id', 'rowaction')}
                    db.session.query(ShetkariSaleBillDetail).filter(ShetkariSaleBillDetail.SaleDetail_Id == SaleDetail_Id).update(update_values)
                    updatedDetails.append(SaleDetail_Id)
                else:
                    SaleDetail_Id = item['SaleDetail_Id']
                    update_values = {k: v for k, v in item.items() if k not in ('SaleDetail_Id', 'Sale_Id', 'rowaction')}
                    db.session.query(ShetkariSaleBillDetail).filter(ShetkariSaleBillDetail.Sale_Id == Sale_Id).update(update_values)
                    updatedDetails.append(SaleDetail_Id)   

            elif item['rowaction'] == "delete":
                SaleDetail_Id = item['SaleDetail_Id']
                detail_to_delete = db.session.query(ShetkariSaleBillDetail).filter(ShetkariSaleBillDetail.SaleDetail_Id == SaleDetail_Id).one_or_none()

                if detail_to_delete:
                    db.session.delete(detail_to_delete)
                    deletedDetailIds.append(SaleDetail_Id)

     
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


#Delete record from Operation and also delet the Gledger Effect also implement Company Logs.
@app.route(API_URL + "/delete_data_ShetkariSaleBillHead", methods=["DELETE"])
def delete_data_ShetkariSaleBillHead():
    try:
        Sale_Id = request.args.get('Sale_Id')
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('Cash_Credit')
        User_Id = request.args.get('User_Id',0)
        Cash_Credit =request.args.get('Cash_Credit')
        if not all([Sale_Id, Company_Code, doc_no, Year_Code, tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400

        deleted_purchase_head = ShetkariSaleBillHead.query.filter_by(Sale_Id=Sale_Id).first()

        if not deleted_purchase_head:
            return jsonify({"error": "Purchase record not found"}), 404

        try:
            deleted_task_rows = ShetkariSaleBillDetail.query.filter_by(Sale_Id=Sale_Id).delete()
            deleted_user_rows = ShetkariSaleBillHead.query.filter_by(Sale_Id=Sale_Id).delete()

            query_params = {
                'Company_Code': Company_Code,
                'DOC_NO': doc_no,
                'Year_Code': Year_Code,
                'TRAN_TYPE': tran_type,
                'Sale_Id': Sale_Id,
                'CASHCREDIT' :Cash_Credit
                
            }

            response = requests.delete(API_URL_SERVER + "/delete-Record-gLedger", params=query_params, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})

            if response.status_code != 200:
                raise Exception("Failed to delete record in gLedger")

            db.session.commit()

            return jsonify({
                "message": f"Deleted {deleted_user_rows} ShetkariSaleBillHead row(s) and {deleted_task_rows} ShetkariSaleBillDetail row(s) successfully"
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Transaction failed", "message": str(e)}), 500

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Fetch the last Record on database by Sale_Id
@app.route(API_URL+"/get-lastrecordShetkariSaleBillHead", methods=["GET"])
def get_lastrecordShetkariSaleBillHead():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        Cash_Credit =request.args.get('Cash_Credit')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        last_tender_head = ShetkariSaleBillHead.query.filter_by(Company_Code=company_code,Year_Code=year_code,Cash_Credit = Cash_Credit).order_by(ShetkariSaleBillHead.Sale_Id.desc()).first()

        if not last_tender_head:
            return jsonify({"error": "No records found in last_tender_head table"}), 404

        last_tenderid = last_tender_head.Sale_Id
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Sale_Id": last_tenderid})

        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
    
        last_tender_head_data = {
            **{column.name: getattr(last_tender_head, column.name) for column in last_tender_head.__table__.columns},
            **format_dates(last_tender_head), 
        }

        last_tender_details_data = additional_data_rows
        response = {
            "last_ShetkariSaleBillHeadhead": last_tender_head_data,
            "last_ShetkariSaleBillDetail": last_tender_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Navigations API    
#Get First record from database 
@app.route(API_URL+"/get-firstShetkariSaleBillHead-navigation", methods=["GET"])
def get_firstShetkariSaleBillHead_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        Cash_Credit =request.args.get('Cash_Credit')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        first_task = ShetkariSaleBillHead.query.filter_by(Company_Code=company_code,Year_Code=year_code,Cash_Credit=Cash_Credit).order_by(ShetkariSaleBillHead.Sale_Id.asc()).first()
        
        if not first_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        first_taskid = first_task.Sale_Id

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Sale_Id": first_taskid})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "first_ShetkariSaleBillHeadHead_data": {
                **{column.name: getattr(first_task, column.name) for column in first_task.__table__.columns},
                **format_dates(first_task), 
            },
            "first_ShetkariSaleBillDetail_data": additional_data_rows
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# #Get last Record from Database in navigation 
@app.route(API_URL+"/getlastShetkariSaleBillHead-record-navigation", methods=["GET"])
def getlastShetkariSaleBillHead_record_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        Cash_Credit =request.args.get('Cash_Credit')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400

        last_task = ShetkariSaleBillHead.query.filter_by(Company_Code=company_code,Year_Code=year_code,Cash_Credit=Cash_Credit).order_by(ShetkariSaleBillHead.Sale_Id.desc()).first()

        if not last_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        last_taskid = last_task.Sale_Id

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Sale_Id": last_taskid})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
      
        response = {
            "last_ShetkariSaleBillHeadHead_data": {
                **{column.name: getattr(last_task, column.name) for column in last_task.__table__.columns},
                **format_dates(last_task),
            },
            "last_ShetkariSaleBillDetail_data": additional_data_rows
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# #Get Previous record by database 
@app.route(API_URL+"/getpreviousShetkariSaleBillHead-navigation", methods=["GET"])
def getpreviousShetkariSaleBillHead_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        current_doc_no = request.args.get('doc_no')
        Cash_Credit =request.args.get('Cash_Credit')
        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        if not current_doc_no:
            return jsonify({"error": "Current Task No is required"}), 400

        previous_task = ShetkariSaleBillHead.query.filter(
            ShetkariSaleBillHead.Doc_No < current_doc_no,
            ShetkariSaleBillHead.Company_Code == company_code,
            ShetkariSaleBillHead.Year_Code == year_code,
            ShetkariSaleBillHead.Cash_Credit == Cash_Credit,

        ).order_by(ShetkariSaleBillHead.Doc_No.desc()).first()
    
        if not previous_task:
            return jsonify({"error": "No previous records found"}), 404

        previous_Sale_Id_id = previous_task.Sale_Id
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Sale_Id": previous_Sale_Id_id})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "previous_ShetkariSaleBillHeadHead_data": {
                **{column.name: getattr(previous_task, column.name) for column in previous_task.__table__.columns},
                **format_dates(previous_task), 
            },
            "previous_ShetkariSaleBillDetail_data":additional_data_rows
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# # #Get Next record by database 
@app.route(API_URL+"/getnextShetkariSaleBillHead-navigation", methods=["GET"])
def getnextShetkariSaleBillHead_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        current_doc_no = request.args.get('doc_no')
        Cash_Credit =request.args.get('Cash_Credit')
        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
    
        if not current_doc_no:
            return jsonify({"error": "Current doc No required"}), 400
        next_purchseid = ShetkariSaleBillHead.query.filter(ShetkariSaleBillHead.Doc_No > current_doc_no,ShetkariSaleBillHead.Company_Code == company_code,
            ShetkariSaleBillHead.Year_Code == year_code,
            ShetkariSaleBillHead.Cash_Credit==Cash_Credit
            ).order_by(ShetkariSaleBillHead.Doc_No.asc()).first()

        if not next_purchseid:
            return jsonify({"error": "No next records found"}), 404

        next_purchseid_id = next_purchseid.Sale_Id
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Sale_Id": next_purchseid_id})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "next_ShetkariSaleBillHeadhead_data": {
                **{column.name: getattr(next_purchseid, column.name) for column in next_purchseid.__table__.columns},
                **format_dates(next_purchseid)
            },
            "next_ShetkariSaleBillDetails_data": additional_data_rows
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
#                          dbo.qrypurchaseheaddetail.Sale_Id, dbo.qrypurchaseheaddetail.ac, dbo.qrypurchaseheaddetail.uc, dbo.qrypurchaseheaddetail.mc, dbo.qrypurchaseheaddetail.bk, dbo.qrypurchaseheaddetail.suppliername, 
#                          dbo.qrypurchaseheaddetail.suppliergstno, dbo.qrypurchaseheaddetail.supplierstatecode, dbo.qrypurchaseheaddetail.unitname, dbo.qrypurchaseheaddetail.millname, dbo.qrypurchaseheaddetail.brokername, 
#                          dbo.qrypurchaseheaddetail.GST_Name, dbo.qrypurchaseheaddetail.gstrate, dbo.qrypurchaseheaddetail.detail_id, dbo.qrypurchaseheaddetail.Item_Code, dbo.qrypurchaseheaddetail.itemnarration, 
#                          dbo.qrypurchaseheaddetail.Quantal, dbo.qrypurchaseheaddetail.packing, dbo.qrypurchaseheaddetail.bags, dbo.qrypurchaseheaddetail.rate, dbo.qrypurchaseheaddetail.item_Amount, 
#                          dbo.qrypurchaseheaddetail.SaleDetail_Id, dbo.qrypurchaseheaddetail.ic, dbo.qrypurchaseheaddetail.itemname, dbo.qrypurchaseheaddetail.doc_dateConverted, dbo.qrypurchaseheaddetail.grade, 
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