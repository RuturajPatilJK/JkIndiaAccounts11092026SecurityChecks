from flask import Flask, jsonify, request
from app import app, db
from app.models.Transactions.DebitCreditNote.DebitCreditNoteModels import DebitCreditNoteHead, DebitCreditNoteDetail 
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
import requests
from datetime import datetime
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,get_ac_Name, get_acShort_Name
from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry

# Get the base URL from environment variables
API_URL= os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')

# Import schemas from the schemas module
from app.models.Transactions.DebitCreditNote.DebitCreditNoteSchema import DebitCreditNoteHeadSchema, DebitCreditNoteDetailSchema

# Global SQL Query
TASK_DETAILS_QUERY = '''
SELECT        dbo.debitnotehead.dcid, dbo.debitnotehead.ac_code, dbo.debitnotehead.gst_code, dbo.nt_1_gstratemaster.GST_Name, dbo.nt_1_systemmaster.System_Name_E, BillFrom.Ac_Name_E AS BillFromName, 
                         BillTo.Ac_Name_E AS BillToName, Mill.Ac_Name_E AS MillName, ShipTotbl.Ac_Name_E AS ShipToName, dbo.qrydebitnotedetail.expac_code, dbo.qrydebitnotedetail.value, dbo.qrydebitnotedetail.expac, 
                         dbo.qrydebitnotedetail.detail_Id, dbo.qrydebitnotedetail.expacaccountname, dbo.qrydebitnotedetail.Item_Code, dbo.qrydebitnotedetail.Quantal, dbo.qrydebitnotedetail.Item_Name, dbo.qrydebitnotedetail.HSN, 
                         dbo.qrydebitnotedetail.dcdetailid, dbo.debitnotehead.Unit_Code, Unit.Ac_Name_E AS UnitAcName, dbo.debitnotehead.tran_type
FROM            dbo.nt_1_gstratemaster RIGHT OUTER JOIN
                         dbo.nt_1_accountmaster AS Unit RIGHT OUTER JOIN
                         dbo.debitnotehead ON Unit.accoid = dbo.debitnotehead.uc ON dbo.nt_1_gstratemaster.Company_Code = dbo.debitnotehead.Company_Code AND dbo.nt_1_gstratemaster.Doc_no = dbo.debitnotehead.gst_code LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS ShipTotbl ON dbo.debitnotehead.uc = ShipTotbl.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS Mill ON dbo.debitnotehead.mc = Mill.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS BillTo ON dbo.debitnotehead.st = BillTo.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS BillFrom ON dbo.debitnotehead.ac = BillFrom.accoid LEFT OUTER JOIN
                         dbo.nt_1_systemmaster RIGHT OUTER JOIN
                         dbo.qrydebitnotedetail ON dbo.nt_1_systemmaster.systemid = dbo.qrydebitnotedetail.ic ON dbo.debitnotehead.dcid = dbo.qrydebitnotedetail.dcid
				  where dbo.debitnotehead.dcid =:dcid
'''

#Format Dates
def format_dates(task):
    return {
        "bill_date": task.bill_date.strftime('%Y-%m-%d') if task.bill_date else None,
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
    }

#GET Max Doc Number from the databse.
def get_max_doc_no(tran_type, company_code, year_code):
        return db.session.query(func.max(DebitCreditNoteHead.doc_no)).filter(
        DebitCreditNoteHead.tran_type == tran_type,
        DebitCreditNoteHead.Company_Code == company_code,
        DebitCreditNoteHead.Year_Code == year_code
    ).scalar() or 0

# Define schemas
task_head_schema = DebitCreditNoteHeadSchema()
task_head_schemas = DebitCreditNoteHeadSchema(many=True)

task_detail_schema = DebitCreditNoteDetailSchema()
task_detail_schemas = DebitCreditNoteDetailSchema(many=True)


#Genrate the narration for the sale bill
def generate_narration(headData, accode,detailData):

    if headData.get('tran_type') in ["DS", "DN"]:
        GeneralNarrationForCA = (
            f"Debit Note {headData['doc_no']}"+ " " 
            f"{get_acShort_Name(headData.get('ac_code', ''), headData['Company_Code'])}"
           
        )

        TDSNarrationPartyForCA = (
            f"Debit Note {headData['doc_no']}"+ " " 
            f"{get_acShort_Name(headData.get('ac_code', ''), headData['Company_Code'])} "
           
        )

        TDSNarrationTDSAcForCA = (
            f"TDS Debit Note {headData['doc_no']}"
        )

        GeneralNarrationForParty_CA = (
            f"Debit Note {headData['doc_no']}"
        )

    elif headData.get('tran_type') in ["CS", "CN"]:
        GeneralNarrationForCA = (
            f"Credit Note {headData['doc_no']}"+ " "
            f"{get_acShort_Name(headData.get('ac_code', ''), headData['Company_Code'])}" 
            
        )

        TDSNarrationPartyForCA = (
            f"Credit Note {headData['doc_no']}"+ " " 
            f"{get_acShort_Name(headData.get('ac_code', ''), headData['Company_Code'])} "
            
        )

        TDSNarrationTDSAcForCA = (
            f"TDS Credit Note {headData['doc_no']}"
        )

        GeneralNarrationForParty_CA = (
            f"Credit Note {headData['doc_no']}"
        )


    return GeneralNarrationForCA, TDSNarrationPartyForCA, TDSNarrationTDSAcForCA, GeneralNarrationForParty_CA

#GET all data from the database 
@app.route(API_URL + "/getdata-debitcreditNote", methods=["GET"])
def getdata_debitcreditNote():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT        dbo.debitnotehead.tran_type, dbo.debitnotehead.doc_no, dbo.debitnotehead.doc_date, dbo.debitnotehead.bill_id, dbo.debitnotehead.bill_amount, dbo.debitnotehead.dcid, dbo.debitnotehead.ackno, 
                         AccountName.Ac_Name_E AS AccountName, ShipTo.Ac_Name_E AS ShipTo
FROM            dbo.nt_1_accountmaster AS ShipTo RIGHT OUTER JOIN
                         dbo.debitnotehead ON ShipTo.company_code = dbo.debitnotehead.Company_Code AND ShipTo.Ac_Code = dbo.debitnotehead.Shit_To LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS AccountName ON dbo.debitnotehead.Company_Code = AccountName.company_code AND dbo.debitnotehead.ac_code = AccountName.Ac_Code AND 
                         dbo.debitnotehead.ac = AccountName.accoid
                 where dbo.debitnotehead.Company_Code = :company_code and dbo.debitnotehead.Year_Code = :year_code
            order by dbo.debitnotehead.doc_no desc
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code})

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
    

@app.route(API_URL + "/getNextdocnodebitcreditnote", methods=["GET"])
def getNextdocnodebitcreditnote():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')

        if not all([Company_Code, Year_Code, tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400

        try:
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
            tran_type = str(tran_type)
        except ValueError:
            return jsonify({'error': 'Missing Required Parameters.!'}), 400

        max_doc_no = db.session.query(func.max(DebitCreditNoteHead.doc_no)).filter_by(Company_Code=Company_Code, Year_Code=Year_Code,tran_type=tran_type).scalar()

        if max_doc_no is None:
            next_doc_no = 1
        else:
            next_doc_no = max_doc_no + 1

        return jsonify({"next_doc_no": next_doc_no}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
   
# GET the data By the Particular doc_no AND tran_type
@app.route(API_URL+"/getdebitcreditByid", methods=["GET"])
def getdebitcreditByid():
    try:
        doc_no = request.args.get('doc_no')
        tran_type = request.args.get('tran_type')

        if not doc_no:
            return jsonify({"error": "Document number not provided"}), 400
    
        if not tran_type:
            return jsonify({"error": "Transaction Type not provided"}), 400
        
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code Or Year_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
            year_code = int(Year_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        task_head = DebitCreditNoteHead.query.filter_by(doc_no=doc_no, tran_type=tran_type,Company_Code=Company_Code,Year_Code=year_code).first()

        newtaskid = task_head.dcid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"dcid": newtaskid})

        additional_data_rows = additional_data.fetchall()
      
        row = additional_data_rows[0] if additional_data_rows else None
        category = row.BillToName if row else None
    
        last_head_data = {column.name: getattr(task_head, column.name) for column in task_head.__table__.columns}
        last_head_data.update(format_dates(task_head))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#Insert Record and Gldger Effects of DebitcreditNote and DebitcreditNoteDetail
@app.route(API_URL + "/insert-debitcreditnote", methods=["POST"])
def insert_debitcreditnote():
    def create_gledger_entry(data, amount, drcr, ac_code, accoid, narration,ordercode,ca_narration):
        return {
            "TRAN_TYPE": bill_type,
            "DOC_NO": new_doc_no,
            "DOC_DATE": data['doc_date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['Company_Code'],
            "YEAR_CODE": data['Year_Code'],
            "ORDER_CODE": ordercode,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": narration,
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": bill_type,
            "SORT_NO": new_doc_no,
            "vc": 0,
            "progid": 0,
            "tranid": 0,
            "saleid": 0,
            "ac": accoid,
            "CA_NARRATION":ca_narration
        }

    def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid, narration,ordercode,ca_narration=None):
        if amount > 0:
            entry = create_gledger_entry(data, amount, drcr, ac_code, accoid,narration,ordercode,ca_narration)
            entry['CA_NARRATION'] = ca_narration
            entries.append(entry)
            
    try:
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']

        tran_type = headData.get('tran_type')
        company_code = headData.get('Company_Code')
        year_code = headData.get('Year_Code')
        bill_type = headData.get('bill_type')
      
        max_doc_no = get_max_doc_no(tran_type,company_code,year_code)
        new_doc_no = max_doc_no + 1
        headData['doc_no'] = new_doc_no
       
        new_head = DebitCreditNoteHead(**headData)
        db.session.add(new_head)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        for item in detailData:
            item['doc_no'] = new_doc_no
            item['dcid'] = new_head.dcid

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    new_detail = DebitCreditNoteDetail(**item)
                    new_head.details.append(new_detail)
                    createdDetails.append(new_detail)

                elif item['rowaction'] == "update":
                    dcdetailid = item['dcdetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('dcdetailid', 'rowaction', 'dcid')}
                    db.session.query(DebitCreditNoteDetail).filter(DebitCreditNoteDetail.dcdetailid == dcdetailid).update(update_values)
                    updatedDetails.append(dcdetailid)

                elif item['rowaction'] == "delete":
                    dcdetailid = item['dcdetailid']
                    detail_to_delete = db.session.query(DebitCreditNoteDetail).filter(DebitCreditNoteDetail.dcdetailid == dcdetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(dcdetailid)

        db.session.commit()

        igst_amount = float(headData.get('igst_amount', 0) or 0)
        bill_amount = float(headData.get('bill_amount', 0) or 0)
        sgst_amount = float(headData.get('sgst_amount', 0) or 0)
        cgst_amount = float(headData.get('cgst_amount', 0) or 0)
        TCS_Amt = float(headData.get('TCS_Amt', 0) or 0)
        TDS_Amt = float(headData.get('TDS_Amt', 0) or 0)
        misc_amount = float(headData.get('misc_amount', 0) or 0)

        ordercode = 0


        GeneralNarrationForCA, TDSNarrationPartyForCA, TDSNarrationTDSAcForCA, GeneralNarrationForParty_CA= generate_narration(headData,headData['ac_code'],detailData)


        if tran_type in ["DN", "DS"]:
            DRCR_detail = "C"
            DRCR_head = "D"
        elif tran_type in ["CN", "CS"]:
            DRCR_detail = "D"
            DRCR_head = "C"

        company_parameters = fetch_company_parameters(headData['Company_Code'], headData['Year_Code'])

        gledger_entries = []

        if bill_amount > 0:
            if tran_type in ["DN","DS"]:
                ordercode +=1
                add_gledger_entry(gledger_entries, headData, bill_amount, "D", headData['ac_code'], get_accoid(headData['ac_code'],headData['Company_Code']),headData["Narration"],ordercode,GeneralNarrationForParty_CA)
            else:
                ordercode +=1
                add_gledger_entry(gledger_entries, headData, bill_amount, "C", headData['ac_code'], get_accoid(headData['ac_code'],headData['Company_Code']),headData["Narration"],ordercode,GeneralNarrationForParty_CA)

        if igst_amount > 0:
            if tran_type in ["DN"]:
                ordercode +=1
                ac_code = company_parameters.IGSTAc
                accoid = get_accoid(company_parameters.IGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, igst_amount, "C", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["DS"]:
                ordercode +=1
                ac_code = company_parameters.PurchaseIGSTAc
                accoid = get_accoid(company_parameters.PurchaseIGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, igst_amount, "C", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["CN"]:
                ordercode +=1
                ac_code = company_parameters.IGSTAc
                accoid = get_accoid(company_parameters.IGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, igst_amount, "D", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["CS"]:
                ordercode +=1
                ac_code = company_parameters.PurchaseIGSTAc
                accoid = get_accoid(company_parameters.PurchaseIGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, igst_amount, "D", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)


        if cgst_amount > 0:
            if tran_type in ["DN"]:
                ordercode +=1
                ac_code = company_parameters.CGSTAc
                accoid = get_accoid(company_parameters.CGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, cgst_amount, "C", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)
            if tran_type in ["DS"]:
                ordercode +=1
                ac_code = company_parameters.PurchaseCGSTAc
                accoid = get_accoid(company_parameters.PurchaseCGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, cgst_amount, "C", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["CN"]:
                ordercode +=1
                ac_code = company_parameters.CGSTAc
                accoid = get_accoid(company_parameters.CGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, cgst_amount, "D", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["CS"]:
                ordercode +=1
                ac_code = company_parameters.PurchaseCGSTAc
                accoid = get_accoid(company_parameters.PurchaseCGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, cgst_amount, "D", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

        if sgst_amount > 0:
            if tran_type in ["DN"]:
                ordercode +=1
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(company_parameters.SGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, sgst_amount, "C", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["DS"]:
                ordercode +=1
                ac_code = company_parameters.PurchaseSGSTAc
                accoid = get_accoid(company_parameters.PurchaseSGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, sgst_amount, "C", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["CN"]:
                ordercode +=1
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(company_parameters.SGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, sgst_amount, "D", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)
            
            if tran_type in ["CS"]:
                ordercode +=1
                ac_code = company_parameters.PurchaseSGSTAc
                accoid = get_accoid(company_parameters.PurchaseSGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, sgst_amount, "D", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)
        
        if TCS_Amt > 0:
            acName = get_ac_Name(headData['ac_code'], headData['Company_Code'])
            narration = f"TCS {acName} {headData['doc_no']} ."
            if tran_type == 'DN':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'D', ac_code, accoid,narration,ordercode,narration)
                ordercode +=1
                ac_code = company_parameters.SaleTCSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'C', ac_code, accoid, narration,ordercode,narration)
            elif tran_type == 'CN':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'C', ac_code, accoid,narration,ordercode,narration)
                ordercode +=1
                ac_code = company_parameters.SaleTCSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'D', ac_code, accoid,narration,ordercode,narration)
            elif tran_type == 'DS':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'D', ac_code, accoid,narration,ordercode,narration)
                ordercode +=1
                ac_code = company_parameters.PurchaseTCSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'C', ac_code, accoid,narration,ordercode,narration)
            elif tran_type == 'CS':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'C', ac_code, accoid,narration,ordercode,narration)
                ordercode +=1
                ac_code = company_parameters.PurchaseTCSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'D', ac_code, accoid,narration,ordercode,narration)

        if TDS_Amt > 0:
            acName = get_ac_Name(headData['ac_code'], headData['Company_Code'])
            narration = f"TDS {acName} {headData['doc_no']} ."
            if tran_type == 'DN':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'C', ac_code, accoid,narration,ordercode,TDSNarrationTDSAcForCA)
                ordercode +=1
                ac_code = company_parameters.SaleTDSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'D', ac_code, accoid,narration,ordercode,TDSNarrationPartyForCA)
            elif tran_type == 'CN':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'D', ac_code, accoid,narration,ordercode,TDSNarrationTDSAcForCA)
                ordercode +=1
                ac_code = company_parameters.SaleTDSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'C', ac_code, accoid,narration,ordercode,TDSNarrationPartyForCA)
            elif tran_type == 'DS':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'C', ac_code, accoid,narration,ordercode,TDSNarrationTDSAcForCA)
                ordercode +=1
                ac_code = company_parameters.PurchaseTDSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'D', ac_code, accoid,narration,ordercode,TDSNarrationPartyForCA)
            elif tran_type == 'CS':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'D', ac_code, accoid,narration,ordercode,TDSNarrationTDSAcForCA)
                ordercode +=1
                ac_code = company_parameters.PurchaseTDSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'C', ac_code, accoid,narration,ordercode,TDSNarrationPartyForCA)

        if misc_amount != 0:
            if tran_type in ['DN', 'DS']:
                if misc_amount > 0:
                    ordercode +=1
                    ac_code = company_parameters.OTHER_AMOUNT_AC
                    accoid = get_accoid(ac_code,headData['Company_Code'])
                    add_gledger_entry(gledger_entries, headData, misc_amount, 'C', ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForParty_CA)
                else:
                    ordercode +=1
                    ac_code = company_parameters.OTHER_AMOUNT_AC
                    accoid = get_accoid(ac_code,headData['Company_Code'])
                    add_gledger_entry(gledger_entries, headData, misc_amount, 'D', ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForParty_CA)
            elif tran_type in ['CN', 'CS']:
                if misc_amount > 0:
                    ordercode +=1
                    ac_code = company_parameters.OTHER_AMOUNT_AC
                    accoid = get_accoid(ac_code,headData['Company_Code'])
                    add_gledger_entry(gledger_entries, headData, misc_amount, 'D', ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForParty_CA)
                else:
                    ordercode +=1
                    ac_code = company_parameters.OTHER_AMOUNT_AC
                    accoid = get_accoid(ac_code,headData['Company_Code'])
                    add_gledger_entry(gledger_entries, headData, misc_amount, 'C', ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForParty_CA)
            
        for item in detailData:
            ordercode +=1
            detailLedger_entry = create_gledger_entry({
                "tran_type": bill_type,
                "doc_date": headData['doc_date'],
                "ac_code": item['expac_code'],
                "Company_Code": headData['Company_Code'],
                "Year_Code": headData['Year_Code'],
                "Narration": headData['Narration']
            }, float(item['value']), DRCR_detail, item['expac_code'], get_accoid(item['expac_code'],headData['Company_Code']),headData["Narration"],ordercode,GeneralNarrationForCA)
            gledger_entries.append(detailLedger_entry)

        query_params = {
            'Company_Code': headData['Company_Code'],
            'DOC_NO': new_doc_no,
            'Year_Code': headData['Year_Code'],
            'TRAN_TYPE': headData['tran_type'],
        }

        response = requests.post(API_URL_SERVER + "/create-Record-gLedger", params=query_params, json=gledger_entries, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Data Inserted successfully",
            "head": task_head_schema.dump(new_head),
            "addedDetails": task_detail_schemas.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Update Record and Gldger Effects of DebitcreditNote and DebitcreditNoteDetail
@app.route(API_URL + "/update-debitCreditnote", methods=["PUT"])
def update_debitCreditnote():

    def create_gledger_entry(data, amount, drcr, ac_code, accoid, narration,ordercode,ca_narration):
        return {
            "TRAN_TYPE": bill_type,
            "DOC_NO": updateddoc_no,
            "DOC_DATE": data['doc_date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['Company_Code'],
            "YEAR_CODE": data['Year_Code'],
            "ORDER_CODE": ordercode,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": narration,
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": bill_type,
            "SORT_NO": updateddoc_no,
            "vc": 0,
            "progid": 0,
            "tranid": 0,
            "saleid": 0,
            "ac": accoid,
            "CA_NARRATION":ca_narration
        }

    def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid, narration,ordercode,ca_narration=None):
        if amount > 0:
            entry = create_gledger_entry(data, amount, drcr, ac_code, accoid,narration,ordercode,ca_narration)
            entry['CA_NARRATION'] = ca_narration
            entries.append(entry)
            
    try:
        # Retrieve 'tenderid' from URL parameters
        dcid = request.args.get('dcid')

        if dcid is None:
            return jsonify({"error": "Missing 'dcid' parameter"}), 400  
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']

        tran_type = headData.get('tran_type')
        bill_type = headData.get('bill_type')

        company_code = headData.get('Company_Code')
        year_code = headData.get('Year_Code')
        user_id = headData.get('User_Id', 0)

        if 'User_Id' in headData:
            del headData['User_Id']

        existing_head = DebitCreditNoteHead.query.filter_by(dcid=dcid).first()

        if not existing_head:
            return jsonify({"error": "UTRHead with the given utrid not found"}), 404
        
        bill_to_changed = existing_head.Shit_To != headData.get('Shit_To', existing_head.Shit_To)
        TCS_Net_Payable = existing_head.TCS_Net_Payable != headData.get('TCS_Net_Payable', existing_head.TCS_Net_Payable)
        
        # Update the head data
        updatedHeadCount = db.session.query(DebitCreditNoteHead).filter(DebitCreditNoteHead.dcid == dcid).update(headData)
        updated_debit_head = db.session.query(DebitCreditNoteHead).filter(DebitCreditNoteHead.dcid == dcid).one()
        updateddoc_no = updated_debit_head.doc_no

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        for item in detailData:
            item['dcid'] = updated_debit_head.dcid

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['doc_no'] = updateddoc_no
                    new_detail = DebitCreditNoteDetail(**item)
                    updated_debit_head.details.append(new_detail)
                    createdDetails.append(new_detail)

                elif item['rowaction'] == "update":
                    dcdetailid = item['dcdetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('dcdetailid', 'rowaction', 'dcid')}
                    db.session.query(DebitCreditNoteDetail).filter(DebitCreditNoteDetail.dcdetailid == dcdetailid).update(update_values)
                    updatedDetails.append(dcdetailid)

                elif item['rowaction'] == "delete":
                    dcdetailid = item['dcdetailid']
                    detail_to_delete = db.session.query(DebitCreditNoteDetail).filter(DebitCreditNoteDetail.dcdetailid == dcdetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(dcdetailid)

        if existing_head and updatedHeadCount > 0 and (bill_to_changed or TCS_Net_Payable):
            create_company_log_entry(
                db=db,
                ac_code=existing_head.Shit_To,
                value=existing_head.TCS_Net_Payable,
                doc_no=existing_head.doc_no,
                doc_date=existing_head.bill_date,
                # updated_doc_date=head_data.get("doc_date"),
                company_code=company_code,
                year_code=year_code,
                record_type='O',
                record_no=dcid,
                user_id=user_id,
                tran_type=tran_type,
                bank_ac= "",
                created_by=headData.get('Created_By'),
                modified_by=headData.get('Modified_By')
            )

            create_company_log_entry(
                db=db,
                ac_code=headData.get("Shit_To"),
                value=headData.get("TCS_Net_Payable"),
                doc_no=updateddoc_no,
                doc_date=headData.get("doc_date"),
                # updated_doc_date=head_data.get("doc_date"),
                company_code=company_code,
                year_code=year_code,
                record_type='N',
                record_no=dcid,
                user_id=user_id,
                tran_type=tran_type,
                bank_ac= "",
                created_by=headData.get('Created_By'),
                modified_by=headData.get('Modified_By')
            )
                        

        db.session.commit()

        igst_amount = float(headData.get('igst_amount', 0) or 0)
        bill_amount = float(headData.get('bill_amount', 0) or 0)
        sgst_amount = float(headData.get('sgst_amount', 0) or 0)
        cgst_amount = float(headData.get('cgst_amount', 0) or 0)
        TCS_Amt = float(headData.get('TCS_Amt', 0) or 0)
        TDS_Amt = float(headData.get('TDS_Amt', 0) or 0)
        misc_amount = float(headData.get('misc_amount', 0) or 0)
        ca_narration = "Being Delivery Order " + str(headData['doc_no'])

        GeneralNarrationForCA, TDSNarrationPartyForCA, TDSNarrationTDSAcForCA, GeneralNarrationForParty_CA= generate_narration(headData,headData['ac_code'],detailData)

        ordercode = 0

        if tran_type in ["DN", "DS"]:
            DRCR_detail = "C"
            DRCR_head = "D"
        elif tran_type in ["CN", "CS"]:
            DRCR_detail = "D"
            DRCR_head = "C"

        company_parameters = fetch_company_parameters(headData['Company_Code'], headData['Year_Code'])

        gledger_entries = []

        if bill_amount > 0:
            if tran_type in ["DN","DS"]:
                ordercode +=1
                add_gledger_entry(gledger_entries, headData, bill_amount, "D", headData['ac_code'], get_accoid(headData['ac_code'],headData['Company_Code']),headData["Narration"],ordercode,GeneralNarrationForParty_CA)
            else:
                ordercode +=1
                add_gledger_entry(gledger_entries, headData, bill_amount, "C", headData['ac_code'], get_accoid(headData['ac_code'],headData['Company_Code']),headData["Narration"],ordercode,GeneralNarrationForParty_CA)

        if igst_amount > 0:
            if tran_type in ["DN"]:
                ordercode +=1
                ac_code = company_parameters.IGSTAc
                accoid = get_accoid(company_parameters.IGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, igst_amount, "C", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["DS"]:
                ordercode +=1
                ac_code = company_parameters.PurchaseIGSTAc
                accoid = get_accoid(company_parameters.PurchaseIGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, igst_amount, "C", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["CN"]:
                ordercode +=1
                ac_code = company_parameters.IGSTAc
                accoid = get_accoid(company_parameters.IGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, igst_amount, "D", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["CS"]:
                ordercode +=1
                ac_code = company_parameters.PurchaseIGSTAc
                accoid = get_accoid(company_parameters.PurchaseIGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, igst_amount, "D", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)


        if cgst_amount > 0:
            if tran_type in ["DN"]:
                ordercode +=1
                ac_code = company_parameters.CGSTAc
                accoid = get_accoid(company_parameters.CGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, cgst_amount, "C", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)
            if tran_type in ["DS"]:
                ordercode +=1
                ac_code = company_parameters.PurchaseCGSTAc
                accoid = get_accoid(company_parameters.PurchaseCGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, cgst_amount, "C", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["CN"]:
                ordercode +=1
                ac_code = company_parameters.CGSTAc
                accoid = get_accoid(company_parameters.CGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, cgst_amount, "D", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["CS"]:
                ordercode +=1
                ac_code = company_parameters.PurchaseCGSTAc
                accoid = get_accoid(company_parameters.PurchaseCGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, cgst_amount, "D", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

        if sgst_amount > 0:
            if tran_type in ["DN"]:
                ordercode +=1
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(company_parameters.SGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, sgst_amount, "C", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["DS"]:
                ordercode +=1
                ac_code = company_parameters.PurchaseSGSTAc
                accoid = get_accoid(company_parameters.PurchaseSGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, sgst_amount, "C", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)

            if tran_type in ["CN"]:
                ordercode +=1
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(company_parameters.SGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, sgst_amount, "D", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)
            
            if tran_type in ["CS"]:
                ordercode +=1
                ac_code = company_parameters.PurchaseSGSTAc
                accoid = get_accoid(company_parameters.PurchaseSGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, sgst_amount, "D", ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForCA)
        
        if TCS_Amt > 0:
            acName = get_ac_Name(headData['ac_code'], headData['Company_Code'])
            narration = f"TCS {acName} {headData['doc_no']} ."
            if tran_type == 'DN':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'D', ac_code, accoid,narration,ordercode,narration)
                ordercode +=1
                ac_code = company_parameters.SaleTCSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'C', ac_code, accoid, narration,ordercode,narration)
            elif tran_type == 'CN':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'C', ac_code, accoid,narration,ordercode,narration)
                ordercode +=1
                ac_code = company_parameters.SaleTCSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'D', ac_code, accoid,narration,ordercode,narration)
            elif tran_type == 'DS':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'D', ac_code, accoid,narration,ordercode,narration)
                ordercode +=1
                ac_code = company_parameters.PurchaseTCSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'C', ac_code, accoid,narration,ordercode,narration)
            elif tran_type == 'CS':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'C', ac_code, accoid,narration,ordercode,narration)
                ordercode +=1
                ac_code = company_parameters.PurchaseTCSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TCS_Amt, 'D', ac_code, accoid,narration,ordercode,narration)

        if TDS_Amt > 0:
            acName = get_ac_Name(headData['ac_code'], headData['Company_Code'])
            narration = f"TDS {acName} {headData['doc_no']} ."
            if tran_type == 'DN':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'C', ac_code, accoid,narration,ordercode,TDSNarrationTDSAcForCA)
                ordercode +=1
                ac_code = company_parameters.SaleTDSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'D', ac_code, accoid,narration,ordercode,TDSNarrationPartyForCA)
            elif tran_type == 'CN':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'D', ac_code, accoid,narration,ordercode,TDSNarrationTDSAcForCA)
                ordercode +=1
                ac_code = company_parameters.SaleTDSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'C', ac_code, accoid,narration,ordercode,TDSNarrationPartyForCA)
            elif tran_type == 'DS':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'C', ac_code, accoid,narration,ordercode,TDSNarrationTDSAcForCA)
                ordercode +=1
                ac_code = company_parameters.PurchaseTDSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'D', ac_code, accoid,narration,ordercode,TDSNarrationPartyForCA)
            elif tran_type == 'CS':
                ordercode +=1
                ac_code = headData['ac_code']
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'D', ac_code, accoid,narration,ordercode,TDSNarrationTDSAcForCA)
                ordercode +=1
                ac_code = company_parameters.PurchaseTDSAc
                accoid = get_accoid(ac_code,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, TDS_Amt, 'C', ac_code, accoid,narration,ordercode,TDSNarrationPartyForCA)

        if misc_amount != 0:
            if tran_type in ['DN', 'DS']:
                if misc_amount > 0:
                    ordercode +=1
                    ac_code = company_parameters.OTHER_AMOUNT_AC
                    accoid = get_accoid(ac_code,headData['Company_Code'])
                    add_gledger_entry(gledger_entries, headData, misc_amount, 'C', ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForParty_CA)
                else:
                    ordercode +=1
                    ac_code = company_parameters.OTHER_AMOUNT_AC
                    accoid = get_accoid(ac_code,headData['Company_Code'])
                    add_gledger_entry(gledger_entries, headData, misc_amount, 'D', ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForParty_CA)
            elif tran_type in ['CN', 'CS']:
                if misc_amount > 0:
                    ordercode +=1
                    ac_code = company_parameters.OTHER_AMOUNT_AC
                    accoid = get_accoid(ac_code,headData['Company_Code'])
                    add_gledger_entry(gledger_entries, headData, misc_amount, 'D', ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForParty_CA)
                else:
                    ordercode +=1
                    ac_code = company_parameters.OTHER_AMOUNT_AC
                    accoid = get_accoid(ac_code,headData['Company_Code'])
                    add_gledger_entry(gledger_entries, headData, misc_amount, 'C', ac_code, accoid,headData["Narration"],ordercode,GeneralNarrationForParty_CA)

        for item in detailData:
            ordercode +=1
            detailLedger_entry = create_gledger_entry({
                "tran_type": bill_type,
                "doc_date": headData['doc_date'],
                "ac_code": item['expac_code'],
                "Company_Code": headData['Company_Code'],
                "Year_Code": headData['Year_Code'],
                "Narration": headData['Narration']
            }, float(item['value']), DRCR_detail, item['expac_code'], get_accoid(item['expac_code'],headData['Company_Code']),headData["Narration"],ordercode,GeneralNarrationForCA)
            gledger_entries.append(detailLedger_entry)

        query_params = {
            'Company_Code': headData['Company_Code'],
            'DOC_NO': updateddoc_no,
            'Year_Code': headData['Year_Code'],
            'TRAN_TYPE': headData['tran_type'],
        }

        response = requests.post(API_URL_SERVER + "/create-Record-gLedger", params=query_params, json=gledger_entries, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Data Inserted successfully",
            "head": updatedHeadCount,
            "addedDetails": task_detail_schemas.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Delete record from datatabse based Dcid and also delete that record GLeder Effects.  
# @app.route(API_URL + "/delete_data_by_dcid", methods=["DELETE"])
# def delete_data_by_dcid():
#     try:
#         dcid = request.args.get('dcid')
#         Company_Code = request.args.get('Company_Code')
#         doc_no = request.args.get('doc_no')
#         Year_Code = request.args.get('Year_Code')
#         tran_type = request.args.get('tran_type')

#         if not all([dcid, Company_Code, doc_no, Year_Code, tran_type]):
#             return jsonify({"error": "Missing required parameters"}), 400

#         with db.session.begin():
#             deleted_user_rows = DebitCreditNoteDetail.query.filter_by(dcid=dcid).delete()
#             deleted_task_rows = DebitCreditNoteHead.query.filter_by(dcid=dcid).delete()

#         if deleted_user_rows > 0 and deleted_task_rows > 0:
#             query_params = {
#                 'Company_Code': Company_Code,
#                 'DOC_NO': doc_no,
#                 'Year_Code': Year_Code,
#                 'TRAN_TYPE': tran_type,
#             }

#             response = requests.delete(API_URL_SERVER + "/delete-Record-gLedger", params=query_params)
            
#             if response.status_code != 200:
#                 raise Exception("Failed to create record in gLedger")

#             db.session.commit()

#         return jsonify({
#             "message": f"Deleted {deleted_task_rows} Task row(s) and {deleted_user_rows} User row(s) successfully"
#         }), 200

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/delete_data_by_dcid", methods=["DELETE"])
def delete_data_by_dcid():
    try:
        dcid = request.args.get('dcid')
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')
        User_Id = request.args.get('User_Id', 0)

        if not all([dcid, Company_Code, doc_no, Year_Code, tran_type, User_Id]):
            return jsonify({"error": "Missing required parameters"}), 400

        with db.session.begin():
            deleted_head = DebitCreditNoteHead.query.filter_by(dcid=dcid).first()

            if deleted_head:
                deleted_user_rows = DebitCreditNoteDetail.query.filter_by(dcid=dcid).delete()
                deleted_task_rows = DebitCreditNoteHead.query.filter_by(dcid=dcid).delete()

                create_company_log_entry(
                        db=db,
                        ac_code=deleted_head.Shit_To,
                        value=deleted_head.TCS_Net_Payable,
                        doc_no=deleted_head.doc_no,
                        doc_date=deleted_head.bill_date,
                        company_code=Company_Code,
                        year_code=Year_Code,
                        record_type='D',
                        record_no=dcid,
                        user_id=User_Id,
                        tran_type=tran_type,
                        bank_ac="",
                        created_by=deleted_head.Created_By,
                        modified_by=deleted_head.Modified_By
                )

                    # Delete from gLedger
                query_params = {
                    'Company_Code': Company_Code,
                        'DOC_NO': doc_no,
                        'Year_Code': Year_Code,
                        'TRAN_TYPE': tran_type,
                }
                response = requests.delete(API_URL_SERVER + "/delete-Record-gLedger", params=query_params, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})

                if response.status_code != 200:
                    raise Exception("Failed to delete record in gLedger")

        return jsonify({
            "message": f"Deleted {deleted_task_rows} Task row(s) and {deleted_user_rows} User row(s) successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500



#Fetch the last Record on database by dcid
@app.route(API_URL + "/get-lastdebitcreditnotedata", methods=["GET"])
def get_lastdebitcreditnotedata():
    try:
        tran_type = request.args.get('tran_type')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not tran_type:
            return jsonify({"error": "Transaction type is required"}), 400

        last_dcid_Head = DebitCreditNoteHead.query.filter_by(tran_type=tran_type,Company_Code=company_code,Year_Code=year_code).order_by(DebitCreditNoteHead.dcid.desc()).first()

        if not last_dcid_Head:
            return jsonify({"error": "No records found in dcid table"}), 404

        last_dcid = last_dcid_Head.dcid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"dcid": last_dcid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        category = row.BillToName if row else None

        last_head_data = {column.name: getattr(last_dcid_Head, column.name) for column in last_dcid_Head.__table__.columns}
        last_head_data.update(format_dates(last_dcid_Head))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Navigations API    
@app.route(API_URL+"/get-firstdebitcredit-navigation", methods=["GET"])
def get_firstdebitcredit_navigation():
    try:
        tran_type = request.args.get('tran_type')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not tran_type:
            return jsonify({"error": "Transaction type is required"}), 400
        first_task = DebitCreditNoteHead.query.filter_by(tran_type=tran_type,Company_Code=company_code,Year_Code=year_code).order_by(DebitCreditNoteHead.doc_no.asc()).first()

        if not first_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        first_taskid = first_task.dcid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"dcid": first_taskid})

        additional_data_rows = additional_data.fetchall()
      
        row = additional_data_rows[0] if additional_data_rows else None
        category = row.BillToName if row else None

        last_head_data = {column.name: getattr(first_task, column.name) for column in first_task.__table__.columns}
        last_head_data.update(format_dates(first_task))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Get last Record from Database
@app.route(API_URL+"/get-lastdebitcredit-navigation", methods=["GET"])
def get_lastdebitcredit_navigation():
    try:
        tran_type = request.args.get('tran_type')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not tran_type:
            return jsonify({"error": "Transaction type is required"}), 400
    
        last_task =  DebitCreditNoteHead.query.filter_by(tran_type=tran_type,Company_Code=company_code,Year_Code=year_code).order_by(DebitCreditNoteHead.doc_no.desc()).first()

        if not last_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        last_taskid = last_task.dcid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"dcid": last_taskid})

        additional_data_rows = additional_data.fetchall()
      
        row = additional_data_rows[0] if additional_data_rows else None
       
        last_head_data = {column.name: getattr(last_task, column.name) for column in last_task.__table__.columns}
        last_head_data.update(format_dates(last_task))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Get Previous record by database 
@app.route(API_URL+"/get-previousDebitcreditnote-navigation", methods=["GET"])
def get_previousDebitcreditnote_navigation():
    try:
        tran_type = request.args.get('tran_type')
        current_task_no = request.args.get('doc_no')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not tran_type:
            return jsonify({"error": "Transaction type is required"}), 400
        
        if not current_task_no:
            return jsonify({"error": "Current Task No is required"}), 400

        previous_task = DebitCreditNoteHead.query.filter_by(tran_type=tran_type,Company_Code=company_code,Year_Code=year_code).filter(DebitCreditNoteHead.doc_no < current_task_no).order_by(DebitCreditNoteHead.doc_no.desc()).first()
    
        if not previous_task:
            return jsonify({"error": "No previous records found"}), 404

        previous_task_id = previous_task.dcid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"dcid": previous_task_id})
        additional_data_rows = additional_data.fetchall()
        
        row = additional_data_rows[0] if additional_data_rows else None

        last_head_data = {column.name: getattr(previous_task, column.name) for column in previous_task.__table__.columns}
        last_head_data.update(format_dates(previous_task))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Get Next record by database 
@app.route(API_URL+"/get-nextdebitcreditnote-navigation", methods=["GET"])
def get_nextdebitcreditnote_navigation():
    try:
        tran_type = request.args.get('tran_type')
        current_task_no = request.args.get('doc_no')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        
        if not tran_type:
            return jsonify({"error": "Transaction Type is  required"}), 400

        next_task = DebitCreditNoteHead.query.filter(DebitCreditNoteHead.doc_no > current_task_no).filter_by(tran_type=tran_type,Company_Code=company_code,Year_Code=year_code).order_by(DebitCreditNoteHead.doc_no.asc()).first()

        if not next_task:
            return jsonify({"error": "No next records found"}), 404

        next_task_id = next_task.dcid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"dcid": next_task_id})
        
        additional_data_rows = additional_data.fetchall()
        
        row = additional_data_rows[0] if additional_data_rows else None
        last_head_data = {column.name: getattr(next_task, column.name) for column in next_task.__table__.columns}
        last_head_data.update(format_dates(next_task))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

#Debit Credit Note Print Report
@app.route(API_URL+"/generating_DebitCredit_report", methods=["GET"])
def generating_DebitCredit_report():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no')
        tran_type= request.args.get('tran_type')

        if not company_code or not year_code or not doc_no:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''
                 SELECT        dbo.qrydebitnoteheaddetail.tran_type, dbo.qrydebitnoteheaddetail.doc_no, dbo.qrydebitnoteheaddetail.doc_date, dbo.qrydebitnoteheaddetail.doc_dateConverted, dbo.qrydebitnoteheaddetail.ac_code, 
                         dbo.qrydebitnoteheaddetail.bill_no, dbo.qrydebitnoteheaddetail.bill_date, dbo.qrydebitnoteheaddetail.bill_id, dbo.qrydebitnoteheaddetail.bill_type, dbo.qrydebitnoteheaddetail.texable_amount, 
                         dbo.qrydebitnoteheaddetail.gst_code, dbo.qrydebitnoteheaddetail.cgst_rate, dbo.qrydebitnoteheaddetail.cgst_amount, dbo.qrydebitnoteheaddetail.sgst_rate, dbo.qrydebitnoteheaddetail.sgst_amount, 
                         dbo.qrydebitnoteheaddetail.igst_rate, dbo.qrydebitnoteheaddetail.igst_amount, dbo.qrydebitnoteheaddetail.bill_amount, dbo.qrydebitnoteheaddetail.Company_Code, dbo.qrydebitnoteheaddetail.Year_Code, 
                         dbo.qrydebitnoteheaddetail.Branch_Code, dbo.qrydebitnoteheaddetail.Created_By, dbo.qrydebitnoteheaddetail.Modified_By, dbo.qrydebitnoteheaddetail.misc_amount, dbo.qrydebitnoteheaddetail.ac, 
                         dbo.qrydebitnoteheaddetail.dcid, dbo.qrydebitnoteheaddetail.Ac_Name_E, dbo.qrydebitnoteheaddetail.Address_E, dbo.qrydebitnoteheaddetail.City_Code, dbo.qrydebitnoteheaddetail.Pincode, dbo.qrydebitnoteheaddetail.Gst_No, 
                         dbo.qrydebitnoteheaddetail.Email_Id, dbo.qrydebitnoteheaddetail.AC_Pan, dbo.qrydebitnoteheaddetail.Mobile_No, dbo.qrydebitnoteheaddetail.GSTStateCode, dbo.qrydebitnoteheaddetail.cityname, 
                         dbo.qrydebitnoteheaddetail.citygststatecode, dbo.qrydebitnoteheaddetail.GST_Name, dbo.qrydebitnoteheaddetail.Rate, dbo.qrydebitnoteheaddetail.SGST, dbo.qrydebitnoteheaddetail.CGST, dbo.qrydebitnoteheaddetail.IGST, 
                         dbo.qrydebitnoteheaddetail.expac_code, dbo.qrydebitnoteheaddetail.value, dbo.qrydebitnoteheaddetail.expac, dbo.qrydebitnoteheaddetail.dcdetailid, dbo.qrydebitnoteheaddetail.detail_Id, 
                         dbo.qrydebitnoteheaddetail.expacaccountname, dbo.qrydebitnoteheaddetail.bill_dateConverted, dbo.qrydebitnoteheaddetail.ASNNO, dbo.qrydebitnoteheaddetail.Ewaybillno, dbo.qrydebitnoteheaddetail.Narration, 
                         dbo.qrydebitnoteheaddetail.Shit_To, dbo.qrydebitnoteheaddetail.Mill_Code, dbo.qrydebitnoteheaddetail.st, dbo.qrydebitnoteheaddetail.mc, dbo.qrydebitnoteheaddetail.ackno, dbo.qrydebitnoteheaddetail.ShopTo_Name, 
                         dbo.qrydebitnoteheaddetail.Mill_Name, dbo.qrydebitnoteheaddetail.Unit_Code, dbo.qrydebitnoteheaddetail.uc, dbo.qrydebitnoteheaddetail.Unit_Name, dbo.qrydebitnoteheaddetail.TCS_Rate, 
                         dbo.qrydebitnoteheaddetail.TCS_Amt, dbo.qrydebitnoteheaddetail.TCS_Net_Payable, dbo.qrydebitnoteheaddetail.ShipToAddress, dbo.qrydebitnoteheaddetail.ShipToGSTNo, dbo.qrydebitnoteheaddetail.ShipToStateCode, 
                         dbo.qrydebitnoteheaddetail.billtoFSSAI, dbo.qrydebitnoteheaddetail.billtoTAN, dbo.qrydebitnoteheaddetail.shiptoFSSAI, dbo.qrydebitnoteheaddetail.shiptoTAN, dbo.qrydebitnoteheaddetail.CompanyPan, 
                         dbo.qrydebitnoteheaddetail.Item_Code, dbo.qrydebitnoteheaddetail.Quantal, dbo.qrydebitnoteheaddetail.ic, dbo.qrydebitnoteheaddetail.Item_Name, dbo.qrydebitnoteheaddetail.HSN, dbo.qrydebitnoteheaddetail.unitgstno, 
                         dbo.qrydebitnoteheaddetail.unitstatecode, dbo.qrydebitnoteheaddetail.unitaddress, dbo.qrydebitnoteheaddetail.unitpanno, dbo.qrydebitnoteheaddetail.TDS_Amt, dbo.qrydebitnoteheaddetail.TDS_Rate, dbo.company.GST, 
                         dbo.company.TIN, dbo.company.FSSAI_No, dbo.company.Pan_No, dbo.company.Company_Name_E, dbo.tblvoucherheadaddress.AL1, dbo.tblvoucherheadaddress.AL2, dbo.tblvoucherheadaddress.AL3, 
                         dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other,dbo.company.State_E,dbo.tblvoucherheadaddress.BillFooter,dbo.qrydebitnoteheaddetail.millshortname, 
                  dbo.qrydebitnoteheaddetail.millstatename, dbo.qrydebitnoteheaddetail.millstatecode,dbo.qrydebitnoteheaddetail.ShipToCity, dbo.qrydebitnoteheaddetail.shiptostatename,dbo.qrydebitnoteheaddetail.shiptoshortname,
                    dbo.qrydebitnoteheaddetail.shipToPinCode, dbo.qrydebitnoteheaddetail.unitPinCode, dbo.qrydebitnoteheaddetail.UnitCityname, dbo.qrydebitnoteheaddetail.UnitStateName, dbo.qrydebitnoteheaddetail.MillFSSAI_No,dbo.company.City_E
FROM            dbo.company RIGHT OUTER JOIN
                         dbo.tblvoucherheadaddress ON dbo.company.Company_Code = dbo.tblvoucherheadaddress.Company_Code RIGHT OUTER JOIN
                         dbo.qrydebitnoteheaddetail ON dbo.tblvoucherheadaddress.Company_Code = dbo.qrydebitnoteheaddetail.Company_Code
               WHERE        (dbo.qrydebitnoteheaddetail.tran_type = :tran_type) AND (dbo.qrydebitnoteheaddetail.doc_no = :doc_no) AND (dbo.qrydebitnoteheaddetail.Year_Code = :year_code) AND (dbo.qrydebitnoteheaddetail.Company_Code = :company_code)
               '''
            )
        additional_data = db.session.execute(text(query), 
         {"company_code": company_code, "year_code": year_code, "doc_no": doc_no,'tran_type' :tran_type})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' or 'bill_date' in data:
                data['doc_date'] = data['doc_date'].strftime('%Y-%m-%d') if data['doc_date'] else None
                data['bill_date'] = data['bill_date'].strftime('%Y-%m-%d') if data['bill_date'] else None

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#GET data for the Einvoice genration
@app.route(API_URL + "/get_eWayBill_generationData_for_DebitCredit", methods=["GET"])
def get_eWayBill_generationData_for_DebitCredit():
    try:
        doc_no = request.args.get('doc_no')
        companyCode = request.args.get('Company_Code')
        yearCode = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')

        if not doc_no or not companyCode or not yearCode or not tran_type:
            return jsonify({
                "error": "Missing 'doc_no', 'Company_Code', 'Year_Code', or 'tran_type' parameter"
            }), 400

    
        query = '''
                SELECT        dbo.NT_1qryEInvoiceDebitCredit.doc_no AS Doc_No, CONVERT(varchar, dbo.NT_1qryEInvoiceDebitCredit.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEInvoiceDebitCredit.BuyerGst_No) AS BuyerGst_No, 
                         UPPER(dbo.NT_1qryEInvoiceDebitCredit.Buyer_Name) AS Buyer_Name, UPPER(dbo.NT_1qryEInvoiceDebitCredit.Buyer_Address) AS Buyer_Address, UPPER(dbo.NT_1qryEInvoiceDebitCredit.Buyer_City) AS Buyer_City, 
                         (CASE Buyer_Pincode WHEN 0 THEN 999999 ELSE Buyer_Pincode END) AS Buyer_Pincode, UPPER(dbo.NT_1qryEInvoiceDebitCredit.Buyer_State_name) AS Buyer_State_name, 
                         dbo.NT_1qryEInvoiceDebitCredit.Buyer_State_Code, dbo.NT_1qryEInvoiceDebitCredit.Buyer_Phno, dbo.NT_1qryEInvoiceDebitCredit.Buyer_Email_Id, UPPER(dbo.NT_1qryEInvoiceDebitCredit.DispatchGst_No) 
                         AS DispatchGst_No, UPPER(dbo.NT_1qryEInvoiceDebitCredit.Dispatch_Name) AS Dispatch_Name, UPPER(dbo.NT_1qryEInvoiceDebitCredit.Dispatch_Address) AS Dispatch_Address, 
                         UPPER(dbo.NT_1qryEInvoiceDebitCredit.DispatchCity_City) AS DispatchCity_City, dbo.NT_1qryEInvoiceDebitCredit.Dispatch_GSTStateCode, (CASE Dispatch_Pincode WHEN 0 THEN 999999 ELSE Dispatch_Pincode END) 
                         AS Dispatch_Pincode, UPPER(dbo.NT_1qryEInvoiceDebitCredit.ShipToGst_No) AS ShipToGst_No, UPPER(dbo.NT_1qryEInvoiceDebitCredit.ShipTo_Name) AS ShipTo_Name, 
                         UPPER(dbo.NT_1qryEInvoiceDebitCredit.ShipTo_Address) AS ShipTo_Address, UPPER(dbo.NT_1qryEInvoiceDebitCredit.ShipTo_City) AS ShipTo_City, dbo.NT_1qryEInvoiceDebitCredit.ShipTo_GSTStateCode, 
                         (CASE ShipTo_Pincode WHEN 0 THEN 999999 ELSE ShipTo_Pincode END) AS ShipTo_Pincode, 0.00 AS NETQNTL, dbo.NT_1qryEInvoiceDebitCredit.Rate as rate,dbo.NT_1qryEInvoiceDebitCredit.Rate as GSTRate, dbo.NT_1qryEInvoiceDebitCredit.cgst_amount AS CGSTAmount, 
                         dbo.NT_1qryEInvoiceDebitCredit.sgst_amount AS SGSTAmount, dbo.NT_1qryEInvoiceDebitCredit.igst_amount AS IGSTAmount, dbo.NT_1qryEInvoiceDebitCredit.texable_amount AS TaxableAmount, 
                         dbo.NT_1qryEInvoiceDebitCredit.cgst_rate AS CGSTRate, dbo.NT_1qryEInvoiceDebitCredit.sgst_rate AS SGSTRate, dbo.NT_1qryEInvoiceDebitCredit.igst_rate AS IGSTRate, 0 AS Distance, '' AS LORRYNO, 
                         'Sugar' AS System_Name_E, 17011490 AS HSN, dbo.NT_1qryEInvoiceDebitCredit.ShipToEmailID, dbo.NT_1qryEInvoiceDebitCredit.ShipToOffPhone, dbo.NT_1qryEInvoiceDebitCredit.ShipToState_Name, 
                         dbo.company.Company_Name_E, dbo.company.Address_E, dbo.company.City_E, dbo.company.State_E, dbo.company.PIN, dbo.company.Mobile_No, dbo.company.GST, dbo.company.bankdetail, dbo.eway_bill.Branch, 
                         dbo.eway_bill.Account_Details, dbo.nt_1_companyparameters.GSTStateCode, dbo.accountingyear.year, dbo.eway_bill.Mode_of_Payment, dbo.NT_1qryEInvoiceDebitCredit.bill_amount AS billAmount
FROM            dbo.NT_1qryEInvoiceDebitCredit INNER JOIN
                         dbo.company ON dbo.NT_1qryEInvoiceDebitCredit.Company_Code = dbo.company.Company_Code INNER JOIN
                         dbo.eway_bill ON dbo.NT_1qryEInvoiceDebitCredit.Company_Code = dbo.eway_bill.Company_Code INNER JOIN
                         dbo.nt_1_companyparameters ON dbo.NT_1qryEInvoiceDebitCredit.Company_Code = dbo.nt_1_companyparameters.Company_Code AND 
                         dbo.NT_1qryEInvoiceDebitCredit.Year_Code = dbo.nt_1_companyparameters.Year_Code INNER JOIN
                         dbo.accountingyear ON dbo.NT_1qryEInvoiceDebitCredit.Year_Code = dbo.accountingyear.yearCode
            WHERE dbo.NT_1qryEInvoiceDebitCredit.Company_Code = :companyCode
              AND dbo.NT_1qryEInvoiceDebitCredit.Year_Code = :yearCode
              AND dbo.NT_1qryEInvoiceDebitCredit.doc_no = :doc_no AND dbo.NT_1qryEInvoiceDebitCredit.tran_type = :tran_type

            '''

        result_data = db.session.execute(
            text(query),
            {
                "companyCode": companyCode,
                "yearCode": yearCode,
                "doc_no": doc_no,
                "tran_type": tran_type
            } 
        )

        rows = result_data.fetchall()
        all_data = [dict(row._mapping) for row in rows]

        for data_row in all_data:
            if 'doc_date' in data_row and data_row['doc_date']:
                try:
                    date_obj = datetime.strptime(data_row['doc_date'], "%d/%m/%Y")
                    data_row['doc_date'] = date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    data_row['doc_date'] = None
            else:
                data_row['doc_date'] = None

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500