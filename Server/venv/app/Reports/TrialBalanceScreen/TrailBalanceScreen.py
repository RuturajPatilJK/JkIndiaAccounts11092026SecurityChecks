from flask import Flask, request, jsonify, session
from app import app, db
from sqlalchemy import  func, and_, or_
from sqlalchemy.sql import text
from datetime import datetime
from app.models.Masters.AccountInformation.AccountMaster.AccountMasterModel import AccountMaster
from app.models.Reports.GLedeger.GLedgerModels import Gledger
import os
import requests
from app.utils.CommonGLedgerFunctions import fetch_company_parameters
from sqlalchemy import text

API_URL = os.getenv('API_URL')
API_SERVER = os.getenv('API_URL_SERVER')
# Utility Functions
def format_date(date_str):
    try:
        return datetime.strptime(date_str, "%d/%m/%Y").strftime("%Y/%m/%d")
    except ValueError:
        return date_str



@app.route(API_URL + '/trial-balance-getData', methods=['GET'])
def trial_balance_getData():
    try:
        from_date = request.args.get("from_date")
        to_date = request.args.get("to_date")
        company_code = request.args.get("company_code")
        year_code = request.args.get("year_code") 
        group_code = request.args.get("group_code")  

        if not from_date or not to_date or not company_code or not year_code:
            return jsonify({"error": "Missing required parameters: 'from_date', 'to_date', 'company_code', or 'year_code'"}), 400

        query = db.session.execute(text('''
            EXEC TrialBalanceScreen 
                :Fromdate, 
                :Todate, 
                :Company_Code, 
                :Year_code,
                :GroupCode
        '''), {
            'Fromdate': from_date,
            'Todate': to_date,
            'Company_Code': company_code,
            'Year_code': year_code,
            'GroupCode': group_code
        })

        data = []
        for row in query:
            balance = row.Balance or 0
            data.append({
                "accode": row.Ac_Code,
                "ac": row.ac,
                "acname": row.Ac_name_E,
                "city": row.cityname,
                "mobile": row.Mobile_no,
                "groupcode": row.GroupCode,
                "groupname": row.groupname,
                "debitAmt": balance if balance > 0 else 0,
                "creditAmt": -balance if balance < 0 else 0
            })

        return jsonify({"data": data, "count": len(data)})

    except Exception as e:
        db.session.rollback()
        print(f"Error occurred: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500
    

@app.route(API_URL + '/get-groups', methods=['GET'])
def get_groups():
    try:
        company_code = request.args.get('company_code')
        
        if not company_code:
            return jsonify({'error': 'company_code is required'}), 400

        query = db.session.execute(text('''
            SELECT group_Code, group_Name_E 
            FROM nt_1_bsgroupmaster 
            WHERE Company_Code = :company_code
            ORDER BY group_Name_E
        '''), {
            'company_code': company_code
        })

        groups = [{
            'group_code': row.group_Code,
            'group_name': row.group_Name_E
        } for row in query]

        return jsonify({'data': groups, 'count': len(groups)})

    except Exception as e:
        db.session.rollback()
        print(f"Error occurred: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route(API_URL + '/create_roundoffJV', methods=['POST'])
def create_roundoffJV():
    try:
        data = request.json
    
        if not data or 'rows' not in data:
            return jsonify({'error': 'Invalid request data. Expected rows array.'}), 400
        
        company_code = data.get('company_code')
        year_code = data.get('year_code')
        Created_By = data.get('username', '')
        
        if not company_code or not year_code:
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # Fetch company parameters
        company_parameters = fetch_company_parameters(company_code, year_code)

        if company_parameters:
            RoundOffAcCode = company_parameters.RoundOff if company_parameters.RoundOff else 0
            RoundOffAccoid = company_parameters.RoundOffAccoid if company_parameters.RoundOffAccoid else 0
        else:
            return jsonify({'error': 'Company parameters not found for the given company_code and year_code'}), 400
        
        success_count = 0
        error_count = 0
        error_details = []
        jv_entries = []

        for row in data['rows']:
            try:
                accode = row.get('accode')
                ac = row.get('ac')
                acname = row.get('acname')
                debit_amt = float(row.get('debitAmt', 0))
                credit_amt = float(row.get('creditAmt', 0))
                
                if debit_amt > 0:
                    jv_entries.append({
                        'accode': accode,
                        'ac' : ac,
                        'acname': acname,
                        'amount': debit_amt,
                        'type': 'debit'
                    })
                
                if credit_amt > 0:
                    jv_entries.append({
                        'accode': accode,
                        'ac' : ac,
                        'acname': acname,
                        'amount': credit_amt,
                        'type': 'credit'
                    })

            except Exception as e:
                error_details.append({
                    'accode': accode,
                    'error': str(e),
                    'step': 'Initial validation'
                })
                error_count += 1

        if jv_entries:
            try:
                jv_total_amount = sum(entry['amount'] for entry in jv_entries)
                current_date = datetime.now().strftime('%Y-%m-%d')
                
                jv_head = {
                    "tran_type": "JV",
                    "doc_date": current_date,
                    "company_code": company_code,
                    "year_code": year_code,
                    "total": f"{jv_total_amount:.2f}",
                    "Created_By": Created_By,
                    "Modified_By": "",
                }

                jv_details = []
                detail_counter = 1
                
                for entry in jv_entries:
                    if entry['type'] == 'debit':
                        jv_details.append({
                            "rowaction": "add",
                            "detail_id": detail_counter,
                            "Tran_Type": "JV",
                            "doc_date": current_date,
                            "debit_ac": entry['accode'],
                            "da": entry['ac'],
                            "credit_ac": entry['accode'],
                            "ca": entry['ac'],
                            "amount": f"{entry['amount']:.2f}",
                            "narration": f"DEBIT AMOUNT TRANSFER TO ROUNDED OFF - {entry['acname']}",
                            "Company_Code": company_code,
                            "Year_Code": year_code,
                            "Group_Code": 1,
                            "drcr": "C",
                            "Branch_Code": 1,
                            "ac": "",
                            "gcid": 71,
                            "AcadjAccode": "",
                            "AcadjAmt": 0,
                            "Adjusted_Amount": 0
                        })
                        detail_counter += 1

                        jv_details.append({
                            "rowaction": "add",
                            "detail_id": detail_counter,
                            "Tran_Type": "JV",
                            "doc_date": current_date,
                            "debit_ac": RoundOffAcCode,
                            "da": RoundOffAccoid,
                            "credit_ac": RoundOffAcCode,
                            "ca": RoundOffAccoid,
                            "amount": f"{entry['amount']:.2f}",
                            "narration": f"DEBIT AMOUNT TRANSFER TO ROUNDED OFF - {entry['acname']}",
                            "Company_Code": company_code,
                            "Year_Code": year_code,
                            "Group_Code": 1,
                            "drcr": "D",
                            "Branch_Code": 1,
                            "ac": "",
                            "gcid": 71,
                            "AcadjAccode": "",
                            "AcadjAmt": 0,
                            "Adjusted_Amount": 0
                        })
                        detail_counter += 1
                    else:
                        jv_details.append({
                            "rowaction": "add",
                            "detail_id": detail_counter,
                            "Tran_Type": "JV",
                            "doc_date": current_date,
                            "debit_ac": entry['accode'],
                            "da": entry['ac'],
                            "credit_ac": entry['accode'],
                            "ca": entry['ac'],
                            "amount": f"{entry['amount']:.2f}",
                            "narration": f"CREDIT AMOUNT TRANSFER TO ROUNDED OFF - {entry['acname']}",
                            "Company_Code": company_code,
                            "Year_Code": year_code,
                            "Group_Code": 1,
                            "drcr": "D",
                            "Branch_Code": 1,
                            "ac": "",
                            "gcid": 71,
                            "AcadjAccode": "",
                            "AcadjAmt": 0,
                            "Adjusted_Amount": 0
                        })
                        detail_counter += 1

                        jv_details.append({
                            "rowaction": "add",
                            "detail_id": detail_counter,
                            "Tran_Type": "JV",
                            "doc_date": current_date,
                            "debit_ac": RoundOffAcCode,
                            "da": RoundOffAccoid,
                            "credit_ac": RoundOffAcCode,
                            "ca": RoundOffAccoid,
                            "amount": f"{entry['amount']:.2f}",
                            "narration": f"CREDIT AMOUNT TRANSFER TO ROUNDED OFF - {entry['acname']}",
                            "Company_Code": company_code,
                            "Year_Code": year_code,
                            "Group_Code": 1,
                            "drcr": "C",
                            "Branch_Code": 1,
                            "ac": "",
                            "gcid": 71,
                            "AcadjAccode": "",
                            "AcadjAmt": 0,
                            "Adjusted_Amount": 0
                        })
                        detail_counter += 1

                jv_url = f"{API_SERVER}/insert-receiptpayment"
                jv_response = requests.post(jv_url, json={
                    "head_data": jv_head,
                    "detail_data": jv_details
                })

                if jv_response.status_code != 200:
                    raise Exception(f"JV API failed: {jv_response.text}")

                success_count = len(jv_entries)
                doc_no = jv_response.json().get('doc_no', '')

                return jsonify({
                    'success': True,
                    'message': 'JV created successfully',
                    'doc_no': doc_no,
                    'total_amount': jv_total_amount,
                    'entry_count': len(jv_entries),
                    'stats': {
                        'success_count': success_count,
                        'error_count': error_count
                    },
                    'errors': error_details if error_count > 0 else None
                })

            except Exception as e:
                error_details.append({
                    'error': f'JV creation failed: {str(e)}',
                    'step': 'JV creation'
                })
                return jsonify({
                    'success': False,
                    'error': str(e),
                    'error_details': error_details
                }), 400

        return jsonify({
            'success': False,
            'error': 'No valid entries to process',
            'error_details': error_details
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    

@app.route(API_URL + '/calculate-depreciation', methods=['POST'])
def calculate_depreciation():
    try:
        data = request.get_json()
        as_on_date_str = data.get("as_on_date")     # Expecting format: "YYYY-MM-DD"
        start_date_str = data.get("start_date")     # Format: "YYYY-MM-DD"
        end_date_str = data.get("end_date")         # Format: "YYYY-MM-DD"
        company_code = data.get("company_code")     # Passed as string or int

        if not all([as_on_date_str, start_date_str, end_date_str, company_code]):
            return jsonify({"error": "Missing required fields"}), 400

        # Parse all dates in the expected format
        as_on_date = datetime.strptime(as_on_date_str, "%Y-%m-%d")
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
        six_month_cutoff = datetime.strptime(f"{start_date.year}-09-30", "%Y-%m-%d")

        # Fetch fixed asset accounts
        qry_accounts = text("""
            SELECT AC_CODE, Ac_Name_E, Ac_rate, accoid
            FROM nt_1_accountmaster
            WHERE Ac_type='F' AND company_code=:company_code
        """)
        result = db.session.execute(qry_accounts, {"company_code": company_code})
        accounts = result.fetchall()

        depreciation_data = []

        for row in accounts:
            accode = row.AC_CODE
            acname = row.Ac_Name_E
            accoid = row.accoid
            intrate = float(row.Ac_rate or 0)

            # Opening balance before financial year
            qry_op = text("""
                SELECT SUM(CASE drcr WHEN 'D' THEN amount WHEN 'C' THEN -amount END) AS Balance
                FROM qrygledger
                WHERE AC_CODE = :accode AND DOC_DATE < :start_date AND COMPANY_CODE = :company_code
            """)
            op_result = db.session.execute(qry_op, {
                "accode": accode,
                "start_date": start_date.strftime('%Y-%m-%d'),
                "company_code": company_code
            }).scalar() or 0.0
            op_result = float(op_result)

            # Additions in first 6 months
            qry_dr1 = text("""
                SELECT SUM(amount) FROM qrygledger
                WHERE drcr='D' AND AC_CODE = :accode AND DOC_DATE BETWEEN :start_date AND :six_month_cutoff AND COMPANY_CODE = :company_code
            """)
            dr1 = db.session.execute(qry_dr1, {
                "accode": accode,
                "start_date": start_date.strftime('%Y-%m-%d'),
                "six_month_cutoff": six_month_cutoff.strftime('%Y-%m-%d'),
                "company_code": company_code
            }).scalar() or 0.0
            dr1 = float(dr1)

            # Additions after cutoff date
            qry_dr2 = text("""
                SELECT SUM(amount) FROM qrygledger
                WHERE drcr='D' AND AC_CODE = :accode AND DOC_DATE > :six_month_cutoff AND DOC_DATE <= :end_date AND COMPANY_CODE = :company_code
            """)
            dr2 = db.session.execute(qry_dr2, {
                "accode": accode,
                "six_month_cutoff": six_month_cutoff.strftime('%Y-%m-%d'),
                "end_date": end_date.strftime('%Y-%m-%d'),
                "company_code": company_code
            }).scalar() or 0.0
            dr2 = float(dr2)

            # Deletions (credits)
            qry_cr = text("""
                SELECT SUM(amount) FROM qrygledger
                WHERE drcr='C' AND AC_CODE = :accode AND DOC_DATE BETWEEN :start_date AND :end_date AND COMPANY_CODE = :company_code
            """)
            cr = db.session.execute(qry_cr, {
                "accode": accode,
                "start_date": start_date.strftime('%Y-%m-%d'),
                "end_date": end_date.strftime('%Y-%m-%d'),
                "company_code": company_code
            }).scalar() or 0.0
            cr = float(cr)

            # Final calculations
            balance = op_result + dr1 + dr2 - cr
            depreciation = round(((op_result + dr1) * intrate / 100), 0)
            depreciation += round(((dr2 * (intrate / 2)) / 100), 0)
            final_amount = balance - depreciation

            depreciation_data.append({
                "accode": accode,
                "acname": acname,
                "ac":accoid,
                "OpeningBalance": op_result,
                "Before": dr1,
                "After": dr2,
                "Deletion": cr,
                "Balance": balance,
                "Depamount": depreciation,
                "Finalamount": final_amount,
                "InterestRate": intrate
            })

        return jsonify({"data": depreciation_data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

from flask import request, jsonify
from datetime import datetime
import requests

@app.route(API_URL + '/create_depreciationJV', methods=['POST'])
def create_depreciationJV():
    try:
        data = request.json

        if not data or 'rows' not in data:
            return jsonify({'error': 'Invalid request. "rows" missing'}), 400

        company_code = data.get('company_code')
        year_code = data.get('year_code')
        Created_By = data.get('username', '')

        if not company_code or not year_code:
            return jsonify({'error': 'Missing required parameters'}), 400

        # Fetch depreciation account details from company parameters
        company_parameters = fetch_company_parameters(company_code, year_code)
        if not company_parameters:
            return jsonify({'error': 'Company parameters not found'}), 400

        DepreciationAcCode = company_parameters.DepreciationAC
        DepreciationAccoid = company_parameters.DepreciationAccoid

        if not DepreciationAcCode or not DepreciationAccoid:
            return jsonify({'error': 'Depreciation account not configured in company parameters'}), 400

        # Process rows
        depreciation_entries = []
        for row in data['rows']:
            dep_amount = float(row.get('Depamount', 0))
            if dep_amount > 0:
                depreciation_entries.append({
                    'accode': row.get('accode'),
                    'ac': row.get('ac'),
                    'acname': row.get('acname'),
                    'amount': dep_amount,
                })

        if not depreciation_entries:
            return jsonify({'error': 'No depreciation entries found to post'}), 400

        # Create JV Head
        current_date = datetime.now().strftime('%Y-%m-%d')
        total_amount = sum(entry['amount'] for entry in depreciation_entries)

        jv_head = {
            "tran_type": "JV",
            "doc_date": current_date,
            "company_code": company_code,
            "year_code": year_code,
            "total": f"{total_amount:.2f}",
            "Created_By": Created_By,
            "Modified_By": "",
        }

        # Create JV Details
        jv_details = []
        detail_id = 1

        for entry in depreciation_entries:
            narration = f"Depreciation charged on {entry['acname']}"

            # DEBIT: Depreciation A/c
            jv_details.append({
                "rowaction": "add",
                "detail_id": detail_id,
                "Tran_Type": "JV",
                "doc_date": current_date,
                "debit_ac": entry['accode'],
                "da": entry['ac'],
                "credit_ac": entry['accode'],
                "ca": entry['ac'],
                "amount": f"{entry['amount']:.2f}",
                "narration": f"{narration} (Dr {DepreciationAcCode} / Cr {entry['accode']})",
                "Company_Code": company_code,
                "Year_Code": year_code,
                "Group_Code": 1,
                "drcr": "D",
                "Branch_Code": 1,
                "ac": "",
                "gcid": 71,
                "AcadjAccode": "",
                "AcadjAmt": 0,
                "Adjusted_Amount": 0
            })
            detail_id += 1

            # CREDIT: Asset A/c
            jv_details.append({
                "rowaction": "add",
                "detail_id": detail_id,
                "Tran_Type": "JV",
                "doc_date": current_date,
                "debit_ac": DepreciationAcCode,
                "da":DepreciationAccoid,
                "credit_ac": DepreciationAcCode,
                "ca": DepreciationAccoid,
                "amount": f"{entry['amount']:.2f}",
                "narration": f"{narration} (Cr {entry['accode']} / Dr {DepreciationAcCode})",
                "Company_Code": company_code,
                "Year_Code": year_code,
                "Group_Code": 1,
                "drcr": "C",
                "Branch_Code": 1,
                "ac": "",
                "gcid": 71,
                "AcadjAccode": "",
                "AcadjAmt": 0,
                "Adjusted_Amount": 0
            })
            detail_id += 1

        # Post JV via API
        jv_url = f"{API_SERVER}/insert-receiptpayment"
        response = requests.post(jv_url, json={
            "head_data": jv_head,
            "detail_data": jv_details
        })

        if response.status_code != 200:
            return jsonify({
                'success': False,
                'error': 'Failed to post JV',
                'response': response.text
            }), 400

        doc_no = response.json().get('doc_no', '')

        return jsonify({
            'success': True,
            'message': 'Depreciation JV created successfully',
            'doc_no': doc_no,
            'total_amount': total_amount,
            'entry_count': len(depreciation_entries)
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
