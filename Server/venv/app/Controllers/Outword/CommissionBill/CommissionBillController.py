import traceback
from flask import jsonify, request
from app import app, db
from app.models.Outword.CommissionBill.CommissionBillModel import CommissionBill
from sqlalchemy.sql import text, func
import os
import requests
from datetime import datetime
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getSaleAc,get_acShort_Name
from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry
from decimal import Decimal

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')

sql_query = text('''
    SELECT        dbo.commission_bill.ac_code, dbo.commission_bill.ac, party.Ac_Name_E AS PartyName, party.Ac_Code AS PartyCode, dbo.commission_bill.unit_code, dbo.commission_bill.uc, unit.Ac_Name_E AS UnitName, 
                         unit.Ac_Code AS Unitcode, dbo.commission_bill.broker_code, broker.Ac_Name_E AS brokername, broker.Ac_Code AS Brokercode, dbo.commission_bill.bc, dbo.commission_bill.transport_code, 
                         transport.Ac_Name_E AS transportname, dbo.commission_bill.tc, transport.Ac_Code AS transportcode, dbo.commission_bill.mill_code, dbo.commission_bill.mc, mill.Ac_Name_E AS millname, mill.Ac_Code AS millcode, 
                         dbo.commission_bill.TDS_Ac, dbo.commission_bill.ta, tdsac.Ac_Code AS tdsac, tdsac.Ac_Name_E AS tdsacname, dbo.commission_bill.item_code, dbo.commission_bill.ic, itemcode.System_Code AS Itemcode, 
                         itemcode.System_Name_E AS Itemname, dbo.commission_bill.gst_code, gstratecode.GST_Name AS gstratename, gstratecode.Doc_no AS gstratecode
FROM            dbo.commission_bill LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster AS gstratecode ON dbo.commission_bill.gst_code = gstratecode.Doc_no LEFT OUTER JOIN
                         dbo.nt_1_systemmaster AS itemcode ON dbo.commission_bill.ic = itemcode.systemid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS tdsac ON dbo.commission_bill.ta = tdsac.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS transport ON dbo.commission_bill.tc = transport.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS mill ON dbo.commission_bill.mc = mill.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS broker ON dbo.commission_bill.bc = broker.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS unit ON dbo.commission_bill.uc = unit.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS party ON dbo.commission_bill.ac = party.accoid
WHERE        itemcode.System_Type = 'I' and dbo.commission_bill.Tran_Type = :tran_type and dbo.commission_bill.doc_no = :doc_no and 
                 dbo.commission_bill.Company_Code = :company_code and dbo.commission_bill.Year_Code = :year_code
''')

#Format Dates
def format_dates(input):
    return input.doc_date.strftime('%Y-%m-%d') if input.doc_date else None

def generate_narration(headData):
    def _get(key):
        return headData[key] if isinstance(headData, dict) else getattr(headData, key)

    ac_short_name = get_acShort_Name(_get('ac_code'), _get('Company_Code'))
    tds_ac_name = get_acShort_Name(_get('TDS_Ac'), _get('Company_Code'))
    doc_no = _get('doc_no')

    GeneralNarrationForCA = f"{ac_short_name} Voucher No {doc_no}"
    TDSNarrationPartyForCA = f"{tds_ac_name} Voucher No {doc_no}"
    TDSNarrationTDSAcForCA = f"{ac_short_name} Voucher No {doc_no}"
    GeneralNarrationForParty_CA = f"Voucher No {doc_no}"

    return (
        GeneralNarrationForCA,
        TDSNarrationPartyForCA,
        TDSNarrationTDSAcForCA,
        GeneralNarrationForParty_CA,
    )


#GET all Data.
@app.route(API_URL + "/getall-CommissionBill", methods=["GET"])
def get_CommissionBillallData():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        tran_type = request.args.get('Tran_Type')
        
        if company_code is None or year_code is None or tran_type is None:
            return jsonify({'error': 'Missing Company_Code, Year_Code, or Tran_Type parameter'}), 400

        try:
            company_code = int(company_code)
            year_code = int(year_code)
            tran_type = str(tran_type)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, Year_Code, or Tran_Type parameter'}), 400

        records = CommissionBill.query.filter_by(Company_Code=company_code, Year_Code=year_code, Tran_Type=tran_type).order_by(CommissionBill.doc_no.desc()).all()

        result_list = []
        for record in records:
            record_data = {column.name: getattr(record, column.name) for column in record.__table__.columns}
            record_data['Formatted_Doc_Date'] = format_dates(record)

            account_details = db.session.execute(sql_query, {
                'doc_no': record.doc_no,
                'company_code': company_code,
                'year_code': year_code,
                'tran_type': tran_type
            })
            account_info = account_details.first()

            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    record_data[key] = value if value is not None else ""

            result_list.append(record_data)

        return jsonify(result_list)
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

#GET last record from the database.
@app.route(API_URL + "/get-CommissionBill-lastRecord", methods=["GET"])
def get_CommissionBill_lastRecord():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        if not company_code or not year_code or not tran_type:
            return jsonify({'error': 'Missing Company_Code, Tran_Type, or Year_Code parameter'}), 400
        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, Tran_Type, or Year_Code parameter'}), 400

        last_Record = CommissionBill.query.filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.desc()).first()
        if last_Record is None:
            response_data = {
                'Company_Code': company_code,
                'Tran_Type': tran_type,
                'Year_Code': year_code,
                'doc_no': 0 
            }
            return jsonify(response_data), 200
        account_details = db.session.execute(sql_query, {'doc_no': last_Record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': tran_type})
        account_info = account_details.first() 

        last_Record_data = {column.name: getattr(last_Record, column.name) for column in last_Record.__table__.columns}
        last_Record_data['doc_date'] = format_dates(last_Record)

        if account_info:
            result_keys = account_details.keys() 
            for key, value in zip(result_keys, account_info):
                last_Record_data[key] = value if value is not None else ""

        return jsonify(last_Record_data)
    except Exception as e:
        print(e) 
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

#GET record by ID
@app.route(API_URL+"/get-CommissionBillSelectedRecord", methods=["GET"])
def get_CommissionBillSelectedRecord():
    try:
        selected_code = request.args.get('doc_no')
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')

        if selected_code is None or company_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing selected_code, Company_Code, tran_type, or year code parameter'}), 400

        try:
            selected_code = int(selected_code)
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid selected_Record, Company_Code, or tran_type parameter'}), 400

        Record = CommissionBill.query.filter_by(doc_no=selected_code, Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).first()

        if Record is None:
            return jsonify({'error': 'Selected Record not found'}), 404
        
        account_details = db.session.execute(sql_query, {'doc_no': selected_code, 'company_code': company_code, 'year_code': year_code, 'tran_type': Record.Tran_Type})
        account_info = account_details.first()

        selected_Record_data = {column.name: getattr(Record, column.name) if getattr(Record, column.name) is not None else "" for column in Record.__table__.columns}
        selected_Record_data['doc_date'] = format_dates(Record)

        if account_info:
            result_keys = account_details.keys()
            for key, value in zip(result_keys, account_info):
                selected_Record_data[key] = value if value is not None else ""

        return jsonify(selected_Record_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500
  
# Create Record
@app.route(API_URL + "/create-RecordCommissionBill", methods=["POST"])
def create_CommissionBill():
    def create_gledger_entry(data, amount, drcr, ac_code, accoid,narration):
        return {
            "TRAN_TYPE": new_Record_data['Tran_Type'],
            "DOC_NO": new_Record_data["doc_no"],
            "DOC_DATE": data['doc_date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": new_Record_data['Company_Code'],
            "YEAR_CODE": new_Record_data['Year_Code'],
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": narration,
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": new_Record_data['Tran_Type'],
            "SORT_NO": new_Record_data['doc_no'],
            "vc": 0,
            "progid": 0,
            "tranid": 0,
            "saleid": 0,
            "ac": accoid,
            "do_no": new_Record_data["link_no"] or 0
        }
    
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')

        if company_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, Tran_Type, or Year_Code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, Tran_Type, or Year_Code parameter'}), 400

        max_record = db.session.query(db.func.max(CommissionBill.doc_no)).filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).scalar() or 0

        new_Record_data = request.json
        new_Record_data['doc_no'] = max_record + 1 
        new_Record_data['Company_Code'] = company_code
        new_Record_data['Tran_Type'] = tran_type
        new_Record_data['Year_Code'] = year_code

        new_Record = CommissionBill(**new_Record_data)
        
        company_parameters = fetch_company_parameters(new_Record_data['Company_Code'], new_Record_data['Year_Code'])

        def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid,narration,ordercode,ca_narration=None):
            if float(amount) != 0:
                entry = create_gledger_entry(data, amount, drcr, ac_code, accoid,new_Record_data["narration1"])
                entry['CA_NARRATION'] = ca_narration
                entries.append(entry)
        
        gledger_entries = []
        bill_amount =new_Record.bill_amount
        drcr=""
        if bill_amount>0:
            drcr="D"
        else:
            drcr="C" 

        GeneralNarrationForCA, TDSNarrationPartyForCA, TDSNarrationTDSAcForCA, GeneralNarrationForParty_CA= generate_narration(new_Record_data)


        ordercode=0  

        ordercode=ordercode+1
        ac_code = new_Record_data['ac_code']
        accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
        add_gledger_entry(gledger_entries, new_Record_data, abs(bill_amount), drcr, ac_code, accoid, "",ordercode,GeneralNarrationForParty_CA) 

        ac_code = company_parameters.RoundOff
        accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
    
        dono=new_Record_data['link_id']
        ac_code = new_Record_data['ac_code']
        accoid = get_accoid(ac_code, new_Record_data['Company_Code'])

        cgstamount=new_Record_data['cgst_amount']
        sgstamount=new_Record_data['sgst_amount']
        igstamount=new_Record_data['igst_amount']
        tcsamt=new_Record_data['TCS_Amt']
        tdsamt=new_Record_data['TDSAmount']
        tdsac=new_Record_data['TDS_Ac']
        resalecomm=new_Record_data['resale_commission']
        texable_amount =new_Record_data['texable_amount']

        tcs_net_payable = new_Record_data['TCS_Net_Payable']
        # if tcs_net_payable > 0:
        #     add_gledger_entry(gledger_entries, new_Record_data, tcs_net_payable, 'D', new_Record_data['ac_code'], accoid, new_Record_data["narration1"])
        
        if dono == 0:
            frieght_amount=new_Record_data['Frieght_amt']
            if frieght_amount>0:
                ordercode=ordercode+1
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, frieght_amount, 'C', ac_code, accoid, "",ordercode,GeneralNarrationForParty_CA)
            else:
                ordercode=ordercode+1
                ac_code = company_parameters.Freight_Ac
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, frieght_amount, 'D', ac_code, accoid, "",ordercode,GeneralNarrationForParty_CA)
          
        if bill_amount > 0:
            ordercode=ordercode+1
            ac_code = company_parameters.COMMISSION_AC
            accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
            add_gledger_entry(gledger_entries, new_Record_data, texable_amount - resalecomm, 'C', ac_code, accoid, "",ordercode,GeneralNarrationForParty_CA)
            if cgstamount>0:
                ordercode=ordercode+1
                ac_code = company_parameters.CGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, cgstamount, 'C', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            if sgstamount >0:  
                ordercode=ordercode+1  
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, sgstamount, 'C', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            if igstamount >0:  
                ordercode=ordercode+1  
                ac_code = company_parameters.IGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, igstamount, 'C', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            if tcsamt >0:   
                ordercode=ordercode+1 
                ac_code = company_parameters.SaleTCSAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, tcsamt, 'C', ac_code, accoid, "",ordercode,"Being Commission Bill:" + str(new_Record_data['doc_no']))

                ordercode=ordercode+1
                ac_code = new_Record_data['ac_code']
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, tcsamt, 'D', ac_code, accoid, "",ordercode,"Being Commission Bill:" + str(new_Record_data['doc_no']))
            
        elif bill_amount != 0:
            ordercode=ordercode+1
            ac_code = company_parameters.COMMISSION_AC
            accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
            add_gledger_entry(gledger_entries, new_Record_data, abs(texable_amount - resalecomm), 'D', ac_code, accoid, "",ordercode,GeneralNarrationForParty_CA)
            if cgstamount != 0:
                ordercode=ordercode+1
                ac_code = company_parameters.PurchaseCGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, abs(cgstamount), 'D', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            if sgstamount !=0:    
                ordercode=ordercode+1
                ac_code = company_parameters.PurchaseSGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, abs(sgstamount), 'D', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            if igstamount !=0:    
                ordercode=ordercode+1
                ac_code = company_parameters.PurchaseIGSTAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, abs(igstamount), 'D', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            if tcsamt != 0:    
                ordercode=ordercode+1
                ac_code = company_parameters.SaleTCSAc
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, abs(tcsamt), 'D', ac_code, accoid, "",ordercode,"Being Commission Bill:" + str(new_Record_data['doc_no']))
                ordercode=ordercode+1
                ac_code = new_Record_data['ac_code']
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, abs(tcsamt), 'C', ac_code, accoid, "",ordercode,"Being Commission Bill:" + str(new_Record_data['doc_no']))

        if tdsamt!=0 : 
            if tdsamt>0:
                ordercode=ordercode+1
                ac_code = new_Record_data['ac_code']
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, tdsamt, 'C', ac_code, accoid, "",ordercode,TDSNarrationPartyForCA)

                ordercode=ordercode+1
                accoid = get_accoid(tdsac, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, tdsamt, 'D', tdsac, accoid, "",ordercode,TDSNarrationTDSAcForCA)
            else:
                ordercode=ordercode+1
                ac_code = new_Record_data['ac_code']
                accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, abs(tdsamt), 'D', ac_code, accoid, "",ordercode,TDSNarrationPartyForCA)

                ordercode=ordercode+1
                accoid = get_accoid(tdsac, new_Record_data['Company_Code'])
                add_gledger_entry(gledger_entries, new_Record_data, abs(tdsamt), 'C', tdsac, accoid, "",ordercode,TDSNarrationTDSAcForCA)

        if float(resalecomm) != 0:
            if float(resalecomm)  >0:
                drcr="C"      
            else:
                drcr="D"  
            ordercode=ordercode+1
            ac_code=company_parameters.COMMISSION_AC    
            accoid = get_accoid(tdsac, new_Record_data['Company_Code'])
            add_gledger_entry(gledger_entries, new_Record_data, abs(resalecomm), drcr, ac_code, accoid, "",ordercode,GeneralNarrationForParty_CA)    
        
        commission_amount=float(new_Record_data['commission_amount'])
        qntl=float(new_Record_data['qntl'])

        # if commission_amount !=0:
        #     if commission_amount>0:
                
        #         ac_code=company_parameters.RateDiffAc    
        #         accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
        #         add_gledger_entry(gledger_entries, new_Record_data, float(commission_amount), 'C', ac_code, accoid, "")  
        #     else:
                
        #         ac_code=company_parameters.RateDiffAc    
        #         accoid = get_accoid(ac_code, new_Record_data['Company_Code'])
        #         add_gledger_entry(gledger_entries, new_Record_data, float(commission_amount), 'D', ac_code, accoid, "") 

        db.session.add(new_Record)
        db.session.commit()

        commisionid = new_Record.commissionid

        query_params = {
            'Company_Code': new_Record_data['Company_Code'],
            'DOC_NO': new_Record_data['doc_no'],
            'Year_Code': new_Record_data['Year_Code'],
            'TRAN_TYPE': new_Record_data['Tran_Type']
        }

        response = requests.post(API_URL_SERVER+"/create-Record-gLedger", params=query_params, json=gledger_entries, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            'message': 'Record created successfully',
            'record': {
                "new_Record_data":new_Record_data,
                'commissionid': commisionid
            }
        }), 201
    except Exception as e:
        print("Traceback",traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
# Update a group API
@app.route(API_URL+"/update-CommissionBill", methods=["PUT"])
def update_CommissionBill():
    def create_gledger_entry(data, amount, drcr, ac_code, accoid,narration,ordercode):
        return {
            "TRAN_TYPE": tran_type,
            "DOC_NO": new_Record_data.doc_no,
            "DOC_DATE": data.doc_date,
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": new_Record_data.Company_Code,
            "YEAR_CODE": new_Record_data.Year_Code,
            "ORDER_CODE":  ordercode,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": narration,
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": tran_type,
            "SORT_NO": new_Record_data.doc_no,
            "vc": 0,
            "progid": 0,
            "tranid": 0,
            "saleid": 0,
            "ac": accoid,
            "do_no":new_Record_data.link_no or 0
        }

    def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid,narration,ordercode,ca_narration=None):
            if float(amount) != 0:
                entry = create_gledger_entry(data, amount, drcr, ac_code, accoid,new_Record_data.narration1,ordercode)
                entry['CA_NARRATION'] = ca_narration
                entries.append(entry)
    
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        selected_code = request.args.get('doc_no')
        if company_code is None or selected_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, selected_Record, tran_type, or year code parameter'}), 400

        try:
            company_code = int(company_code)
            selected_code = int(selected_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, selected_code, tran_type, or year code parameter'}), 400
        
    
        update_Record_data = CommissionBill.query.filter_by(Company_Code=company_code, doc_no=selected_code, Tran_Type=tran_type, Year_Code=year_code).first()
        if update_Record_data is None:
            return jsonify({'error': 'Record not found'}), 404
        

        old_ac_code = update_Record_data.ac_code
        old_TCS_Net_Payable = update_Record_data.TCS_Net_Payable
        old_item_code = update_Record_data.item_code
        old_quintal = update_Record_data.qntl
        old_Narration = update_Record_data.narration1

        # Update selected record data
        update_data = request.json

        user_id = update_data.get('User_Id', 27)
        
        if 'User_Id' in update_data:
            del update_data['User_Id']

        for key, value in update_data.items():
            setattr(update_Record_data, key, value)

        new_Record_data=update_Record_data
        new_Record=update_data

        ac_code_changed = str(old_ac_code) != str(update_data.get('ac_code', old_ac_code) or "")
        tcs_net_payable_changed = Decimal(str(old_TCS_Net_Payable)) != Decimal(str(update_data.get('TCS_Net_Payable', old_TCS_Net_Payable) or 0))
        itemcode_changed = int(old_item_code) != int(update_data.get('item_code', old_item_code) or 0)
        quintal_changed = Decimal(str(old_quintal)) != Decimal(str(update_data.get('qntl', old_quintal) or 0))

        if ac_code_changed or tcs_net_payable_changed or itemcode_changed or quintal_changed:
            create_company_log_entry(
                db=db,
                ac_code=old_ac_code,
                value=old_TCS_Net_Payable,
                doc_no=new_Record_data.doc_no,
                doc_date=new_Record_data.doc_date,
                item_code=old_item_code,
                quintal = old_quintal,
                company_code=new_Record_data.Company_Code,
                year_code=new_Record_data.Year_Code,
                record_type='O',
                record_no=new_Record_data.doc_no,
                user_id=user_id,
                tran_type=tran_type,
                bank_ac=0,
                created_by=new_Record.get('Created_By'),
                modified_by=new_Record.get('Modified_By'),
                narration=old_Narration
            )

            create_company_log_entry(
                db=db,
                ac_code=new_Record_data.ac_code,
                value=new_Record_data.TCS_Net_Payable,
                doc_no=new_Record_data.doc_no,
                doc_date=new_Record_data.doc_date,
                item_code=new_Record_data.item_code,
                quintal = new_Record_data.qntl,
                company_code=new_Record_data.Company_Code,
                year_code=new_Record_data.Year_Code,
                record_type='N',
                record_no=new_Record_data.doc_no,
                user_id=user_id,
                tran_type=tran_type,
                bank_ac=0,
                created_by=new_Record.get('Created_By'),
                modified_by=new_Record.get('Modified_By'),
                narration=new_Record_data.narration1
            )


        company_parameters = fetch_company_parameters(new_Record_data.Company_Code, new_Record_data.Year_Code)
        
        gledger_entries = []
        bill_amount = float(new_Record_data.bill_amount)
        drcr=""
        if bill_amount > 0:
            drcr="D"
        else:
            drcr="C"  

        ordercode=0 

        GeneralNarrationForCA, TDSNarrationPartyForCA, TDSNarrationTDSAcForCA, GeneralNarrationForParty_CA= generate_narration(new_Record_data) 
        
        ordercode=ordercode+1
        ac_code = new_Record_data.ac_code
        accoid = get_accoid(ac_code, new_Record_data.Company_Code)
        add_gledger_entry(gledger_entries, new_Record_data, abs(bill_amount), drcr, ac_code, accoid, "",ordercode,GeneralNarrationForParty_CA)

        ac_code = company_parameters.RoundOff
        accoid = get_accoid(ac_code, new_Record_data.Company_Code)

        def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid, narration,ordercode,ca_narration=None):
            ordercode=ordercode+1
            if amount != 0:
                entry = create_gledger_entry(data, amount, drcr, ac_code, accoid,new_Record_data.narration1,ordercode)
                entry['CA_NARRATION'] = ca_narration
                entries.append(entry)
    
        dono=new_Record_data.link_id
        ac_code = new_Record_data.ac_code
        accoid = get_accoid(ac_code, new_Record_data.Company_Code)

        cgstamount=float(new_Record_data.cgst_amount)
        sgstamount=float(new_Record_data.sgst_amount)
        igstamount=float(new_Record_data.igst_amount)
        tcsamt=float(new_Record_data.TCS_Amt)
        tdsamt=float(new_Record_data.TDSAmount)
        tdsac=float(new_Record_data.TDS_Ac)
        resalecomm=float(new_Record_data.resale_commission)
        texable_amount = float(new_Record_data.texable_amount)

        tcs_net_payable = float(new_Record_data.TCS_Net_Payable)
        # if tcs_net_payable > 0:
        #     ordercode=ordercode+1
        #     add_gledger_entry(gledger_entries, new_Record_data, tcs_net_payable, 'D', new_Record_data.ac_code, accoid, new_Record_data.narration1, ordercode)
       
        if dono == 0:
            frieght_amount=float(new_Record_data.Frieght_amt)
            if frieght_amount>0:
                ordercode=ordercode+1
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, frieght_amount, 'C', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            else:
                ordercode=ordercode+1
                ac_code = company_parameters.Freight_Ac
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, abs(frieght_amount), 'D', ac_code, accoid, "",ordercode,GeneralNarrationForParty_CA)
          

        if bill_amount>0:
            ordercode=ordercode+1
            ac_code = company_parameters.COMMISSION_AC
            accoid = get_accoid(ac_code, new_Record_data.Company_Code)
            add_gledger_entry(gledger_entries, new_Record_data, texable_amount - resalecomm, 'C', ac_code, accoid, "",ordercode,GeneralNarrationForParty_CA)
            if cgstamount>0:
                ordercode=ordercode+1
                ac_code = company_parameters.CGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, cgstamount, 'C', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            if sgstamount >0:    
                ordercode=ordercode+1
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, sgstamount, 'C', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            if igstamount >0:    
                ordercode=ordercode+1
                ac_code = company_parameters.IGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, igstamount, 'C', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            if tcsamt >0:    
                ac_code = company_parameters.SaleTCSAc
                ordercode=ordercode+1
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, tcsamt, 'C', ac_code, accoid, "",ordercode,"Being Commission Bill:" + str(new_Record_data.doc_no))

                ordercode=ordercode+1
                ac_code = new_Record_data.ac_code
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, tcsamt, 'D', ac_code, accoid, "",ordercode,"Being Commission Bill:" + str(new_Record_data.doc_no))
             
        elif bill_amount != 0 :
      
            ordercode=ordercode+1
            ac_code = company_parameters.COMMISSION_AC
            accoid = get_accoid(ac_code, new_Record_data.Company_Code)
            add_gledger_entry(gledger_entries, new_Record_data, abs(texable_amount - resalecomm), 'D', ac_code, accoid, "",ordercode,GeneralNarrationForParty_CA)
            if cgstamount!=0:
                ordercode=ordercode+1
                ac_code = company_parameters.PurchaseCGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, abs(cgstamount), 'D', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            if sgstamount !=0:    
                ordercode=ordercode+1
                ac_code = company_parameters.PurchaseSGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, abs(sgstamount), 'D', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            if igstamount !=0:    
                ordercode=ordercode+1
                ac_code = company_parameters.PurchaseIGSTAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, abs(igstamount), 'D', ac_code, accoid, "",ordercode,GeneralNarrationForCA)
            if tcsamt != 0:    
                ordercode=ordercode+1
                ac_code = company_parameters.SaleTCSAc
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, abs(tcsamt), 'C', ac_code, accoid, "",ordercode,"Being Commission Bill:" + str(new_Record_data.doc_no))

                ordercode=ordercode+1
                ac_code = new_Record_data.ac_code
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, abs(tcsamt), 'D', ac_code, accoid, "",ordercode,"Being Commission Bill:" + str(new_Record_data.doc_no))

        if tdsamt!=0 : 
            if tdsamt>0:
                ordercode=ordercode+1
                ac_code = new_Record_data.ac_code
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, tdsamt, 'C', ac_code, accoid, "",ordercode,TDSNarrationPartyForCA)

                ordercode=ordercode+1
                accoid = get_accoid(tdsac, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, tdsamt, 'D', tdsac, accoid, "",ordercode,TDSNarrationTDSAcForCA)
            else:
                ordercode=ordercode+1
                ac_code = new_Record_data.ac_code
                accoid = get_accoid(ac_code, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, abs(tdsamt), 'D', ac_code, accoid, "",ordercode,TDSNarrationPartyForCA)

                ordercode=ordercode+1
                accoid = get_accoid(tdsac, new_Record_data.Company_Code)
                add_gledger_entry(gledger_entries, new_Record_data, abs(tdsamt), 'C', tdsac, accoid, "",ordercode,TDSNarrationTDSAcForCA)

        if resalecomm != 0:
            if resalecomm  >0:
                drcr="C"      
            else:
                drcr="D"  
            ordercode=ordercode+1
            ac_code=company_parameters.COMMISSION_AC    
            accoid = get_accoid(tdsac, new_Record_data.Company_Code)
            add_gledger_entry(gledger_entries, new_Record_data, abs(resalecomm), drcr, ac_code, accoid, "",ordercode,GeneralNarrationForParty_CA)    
        
        # commission_amount=float(new_Record_data.commission_amount)
        # if commission_amount !=0:
        #     if commission_amount>0:
        #         ordercode=ordercode+1
        #         ac_code=company_parameters.RateDiffAc    
        #         accoid = get_accoid(ac_code, new_Record_data.Company_Code)
        #         add_gledger_entry(gledger_entries, new_Record_data, commission_amount, 'C', ac_code, accoid, "",ordercode)  
        #     else:
        #         ordercode=ordercode+1
        #         ac_code=company_parameters.RateDiffAc    
        #         accoid = get_accoid(ac_code, new_Record_data.Company_Code)
        #         add_gledger_entry(gledger_entries, new_Record_data, commission_amount, 'D', ac_code, accoid, "",ordercode) 

        db.session.commit()

        query_params = {
            'Company_Code': new_Record_data.Company_Code,
            'DOC_NO': new_Record_data.doc_no,
            'Year_Code': new_Record_data.Year_Code,
            'TRAN_TYPE': tran_type
        }

        response = requests.post(API_URL_SERVER+"/create-Record-gLedger", params=query_params, json=gledger_entries, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            'message': 'Record updated successfully',
            'record': update_data
        })
    except Exception as e:
        print("Traceback",traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Delete a group API
@app.route(API_URL+"/delete-CommissionBill", methods=["DELETE"])
def delete_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        selected_code = request.args.get('doc_no')
        user_id = request.args.get("User_Id")
        if company_code is None or selected_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, selected_code, tran_type, or year code parameter'}), 400

        try:
            company_code = int(company_code)
            selected_code = int(selected_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, selected_code, tran_type, or year code parameter'}), 400
        

        existing_record = CommissionBill.query.filter_by(
            Company_Code=company_code, 
            doc_no=selected_code, 
            Tran_Type=tran_type, 
            Year_Code=year_code
        ).first()
        
        if not existing_record:
            return jsonify({'error': 'Record not found'}), 404

        # Extract values for company log
        old_ac_code = existing_record.ac_code
        old_TCS_Net_Payable = existing_record.TCS_Net_Payable
        old_item_code = existing_record.item_code
        old_quintal = existing_record.qntl
        old_Narration = existing_record.narration1
        doc_date = existing_record.doc_date
        created_by = getattr(existing_record, 'Created_By', None)
        modified_by = getattr(existing_record, 'Modified_By', None)

        create_company_log_entry(
            db=db,
            ac_code=old_ac_code,
            value=old_TCS_Net_Payable,
            doc_no=selected_code,
            doc_date=doc_date,
            item_code=old_item_code,
            quintal=old_quintal,
            company_code=company_code,
            year_code=year_code,
            record_type='D',  
            record_no=0,
            user_id=user_id,
            tran_type=tran_type,
            bank_ac=0,
            created_by=created_by,
            modified_by=modified_by,
            narration=old_Narration
        )


        Deleted_Record = CommissionBill.query.filter_by(Company_Code=company_code, doc_no=selected_code, Tran_Type=tran_type, Year_Code=year_code).delete()
        if Deleted_Record is None:
            return jsonify({'error': 'Record not found'}), 404

        if Deleted_Record > 0 :
            query_params = {
                'Company_Code': company_code,
                'DOC_NO': selected_code,
                'Year_Code': year_code,
                'TRAN_TYPE': tran_type,
            }

            response = requests.delete(API_URL_SERVER +"/delete-Record-gLedger", params=query_params, cookies=request.cookies, headers={'X-CSRF-TOKEN': request.cookies.get('csrf_access_token', '')})
            
            if response.status_code != 200:
                raise Exception("Failed to create record in gLedger")
            db.session.commit()


        return jsonify({'message': 'Record deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

#navigatrion APIS
@app.route(API_URL+"/get-first-CommissionBill", methods=["GET"])
def get_first_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')

        if company_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, or year code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, tran_type, or year code parameter'}), 400
        
        first_record = CommissionBill.query.filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.asc()).first()
        
        if first_record:
            account_details = db.session.execute(sql_query, {'doc_no': first_record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': first_record.Tran_Type})
            account_info = account_details.first()

            serialized_record = {column.name: getattr(first_record, column.name) if getattr(first_record, column.name) is not None else "" for column in first_record.__table__.columns}
            serialized_record['Formatted_Doc_Date'] = format_dates(first_record)
            
            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    serialized_record[key] = value if value is not None else ""

            return jsonify([serialized_record])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-last-CommissionBill", methods=["GET"])
def get_last_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')

        if company_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, or year code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, tran_type, or year code parameter'}), 400

        last_record = CommissionBill.query.filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.desc()).first()
        if last_record:
            account_details = db.session.execute(sql_query, {'doc_no': last_record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': last_record.Tran_Type})
            account_info = account_details.first()

            serialized_record = {column.name: getattr(last_record, column.name) if getattr(last_record, column.name) is not None else "" for column in last_record.__table__.columns}
            serialized_record['Formatted_Doc_Date'] = format_dates(last_record)

            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    serialized_record[key] = value if value is not None else ""

            return jsonify([serialized_record])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-previous-CommissionBill", methods=["GET"])
def get_previous_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        selected_code = request.args.get('doc_no')

        if company_code is None or tran_type is None or year_code is None or selected_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, year code, or selected_code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
            selected_code = int(selected_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, tran_type, year code, or selected_code parameter'}), 400

        previous_record = CommissionBill.query.filter(CommissionBill.doc_no < selected_code).filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.desc()).first()
        if previous_record:
            account_details = db.session.execute(sql_query, {'doc_no': previous_record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': previous_record.Tran_Type})
            account_info = account_details.first()

            serialized_record = {column.name: getattr(previous_record, column.name) if getattr(previous_record, column.name) is not None else "" for column in previous_record.__table__.columns}
            serialized_record['Formatted_Doc_Date'] = format_dates(previous_record)

            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    serialized_record[key] = value if value is not None else ""

            return jsonify([serialized_record])
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-next-CommissionBill", methods=["GET"])
def get_next_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        selected_code = request.args.get('doc_no')

        if company_code is None or tran_type is None or year_code is None or selected_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, year code, or selected_code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
            selected_code = int(selected_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, tran_type, year code, or selected_code parameter'}), 400

        next_record = CommissionBill.query.filter(CommissionBill.doc_no > selected_code).filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.asc()).first()
        if next_record:
            account_details = db.session.execute(sql_query, {'doc_no': next_record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': next_record.Tran_Type})
            account_info = account_details.first()

            serialized_record = {column.name: getattr(next_record, column.name) if getattr(next_record, column.name) is not None else "" for column in next_record.__table__.columns}
            serialized_record['Formatted_Doc_Date'] = format_dates(next_record)

            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    serialized_record[key] = value if value is not None else ""

            return jsonify([serialized_record])
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

#GET Next Doc_no from database
@app.route(API_URL + "/get-next-doc-no-commissionBill", methods=["GET"])
def get_next_doc_no_commissionBill():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        tranType = request.args.get('Tran_Type')
        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        max_doc_no = db.session.query(func.max(CommissionBill.doc_no)).filter_by(Company_Code=company_code, Year_Code=year_code, Tran_Type = tranType).scalar()
        next_doc_no = max_doc_no + 1 if max_doc_no else 1
        response = {
            "next_doc_no": next_doc_no
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#Commission Bill Report 
@app.route(API_URL+"/generating_voucherbill_report", methods=["GET"])
def generating_voucherbill_report():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no')
        tran_type = request.args.get('Tran_Type')

        if not company_code or not year_code or not doc_no or not tran_type:
            return jsonify({"error": "Missing required parameters"}), 400

        query = ('''SELECT        dbo.company.Company_Name_E, dbo.company.State_E, dbo.company.GST, dbo.company.FSSAI_No, dbo.company.PHONE, dbo.company.TIN, dbo.company.Pan_No, dbo.qrycommissionbill.doc_no, 
                         dbo.qrycommissionbill.doc_date, dbo.qrycommissionbill.doc_dateConverted, dbo.qrycommissionbill.link_no, dbo.qrycommissionbill.link_type, dbo.qrycommissionbill.link_id, dbo.qrycommissionbill.ac_code, 
                         dbo.qrycommissionbill.unit_code, dbo.qrycommissionbill.broker_code, dbo.qrycommissionbill.qntl, dbo.qrycommissionbill.packing, dbo.qrycommissionbill.bags, dbo.qrycommissionbill.grade, 
                         dbo.qrycommissionbill.transport_code, dbo.qrycommissionbill.mill_rate, dbo.qrycommissionbill.sale_rate, dbo.qrycommissionbill.purc_rate, dbo.qrycommissionbill.commission_amount, dbo.qrycommissionbill.resale_rate, 
                         dbo.qrycommissionbill.resale_commission, ISNULL(dbo.qrycommissionbill.misc_amount,0) as misc_amount , dbo.qrycommissionbill.texable_amount, dbo.qrycommissionbill.gst_code, dbo.qrycommissionbill.cgst_rate, 
                         dbo.qrycommissionbill.cgst_amount, dbo.qrycommissionbill.sgst_rate, dbo.qrycommissionbill.sgst_amount, dbo.qrycommissionbill.igst_rate, dbo.qrycommissionbill.igst_amount, dbo.qrycommissionbill.bill_amount, 
                         dbo.qrycommissionbill.Company_Code, dbo.qrycommissionbill.Year_Code, dbo.qrycommissionbill.Branch_Code, dbo.qrycommissionbill.Created_By, dbo.qrycommissionbill.Modified_By, dbo.qrycommissionbill.commissionid, 
                         dbo.qrycommissionbill.ac, dbo.qrycommissionbill.uc, dbo.qrycommissionbill.bc, dbo.qrycommissionbill.tc, dbo.qrycommissionbill.Ac_Name_E, dbo.qrycommissionbill.Address_E, dbo.qrycommissionbill.City_Code, 
                         dbo.qrycommissionbill.Pincode, dbo.qrycommissionbill.Gst_No, dbo.qrycommissionbill.Email_Id, dbo.qrycommissionbill.AC_Pan, dbo.qrycommissionbill.Mobile_No, dbo.qrycommissionbill.GSTStateCode, 
                         dbo.qrycommissionbill.citygststatecode, dbo.qrycommissionbill.unitname, dbo.qrycommissionbill.brokername, dbo.qrycommissionbill.transportname, dbo.qrycommissionbill.GST_Name, dbo.qrycommissionbill.Rate, 
                         dbo.qrycommissionbill.IGST, dbo.qrycommissionbill.SGST, dbo.qrycommissionbill.CGST, dbo.qrycommissionbill.mill_code, dbo.qrycommissionbill.mc, dbo.qrycommissionbill.millname, dbo.qrycommissionbill.narration1, 
                         dbo.qrycommissionbill.narration2, dbo.qrycommissionbill.narration3, dbo.qrycommissionbill.narration4, dbo.qrycommissionbill.millshortname, dbo.qrycommissionbill.billtostatename, dbo.qrycommissionbill.TCS_Rate, 
                         dbo.qrycommissionbill.TCS_Amt, dbo.qrycommissionbill.TCS_Net_Payable, dbo.qrycommissionbill.BANK_COMMISSION, dbo.qrycommissionbill.Tin_No, dbo.qrycommissionbill.Cst_no, dbo.qrycommissionbill.Local_Lic_No, 
                         dbo.qrycommissionbill.ECC_No, dbo.qrycommissionbill.FSSAI, dbo.qrycommissionbill.HSN, dbo.qrycommissionbill.einvoiceno, dbo.qrycommissionbill.ackno, dbo.qrycommissionbill.item_code, dbo.qrycommissionbill.ic, 
                         dbo.qrycommissionbill.System_Name_E, dbo.qrycommissionbill.CompanyPan, dbo.qrycommissionbill.Tran_Type, dbo.qrycommissionbill.cityname, dbo.qrycommissionbill.UnregisterGST, dbo.qrycommissionbill.Address_R, 
                         dbo.qrycommissionbill.billtoshortname, dbo.qrycommissionbill.Frieght_Rate, dbo.qrycommissionbill.Frieght_amt, dbo.qrycommissionbill.subtotal, dbo.qrycommissionbill.IsTDS, dbo.qrycommissionbill.TDS_Ac, 
                         dbo.qrycommissionbill.TDS_Per, dbo.qrycommissionbill.TDSAmount, dbo.qrycommissionbill.TDS, dbo.qrycommissionbill.ta, dbo.qrycommissionbill.tdsname, dbo.qrycommissionbill.MillFSSAI_No, 
                         dbo.qrycommissionbill.QRCode, dbo.qrycommissionbill.Tan_no, dbo.nt_1_companyparameters.GSTStateCode AS Expr2, dbo.tblvoucherheadaddress.AL2, dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, 
                         dbo.tblvoucherheadaddress.Other, dbo.tblvoucherheadaddress.bankdetail, dbo.tblvoucherheadaddress.BillFooter, dbo.accountingyear.year, dbo.tblvoucherheadaddress.AL1
FROM            dbo.qrycommissionbill INNER JOIN
                         dbo.tblvoucherheadaddress ON dbo.qrycommissionbill.Company_Code = dbo.tblvoucherheadaddress.Company_Code LEFT OUTER JOIN
                         dbo.accountingyear ON dbo.qrycommissionbill.Company_Code = dbo.accountingyear.Company_Code AND dbo.qrycommissionbill.Year_Code = dbo.accountingyear.yearCode LEFT OUTER JOIN
                         dbo.nt_1_companyparameters ON dbo.qrycommissionbill.Company_Code = dbo.nt_1_companyparameters.Company_Code AND dbo.qrycommissionbill.Year_Code = dbo.nt_1_companyparameters.Year_Code LEFT OUTER JOIN
                         dbo.company ON dbo.qrycommissionbill.Company_Code = dbo.company.Company_Code
                 where dbo.qrycommissionbill.Company_Code = :company_code and dbo.qrycommissionbill.year_Code = :year_code and dbo.qrycommissionbill.Tran_type = :tran_type and dbo.qrycommissionbill.doc_no =:doc_no
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code, "doc_no": doc_no, 'tran_type':tran_type})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]


        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL+"/get_LV_EInvoiceData", methods=["GET"])
def get_LV_EInvoiceData():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('doc_no')

        if not company_code or not year_code or not doc_no:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT        dbo.NT_1qryEInvoiceCommisionBill.doc_no AS Doc_No, CONVERT(varchar, dbo.NT_1qryEInvoiceCommisionBill.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEInvoiceCommisionBill.BuyerGst_No) AS BuyerGst_No, 
                         UPPER(dbo.NT_1qryEInvoiceCommisionBill.Buyer_Name) AS Buyer_Name, UPPER(dbo.NT_1qryEInvoiceCommisionBill.Buyer_Address) AS Buyer_Address, UPPER(dbo.NT_1qryEInvoiceCommisionBill.Buyer_City) 
                         AS Buyer_City, (CASE Buyer_Pincode WHEN 0 THEN 999999 ELSE Buyer_Pincode END) AS Buyer_Pincode, UPPER(dbo.NT_1qryEInvoiceCommisionBill.Buyer_State_name) AS Buyer_State_name, 
                         dbo.NT_1qryEInvoiceCommisionBill.Buyer_State_Code, dbo.NT_1qryEInvoiceCommisionBill.Buyer_Phno, dbo.NT_1qryEInvoiceCommisionBill.Buyer_Email_Id, dbo.NT_1qryEInvoiceCommisionBill.NETQNTL, CASE 
    WHEN dbo.NT_1qryEInvoiceCommisionBill.sale_rate != 0.00 
         AND dbo.NT_1qryEInvoiceCommisionBill.sale_rate > dbo.NT_1qryEInvoiceCommisionBill.mill_rate 
    THEN (dbo.NT_1qryEInvoiceCommisionBill.sale_rate - dbo.NT_1qryEInvoiceCommisionBill.mill_rate) + dbo.NT_1qryEInvoiceCommisionBill.resale_rate 
    WHEN dbo.NT_1qryEInvoiceCommisionBill.sale_rate != 0.00 
         AND dbo.NT_1qryEInvoiceCommisionBill.sale_rate <= dbo.NT_1qryEInvoiceCommisionBill.mill_rate 
    THEN (dbo.NT_1qryEInvoiceCommisionBill.mill_rate - dbo.NT_1qryEInvoiceCommisionBill.sale_rate) + dbo.NT_1qryEInvoiceCommisionBill.resale_rate 
    ELSE 0 
END AS rate, dbo.NT_1qryEInvoiceCommisionBill.CGSTAmount, dbo.NT_1qryEInvoiceCommisionBill.SGSTAmount, dbo.NT_1qryEInvoiceCommisionBill.IGSTAmount, dbo.NT_1qryEInvoiceCommisionBill.TaxableAmount, 
                         ISNULL(dbo.NT_1qryEInvoiceCommisionBill.CGSTRate, 0) AS CGSTRate, ISNULL(dbo.NT_1qryEInvoiceCommisionBill.SGSTRate, 0) AS SGSTRate, ISNULL(dbo.NT_1qryEInvoiceCommisionBill.IGSTRate, 0) AS IGSTRate, 
                         0 AS Distance, '' AS LORRYNO, dbo.NT_1qryEInvoiceCommisionBill.System_Name_E, dbo.NT_1qryEInvoiceCommisionBill.HSN, dbo.NT_1qryEInvoiceCommisionBill.GSTRate, 
                         dbo.NT_1qryEInvoiceCommisionBill.TCS_Net_Payable, dbo.NT_1qryEInvoiceCommisionBill.sale_rate, dbo.NT_1qryEInvoiceCommisionBill.purc_rate, dbo.NT_1qryEInvoiceCommisionBill.mill_rate, 
                         dbo.NT_1qryEInvoiceCommisionBill.resale_rate, ISNULL(dbo.NT_1qryEInvoiceCommisionBill.IsService, 'N') AS IsService, dbo.NT_1qryEInvoiceCommisionBill.IsService AS Expr1, dbo.accountingyear.year, 
                         dbo.company.Company_Name_E, dbo.company.Address_E, dbo.company.City_E, dbo.company.State_E, dbo.company.PIN, dbo.company.Mobile_No, dbo.company.Pan_No, dbo.company.FSSAI_No, dbo.company.GST, 
                         dbo.nt_1_companyparameters.GSTStateCode, dbo.eway_bill.Mode_of_Payment, dbo.eway_bill.Account_Details, dbo.eway_bill.Branch,dbo.NT_1qryEInvoiceCommisionBill.bill_amount as billAmount 
FROM            dbo.NT_1qryEInvoiceCommisionBill INNER JOIN
                         dbo.company ON dbo.NT_1qryEInvoiceCommisionBill.Company_Code = dbo.company.Company_Code INNER JOIN
                         dbo.nt_1_companyparameters ON dbo.NT_1qryEInvoiceCommisionBill.Company_Code = dbo.nt_1_companyparameters.Company_Code AND 
                         dbo.NT_1qryEInvoiceCommisionBill.Year_Code = dbo.nt_1_companyparameters.Year_Code INNER JOIN
                         dbo.eway_bill ON dbo.NT_1qryEInvoiceCommisionBill.Company_Code = dbo.eway_bill.Company_Code LEFT OUTER JOIN
                         dbo.accountingyear ON dbo.NT_1qryEInvoiceCommisionBill.Company_Code = dbo.accountingyear.Company_Code AND dbo.NT_1qryEInvoiceCommisionBill.Year_Code = dbo.accountingyear.yearCode
WHERE        (dbo.NT_1qryEInvoiceCommisionBill.Company_Code = :company_code) AND (dbo.NT_1qryEInvoiceCommisionBill.doc_no = :doc_no) AND (dbo.NT_1qryEInvoiceCommisionBill.Year_Code = :year_code) and dbo.NT_1qryEInvoiceCommisionBill.Tran_Type = 'LV'
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code, "doc_no": doc_no})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' in data and data['doc_date']:
                date_obj = datetime.strptime(data['doc_date'], "%d/%m/%Y")
                data['doc_date'] = date_obj.strftime("%Y-%m-%d")
            else:
                data['doc_date'] = None

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500