from app import app, db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from flask import jsonify, request
import os
import requests

API_URL = os.getenv('API_URL')
API_SERVER = os.getenv('API_URL_SERVER')

@app.route(API_URL + '/search-accounts', methods=['GET'])
def search_accounts():
    ac_name = request.args.get('acName')

    if not ac_name:
        return jsonify({'error': 'Missing required parameter: acName'}), 400

    try:
        query = text("""
            SELECT 
                dbo.salaryaccount.ac_name, 
                dbo.salaryaccount.ac_code, 
                dbo.salaryaccount.ac, 
                dbo.nt_1_accountmaster.Ac_Name_E
            FROM dbo.salaryaccount
            INNER JOIN dbo.nt_1_accountmaster 
                ON dbo.salaryaccount.ac = dbo.nt_1_accountmaster.accoid
            WHERE dbo.salaryaccount.ac_name LIKE :ac_name
        """)

        result = db.session.execute(query, {'ac_name': f"%{ac_name}%"})
        data = [dict(row._mapping) for row in result]

        return jsonify({'results': data}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@app.route(API_URL + '/replace-salary-accounts', methods=['POST'])
def replace_salary_accounts():
    try:
        data = request.json
        if not isinstance(data, list):
            return jsonify({'error': 'Expected a list of account records'}), 400

        for item in data:
            if not all(k in item for k in ['ac_name', 'ac_code', 'ac']):
                return jsonify({'error': 'Each record must contain ac_name, ac_code, and ac'}), 400

        db.session.execute(text("DELETE FROM dbo.salaryaccount"))

        insert_query = text("""
            INSERT INTO dbo.salaryaccount (ac_name, ac_code, ac)
            VALUES (:ac_name, :ac_code, :ac)
        """)

        for row in data:
            db.session.execute(insert_query, {
                'ac_name': row['ac_name'],
                'ac_code': row['ac_code'],
                'ac': row['ac']
            })

        db.session.commit()
        return jsonify({'message': 'Salary accounts replaced successfully'}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route(API_URL + '/submit-other-purchase-from-salary', methods=['POST'])
def submit_other_purchase_from_salary():
    try:
        data = request.json
        
        if not data or 'rows' not in data:
            return jsonify({'error': 'Invalid request data. Expected rows array.'}), 400
        
        company_code = data.get('company_code')
        year_code = data.get('year_code')
        doc_date = data.get('doc_date')
        narration = data.get('narration')
        Created_By = data.get('username','')
        
        if not company_code or not year_code or not doc_date:
            return jsonify({'error': 'Missing required parameters: company_code, year_code, or doc_date'}), 400

        param_result = db.session.execute(text("SELECT salbonusac, sba, bankac, ba, pfac, pa, esiac, ea, Proftax, pt, tdsac, td,tdsac,td FROM salaryparameter"))
        param_row = param_result.first()
        
        if not param_row:
            return jsonify({'error': 'No configuration found in salaryparameter table'}), 400

        salbonusac, sba, bankac, ba, pfac, pa, esiac, ea, Proftax, pt, tdsac, td, tdsac, td = param_row

        success_count = 0
        error_count = 0
        error_details = []
        all_entries = []  
        op_entries = [] 
        jv_entries = [] 
        jv_entries_PF = [] 
        jv_entries_Professional_Tax =[]
        jv_entries_ESIC =[]

        for row in data['rows']:
            try:
                tds_amount = float(row.get('tds_amount', 0))
                net_pay = float(row.get('net_pay', 0))
                PF = float(row.get('PF', 0))
                ESIC = float(row.get('ESIC', 0))
                professional_tax = float(row.get('Professional_Tax', 0))
                
                if net_pay <= 0:
                    continue  

                entry = {
                    'employee_name': row.get('employee_name', ''),
                    'ac_code': row['ac_code'],
                    'ac': row['ac'],
                    'bill_amount': float(row.get('bill_amount', 0)),
                    'tds_amount': tds_amount,
                    'net_pay': net_pay,
                    'PF': PF,
                    'ESIC': ESIC,
                    'Professional_Tax': professional_tax,
                    'needs_op': tds_amount > 0,
                    'needs_jv': tds_amount <= 0,
                    'needs_jv_PF': PF >= 0 ,
                    'needs_jv_Professional_Tax': professional_tax > 0,
                    'needs_jv_ESIC': ESIC > 0 
                }

                all_entries.append(entry)
                if entry['needs_op']:
                    op_entries.append(entry)
                if entry['needs_jv']:
                    jv_entries.append(entry)
                if entry['needs_jv_PF']:
                    jv_entries_PF.append(entry)
                if entry['needs_jv_Professional_Tax']:
                    jv_entries_Professional_Tax.append(entry)
                if entry['needs_jv_ESIC']:
                    jv_entries_ESIC.append(entry)

            except Exception as e:
                error_details.append({
                    'employee': row.get('employee_name'),
                    'error': str(e),
                    'step': 'Initial validation'
                })
                error_count += 1

        for entry in op_entries:
            try:
                op_payload = {
                    "Company_Code": company_code,
                    "Doc_Date": doc_date,
                    "Year_Code": year_code,
                    "tran_type": "OP",
                    "Supplier_Code": entry['ac_code'],
                    "sc": entry['ac'],
                    "Exp_Ac": salbonusac,
                    "ea": sba,
                    "Group_Code": 1,
                    "GST_RateCode": 4,
                    "Bill_Amount": f"{entry['bill_amount']:.2f}",
                    "TDS_Cutt_AcCode": entry['ac_code'],
                    "TDS_AcCode": tdsac,
                    "Section_Code": 192,
                    "TDS": f"{entry['tds_amount']:.2f}",
                    "TDS_Amt": f"{entry['bill_amount']:.2f}",
                    "Taxable_Amount": f"{entry['bill_amount']:.2f}",
                    "ExpensisAmt": f"{entry['bill_amount']:.2f}",
                    "Section_Id": 1,
                    "tca": entry['ac'],
                    "tac": td,
                    "Narration": narration + f"{entry['employee_name']}",
                    "gcid": 71,
                    "Provision_Ac": 0,
                    "pa": 0
                }

                op_url = f"{API_SERVER}/create-Record-OtherPurchase"
                op_response = requests.post(op_url, json=op_payload)

                if op_response.status_code != 201:
                    raise Exception(f"OtherPurchase API failed: {op_response.text}")

                entry['op_reference'] = op_response.json().get('doc_no', '')
                success_count += 1

            except Exception as e:
                error_details.append({
                    'employee': entry['employee_name'],
                    'error': str(e),
                    'step': 'OtherPurchase creation'
                })
                error_count += 1
                entry['needs_op'] = False
                entry['failed'] = True

        bp_response = None
        if all_entries:
            try:
                total_amount = sum(entry['net_pay'] for entry in all_entries if not entry.get('failed'))
                
                bp_head = {
                    "tran_type": "BP",
                    "doc_date": doc_date,
                    "company_code": company_code,
                    "year_code": year_code,
                    "total": f"{total_amount:.2f}",
                    "Created_By": Created_By,
                    "Modified_By": "",
                    "cashbank": bankac,
                    "cb": ba,
                }

                bp_details = []
                for idx, entry in enumerate([e for e in all_entries if not e.get('failed')], start=1):

                    bp_details.append({
                        "rowaction": "add",
                        "detail_id": idx,
                        "Tran_Type": "BP",
                        "doc_date": doc_date,
                        "debit_ac": entry['ac_code'],
                        "da": entry['ac'],
                        "credit_ac": entry['ac_code'],
                        "ca": entry['ac'],
                        "amount": f"{entry['net_pay']:.2f}",
                        "narration": f"{entry['employee_name']}" + narration,
                        "Company_Code": company_code,
                        "Year_Code": year_code,
                        "Group_Code": 1,
                        "drcr": "D",
                        "TDS_Amt": f"{entry['bill_amount']:.2f}" if entry['tds_amount'] > 0 else "0.00",
                        "TDS_Rate": f"{entry['tds_amount']:.2f}" if entry['tds_amount'] > 0 else "0.00",
                        "TDSAc": tdsac if entry['tds_amount'] > 0 else "",
                        "TDSAcid": td if entry['tds_amount'] > 0 else "",
                        "Branch_Code": 1,
                        "ac": 443,
                        "gcid": 71,
                        "AcadjAccode": "",
                        "AcadjAmt": 0,
                        "Adjusted_Amount": 0,
                        "GRN": "",
                        "TReceipt": "",
                        "Tender_No": 0,
                        "Unit_Code": "",
                        "Voucher_No": "",
                        "Voucher_Type": "",
                        "uc": "",
                        "tenderdetailid": 0,
                        "drpFilterValue": "O"
                    })

                bp_url = f"{API_SERVER}/insert-receiptpayment"
                bp_response = requests.post(bp_url, json={
                    "head_data": bp_head,
                    "detail_data": bp_details
                })

                if bp_response.status_code != 200:
                    raise Exception(f"BP API failed: {bp_response.text}")

                success_count += len([e for e in all_entries if not e.get('failed')])

            except Exception as e:
                error_details.append({
                    'error': f'BP failed: {str(e)}',
                    'step': 'BP creation'
                })
                error_count += len([e for e in all_entries if not e.get('failed')])

        jv_response = None
        if jv_entries:  
            try:
                jv_total_amount = sum(entry['bill_amount'] for entry in jv_entries if not entry.get('failed'))
                
                jv_head = {
                    "tran_type": "JV",
                    "doc_date": doc_date,
                    "company_code": company_code,
                    "year_code": year_code,
                    "total": f"{jv_total_amount:.2f}",
                    "Created_By": Created_By,
                    "Modified_By": "",
                }

                jv_details = []
                detail_counter = 1
                
                for entry in [e for e in jv_entries if not e.get('failed')]:

                    jv_details.append({
                        "rowaction": "add",
                        "detail_id": detail_counter,
                        "Tran_Type": "JV",
                        "doc_date": doc_date,
                        "debit_ac": entry['ac_code'],
                        "da": entry['ac'],
                        "credit_ac":entry['ac_code'],
                        "ca":  entry['ac'],
                        "amount": f"{entry['bill_amount']:.2f}",
                        "narration": f"Net Earning {entry['employee_name']}" + narration,
                        "Company_Code": company_code,
                        "Year_Code": year_code,
                        "Group_Code": 1,
                        "drcr": "C",
                        "Branch_Code": 1,
                        "ac": "",
                        "gcid": 71,
                        "AcadjAccode": "",
                        "AcadjAmt": 0,
                        "Adjusted_Amount": 0,
                        "GRN": "",
                        "TReceipt": "",
                        "Tender_No": 0,
                        "Unit_Code": "",
                        "Voucher_No": "",
                        "Voucher_Type": "",
                        "uc": "",
                        "tenderdetailid": 0,
                        "drpFilterValue": "O"
                    })
                    detail_counter += 1

                    jv_details.append({
                        "rowaction": "add",
                        "detail_id": detail_counter,
                        "Tran_Type": "JV",
                        "doc_date": doc_date,
                        "debit_ac": salbonusac,
                        "da": sba,
                        "credit_ac": salbonusac,
                        "ca": sba,
                        "amount": f"{entry['bill_amount']:.2f}",
                        "narration": f"Net Earning {entry['employee_name']}" + narration,
                        "Company_Code": company_code,
                        "Year_Code": year_code,
                        "Group_Code": 1,
                        "drcr": "D",
                        "Branch_Code": 1,
                        "ac": "",
                        "gcid": 71,
                        "AcadjAccode": "",
                        "AcadjAmt": 0,
                        "Adjusted_Amount": 0,
                        "GRN": "",
                        "TReceipt": "",
                        "Tender_No": 0,
                        "Unit_Code": "",
                        "Voucher_No": "",
                        "Voucher_Type": "",
                        "uc": "",
                        "tenderdetailid": 0,
                        "drpFilterValue": "O"
                    })
                    detail_counter += 1

                jv_url = f"{API_SERVER}/insert-receiptpayment"
                jv_response = requests.post(jv_url, json={
                    "head_data": jv_head,
                    "detail_data": jv_details
                })

                if jv_response.status_code != 200:
                    raise Exception(f"JV API failed: {jv_response.text}")

                success_count += len(jv_entries) * 2 

            except Exception as e:
                error_details.append({
                    'error': f'JV failed: {str(e)}',
                    'step': 'JV creation'
                })
                error_count += len(jv_entries)

        jv_response_PF = None
        if jv_entries_PF:  
            try:
                jv_total_amount_PF = sum(entry['PF'] for entry in jv_entries_PF if not entry.get('failed'))
                
                jv_head = {
                    "tran_type": "JV",
                    "doc_date": doc_date,
                    "company_code": company_code,
                    "year_code": year_code,
                    "total": f"{jv_total_amount_PF:.2f}",
                    "Created_By": Created_By,
                    "Modified_By": "",
                }

                jv_details_PF = []
                detail_counter = 1
                
                for entry in [e for e in jv_entries_PF if not e.get('failed')]:
                    jv_details_PF.append({
                        "rowaction": "add",
                        "detail_id": detail_counter,
                        "Tran_Type": "JV",
                        "doc_date": doc_date,
                        "debit_ac": entry['ac_code'],
                        "da": entry['ac'],
                        "credit_ac": "",
                        "ca": "",
                        "amount": f"{entry['PF']:.2f}",
                        "narration": f"PF {entry['employee_name']}" + narration,
                        "Company_Code": company_code,
                        "Year_Code": year_code,
                        "Group_Code": 1,
                        "drcr": "D",
                        "Branch_Code": 1,
                        "ac": "",
                        "gcid": 71,
                        "AcadjAccode": "",
                        "AcadjAmt": 0,
                        "Adjusted_Amount": 0,
                        "GRN": "",
                        "TReceipt": "",
                        "Tender_No": 0,
                        "Unit_Code": "",
                        "Voucher_No": "",
                        "Voucher_Type": "",
                        "uc": "",
                        "tenderdetailid": 0,
                        "drpFilterValue": "O"
                    })
                    detail_counter += 1

                    jv_details_PF.append({
                        "rowaction": "add",
                        "detail_id": detail_counter,
                        "Tran_Type": "JV",
                        "doc_date": doc_date,
                        "debit_ac": pfac,
                        "da": pa,
                        "credit_ac": pfac,
                        "ca": pa,
                        "amount": f"{entry['PF']:.2f}",
                        "narration": f"PF {entry['employee_name']}" + narration,
                        "Company_Code": company_code,
                        "Year_Code": year_code,
                        "Group_Code": 1,
                        "drcr": "C",
                        "Branch_Code": 1,
                        "ac": "",
                        "gcid": 71,
                        "AcadjAccode": "",
                        "AcadjAmt": 0,
                        "Adjusted_Amount": 0,
                        "GRN": "",
                        "TReceipt": "",
                        "Tender_No": 0,
                        "Unit_Code": "",
                        "Voucher_No": "",
                        "Voucher_Type": "",
                        "uc": "",
                        "tenderdetailid": 0,
                        "drpFilterValue": "O"
                    })
                    detail_counter += 1

                jv_url = f"{API_SERVER}/insert-receiptpayment"
                jv_response_PF = requests.post(jv_url, json={
                    "head_data": jv_head,
                    "detail_data": jv_details_PF
                })

                if jv_response_PF.status_code != 200:
                    raise Exception(f"JV API failed: {jv_response_PF.text}")

                success_count += len(jv_entries_PF) * 2 

            except Exception as e:
                error_details.append({
                    'error': f'JV for PF failed: {str(e)}',
                    'step': 'JV PF creation'
                })
                error_count += len(jv_entries_PF)

        jv_response_Professional_Tax = None
        if jv_entries_Professional_Tax:  
            try:
                jv_total_amount_Professional_Tax = sum(entry['Professional_Tax'] for entry in jv_entries_Professional_Tax if not entry.get('failed'))
                
                jv_head = {
                    "tran_type": "JV",
                    "doc_date": doc_date,
                    "company_code": company_code,
                    "year_code": year_code,
                    "total": f"{jv_total_amount_Professional_Tax:.2f}",
                    "Created_By": Created_By,
                    "Modified_By": "",
                }

                jv_details_Professional_Tax = []
                detail_counter = 1
                
                for entry in [e for e in jv_entries_Professional_Tax if not e.get('failed')]:
                    jv_details_Professional_Tax.append({
                        "rowaction": "add",
                        "detail_id": detail_counter,
                        "Tran_Type": "JV",
                        "doc_date": doc_date,
                        "debit_ac": entry['ac_code'],
                        "da": entry['ac'],
                        "credit_ac": "",
                        "ca": "",
                        "amount": f"{entry['Professional_Tax']:.2f}",
                        "narration": f"Professional Tax {entry['employee_name']}" + narration,
                        "Company_Code": company_code,
                        "Year_Code": year_code,
                        "Group_Code": 1,
                        "drcr": "D",
                        "Branch_Code": 1,
                        "ac": "",
                        "gcid": 71,
                        "AcadjAccode": "",
                        "AcadjAmt": 0,
                        "Adjusted_Amount": 0,
                        "GRN": "",
                        "TReceipt": "",
                        "Tender_No": 0,
                        "Unit_Code": "",
                        "Voucher_No": "",
                        "Voucher_Type": "",
                        "uc": "",
                        "tenderdetailid": 0,
                        "drpFilterValue": "O"
                    })
                    detail_counter += 1

                    jv_details_Professional_Tax.append({
                        "rowaction": "add",
                        "detail_id": detail_counter,
                        "Tran_Type": "JV",
                        "doc_date": doc_date,
                        "debit_ac": Proftax,
                        "da": pt,
                        "credit_ac": Proftax,
                        "ca": pt,
                        "amount": f"{entry['Professional_Tax']:.2f}",
                        "narration": f"Professional Tax {entry['employee_name']}" + narration,
                        "Company_Code": company_code,
                        "Year_Code": year_code,
                        "Group_Code": 1,
                        "drcr": "C",
                        "Branch_Code": 1,
                        "ac": "",
                        "gcid": 71,
                        "AcadjAccode": "",
                        "AcadjAmt": 0,
                        "Adjusted_Amount": 0,
                        "GRN": "",
                        "TReceipt": "",
                        "Tender_No": 0,
                        "Unit_Code": "",
                        "Voucher_No": "",
                        "Voucher_Type": "",
                        "uc": "",
                        "tenderdetailid": 0,
                        "drpFilterValue": "O"
                    })
                    detail_counter += 1

                jv_url = f"{API_SERVER}/insert-receiptpayment"
                jv_response_Professional_Tax = requests.post(jv_url, json={
                    "head_data": jv_head,
                    "detail_data": jv_details_Professional_Tax
                })

                if jv_response_Professional_Tax.status_code != 200:
                    raise Exception(f"JV API failed: {jv_response_Professional_Tax.text}")

                success_count += len(jv_entries_Professional_Tax) * 2 

            except Exception as e:
                error_details.append({
                    'error': f'JV failed: {str(e)}',
                    'step': 'JV creation'
                })
                error_count += len(jv_entries_Professional_Tax)


        jv_response_ESIC = None
        if jv_entries_ESIC:  
            try:
                jv_total_amount_ESIC = sum(entry['ESIC'] for entry in jv_entries_ESIC if not entry.get('failed'))
                
                jv_head = {
                    "tran_type": "JV",
                    "doc_date": doc_date,
                    "company_code": company_code,
                    "year_code": year_code,
                    "total": f"{jv_total_amount_ESIC:.2f}",
                    "Created_By": Created_By,
                    "Modified_By": "",
                }

                jv_details_ESIC = []
                detail_counter = 1
                
                for entry in [e for e in jv_entries_ESIC if not e.get('failed')]:

                    jv_details_ESIC.append({
                        "rowaction": "add",
                        "detail_id": detail_counter,
                        "Tran_Type": "JV",
                        "doc_date": doc_date,
                        "debit_ac": entry['ac_code'],
                        "da": entry['ac'],
                        "credit_ac": "",
                        "ca": "",
                        "amount": f"{entry['ESIC']:.2f}",
                        "narration": f"ESIC {entry['employee_name']}" + narration,
                        "Company_Code": company_code,
                        "Year_Code": year_code,
                        "Group_Code": 1,
                        "drcr": "D",
                        "Branch_Code": 1,
                        "ac": "",
                        "gcid": 71,
                        "AcadjAccode": "",
                        "AcadjAmt": 0,
                        "Adjusted_Amount": 0,
                        "GRN": "",
                        "TReceipt": "",
                        "Tender_No": 0,
                        "Unit_Code": "",
                        "Voucher_No": "",
                        "Voucher_Type": "",
                        "uc": "",
                        "tenderdetailid": 0,
                        "drpFilterValue": "O"
                    })
                    detail_counter += 1

                    jv_details_ESIC.append({
                        "rowaction": "add",
                        "detail_id": detail_counter,
                        "Tran_Type": "JV",
                        "doc_date": doc_date,
                        "debit_ac": esiac,
                        "da": ea,
                        "credit_ac": esiac,
                        "ca": ea,
                        "amount": f"{entry['ESIC']:.2f}",
                        "narration": f"ESIC {entry['employee_name']}" + narration,
                        "Company_Code": company_code,
                        "Year_Code": year_code,
                        "Group_Code": 1,
                        "drcr": "C",
                        "Branch_Code": 1,
                        "ac": "",
                        "gcid": 71,
                        "AcadjAccode": "",
                        "AcadjAmt": 0,
                        "Adjusted_Amount": 0,
                        "GRN": "",
                        "TReceipt": "",
                        "Tender_No": 0,
                        "Unit_Code": "",
                        "Voucher_No": "",
                        "Voucher_Type": "",
                        "uc": "",
                        "tenderdetailid": 0,
                        "drpFilterValue": "O"
                    })
                    detail_counter += 1

                jv_url = f"{API_SERVER}/insert-receiptpayment"
                jv_response_ESIC = requests.post(jv_url, json={
                    "head_data": jv_head,
                    "detail_data": jv_details_ESIC
                })

                if jv_response_ESIC.status_code != 200:
                    raise Exception(f"JV API failed: {jv_response_ESIC.text}")

                success_count += len(jv_entries_ESIC) * 2 

            except Exception as e:
                error_details.append({
                    'error': f'JV failed: {str(e)}',
                    'step': 'JV creation'
                })
                error_count += len(jv_entries_ESIC)



        return jsonify({
            'success': True,
            'message': 'Processing completed',
            'stats': {
                'total_entries': len(data['rows']),
                'processed_entries': len(all_entries),
                'with_tds_entries': len(op_entries),
                'with_professional_NETpay': len(jv_entries),
                'with_pf_entries': len(jv_entries_PF),
                'with_professional_tax_entries': len(jv_entries_Professional_Tax),
                'with_ESIC_entries': len(jv_entries_ESIC),
                'success_count': success_count,
                'error_count': error_count
            },
            'errors': error_details if error_count > 0 else None,
            'transactions': {
                'BP': {
                    'doc_count': len(bp_details) if 'bp_details' in locals() else 0,
                    'total_amount': total_amount if 'total_amount' in locals() else 0,
                    'status': 'success' if bp_response and bp_response.status_code == 200 else 'failed'
                },
                'JV_Professional_Tax': {
                    'doc_count': len(jv_details) if 'jv_details' in locals() else 0,
                    'total_amount': jv_total_amount if 'jv_total_amount' in locals() else 0,
                    'status': 'success' if jv_response and jv_response.status_code == 200 else 'failed'
                },
                'JV_PF': {
                    'doc_count': len(jv_details_PF) if 'jv_details_PF' in locals() else 0,
                    'total_amount': jv_total_amount_PF if 'jv_total_amount_PF' in locals() else 0,
                    'status': 'success' if jv_response_PF and jv_response_PF.status_code == 200 else 'failed'
                },
                'JV_PF_Professional_Tax': {
                    'doc_count': len(jv_details_Professional_Tax) if 'jv_details_Professional_Tax' in locals() else 0,
                    'total_amount': jv_total_amount_Professional_Tax if 'jv_total_amount_Professional_Tax' in locals() else 0,
                    'status': 'success' if jv_response_Professional_Tax and jv_response_Professional_Tax.status_code == 200 else 'failed'
                },
                'JV_ESIC': {
                    'doc_count': len(jv_details_ESIC) if 'jv_details_ESIC' in locals() else 0,
                    'total_amount': jv_total_amount_ESIC if 'jv_total_amount_ESIC' in locals() else 0,
                    'status': 'success' if jv_response_ESIC and jv_response_ESIC.status_code == 200 else 'failed'
                }
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
        }), 500
