from flask import Flask, jsonify, request, copy_current_request_context
from app import app, db, socketio
from app.models.Inword.PurchaseBill.PurchaseBillModels import SugarPurchase, SugarPurchaseDetail
from app.models.Reports.GLedeger.GLedgerModels import Gledger
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func
import os
import json
import traceback
import requests
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getPurchaseAc,create_gledger_entry,send_gledger_entries,get_acShort_Name,get_ac_Name
from app.models.Inword.PurchaseBill.PurchaseBillSchemas import SugarPurchaseHeadSchema, SugarPurchaseDetailSchema
from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry
from decimal import Decimal
import threading

# Define schemas
Sugar_head_Schema = SugarPurchaseHeadSchema()
Sugar_head_Schemas = SugarPurchaseHeadSchema(many=True)

Sugar_detail_Schema = SugarPurchaseDetailSchema()
Sugar_detail_Schemas = SugarPurchaseDetailSchema(many=True)

# Get the base URL from environment variables
API_URL= os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')

#format date Function
def format_dates(task):
    return {
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
        "mill_inv_date": task.mill_inv_date.strftime('%Y-%m-%d') if task.mill_inv_date else None,
    }

#Add GLedger Enteries
trans_typeNew  = "PS"
DRCRHead = "C"
DRCRDetail ="D"
ac_code=0
ordercode=0
new_doc_no=0
narration=''

def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid,ordercode,narration,do_no=0, ca_narration=None):
    if amount > 0:
        entry = create_gledger_entry(data, amount, drcr, ac_code, accoid,ordercode,trans_typeNew,new_doc_no,narration)
        entry['do_no'] = do_no
        entry['CA_NARRATION'] = ca_narration
        entries.append(entry)

#Create GLedger Enteries
def create_gledger_entries(headData, detailData, doc_no,do_no):
    gledger_entries = []
    
    IGSTAmount = float(headData.get('IGSTAmount', 0) or 0)
    SGSTAmount = float(headData.get('SGSTAmount', 0) or 0)
    CGSTAmount = float(headData.get('CGSTAmount', 0) or 0)
    TCS_Amt = float(headData.get('TCS_Amt', 0) or 0)
    TDS_Amt = float(headData.get('TDS_Amt', 0) or 0)
    bill_amount = float(headData.get('Bill_Amount', 0) or 0)
    subTotal = float(headData.get('subTotal', 0) or 0)
    OTHER_AMT = float(headData.get('OTHER_AMT', 0) or 0)

    mill_code = headData['mill_code']
    Ac_Code = headData['Ac_Code']
    millShortName = get_acShort_Name(mill_code, headData['Company_Code'])
    partyName = get_ac_Name(Ac_Code, headData['Company_Code'])
    LORRYNO = headData['LORRYNO']
    grade = headData['grade']

    for item in detailData:
        Quantal = float(item.get('Quantal')) or 0
        item_Amount = float(item.get('item_Amount')) or 0
        rate = item_Amount / Quantal if Quantal else 0

    creditNarration = f"{millShortName} # L :{LORRYNO} # G :{grade} # {Quantal} # R : {rate}"
    debitNarration = f"{millShortName} # {partyName} # L :{LORRYNO} # G :{grade} # {Quantal} # R : {rate}"
    TCSNarration = f"TCS #{partyName}{headData['doc_no']}"
    TDSNarration = f"TDS #{partyName}{headData['doc_no']}"
    OtherAmtNarration = f"Other Amount #{OTHER_AMT}"

    GeneralNarrationForCA = (
        f"{partyName}"+ " " 
        f"P B No {headData['doc_no']}"
    )

    TDSNarrationPartyForCA = (
        f"{partyName} "+ " " 
        f"P B No {headData['doc_no']}"
    )

    TDSNarrationTDSAcForCA = (
        f"TDS P B No {headData['doc_no']}"
    )

    GeneralNarrationForParty_CA = (
        f"P B No {headData['doc_no']}"
    )

    company_parameters = fetch_company_parameters(headData.get('Company_Code'), headData.get('Year_Code'))
    ordercode = 0

    add_gledger_entry(gledger_entries, headData, bill_amount,DRCRHead, headData['Ac_Code'], get_accoid(headData['Ac_Code'],headData['Company_Code']),ordercode,creditNarration,do_no,GeneralNarrationForParty_CA)

    ic_value = ''
    purchase_ac_code = ''
    for item in detailData:
        ic_value = item.get('ic')  
        if ic_value is not None:
            purchase_ac_code = getPurchaseAc(ic_value)
    if subTotal > 0:
        ordercode += 1
        ac_code = purchase_ac_code
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, subTotal, DRCRDetail, ac_code, accoid, ordercode,debitNarration,do_no,GeneralNarrationForCA)

    for amount, ac_code in [
        (IGSTAmount, company_parameters.PurchaseIGSTAc),
        (CGSTAmount, company_parameters.PurchaseCGSTAc),
        (SGSTAmount, company_parameters.PurchaseSGSTAc),
    ]:
        if amount > 0:
            ordercode += 1
            accoid = get_accoid(ac_code, headData.get('Company_Code'))
            add_gledger_entry(gledger_entries, headData, amount, DRCRDetail, ac_code, accoid, ordercode,debitNarration,do_no,GeneralNarrationForCA)

    if TCS_Amt > 0:
        ordercode += 1
        ac_code = headData['Ac_Code']
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, TCS_Amt, DRCRHead, ac_code, accoid, ordercode,TCSNarration,do_no,TCSNarration)

        ordercode += 1
        ac_code = company_parameters.PurchaseTCSAc
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, TCS_Amt, DRCRDetail, ac_code, accoid, ordercode,TCSNarration,do_no,TCSNarration)

    if TDS_Amt > 0:
        ordercode += 1
        ac_code = headData['Ac_Code']
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRDetail, ac_code, accoid, ordercode,TDSNarration,do_no,TDSNarrationTDSAcForCA)

        ordercode += 1
        ac_code = company_parameters.PurchaseTDSAc
        accoid = get_accoid(ac_code, headData['Company_Code'])
        add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRHead, ac_code, accoid, ordercode,TDSNarration,do_no,TDSNarrationPartyForCA)

    if OTHER_AMT != 0:
        if OTHER_AMT > 0:
            ordercode += 1
            ac_code = company_parameters.OTHER_AMOUNT_AC
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, OTHER_AMT, DRCRDetail, ac_code, accoid, ordercode,OtherAmtNarration,do_no,GeneralNarrationForParty_CA)
        else:
            ordercode += 1
            ac_code = company_parameters.OTHER_AMOUNT_AC
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, abs(OTHER_AMT), DRCRHead, ac_code, accoid, ordercode,OtherAmtNarration,do_no,GeneralNarrationForParty_CA)


    return gledger_entries

# Global SQL Query
TASK_DETAILS_QUERY = '''
  SELECT        dbo.nt_1_sugarpurchase.doc_no , dbo.nt_1_sugarpurchase.Tran_Type, dbo.nt_1_sugarpurchase.GstRateCode,dbo.nt_1_gstratemaster.GST_Name, dbo.nt_1_sugarpurchase.Ac_Code, qryFrom.Ac_Name_E AS FromName, 
                         dbo.nt_1_sugarpurchase.Unit_Code, qryUnit.Ac_Name_E AS Unit_Name, dbo.nt_1_sugarpurchase.mill_code, qryMill.Ac_Name_E AS Mill_Name, dbo.nt_1_sugarpurchase.BROKER, qryBroker.Ac_Name_E AS Broker_Name, 
                         dbo.nt_1_sugarpurchasedetails.doc_no, dbo.nt_1_sugarpurchasedetails.detail_id, dbo.nt_1_sugarpurchasedetails.Tran_Type, dbo.nt_1_sugarpurchasedetails.item_code, dbo.qryItemMaster.System_Name_E AS ItemName, 
                         dbo.nt_1_sugarpurchasedetails.narration, dbo.nt_1_sugarpurchasedetails.Quantal, dbo.nt_1_sugarpurchasedetails.packing, dbo.nt_1_sugarpurchasedetails.bags, dbo.nt_1_sugarpurchasedetails.rate, 
                         dbo.nt_1_sugarpurchasedetails.item_Amount, dbo.nt_1_sugarpurchasedetails.Company_Code, dbo.nt_1_sugarpurchasedetails.Year_Code, dbo.nt_1_sugarpurchasedetails.Branch_Code, 
                         dbo.nt_1_sugarpurchasedetails.Created_By, dbo.nt_1_sugarpurchasedetails.Modified_By, dbo.nt_1_sugarpurchasedetails.purchasedetailid, dbo.nt_1_sugarpurchasedetails.purchaseid, dbo.nt_1_sugarpurchasedetails.ic, 
                         dbo.nt_1_sugarpurchasedetails.Brand_Code, dbo.qryBrand_Master.Marka AS Brand_Name
                        FROM dbo.qryBrand_Master RIGHT OUTER JOIN
                         dbo.nt_1_sugarpurchasedetails ON dbo.qryBrand_Master.Company_Code = dbo.nt_1_sugarpurchasedetails.Company_Code AND dbo.qryBrand_Master.Code = dbo.nt_1_sugarpurchasedetails.Branch_Code LEFT OUTER JOIN
                         dbo.qryItemMaster ON dbo.nt_1_sugarpurchasedetails.Company_Code = dbo.qryItemMaster.Company_Code AND dbo.nt_1_sugarpurchasedetails.item_code = dbo.qryItemMaster.System_Code RIGHT OUTER JOIN
                         dbo.nt_1_sugarpurchase ON dbo.nt_1_sugarpurchasedetails.purchaseid = dbo.nt_1_sugarpurchase.purchaseid LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_sugarpurchase.Company_Code = dbo.nt_1_gstratemaster.Company_Code AND dbo.nt_1_sugarpurchase.GstRateCode = dbo.nt_1_gstratemaster.Doc_no LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryBroker ON dbo.nt_1_sugarpurchase.bk = qryBroker.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryMill ON dbo.nt_1_sugarpurchase.mc = qryMill.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryUnit ON dbo.nt_1_sugarpurchase.uc = qryUnit.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryFrom ON dbo.nt_1_sugarpurchase.ac = qryFrom.accoid
WHERE    nt_1_sugarpurchase.purchaseid=:purchaseid
'''

# Get data from both tables SaleBill and SaleBilllDetail
@app.route(API_URL + "/getdata-sugarpurchase", methods=["GET"])
def getdata_sugarpurchase():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = '''
  SELECT        dbo.nt_1_sugarpurchase.doc_no, dbo.nt_1_sugarpurchase.Tran_Type, dbo.nt_1_sugarpurchase.GstRateCode, dbo.nt_1_sugarpurchase.Ac_Code, qryFrom.Ac_Name_E AS FromName, dbo.nt_1_sugarpurchase.Unit_Code, 
                         dbo.nt_1_sugarpurchase.mill_code, qryMill.Ac_Name_E AS Mill_Name, dbo.nt_1_sugarpurchase.BROKER, dbo.nt_1_sugarpurchase.doc_date, dbo.nt_1_sugarpurchase.NETQNTL, dbo.nt_1_sugarpurchase.Bill_Amount, 
                         dbo.nt_1_sugarpurchase.EWay_Bill_No, dbo.nt_1_sugarpurchase.Bill_No, dbo.nt_1_sugarpurchase.purchaseid
FROM  dbo.nt_1_sugarpurchase INNER JOIN
                         dbo.qrymstaccountmaster AS qryMill ON dbo.nt_1_sugarpurchase.mc = qryMill.accoid INNER JOIN
                         dbo.qrymstaccountmaster AS qryFrom ON dbo.nt_1_sugarpurchase.ac = qryFrom.accoid
        WHERE 
            dbo.nt_1_sugarpurchase.Company_Code = :company_code 
            AND dbo.nt_1_sugarpurchase.Year_Code = :year_code
        order by dbo.nt_1_sugarpurchase.doc_no desc
        '''

        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code})

        additional_data_rows = additional_data.fetchall()

        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' in data:
                data['doc_date'] = data['doc_date'].strftime('%Y-%m-%d') if data['doc_date'] else None

        response = {"SugarPurchase_Head":all_data}
        return jsonify(response), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Get data by getsugarpurchasebyid  
@app.route(API_URL+"/getsugarpurchasebyid", methods=["GET"])
def getsugarpurchasebyid():
    try:
        doc_no = request.args.get('doc_no')

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

        task_head = SugarPurchase.query.filter_by(doc_no=doc_no, Company_Code=Company_Code, Year_Code=Year_Code).first()

        newtaskid = task_head.purchaseid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": newtaskid})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "getData_SugarPurchaseHead_data": {
                **{column.name: getattr(task_head, column.name) for column in task_head.__table__.columns},
                **format_dates(task_head),
            },
            "getData_SugarPurchaseDetail_data": additional_data_rows
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#GET THE next doc no from the sugar purchase
@app.route(API_URL + "/get-next-doc-no-purchaseBill", methods=["GET"])
def get_next_doc_no_purchaseBill():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        max_doc_no = db.session.query(func.max(SugarPurchase.doc_no)).filter_by(Company_Code=company_code, Year_Code=year_code).scalar()

        next_doc_no = max_doc_no + 1 if max_doc_no else 1
        response = {
            "next_doc_no": next_doc_no
        }
        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#INSERT record into the puchase Bill
@app.route(API_URL + "/insert_SugarPurchase", methods=["POST"])
def insert_SugarPurchase():
    try:
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']

        max_doc_no = db.session.query(func.max(SugarPurchase.doc_no)).filter(SugarPurchase.Company_Code == headData['Company_Code'], SugarPurchase.Year_Code == headData['Year_Code']).scalar() or 0
        new_doc_no = max_doc_no + 1
        headData['doc_no'] = new_doc_no

        do_no = headData['PURCNO']

        new_head = SugarPurchase(**headData)
        db.session.add(new_head)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        for item in detailData:
            item['doc_no'] = new_doc_no 
            rowaction = item.pop('rowaction', None)
            if rowaction == "add":
                new_detail = SugarPurchaseDetail(**item)
                new_head.details.append(new_detail) 
                createdDetails.append(new_detail)
            elif rowaction == "update":
                purchasedetailid = item['purchasedetailid']
                db.session.query(SugarPurchaseDetail).filter(SugarPurchaseDetail.purchasedetailid == purchasedetailid).update(item)
                updatedDetails.append(purchasedetailid)
            elif rowaction == "delete":
                purchasedetailid = item['purchasedetailid']
                detail_to_delete = db.session.query(SugarPurchaseDetail).filter(SugarPurchaseDetail.purchasedetailid == purchasedetailid).one_or_none()
                if detail_to_delete:
                    db.session.delete(detail_to_delete)
                    deletedDetailIds.append(purchasedetailid)

        db.session.commit()

        socketio.emit('purchase_bill_added', json.loads(json.dumps(headData, default=str)))

        gledger_entries = create_gledger_entries(headData, detailData, new_doc_no,do_no)

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
            "head": SugarPurchaseHeadSchema().dump(new_head),
            "addedDetails": SugarPurchaseDetailSchema(many=True).dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201 

    except Exception as e:
        print("Traceback", traceback.format_exc())
        try:
            do_no = headData.get('PURCNO')  
            Company_Code = headData.get('Company_Code')
            Year_Code = headData.get('Year_Code')
            
            delete_url = f"{API_URL_SERVER}/DeleteTransaction?PURCNO={do_no}&Company_Code={Company_Code}&Year_Code={Year_Code}"
            
            response = requests.delete(delete_url)
            
            if response.status_code != 200:
                print(f"Failed to delete related records: {response.text}")
        
        except Exception as inner_exception:
            print(f"Error occurred while calling DeleteTransaction API: {inner_exception}")
        
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
@app.route(API_URL + "/DeleteTransaction", methods=["DELETE"])
def DeleteTransaction():
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
@app.route(API_URL + "/update-SugarPurchase", methods=["PUT"])
def update_SugarPurchase():
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
        user_id = headData.get('User_Id')
        tran_type = "PS" 
        
        if 'User_Id' in headData:
            del headData['User_Id']

        existing_head = SugarPurchase.query.filter_by(purchaseid=purchaseid).first()

        if not existing_head:
            return jsonify({"error": "SugarPurchase with the given purchaseid not found"}), 404

        from_account_changed = existing_head.Ac_Code != int(headData.get('Ac_Code', existing_head.Ac_Code) or 0)
        tcs_net_payable_changed = Decimal(str(existing_head.TCS_Net_Payable)) != Decimal(str(headData.get('TCS_Net_Payable', existing_head.TCS_Net_Payable) or 0))
        netquintal_changed = Decimal(str(existing_head.NETQNTL)) != Decimal(str(headData.get('NETQNTL', existing_head.NETQNTL) or 0))
        tds_Rate_changed = Decimal(str(existing_head.TDS_Rate)) != Decimal(str(headData.get('TDS_Rate', existing_head.TDS_Rate) or 0))

        existing_rate = Decimal(str(existing_head.subTotal)) / Decimal(str(existing_head.NETQNTL or 0))
        updated_rate = Decimal(str(headData.get("subTotal", existing_head.subTotal))) / Decimal(str(headData.get("NETQNTL", existing_head.NETQNTL) or 0))
        rate_changed = existing_rate != updated_rate
        
        updatedHeadCount = db.session.query(SugarPurchase).filter(SugarPurchase.purchaseid == purchaseid).update(headData)
        
        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        updated_tender_head = db.session.query(SugarPurchase).filter(SugarPurchase.purchaseid == purchaseid).one()
        doc_no = updated_tender_head.doc_no
        dono=headData['PURCNO']
        for item in detailData:
            if item['rowaction'] == "add":
                item['doc_no'] = doc_no
                item['purchaseid'] = purchaseid
                del item['rowaction']
                new_detail = SugarPurchaseDetail(**item)
                db.session.add(new_detail)
                createdDetails.append(item)

            elif item['rowaction'] == "update":
                item['doc_no'] = doc_no
                item['purchaseid'] = purchaseid
                if dono=="" and dono==0:
                    purchasedetailid = item['purchasedetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('purchasedetailid', 'purchaseid', 'rowaction')}
                    db.session.query(SugarPurchaseDetail).filter(SugarPurchaseDetail.purchasedetailid == purchasedetailid).update(update_values)
                    updatedDetails.append(purchasedetailid)
                else:
                    purchasedetailid = item['purchasedetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('purchasedetailid', 'purchaseid', 'rowaction')}
                    db.session.query(SugarPurchaseDetail).filter(SugarPurchaseDetail.purchaseid == purchaseid).update(update_values)
                    updatedDetails.append(purchasedetailid)   

            elif item['rowaction'] == "delete":
                purchasedetailid = item['purchasedetailid']
                detail_to_delete = db.session.query(SugarPurchaseDetail).filter(SugarPurchaseDetail.purchasedetailid == purchasedetailid).one_or_none()

                if detail_to_delete:
                    db.session.delete(detail_to_delete)
                    deletedDetailIds.append(purchasedetailid)

        if existing_head and updatedHeadCount > 0 and (from_account_changed or tcs_net_payable_changed or netquintal_changed or rate_changed or tds_Rate_changed):
            create_company_log_entry(
                db=db,
                ac_code=existing_head.Ac_Code,
                value=existing_head.TCS_Net_Payable,
                doc_no=existing_head.doc_no,
                doc_date=existing_head.doc_date,
                # updated_doc_date=head_data.get("doc_date"),
                company_code=company_code,
                year_code=year_code,
                record_type='O',
                record_no=purchaseid,
                user_id=user_id,
                tran_type=tran_type,
                bank_ac=0,
                created_by=headData.get('Created_By'),
                modified_by=headData.get('Modified_By'),
                narration="",
                do_no = existing_head.PURCNO,
                quintal = existing_head.NETQNTL,
                rate = Decimal(str(existing_head.subTotal or 0)) / Decimal(str(existing_head.NETQNTL or 0)),
                sale_tds = existing_head.TDS_Rate
            )

            create_company_log_entry(
                db=db,
                ac_code=headData.get("Ac_Code"),
                value=headData.get("TCS_Net_Payable"),
                doc_no=doc_no,
                doc_date=headData.get("doc_date"),
                # updated_doc_date=head_data.get("doc_date"),
                company_code=company_code,
                year_code=year_code,
                record_type='N',
                record_no=purchaseid,
                user_id=user_id,
                tran_type=tran_type,
                bank_ac=0,
                created_by=headData.get('Created_By'),
                modified_by=headData.get('Modified_By'),
                narration="",
                do_no = headData.get("PURCNO"),
                quintal = headData.get("NETQNTL"),
                rate = Decimal(str(headData.get("subTotal") or 0)) / Decimal(str(headData.get("NETQNTL") or 0)),
                sale_tds = headData.get('TDS_Rate')
            )

        db.session.commit()

        socketio.emit('purchase_bill_updated', json.loads(json.dumps({**headData, 'doc_no': doc_no, 'purchaseid': purchaseid}, default=str)))

        gledger_entries = create_gledger_entries(headData, detailData, doc_no,dono)

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
# @app.route(API_URL + "/delete_data_SugarPurchase", methods=["DELETE"])
# def delete_data_SugarPurchase():
#     try:
#         purchaseid = request.args.get('purchaseid')
#         Company_Code = request.args.get('Company_Code')
#         doc_no = request.args.get('doc_no')
#         Year_Code = request.args.get('Year_Code')
#         tran_type = request.args.get('tran_type')
     
#         if not all([purchaseid, Company_Code, doc_no, Year_Code, tran_type]):
#             return jsonify({"error": "Missing required parameters"}), 400

#         with db.session.begin():
#             deleted_user_rows = SugarPurchase.query.filter_by(purchaseid=purchaseid).delete()

#             deleted_task_rows = SugarPurchaseDetail.query.filter_by(purchaseid=purchaseid).delete()

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
@app.route(API_URL + "/delete_data_SugarPurchase", methods=["DELETE"])
def delete_data_SugarPurchase():
    try:
        purchaseid = request.args.get('purchaseid')
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')
        User_Id = request.args.get('User_Id',0)

        if not all([purchaseid, Company_Code, doc_no, Year_Code, tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400

        deleted_purchase_head = SugarPurchase.query.filter_by(purchaseid=purchaseid).first()

        if not deleted_purchase_head:
            return jsonify({"error": "Purchase record not found"}), 404

        try:
            deleted_task_rows = SugarPurchaseDetail.query.filter_by(purchaseid=purchaseid).delete()
            deleted_user_rows = SugarPurchase.query.filter_by(purchaseid=purchaseid).delete()

            create_company_log_entry(
                db=db,
                ac_code=deleted_purchase_head.Ac_Code,
                value=deleted_purchase_head.TCS_Net_Payable,
                doc_no=deleted_purchase_head.doc_no,
                doc_date=deleted_purchase_head.doc_date,
                company_code=Company_Code,
                year_code=Year_Code,
                record_type='D',
                record_no=purchaseid,
                user_id=User_Id,
                tran_type=tran_type,
                bank_ac=0,
                created_by=deleted_purchase_head.Created_By,
                modified_by=deleted_purchase_head.Modified_By
            )

            query_params = {
                'Company_Code': Company_Code,
                'DOC_NO': doc_no,
                'Year_Code': Year_Code,
                'TRAN_TYPE': tran_type,
                'purchaseid': purchaseid
            }

            response = requests.delete(API_URL_SERVER + "/delete-Record-gLedger", params=query_params, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})

            if response.status_code != 200:
                raise Exception("Failed to delete record in gLedger")

            db.session.commit()

            socketio.emit('purchase_bill_deleted', {
                'doc_no': doc_no,
                'purchaseid': purchaseid,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code
            })

            return jsonify({
                "message": f"Deleted {deleted_user_rows} SugarPurchase row(s) and {deleted_task_rows} SugarPurchaseDetail row(s) successfully"
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Transaction failed", "message": str(e)}), 500

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Fetch the last Record on database by purchaseid
@app.route(API_URL+"/get-lastrecordsugarpurchase", methods=["GET"])
def get_lastrecordsugarpurchase():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        last_tender_head = SugarPurchase.query.filter_by(Company_Code=company_code,Year_Code=year_code).order_by(SugarPurchase.purchaseid.desc()).first()

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
            "last_SugarPurchasehead": last_tender_head_data,
            "last_SugarPurchasedetail": last_tender_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Navigations API    
#Get First record from database 
@app.route(API_URL+"/get-firstsugarpurchase-navigation", methods=["GET"])
def get_firstsugarpurchase_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        first_task = SugarPurchase.query.filter_by(Company_Code=company_code,Year_Code=year_code).order_by(SugarPurchase.purchaseid.asc()).first()
        
        if not first_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        first_taskid = first_task.purchaseid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": first_taskid})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "first_SugarPurchaseHead_data": {
                **{column.name: getattr(first_task, column.name) for column in first_task.__table__.columns},
                **format_dates(first_task), 
            },
            "first_SugarPurchasedetail_data": additional_data_rows
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# #Get last Record from Database in navigation 
@app.route(API_URL+"/getlastSugarPurchase-record-navigation", methods=["GET"])
def getlastSugarPurchase_record_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400

        last_task = SugarPurchase.query.filter_by(Company_Code=company_code,Year_Code=year_code).order_by(SugarPurchase.purchaseid.desc()).first()

        if not last_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        last_taskid = last_task.purchaseid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": last_taskid})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
      
        response = {
            "last_SugarPurchaseHead_data": {
                **{column.name: getattr(last_task, column.name) for column in last_task.__table__.columns},
                **format_dates(last_task),
            },
            "last_SugarPurchasedetail_data": additional_data_rows
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# #Get Previous record by database 
@app.route(API_URL+"/getprevioussugarpurchase-navigation", methods=["GET"])
def getprevioussugarpurchase_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        current_doc_no = request.args.get('doc_no')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        if not current_doc_no:
            return jsonify({"error": "Current Task No is required"}), 400

        previous_task = SugarPurchase.query.filter(
            SugarPurchase.doc_no < current_doc_no,
            SugarPurchase.Company_Code == company_code,
            SugarPurchase.Year_Code == year_code
        ).order_by(SugarPurchase.doc_no.desc()).first()
    
        if not previous_task:
            return jsonify({"error": "No previous records found"}), 404

        previous_purchaseid_id = previous_task.purchaseid
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": previous_purchaseid_id})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "previous_SugarPurchaseHead_data": {
                **{column.name: getattr(previous_task, column.name) for column in previous_task.__table__.columns},
                **format_dates(previous_task), 
            },
            "previous_SugarPurchasedetail_data":additional_data_rows
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# # #Get Next record by database 
@app.route(API_URL+"/getnextsugarpurchase-navigation", methods=["GET"])
def getnextsugarpurchase_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        current_doc_no = request.args.get('doc_no')
        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
    
        if not current_doc_no:
            return jsonify({"error": "Current doc No required"}), 400
        next_purchseid = SugarPurchase.query.filter(SugarPurchase.doc_no > current_doc_no,SugarPurchase.Company_Code == company_code,
            SugarPurchase.Year_Code == year_code).order_by(SugarPurchase.doc_no.asc()).first()

        if not next_purchseid:
            return jsonify({"error": "No next records found"}), 404

        next_purchseid_id = next_purchseid.purchaseid
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": next_purchseid_id})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "next_SugarPurchasehead_data": {
                **{column.name: getattr(next_purchseid, column.name) for column in next_purchseid.__table__.columns},
                **format_dates(next_purchseid)
            },
            "next_SugarPurchasedetails_data": additional_data_rows
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Purchase Bill Report 
@app.route(API_URL+"/generating_purchaseReport_report", methods=["GET"])
def generating_purchaseReport_report():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no')

        if not company_code or not year_code or not doc_no:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT        dbo.qrypurchaseheaddetail.doc_no, dbo.qrypurchaseheaddetail.Tran_Type, dbo.qrypurchaseheaddetail.PURCNO, dbo.qrypurchaseheaddetail.doc_date, dbo.qrypurchaseheaddetail.Ac_Code, 
                         dbo.qrypurchaseheaddetail.Unit_Code, dbo.qrypurchaseheaddetail.mill_code, dbo.qrypurchaseheaddetail.FROM_STATION, dbo.qrypurchaseheaddetail.TO_STATION, dbo.qrypurchaseheaddetail.LORRYNO, 
                         dbo.qrypurchaseheaddetail.BROKER, dbo.qrypurchaseheaddetail.wearhouse, dbo.qrypurchaseheaddetail.subTotal, dbo.qrypurchaseheaddetail.LESS_FRT_RATE, dbo.qrypurchaseheaddetail.freight, 
                         dbo.qrypurchaseheaddetail.cash_advance, dbo.qrypurchaseheaddetail.bank_commission, dbo.qrypurchaseheaddetail.OTHER_AMT, dbo.qrypurchaseheaddetail.Bill_Amount, dbo.qrypurchaseheaddetail.Due_Days, 
                         dbo.qrypurchaseheaddetail.NETQNTL, dbo.qrypurchaseheaddetail.Company_Code, dbo.qrypurchaseheaddetail.Year_Code, dbo.qrypurchaseheaddetail.Branch_Code, dbo.qrypurchaseheaddetail.Created_By, 
                         dbo.qrypurchaseheaddetail.Modified_By, dbo.qrypurchaseheaddetail.Bill_No, dbo.qrypurchaseheaddetail.GstRateCode, dbo.qrypurchaseheaddetail.CGSTRate, dbo.qrypurchaseheaddetail.CGSTAmount, 
                         dbo.qrypurchaseheaddetail.SGSTRate, dbo.qrypurchaseheaddetail.SGSTAmount, dbo.qrypurchaseheaddetail.IGSTRate, dbo.qrypurchaseheaddetail.IGSTAmount, dbo.qrypurchaseheaddetail.EWay_Bill_No, 
                         dbo.qrypurchaseheaddetail.purchaseid, dbo.qrypurchaseheaddetail.ac, dbo.qrypurchaseheaddetail.uc, dbo.qrypurchaseheaddetail.mc, dbo.qrypurchaseheaddetail.bk, dbo.qrypurchaseheaddetail.suppliername, 
                         dbo.qrypurchaseheaddetail.suppliergstno, dbo.qrypurchaseheaddetail.supplierstatecode, dbo.qrypurchaseheaddetail.unitname, dbo.qrypurchaseheaddetail.millname, dbo.qrypurchaseheaddetail.brokername, 
                         dbo.qrypurchaseheaddetail.GST_Name, dbo.qrypurchaseheaddetail.gstrate, dbo.qrypurchaseheaddetail.detail_id, dbo.qrypurchaseheaddetail.item_code, dbo.qrypurchaseheaddetail.itemnarration, 
                         dbo.qrypurchaseheaddetail.Quantal, dbo.qrypurchaseheaddetail.packing, dbo.qrypurchaseheaddetail.bags, dbo.qrypurchaseheaddetail.rate, dbo.qrypurchaseheaddetail.item_Amount, 
                         dbo.qrypurchaseheaddetail.purchasedetailid, dbo.qrypurchaseheaddetail.ic, dbo.qrypurchaseheaddetail.itemname, dbo.qrypurchaseheaddetail.doc_dateConverted, dbo.qrypurchaseheaddetail.grade, 
                         dbo.qrypurchaseheaddetail.mill_inv_date, dbo.qrypurchaseheaddetail.mill_inv_dateConverted, dbo.qrypurchaseheaddetail.millshortname, dbo.qrypurchaseheaddetail.Purcid, dbo.qrypurchaseheaddetail.SelfBal, 
                         dbo.qrypurchaseheaddetail.Brand_Code, dbo.qrypurchaseheaddetail.Brand_Name, dbo.qrypurchaseheaddetail.GSTStateCode, dbo.qrypurchaseheaddetail.SupplierShortname, dbo.qrypurchaseheaddetail.TCS_Rate, 
                         dbo.qrypurchaseheaddetail.TCS_Amt, dbo.qrypurchaseheaddetail.TCS_Net_Payable, dbo.qrypurchaseheaddetail.supplieraddress, dbo.qrypurchaseheaddetail.CompanyPan, dbo.qrypurchaseheaddetail.TDS_Amt, 
                         dbo.qrypurchaseheaddetail.TDS_Rate, dbo.qrypurchaseheaddetail.partyCity, dbo.qrypurchaseheaddetail.BrokerShort, dbo.qrypurchaseheaddetail.supllierfssaino, dbo.qrypurchaseheaddetail.suppliertinno, 
                         dbo.qrypurchaseheaddetail.supplierpan, dbo.qrypurchaseheaddetail.HSN, dbo.qrypurchaseheaddetail.Unit, dbo.company.Company_Name_E, dbo.company.Address_E, dbo.company.City_E, dbo.company.State_E, 
                         dbo.company.PIN, dbo.company.Mobile_No, dbo.company.Pan_No, dbo.company.PHONE, dbo.company.FSSAI_No, dbo.nt_1_companyparameters.GSTStateCode AS Expr1, dbo.tblvoucherheadaddress.AL1, 
                         dbo.tblvoucherheadaddress.AL2, dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other, dbo.tblvoucherheadaddress.BillFooter, dbo.tblvoucherheadaddress.bankdetail, 
                         dbo.company.GST, dbo.company.TIN, dbo.accountingyear.year, dbo.qrypurchaseheaddetail.SupplierPinCode, dbo.qrypurchaseheaddetail.supplierStateName, dbo.qrypurchaseheaddetail.unitStateName, 
                         dbo.qrypurchaseheaddetail.unitCityName, dbo.qrypurchaseheaddetail.unitPinCode, dbo.qrypurchaseheaddetail.UnitGSTNo, dbo.qrypurchaseheaddetail.unitPan, dbo.qrypurchaseheaddetail.unitFSSAI, 
                         dbo.qrypurchaseheaddetail.unitTan
FROM            dbo.qrypurchaseheaddetail INNER JOIN
                         dbo.nt_1_companyparameters ON dbo.qrypurchaseheaddetail.Company_Code = dbo.nt_1_companyparameters.Company_Code AND 
                         dbo.qrypurchaseheaddetail.Year_Code = dbo.nt_1_companyparameters.Year_Code INNER JOIN
                         dbo.tblvoucherheadaddress ON dbo.qrypurchaseheaddetail.Company_Code = dbo.tblvoucherheadaddress.Company_Code LEFT OUTER JOIN
                         dbo.accountingyear ON dbo.qrypurchaseheaddetail.Company_Code = dbo.accountingyear.Company_Code AND dbo.qrypurchaseheaddetail.Year_Code = dbo.accountingyear.yearCode LEFT OUTER JOIN
                         dbo.company ON dbo.qrypurchaseheaddetail.Company_Code = dbo.company.Company_Code
                 where dbo.qrypurchaseheaddetail.Company_Code = :company_code and dbo.qrypurchaseheaddetail.Year_Code = :year_code and dbo.qrypurchaseheaddetail.doc_no = :doc_no
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code, "doc_no": doc_no})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]


        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500