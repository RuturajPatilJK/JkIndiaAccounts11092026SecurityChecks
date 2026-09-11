import traceback
import json
from flask import Flask, jsonify, request, copy_current_request_context
from app import app, db, socketio
from app.models.Transactions.OtherPurchaseModels import OtherPurchase
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
import requests
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getPurchaseAc,create_gledger_entry,send_gledger_entries, get_acShort_Name
from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry
import threading

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')


#Add GLedger Enteries
trans_typeNew  = "XP"
DRCRHead = "C"
DRCRDetail ="D"
ac_code=0
ordercode=0
new_doc_no=0
narration=''

def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid,ordercode,ca_narration=None):
    if amount > 0:
        entry = create_gledger_entry(data, amount, drcr, ac_code, accoid,ordercode,trans_typeNew,new_doc_no,narration)
        entry['CA_NARRATION'] = ca_narration
        entries.append(entry)

#Create GLedger Enteries
# def create_gledger_entries(headData, detailData, doc_no):
#     gledger_entries = []
    
#     IGSTAmount = float(headData.get('IGST_Amount', 0) or 0)
#     SGSTAmount = float(headData.get('SGST_Amount', 0) or 0)
#     CGSTAmount = float(headData.get('CGST_Amount', 0) or 0)
#     Other_Amount = float(headData.get('Other_Amount', 0) or 0)
#     TDS_Amt = float(headData.get('TDS', 0) or 0)
#     bill_amount = float(headData.get('Bill_Amount', 0) or 0)
#     ExpensisAmt = float(headData.get('ExpensisAmt', 0) or 0)
#     ProvisionAmt = float(headData.get('ProvisionAmt', 0) or 0)

#     company_parameters = fetch_company_parameters(headData.get('Company_Code'), headData.get('Year_Code'))
#     ordercode = 0

#     for amount, ac_code in [
#         (IGSTAmount, company_parameters.PurchaseIGSTAc),
#         (CGSTAmount, company_parameters.PurchaseCGSTAc),
#         (SGSTAmount, company_parameters.PurchaseSGSTAc),
#     ]:
#         if amount > 0:
#             ordercode += 1
#             accoid = get_accoid(ac_code, headData.get('Company_Code'))
#             add_gledger_entry(gledger_entries, headData, amount, DRCRDetail, ac_code, accoid, ordercode)

#     if bill_amount > 0:
#         add_gledger_entry(gledger_entries, headData, bill_amount,DRCRHead, headData['Supplier_Code'], get_accoid(headData['Supplier_Code'],headData['Company_Code']),ordercode)

#     if Other_Amount != 0:
#         if Other_Amount > 0:
#             ordercode += 1
#             ac_code = company_parameters.RoundOff
#             accoid = get_accoid(ac_code, headData['Company_Code'])
#             add_gledger_entry(gledger_entries, headData, Other_Amount, DRCRDetail, ac_code, accoid, ordercode)

#         else:
#             ordercode += 1
#             ac_code = company_parameters.RoundOff
#             accoid = get_accoid(ac_code, headData['Company_Code'])
#             add_gledger_entry(gledger_entries, headData, abs(Other_Amount), DRCRHead, ac_code, accoid, ordercode)

#     if headData['TDS_AcCode'] > 0:
#         if TDS_Amt > 0:
#             ordercode += 1
#             ac_code = headData['TDS_Cutt_AcCode']
#             accoid = get_accoid(ac_code, headData['Company_Code'])
#             add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRDetail, ac_code, accoid, ordercode)

#             ordercode += 1
#             ac_code = headData['TDS_AcCode']
#             accoid = get_accoid(ac_code, headData['Company_Code'])
#             add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRHead, ac_code, accoid, ordercode)

#     if ProvisionAmt > 0:
#         ordercode += 1
#         ac_code = headData['Provision_Ac']
#         accoid = get_accoid(ac_code, headData['Company_Code'])
#         add_gledger_entry(gledger_entries, headData, ProvisionAmt, DRCRDetail, ac_code, accoid, ordercode)

#     if ExpensisAmt > 0:
#         ordercode += 1
#         ac_code = headData['Exp_Ac']
#         accoid = get_accoid(ac_code, headData['Company_Code'])
#         add_gledger_entry(gledger_entries, headData, ExpensisAmt, DRCRDetail, ac_code, accoid, ordercode)
    
    
#     return gledger_entries




def create_gledger_entries(headData, detailData, doc_no):
    gledger_entries = []
    
    IGSTAmount = float(headData.get('IGST_Amount', 0) or 0)
    SGSTAmount = float(headData.get('SGST_Amount', 0) or 0)
    CGSTAmount = float(headData.get('CGST_Amount', 0) or 0)
    Other_Amount = float(headData.get('Other_Amount', 0) or 0)
    TDS_Amt = float(headData.get('TDS', 0) or 0)
    bill_amount = float(headData.get('Bill_Amount', 0) or 0)
    ExpensisAmt = float(headData.get('ExpensisAmt', 0) or 0)
    ProvisionAmt = float(headData.get('ProvisionAmt', 0) or 0)
    TDSAmount = float(headData.get('TDS_Amt', 0) or 0)

    tran_type = headData['tran_type']
    company_code = headData['Company_Code']

    company_parameters = fetch_company_parameters(headData.get('Company_Code'), headData.get('Year_Code'))
    ordercode = 0


    Ac_Code = headData['Supplier_Code']
    partyName = get_acShort_Name(Ac_Code, headData['Company_Code'])

    Provision_Ac = headData['Provision_Ac']
    provisionAcName = get_acShort_Name(Provision_Ac, headData['Company_Code'])

    Exp_Ac = headData['Exp_Ac']
    expAcName = get_acShort_Name(Exp_Ac, headData['Company_Code'])

    TDS_AcCode = headData['TDS_AcCode']
    tdsAcName = get_acShort_Name(TDS_AcCode, headData['Company_Code'])

    TDS_Cutt_AcCode = headData['TDS_Cutt_AcCode']
    tdsCutAcName = get_acShort_Name(TDS_Cutt_AcCode, headData['Company_Code'])

    if tran_type == 'OP':

        if bill_amount > 0:
            add_gledger_entry(gledger_entries, headData, bill_amount,DRCRHead, headData['Supplier_Code'], get_accoid(headData['Supplier_Code'],headData['Company_Code']),ordercode,expAcName)


        if ProvisionAmt > 0:
            ordercode += 1
            ac_code = headData['Provision_Ac']
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, ProvisionAmt, DRCRDetail, ac_code, accoid, ordercode,partyName)

        if ExpensisAmt > 0:
            ordercode += 1
            ac_code = headData['Exp_Ac']
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, ExpensisAmt, DRCRDetail, ac_code, accoid, ordercode,partyName)

        for amount, ac_code in [
            (IGSTAmount, company_parameters.PurchaseIGSTAc),
            (CGSTAmount, company_parameters.PurchaseCGSTAc),
            (SGSTAmount, company_parameters.PurchaseSGSTAc),
        ]:
            if amount > 0:
                ordercode += 1
                accoid = get_accoid(ac_code, headData.get('Company_Code'))
                add_gledger_entry(gledger_entries, headData, amount, DRCRDetail, ac_code, accoid, ordercode,partyName)

        if Other_Amount != 0:
            if Other_Amount > 0:
                ordercode += 1
                ac_code = company_parameters.RoundOff
                accoid = get_accoid(ac_code, headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, Other_Amount, DRCRDetail, ac_code, accoid, ordercode,partyName)

            else:
                ordercode += 1
                ac_code = company_parameters.RoundOff
                accoid = get_accoid(ac_code, headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, abs(Other_Amount), DRCRHead, ac_code, accoid, ordercode,partyName)

        if headData['TDS_AcCode'] > 0:
            if TDS_Amt > 0:
                ordercode += 1
                ac_code = headData['TDS_Cutt_AcCode']
                accoid = get_accoid(ac_code, headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRDetail, ac_code, accoid, ordercode,tdsAcName)

                ordercode += 1
                ac_code = headData['TDS_AcCode']
                accoid = get_accoid(ac_code, headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRHead, ac_code, accoid, ordercode,tdsCutAcName)

    else:
        def add_entry(amount, drcr, ac_code,ca_narration):
            nonlocal ordercode
            ordercode += 1
            accoid = get_accoid(ac_code, company_code)
            add_gledger_entry(gledger_entries, headData, amount, drcr, ac_code, accoid, ordercode,ca_narration)

        if tran_type == 'AD':
            if bill_amount > 0:
                add_entry(bill_amount, 'C', headData['Supplier_Code'],expAcName)
                add_entry(bill_amount, 'D', headData['Exp_Ac'],partyName)
            if TDS_Amt > 0:
                add_entry(TDS_Amt, 'D', headData['TDS_Cutt_AcCode'],tdsAcName)
                add_entry(TDS_Amt, 'C', headData['TDS_AcCode'],tdsCutAcName)

        elif tran_type in ['SM', 'PA']:
            if TDSAmount > 0:
                add_entry(TDSAmount, 'D', headData['TDS_Cutt_AcCode'],tdsAcName)
                add_entry(TDSAmount, 'C', headData['TDS_AcCode'],tdsCutAcName)

        elif tran_type in ['SA', 'PM']:
            if TDSAmount > 0:
                add_entry(TDSAmount, 'C', headData['TDS_Cutt_AcCode'],tdsAcName)
                add_entry(TDSAmount, 'D', headData['TDS_AcCode'],tdsCutAcName)

        elif tran_type == 'IP':
            if bill_amount > 0:
                add_entry(bill_amount, 'C', headData['Supplier_Code'],expAcName)
                add_entry(bill_amount, 'D', headData['Exp_Ac'],partyName)
            if TDS_Amt > 0:
                add_entry(TDS_Amt, 'D', headData['TDS_Cutt_AcCode'],tdsAcName)
                add_entry(TDS_Amt, 'C', headData['TDS_AcCode'],tdsCutAcName)

        elif tran_type == 'IR':
            if bill_amount > 0:
                add_entry(bill_amount, 'D', headData['Supplier_Code'],expAcName)
                add_entry(bill_amount, 'C', headData['Exp_Ac'],partyName)
            if TDS_Amt > 0:
                add_entry(TDS_Amt, 'C', headData['TDS_Cutt_AcCode'],tdsAcName)
                add_entry(TDS_Amt, 'D', headData['TDS_AcCode'],tdsCutAcName)
    
    return gledger_entries



TASK_DETAILS_QUERY = '''
SELECT        dbo.nt_1_gstratemaster.GST_Name, qrymsttdaccode.Ac_Name_E AS tdsacname, qrymsttdscutaccode.Ac_Name_E AS TDSCutAcName, qrymstexp.Ac_Name_E AS ExpAcName, qrymstsuppiler.Ac_Name_E AS SupplierName, 
                         ProvisionAc.Ac_Name_E AS provisionAcName, dbo.nt_1_systemmaster.System_Name_E AS groupName, dbo.TDS_Sections.Nature_of_Payment, dbo.nt_1_other_purchase.Section_Code,dbo.TDS_Sections.TDS_Section_Code
FROM            dbo.nt_1_other_purchase LEFT OUTER JOIN
                         dbo.nt_1_systemmaster ON dbo.nt_1_other_purchase.gcid = dbo.nt_1_systemmaster.systemid LEFT OUTER JOIN
                         dbo.TDS_Sections ON dbo.nt_1_other_purchase.Section_Id = dbo.TDS_Sections.id LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS ProvisionAc ON dbo.nt_1_other_purchase.pa = ProvisionAc.accoid LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_other_purchase.Company_Code = dbo.nt_1_gstratemaster.Company_Code AND dbo.nt_1_other_purchase.GST_RateCode = dbo.nt_1_gstratemaster.Doc_no LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymsttdaccode ON dbo.nt_1_other_purchase.tac = qrymsttdaccode.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymsttdscutaccode ON dbo.nt_1_other_purchase.tca = qrymsttdscutaccode.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstexp ON dbo.nt_1_other_purchase.ea = qrymstexp.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstsuppiler ON dbo.nt_1_other_purchase.sc = qrymstsuppiler.accoid
WHERE dbo.nt_1_other_purchase.opid=:opid
'''

# TASK_DETAILS_QUERY = '''
# SELECT        dbo.nt_1_gstratemaster.GST_Name, qrymsttdaccode.Ac_Name_E AS tdsacname, qrymsttdscutaccode.Ac_Name_E AS TDSCutAcName, qrymstexp.Ac_Name_E AS ExpAcName, qrymstsuppiler.Ac_Name_E AS SupplierName, 
#                          ProvisionAc.Ac_Name_E AS provisionAcName, dbo.nt_1_systemmaster.System_Name_E AS groupName, dbo.TDS_Sections.Nature_of_Payment, dbo.nt_1_other_purchase.Section_Code
# FROM            dbo.nt_1_other_purchase LEFT OUTER JOIN
#                          dbo.nt_1_systemmaster ON dbo.nt_1_other_purchase.gcid = dbo.nt_1_systemmaster.systemid LEFT OUTER JOIN
#                          dbo.TDS_Sections ON dbo.nt_1_other_purchase.Section_Id = dbo.TDS_Sections.id LEFT OUTER JOIN
#                          dbo.nt_1_accountmaster AS ProvisionAc ON dbo.nt_1_other_purchase.pa = ProvisionAc.accoid LEFT OUTER JOIN
#                          dbo.nt_1_gstratemaster ON dbo.nt_1_other_purchase.Company_Code = dbo.nt_1_gstratemaster.Company_Code AND dbo.nt_1_other_purchase.GST_RateCode = dbo.nt_1_gstratemaster.Doc_no LEFT OUTER JOIN
#                          dbo.qrymstaccountmaster AS qrymsttdaccode ON dbo.nt_1_other_purchase.tac = qrymsttdaccode.accoid LEFT OUTER JOIN
#                          dbo.qrymstaccountmaster AS qrymsttdscutaccode ON dbo.nt_1_other_purchase.tca = qrymsttdscutaccode.accoid LEFT OUTER JOIN
#                          dbo.qrymstaccountmaster AS qrymstexp ON dbo.nt_1_other_purchase.ea = qrymstexp.accoid LEFT OUTER JOIN
#                          dbo.qrymstaccountmaster AS qrymstsuppiler ON dbo.nt_1_other_purchase.sc = qrymstsuppiler.accoid
# WHERE dbo.nt_1_other_purchase.opid=:opid
# '''

def format_dates(task):
    return {
        "Doc_Date": task.Doc_Date.strftime('%Y-%m-%d') if task.Doc_Date else None,
    }

@app.route(API_URL + "/getall-OtherPurchase", methods=["GET"])
def get_OtherPurchase():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT        ISNULL(qrymstsuppiler.Ac_Name_E, dbo.nt_1_accountmaster.Ac_Name_E) AS SupplierName, dbo.nt_1_other_purchase.Doc_No, dbo.nt_1_other_purchase.Doc_Date, dbo.nt_1_other_purchase.Bill_Amount, 
                         dbo.nt_1_other_purchase.Narration, dbo.nt_1_other_purchase.opid
FROM            dbo.nt_1_other_purchase LEFT OUTER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_other_purchase.tca = dbo.nt_1_accountmaster.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstsuppiler ON dbo.nt_1_other_purchase.sc = qrymstsuppiler.accoid
                 				 where dbo.nt_1_other_purchase.Company_Code = :company_code and dbo.nt_1_other_purchase.Year_Code= :year_code
ORDER BY dbo.nt_1_other_purchase.Doc_No DESC
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'Doc_Date' in data:
                data['Doc_Date'] = data['Doc_Date'].strftime('%Y-%m-%d') if data['Doc_Date'] else None

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
@app.route(API_URL + "/get-next-doc-no-OtherPurchase", methods=["GET"])
def get_next_doc_no_OtherPurchase():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        try:
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or Year_Code parameter'}), 400

        max_doc_no = db.session.query(func.max(OtherPurchase.Doc_No)).filter_by(Company_Code=Company_Code, Year_Code=Year_Code).scalar()

        if max_doc_no is None:
            next_doc_no = 1
        else:
            next_doc_no = max_doc_no + 1

        return jsonify({"next_doc_no": next_doc_no}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/get-OtherPurchase-lastRecord", methods=["GET"])
def get_OtherPurchase_lastRecord():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_Record = OtherPurchase.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(OtherPurchase.Doc_No.desc()).first()

        if not last_Record:
            return jsonify({"error": "No record found for the provided Company_Code and Year_Code"}), 404

        last_Record_data = {column.name: getattr(last_Record, column.name) for column in last_Record.__table__.columns}
        last_Record_data.update(format_dates(last_Record))

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": last_Record.opid})
        additional_data_row = additional_data.fetchone()

        labels = dict(additional_data_row._mapping) if additional_data_row else {}

        response = {
            "last_OtherPurchase_data": last_Record_data,
            "labels": labels
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/get-OtherPurchaseSelectedRecord", methods=["GET"])
def get_OtherPurchaseSelectedRecord():
    try:
        Doc_No = request.args.get('Doc_No')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Doc_No, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        try:
            Doc_No = int(Doc_No)
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({"error": "Invalid Doc_No, Company_Code, or Year_Code parameter"}), 400

        Record = OtherPurchase.query.filter_by(Doc_No=Doc_No, Company_Code=Company_Code, Year_Code=Year_Code).first()

        if not Record:
            return jsonify({"error": "Selected Record not found"}), 404

        Record_data = {column.name: getattr(Record, column.name) for column in Record.__table__.columns}
        Record_data.update(format_dates(Record))

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": Record.opid})
        additional_data_row = additional_data.fetchone()

        labels = dict(additional_data_row._mapping) if additional_data_row else {}

        response = {
            "selected_Record_data": Record_data,
            "labels": labels
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/create-Record-OtherPurchase", methods=["POST"])
def create_OtherPurchase():
    try:
        Company_Code = request.json.get('Company_Code')
        Year_Code = request.json.get('Year_Code')
        
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing Company_Code or Year_Code parameter"}), 400

        try:
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({"error": "Invalid Company_Code or Year_Code parameter"}), 400

        max_doc_no = db.session.query(func.max(OtherPurchase.Doc_No)).filter_by(Company_Code=Company_Code, Year_Code=Year_Code).scalar() or 0

        new_record_data = request.json
        new_record_data['Doc_No'] = max_doc_no + 1
        new_record_data['Company_Code'] = Company_Code
        new_record_data['Year_Code'] = Year_Code

        new_record = OtherPurchase(**new_record_data)
        db.session.add(new_record)
        db.session.commit()

        socketio.emit('other_purchase_added', json.loads(json.dumps(new_record_data, default=str)))

        gledger_entries = create_gledger_entries(new_record_data, '', new_record.Doc_No)

        @copy_current_request_context
        def async_send_gledger():
            try:
                send_gledger_entries(new_record_data, gledger_entries,trans_typeNew)
            except Exception as e:
                print(f"[Async Gledger Error] {e}")

        threading.Thread(target=async_send_gledger).start()

        # response = send_gledger_entries(new_record_data, gledger_entries,trans_typeNew)

        # if response.status_code != 201:
        #     db.session.rollback()
            
        #     return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Record created successfully",
            "record": new_record_data
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# @app.route(API_URL + "/update-OtherPurchase", methods=["PUT"])
# def update_OtherPurchase():
#     try:
#         Company_Code = request.json.get('Company_Code')
#         Doc_No = request.json.get('Doc_No')
#         Year_Code = request.json.get('Year_Code')
        
#         if not all([Company_Code, Doc_No, Year_Code]):
#             return jsonify({"error": "Missing Company_Code, Doc_No, or Year_Code parameter"}), 400

#         try:
#             Company_Code = int(Company_Code)
#             Doc_No = int(Doc_No)
#             Year_Code = int(Year_Code)
#         except ValueError:
#             return jsonify({"error": "Invalid Company_Code, Doc_No, or Year_Code parameter"}), 400

#         existing_record = OtherPurchase.query.filter_by(Doc_No=Doc_No, Company_Code=Company_Code, Year_Code=Year_Code).first()
#         if not existing_record:
#             return jsonify({"error": "Record not found"}), 404

#         update_data = request.json
#         for key, value in update_data.items():
#             setattr(existing_record, key, value)

#         db.session.commit()

#         gledger_entries = create_gledger_entries(update_data, '', Doc_No)

#         response = send_gledger_entries(update_data, gledger_entries,trans_typeNew)

#         if response.status_code != 201:
#             db.session.rollback()
            
#             return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

#         return jsonify({
#             "message": "Record updated successfully",
#             "record": update_data
#         }), 200
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": str(e)}), 500


#Update Other Purchase Record along with GLedger Entries and Company Logs
@app.route(API_URL + "/update-OtherPurchase", methods=["PUT"])
def update_OtherPurchase():
    try:
        Company_Code = request.json.get('Company_Code')
        Doc_No = request.json.get('Doc_No')
        Year_Code = request.json.get('Year_Code')
        User_Id = request.json.get('User_Id',0)
        tran_type = "XP"

        if not all([Company_Code, Doc_No, Year_Code]):
            return jsonify({"error": "Missing Required Paramters.!"}), 400

        try:
            Company_Code = int(Company_Code)
            Doc_No = int(Doc_No)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({"error": "Invalid Company_Code, Doc_No, or Year_Code parameter"}), 400

        existing_record = OtherPurchase.query.filter_by(Doc_No=Doc_No, Company_Code=Company_Code, Year_Code=Year_Code).first()
        if not existing_record:
            return jsonify({"error": "Record not found"}), 404

        update_data = request.json

        if 'User_Id' in update_data:
            del update_data['User_Id']

        doc_date = existing_record.Doc_Date

        old_Supplier_Code = existing_record.Supplier_Code
        old_Bill_Amount = existing_record.Bill_Amount
        old_expenses_account = existing_record.Exp_Ac
        old_Narration = existing_record.Narration

        for key, value in update_data.items():
            setattr(existing_record, key, value)

        supplier_code_changed = old_Supplier_Code != update_data.get("Supplier_Code", old_Supplier_Code)
        expenses_accountcode_changed = old_expenses_account != update_data.get("Exp_Ac", old_expenses_account)
        Bill_Amount_changed = round(float(old_Bill_Amount), 2) != round(float(update_data.get("Bill_Amount", old_Bill_Amount)), 2)

        if supplier_code_changed or Bill_Amount_changed or expenses_accountcode_changed:
            if supplier_code_changed:
                create_company_log_entry(
                    db=db,
                    ac_code=old_Supplier_Code,
                    value=old_Bill_Amount,
                    doc_no=Doc_No,
                    doc_date=doc_date,
                    company_code=Company_Code,
                    year_code=Year_Code,
                    record_type='O',
                    record_no=Doc_No,
                    user_id=User_Id,
                    tran_type=tran_type,
                    bank_ac=0,
                    created_by=update_data.get('Created_By'),
                    modified_by=update_data.get('Modified_By'),
                    narration=old_Narration
                )

            if expenses_accountcode_changed:
                create_company_log_entry(
                    db=db,
                    ac_code=old_expenses_account,
                    value=old_Bill_Amount,
                    doc_no=Doc_No,
                    doc_date=doc_date,
                    company_code=Company_Code,
                    year_code=Year_Code,
                    record_type='O',
                    record_no=Doc_No,
                    user_id=User_Id,
                    tran_type=tran_type,
                    bank_ac=0,
                    created_by=update_data.get('Created_By'),
                    modified_by=update_data.get('Modified_By'),
                    narration=old_Narration
                )

            if supplier_code_changed:
                create_company_log_entry(
                    db=db,
                    ac_code=update_data.get("Supplier_Code"),
                    value=update_data.get("Bill_Amount"),
                    doc_no=Doc_No,
                    doc_date=update_data.get("Doc_Date"),
                    company_code=Company_Code,
                    year_code=Year_Code,
                    record_type='N',
                    record_no=Doc_No,
                    user_id=User_Id,
                    tran_type=tran_type,
                    bank_ac=0,
                    created_by=update_data.get('Created_By'),
                    modified_by=update_data.get('Modified_By'),
                    narration=update_data.get("Narration")
                )

            if expenses_accountcode_changed:
                create_company_log_entry(
                    db=db,
                    ac_code=update_data.get("Exp_Ac"),
                    value=update_data.get("Bill_Amount"),
                    doc_no=Doc_No,
                    doc_date=update_data.get("Doc_Date"),
                    company_code=Company_Code,
                    year_code=Year_Code,
                    record_type='N',
                    record_no=Doc_No,
                    user_id=User_Id,
                    tran_type=tran_type,
                    bank_ac=0,
                    created_by=update_data.get('Created_By'),
                    modified_by=update_data.get('Modified_By'),
                    narration=update_data.get("Narration")
                )
     
        db.session.commit()

        socketio.emit('other_purchase_updated', json.loads(json.dumps(update_data, default=str)))

        gledger_entries = create_gledger_entries(update_data, '', Doc_No)
        response = send_gledger_entries(update_data, gledger_entries, tran_type)

        if response.status_code != 201:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Record updated successfully",
            "record": update_data
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# @app.route(API_URL + "/delete-OtherPurchase", methods=["DELETE"])
# def delete_OtherPurchase():
#     try:
#         Doc_No = request.args.get('Doc_No')
#         Company_Code = request.args.get('Company_Code')
#         Year_Code = request.args.get('Year_Code')

#         if not all([Doc_No, Company_Code, Year_Code]):
#             return jsonify({"error": "Missing Doc_No, Company_Code, or Year_Code parameter"}), 400

#         try:
#             Doc_No = int(Doc_No)
#             Company_Code = int(Company_Code)
#             Year_Code = int(Year_Code)
#         except ValueError:
#             return jsonify({"error": "Invalid Doc_No, Company_Code, or Year_Code parameter"}), 400

#         existing_record = OtherPurchase.query.filter_by(Doc_No=Doc_No, Company_Code=Company_Code, Year_Code=Year_Code).first()
#         print("existing_record",existing_record)
#         if not existing_record:
#             return jsonify({"error": "Record not found"}), 404

#         db.session.delete(existing_record)
#         if existing_record:
#                 query_params = {
#                     'Company_Code': Company_Code,
#                     'DOC_NO': Doc_No,
#                     'Year_Code': Year_Code,
#                     'TRAN_TYPE': "XP",
#             }

#         response = requests.delete(API_URL_SERVER+"/delete-Record-gLedger", params=query_params)
            
#         if response.status_code != 200:
#             raise Exception("Failed to create record in gLedger")
        
#         db.session.commit()


#         return jsonify({"message": "Record deleted successfully"}), 200
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": str(e)}), 500

#Delte Other Purchase Record along with GLedger Entries and Company Logs
@app.route(API_URL + "/delete-OtherPurchase", methods=["DELETE"])
def delete_OtherPurchase():
    try:
        Doc_No = request.args.get('Doc_No')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        User_Id = request.args.get('User_Id', 0) 
        tran_type = "XP"

        if not all([Doc_No, Company_Code, Year_Code]):
            return jsonify({"error": "Missing Doc_No, Company_Code, or Year_Code parameter"}), 400

        try:
            Doc_No = int(Doc_No)
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({"error": "Invalid Doc_No, Company_Code, or Year_Code parameter"}), 400

        existing_record = OtherPurchase.query.filter_by(Doc_No=Doc_No, Company_Code=Company_Code, Year_Code=Year_Code).first()
        if not existing_record:
            return jsonify({"error": "Record not found"}), 404

        old_Supplier_Code = existing_record.Supplier_Code
        old_Bill_Amount = existing_record.Bill_Amount
        old_Narration = existing_record.Narration
        doc_date = existing_record.Doc_Date
        created_by = getattr(existing_record, 'Created_By', None)
        modified_by = getattr(existing_record, 'Modified_By', None)

        if old_Supplier_Code:
            create_company_log_entry(
                db=db,
                ac_code=old_Supplier_Code,
                value=old_Bill_Amount,
                doc_no=Doc_No,
                doc_date=doc_date,
                company_code=Company_Code,
                year_code=Year_Code,
                record_type='D',
                record_no=Doc_No,
                user_id=User_Id,
                tran_type=tran_type,
                bank_ac=0,
                created_by=created_by,
                modified_by=modified_by,
                narration=old_Narration
            )

        db.session.delete(existing_record)

        query_params = {
            'Company_Code': Company_Code,
            'DOC_NO': Doc_No,
            'Year_Code': Year_Code,
            'TRAN_TYPE': "XP",
        }

        response = requests.delete(API_URL_SERVER + "/delete-Record-gLedger", params=query_params, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})
        if response.status_code != 200:
            raise Exception("Failed to delete record from gLedger")

        db.session.commit()

        socketio.emit('other_purchase_deleted', {
            'Doc_No': Doc_No,
            'Company_Code': Company_Code,
            'Year_Code': Year_Code
        })

        return jsonify({"message": "Record deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route(API_URL + "/get-first-OtherPurchase", methods=["GET"])
def get_first_OtherPurchase():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        first_Record = OtherPurchase.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(OtherPurchase.Doc_No.asc()).first()
        
        if not first_Record:
            return jsonify({"error": "No records found for the provided Company_Code and Year_Code"}), 404

        first_Record_data = {column.name: getattr(first_Record, column.name) for column in first_Record.__table__.columns}
        first_Record_data.update(format_dates(first_Record))

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": first_Record.opid})
        additional_data_row = additional_data.fetchone()

        labels = dict(additional_data_row._mapping) if additional_data_row else {}

        response = {
            "first_OtherPurchase_data": first_Record_data,
            "labels": labels
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500



@app.route(API_URL + "/get-previous-OtherPurchase", methods=["GET"])
def get_previous_OtherPurchase():
    try:
        Doc_No = request.args.get('Doc_No')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Doc_No, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        try:
            Doc_No = int(Doc_No)
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({"error": "Invalid Doc_No, Company_Code, or Year_Code parameter"}), 400

        previous_Record = OtherPurchase.query.filter(
            OtherPurchase.Doc_No < Doc_No,
            OtherPurchase.Company_Code == Company_Code,
            OtherPurchase.Year_Code == Year_Code
        ).order_by(OtherPurchase.Doc_No.desc()).first()

        if not previous_Record:
            return jsonify({"error": "No previous record found"}), 404

        previous_Record_data = {column.name: getattr(previous_Record, column.name) for column in previous_Record.__table__.columns}
        previous_Record_data.update(format_dates(previous_Record))

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": previous_Record.opid})
        additional_data_row = additional_data.fetchone()

        labels = dict(additional_data_row._mapping) if additional_data_row else {}

        response = {
            "previous_OtherPurchase_data": previous_Record_data,
            "labels": labels
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/get-next-OtherPurchase", methods=["GET"])
def get_next_OtherPurchase():
    try:
        Doc_No = request.args.get('Doc_No')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Doc_No, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        try:
            Doc_No = int(Doc_No)
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({"error": "Invalid Doc_No, Company_Code, or Year_Code parameter"}), 400

        next_Record = OtherPurchase.query.filter(
            OtherPurchase.Doc_No > Doc_No,
            OtherPurchase.Company_Code == Company_Code,
            OtherPurchase.Year_Code == Year_Code
        ).order_by(OtherPurchase.Doc_No.asc()).first()

        if not next_Record:
            return jsonify({"error": "No next record found"}), 404

        next_Record_data = {column.name: getattr(next_Record, column.name) for column in next_Record.__table__.columns}
        next_Record_data.update(format_dates(next_Record))

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": next_Record.opid})
        additional_data_row = additional_data.fetchone()

        labels = dict(additional_data_row._mapping) if additional_data_row else {}

        response = {
            "next_OtherPurchase_data": next_Record_data,
            "labels": labels
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    


@app.route(API_URL + "/getOtherReport", methods=["GET"])
def getOtherReport():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get("Year_Code")
        Doc_No = request.args.get('Doc_No')

        if not Company_Code or not Doc_No or not Year_Code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' or 'Doc_No' parameter"}), 400

        query = ('''SELECT DISTINCT 
                         nt_1_accountmaster_3.Ac_Code AS SupplierAcCode, nt_1_accountmaster_3.Ac_Name_E AS SupplierName, nt_1_accountmaster_1.Ac_Code AS ExpenseCode, nt_1_accountmaster_1.Ac_Name_E AS ExpenseName, 
                         nt_1_accountmaster_2.Ac_Code AS ProvisionAc, nt_1_accountmaster_2.Ac_Name_E AS ProvisionName, dbo.nt_1_systemmaster.System_Code, dbo.nt_1_systemmaster.System_Name_E, dbo.nt_1_systemmaster.systemid, 
                         dbo.nt_1_gstratemaster.GST_Name, dbo.nt_1_gstratemaster.Rate, dbo.nt_1_other_purchase.GST_RateCode, dbo.nt_1_other_purchase.Doc_No, dbo.nt_1_other_purchase.Doc_Date, CONVERT(varchar,dbo.nt_1_other_purchase.Doc_Date, 103) as docDateCoverted,
                         dbo.nt_1_other_purchase.CGST_Rate, dbo.nt_1_other_purchase.CGST_Amount, dbo.nt_1_other_purchase.SGST_Rate, dbo.nt_1_other_purchase.SGST_Amount, dbo.nt_1_other_purchase.IGST_Rate, 
                         dbo.nt_1_other_purchase.IGST_Amount, dbo.nt_1_other_purchase.Bill_Amount, dbo.nt_1_other_purchase.TDS_Amt, dbo.nt_1_other_purchase.TDS, dbo.nt_1_other_purchase.tran_type, 
                         dbo.nt_1_other_purchase.Taxable_Amount, dbo.nt_1_other_purchase.Narration, dbo.nt_1_other_purchase.einvoiceno, dbo.nt_1_other_purchase.ASN_No, dbo.nt_1_other_purchase.billno, dbo.tblvoucherheadaddress.AL1, 
                         dbo.tblvoucherheadaddress.AL2, dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other, dbo.tblvoucherheadaddress.BillFooter, dbo.company.Company_Name_E, 
                         nt_1_accountmaster_TDSCutAc.Ac_Code AS TDSCutAcCode, nt_1_accountmaster_TDSCutAc.Ac_Name_E AS TDSCutAcName, nt_1_accountmaster_TDSAc.Ac_Code AS TDSAcCode, 
                         nt_1_accountmaster_TDSAc.Ac_Name_E AS TDSAcName, dbo.TDS_Sections.Nature_of_Payment, dbo.TDS_Sections.Section, dbo.nt_1_other_purchase.Doc_Date AS OtherPurchaseDocDate, 
                         dbo.nt_1_other_purchase.Supplier_Code, dbo.nt_1_other_purchase.Exp_Ac, dbo.nt_1_other_purchase.Other_Amount, dbo.nt_1_other_purchase.TDS_Per, dbo.nt_1_other_purchase.TDS_Cutt_AcCode, 
                         dbo.nt_1_other_purchase.TDS_AcCode, dbo.nt_1_other_purchase.Group_Code, dbo.nt_1_other_purchase.ProvisionAmt, dbo.nt_1_other_purchase.ExpensisAmt, dbo.nt_1_other_purchase.Provision_Ac, 
                         dbo.nt_1_other_purchase.LockedRecord, dbo.nt_1_other_purchase.LockedUser, dbo.nt_1_other_purchase.Section_Code, dbo.company.TIN, dbo.company.FSSAI_No, dbo.company.Pan_No, dbo.company.GST
FROM            dbo.nt_1_other_purchase LEFT OUTER JOIN
                         dbo.TDS_Sections ON dbo.nt_1_other_purchase.Section_Id = dbo.TDS_Sections.id LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_TDSAc ON dbo.nt_1_other_purchase.Company_Code = nt_1_accountmaster_TDSAc.company_code AND 
                         dbo.nt_1_other_purchase.tac = nt_1_accountmaster_TDSAc.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_TDSCutAc ON dbo.nt_1_other_purchase.Company_Code = nt_1_accountmaster_TDSCutAc.company_code AND 
                         dbo.nt_1_other_purchase.tca = nt_1_accountmaster_TDSCutAc.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS TDSCutName ON dbo.nt_1_other_purchase.tca = TDSCutName.accoid LEFT OUTER JOIN
                         dbo.tblvoucherheadaddress ON dbo.nt_1_other_purchase.Company_Code = dbo.tblvoucherheadaddress.Company_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_1 ON dbo.nt_1_other_purchase.ea = nt_1_accountmaster_1.accoid LEFT OUTER JOIN
                         dbo.company ON dbo.nt_1_other_purchase.Company_Code = dbo.company.Company_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_3 ON dbo.nt_1_other_purchase.sc = nt_1_accountmaster_3.accoid LEFT OUTER JOIN
                         dbo.nt_1_systemmaster ON dbo.nt_1_other_purchase.gcid = dbo.nt_1_systemmaster.systemid LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_other_purchase.GST_RateCode = dbo.nt_1_gstratemaster.Doc_no AND dbo.nt_1_other_purchase.Company_Code = dbo.nt_1_gstratemaster.Company_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_2 ON dbo.nt_1_other_purchase.pa = nt_1_accountmaster_2.accoid
                 where dbo.nt_1_other_purchase.Company_Code=:Company_Code and  dbo.nt_1_other_purchase.Year_Code =:Year_Code and dbo.nt_1_other_purchase.Doc_No =:Doc_No
                                 '''
            )
        additional_data = db.session.execute(text(query), {"Company_Code": Company_Code,"Year_Code":Year_Code,"Doc_No": Doc_No})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        tran_type_labels = {
            "OP": "Other Purchase",
            "AD": "Advances",
            "SA": "Sale TDS Receivable",
            "SM": "Sale TDS Deduction",
            "PA": "Purchase TDS Payable",
            "PM": "Purchase TDS Deduction",
            "IP": "Interest Paid",
            "IR": "Interest Received",
        }

        for data in all_data:
            for tran_type in data:
                data['tran_type'] = tran_type_labels.get(data['tran_type'], data['tran_type'])

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

