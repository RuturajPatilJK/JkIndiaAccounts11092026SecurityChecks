from decimal import Decimal
import json
import traceback
from flask import Flask, jsonify, request
import requests
from app import app, db ,socketio
from app.models.AxisBankApiIntegration.AxisBankValidationModels import AxisbankAPiValidation
from app.utils.CommonGLedgerFunctions import get_accoid
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from datetime import date, datetime
import os
import re
import ipaddress
import hmac
from functools import wraps

API_URL = os.getenv('API_URL')  
API_AUTH_KEY = os.getenv('API_AUTH_KEY')     
API_AUTH_HEADER = 'X-API-KEY' 
API_URL_SERVER = os.getenv('API_URL_SERVER')

VALID_PREFIX_CODE = os.getenv('VALID_PREFIX_CODE')
COMPANY_CODE = int(os.getenv('COMPANY_CODE', 4))
YEAR_CODE = int(os.getenv('YEAR_CODE', 4))
BANK_ACCOUNT_CODE = int(os.getenv('BANK_ACCOUNT_CODE', 11192))
BANK_ACCOUNT_ID = int(os.getenv('BANK_ACCOUNT_ID', 10459))
NARRATION_PREFIX = os.getenv('NARRATION_PREFIX', 'Axis Bank Receipt - ')
SYSTEM_USER = os.getenv('SYSTEM_USER', 'SYSTEM')

#Whitelisting AXIS Bank IP
AXIS_BANK_IP_RANGES = [
    ("36.255.30.29", "36.255.30.30"),
    ("36.255.31.29", "36.255.31.30"),
    ("59.144.108.23", "59.144.108.26"),
    ("59.144.108.199", "59.144.108.199"),
    ("103.208.250.29", "103.208.250.30"),
    ("103.208.251.29", "103.208.251.30"),
    ("115.112.84.23", "115.112.84.26"),
    ("115.112.84.199", "115.112.84.199"),
    ("119.226.231.26", "119.226.231.28"),
    ("122.15.183.144", "122.15.183.144"),
    ("122.15.128.143", "122.15.128.146"),
    ("122.15.128.199", "122.15.128.199"),
    ("45.119.45.228", "45.119.45.228"),
    ("127.0.0.1", "127.0.0.1"),
    
]

#Authnticate the APIS
def authenticate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        provided_auth_key = request.headers.get(API_AUTH_HEADER)
        if not provided_auth_key:
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "001",
                "Message": "Authentication failed"
            }), 401
            
        if not hmac.compare_digest(provided_auth_key, API_AUTH_KEY):
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "001",
                "Message": "Authentication failed"
            }), 401
                
        return f(*args, **kwargs)
    return decorated_function

def is_ip_whitelisted(ip_str):
    try:
        ip = ipaddress.ip_address(ip_str)
        for start_ip, end_ip in AXIS_BANK_IP_RANGES:
            if ipaddress.ip_address(start_ip) <= ip <= ipaddress.ip_address(end_ip):
                return True
        return False
    except ValueError:
        return False

def get_client_ip():
    if 'X-Forwarded-For' in request.headers:
        return request.headers['X-Forwarded-For'].split(',')[0].strip()
    return request.remote_addr

#Client IP Whitelisting
PROTECTED_ENDPOINTS = ['receiptvalidation', 'notification']
@app.before_request
def check_ip_whitelist():
    if request.endpoint in PROTECTED_ENDPOINTS:
        client_ip = get_client_ip()
        if not client_ip:
            app.logger.warning("Could not determine client IP")
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "403",
                "Message": "Could not verify client identity"
            }), 403
            
        if not is_ip_whitelisted(client_ip):
            app.logger.warning(f"Unauthorized IP attempt: {client_ip}")
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "403",
                "Message": f"IP {client_ip} not authorized"
            }), 403

#Receiptvalidation API
@app.route(f"{API_URL}/receiptvalidation", methods=["POST"])
@authenticate
def receiptvalidation():
    try:
        client_ip = get_client_ip()
        if not client_ip:
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "403",
                "Message": "Could not verify client identity"
            }), 403

        new_record_data = request.json
        
        required_fields = ["UTR", "Bene_acc_no", "Req_dt_time","Req_type","Tran_id"]
        if not all(field in new_record_data for field in required_fields):
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "400",
                "Message": "Missing required fields"
            }), 400
        
        if new_record_data.get('Req_type') != "validation":
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "400",
                "Message": "Invalid Req_type. Must be 'validation'"
            }), 400

        utr_number = new_record_data['UTR']
        bene_acc_no_full = new_record_data['Bene_acc_no']
        req_dt_time_str = new_record_data['Req_dt_time']
        
        try:
            req_dt_time = datetime.strptime(req_dt_time_str, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "400",
                "Message": "Invalid date/time format. Use YYYY-MM-DD HH:MI:SS."
            }), 400

        valid_prefix = os.getenv('VALID_PREFIX_CODE')
        
        if not bene_acc_no_full.startswith(valid_prefix):
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "002",
                "Message": f"Invalid bene a/c no. or client code."
            }), 400

        account_number_match = re.search(r'\d+$', bene_acc_no_full[len(valid_prefix):])
        
        if not account_number_match:
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "002",
                "Message": "Invalid bene a/c no. or client code."
            }), 400 

        ac_code = int(account_number_match.group())

        account_exists_query = text("""
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM nt_1_accountmaster WHERE Ac_Code = :ac_code
            ) THEN 'True' ELSE 'False' END AS RecordExists
        """)
        result = db.session.execute(account_exists_query, {'ac_code': ac_code}).scalar()

        if result == 'False':
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "002",
                "Message": "Invalid bene a/c no. or client code."
            }), 200 

        duplicate_check = AxisbankAPiValidation.query.filter_by(
            UTR=utr_number,
            Req_dt_time=req_dt_time,
            Req_type="validation"
        ).first()

        if duplicate_check:
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "002", 
                "Message": "Duplicate transaction found for UTR and date/time."
            }), 200 

        new_record = AxisbankAPiValidation(
            UTR=utr_number,
            Bene_acc_no=bene_acc_no_full,
            Req_type=new_record_data.get('Req_type'),
            Req_dt_time=req_dt_time,
            Txn_amnt=new_record_data.get('Txn_amnt'),
            Corp_code=new_record_data.get('Corp_code'),
            Pmode=new_record_data.get('Pmode'),
            Sndr_acnt=new_record_data.get('Sndr_acnt'),
            Sndr_nm=new_record_data.get('Sndr_nm'),
            Sndr_acnt1=new_record_data.get('Sndr_acnt1'),
            Sndr_nm1=new_record_data.get('Sndr_nm1'),
            Sndr_ifsc=new_record_data.get('Sndr_ifsc'),
            Tran_id=new_record_data.get('Tran_id'),
            Stts_flg="S",
            Err_cd="000",
            Message="Success"
        )

        record_dict = {
            "UTR": new_record.UTR,
            "Bene_acc_no": new_record.Bene_acc_no,
            "Req_type": new_record.Req_type,
            "Req_dt_time": new_record.Req_dt_time.isoformat() if new_record.Req_dt_time else None,
            "Txn_amnt": new_record.Txn_amnt,
            "Corp_code": new_record.Corp_code,
            "Pmode": new_record.Pmode,
            "Sndr_acnt": new_record.Sndr_acnt,
            "Sndr_nm": new_record.Sndr_nm,
            "Sndr_acnt1": new_record.Sndr_acnt1,
            "Sndr_nm1": new_record.Sndr_nm1,
            "Sndr_ifsc": new_record.Sndr_ifsc,
            "Tran_id": new_record.Tran_id,
            "Stts_flg": new_record.Stts_flg,
            "Err_cd": new_record.Err_cd,
            "Message": new_record.Message
        }
        
        new_record.Client_IP = client_ip
        
        db.session.add(new_record)
        db.session.commit()

        socketio.emit("receiptvalidation_success", {
            "status": "success",
            "data": record_dict,
        })
        
        return jsonify({
            "Stts_flg": "S",
            "Err_cd": "000",
            "Message": "Success"
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            "Stts_flg": "F",
            "Err_cd": "500", 
            "Message": "Database error occurred"
        }), 500

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Unexpected error: {traceback.format_exc()}")
        return jsonify({
            "Stts_flg": "F",
            "Err_cd": "500",
            "Message": "Internal server error"
        }), 500
    


@app.route(f"{API_URL}/notification", methods=["POST"])
@authenticate
def notification():
    try:
        client_ip = get_client_ip()
        if not client_ip:
            app.logger.error("Could not verify client identity.")
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "403",
                "Message": "Could not verify client identity"
            }), 403

        new_record_data = request.json
        if not new_record_data:
            app.logger.error("No JSON payload received.")
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "400",
                "Message": "Invalid JSON payload"
            }), 400

        required_fields = ["UTR", "Bene_acc_no", "Req_dt_time", "Req_type", "Tran_id"]
        if not all(field in new_record_data for field in required_fields):
            app.logger.error(f"Missing required fields in payload: {required_fields}")
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "400",
                "Message": "Missing required fields"
            }), 400
        
        if new_record_data.get('Req_type') != "notification":
            app.logger.error(f"Invalid Req_type: {new_record_data.get('Req_type')}")
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "400",
                "Message": "Invalid Req_type. Must be 'notification'"
            }), 400

        utr_number = new_record_data['UTR']
        bene_acc_no_full = new_record_data['Bene_acc_no']
        req_dt_time_str = new_record_data['Req_dt_time']
        Pmode = new_record_data['Pmode']
        Sndr_nm = new_record_data['Sndr_nm']
        Sndr_nm1 = new_record_data['Sndr_nm1']
        Sndr_acnt1 = new_record_data['Sndr_acnt1']
        Sndr_acnt = new_record_data['Sndr_acnt']
        
        try:
            req_dt_time = datetime.strptime(req_dt_time_str, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            app.logger.error(f"Invalid date/time format: {req_dt_time_str}")
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "400",
                "Message": "Invalid date/time format. Use YYYY-MM-DD HH:MI:SS."
            }), 400

        if not bene_acc_no_full.startswith(VALID_PREFIX_CODE):
            app.logger.error(f"Invalid bene a/c no. prefix: {bene_acc_no_full}")
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "002",
                "Message": f"Invalid bene a/c no. or client code."
            }), 400

        account_number_part = bene_acc_no_full[len(VALID_PREFIX_CODE):]
        account_number_match = re.search(r'\d+$', account_number_part)
        
        if not account_number_match:
            app.logger.error(f"Could not extract account number from {bene_acc_no_full}")
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "002",
                "Message": "Invalid bene a/c no. or client code."
            }), 400 

        ac_code = int(account_number_match.group())

        account_exists_query = text("""
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM nt_1_accountmaster WHERE Ac_Code = :ac_code
            ) THEN 'True' ELSE 'False' END AS RecordExists
        """)
        
        try:
            result = db.session.execute(account_exists_query, {'ac_code': ac_code}).scalar()
        except SQLAlchemyError as e:
            app.logger.error(f"Database error during account check: {e}")
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "500",
                "Message": "Database error occurred during account validation"
            }), 500

        if result == 'False':
            app.logger.warning(f"Account code {ac_code} not found in account master.")
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "002",
                "Message": "Invalid bene a/c no. or client code."
            }), 200 

        duplicate_check = AxisbankAPiValidation.query.filter_by(
            UTR=utr_number,
            Req_dt_time=req_dt_time,
            Req_type="notification"
        ).first()

        if duplicate_check:
            app.logger.warning(f"Duplicate transaction found for UTR {utr_number}.")
            return jsonify({
                "Stts_flg": "F",
                "Err_cd": "002", 
                "Message": "Duplicate transaction found for UTR and date/time."
            }), 200 

        db.session.begin_nested()
        br_success = False
        br_response_data = None
        
        txn_amount = float(new_record_data.get('Txn_amnt', 0))
        doc_date = req_dt_time.date().strftime('%Y-%m-%d')
        
        try:
            if API_URL_SERVER:
                head_check_query = text("""
                    SELECT tranid, doc_no, total, cashbank, cb, doc_date, company_code, year_code 
                    FROM nt_1_transacthead 
                    WHERE Tran_Type = 'BR' 
                    AND Doc_Date = :doc_date 
                    AND Company_Code = :company_code 
                    AND Year_Code = :year_code
                    AND cashbank = :cashbank
                    order by doc_no desc 
                """)
                
                head_result = db.session.execute(head_check_query, {
                    'doc_date': doc_date,
                    'company_code': COMPANY_CODE,
                    'year_code': YEAR_CODE,
                    'cashbank': BANK_ACCOUNT_CODE
                }).fetchone()

                head_exists = head_result is not None
                accoid = get_accoid(ac_code,COMPANY_CODE)
                
                if head_exists:
                    tranid, doc_no, current_total, _, _, _, _, _ = head_result
                    new_total = float(current_total) + txn_amount
                    
                    br_head = {
                        "tran_type": "BR",
                        "doc_date": doc_date,
                        "doc_no": doc_no,
                        "company_code": COMPANY_CODE,
                        "year_code": YEAR_CODE,
                        "total": f"{new_total:.2f}",
                        "Modified_By": SYSTEM_USER,
                        "cashbank": BANK_ACCOUNT_CODE,
                        "cb": BANK_ACCOUNT_ID,
                        "Created_By": "",
                        "User_Id": 0
                    }
                    
                    existing_details_query = text("""
                        SELECT 
                            trandetailid, Tran_Type, doc_date, doc_no, debit_ac, da, credit_ac, 
                            ca, amount, narration, Company_Code, Year_Code, Group_Code, 
                            drcr, TDS_Amt, TDS_Rate, Branch_Code, ac, gcid, drpFilterValue, tranid
                        FROM nt_1_transactdetail 
                        WHERE Tran_Type = 'BR' 
                        AND Doc_No = :doc_no
                        AND Company_Code = :company_code 
                        AND Year_Code = :year_code
                    """)
                    
                    existing_details_result = db.session.execute(existing_details_query, {
                        'doc_no': doc_no,
                        'company_code': COMPANY_CODE,
                        'year_code': YEAR_CODE
                    }).all()
                    
                    br_details = []
                    
                
                    for row in existing_details_result:
                        detail_dict = dict(row._mapping) 
                        
                 
                        for key, value in detail_dict.items():
                            if isinstance(value, Decimal):
                                detail_dict[key] = float(value)
                            elif isinstance(value, (date, datetime)):
                                detail_dict[key] = value.isoformat()
                        
                      
                        detail_dict['rowaction'] = 'update'
                        br_details.append(detail_dict)
                
                    max_detail_id_query = text("""
                        SELECT ISNULL(MAX(detail_id), 0) FROM nt_1_transactdetail 
                        WHERE Tran_Type = 'BR' 
                        AND Doc_No = :doc_no
                        AND Company_Code = :company_code 
                        AND Year_Code = :year_code
                    """)
                    
                    max_detail_id = db.session.execute(max_detail_id_query, {
                        'doc_no': doc_no,
                        'company_code': COMPANY_CODE,
                        'year_code': YEAR_CODE
                    }).scalar()
                    
                    detail_id = max_detail_id + 1
                    
                    
                    new_detail = {
                        "rowaction": "add",
                        "detail_id": detail_id,
                        "Tran_Type": "BR",
                        "doc_date": doc_date,
                        "doc_no": doc_no,
                        "debit_ac": BANK_ACCOUNT_CODE,
                        "da": BANK_ACCOUNT_ID,
                        "credit_ac": ac_code,
                        "ca": accoid,
                        "amount": f"{txn_amount:.2f}",
                        "narration": f"{Pmode}/{utr_number}/{Sndr_nm}/{Sndr_acnt}/{Sndr_nm1}/{Sndr_acnt1}",
                        "Company_Code": COMPANY_CODE,
                        "Year_Code": YEAR_CODE,
                        "Group_Code": 1,
                        "drcr": "C", 
                        "TDS_Amt": "0.00",
                        "TDS_Rate": "0.00",
                        "Branch_Code": 1,
                        "ac": accoid,
                        "gcid": 71,
                        "drpFilterValue": "O",
                        "tranid": tranid
                    }
                    
                    br_details.append(new_detail)
                    
                    br_url = f"{API_URL_SERVER}/update-receiptpayment?tranid={tranid}"
                    br_response = requests.put(br_url, json={
                        "head_data": br_head,
                        "detail_data": br_details
                    }, timeout=30)
                    
                else:
                    br_head = {
                        "tran_type": "BR",
                        "doc_date": doc_date,
                        "company_code": COMPANY_CODE,
                        "year_code": YEAR_CODE,
                        "total": f"{txn_amount:.2f}",
                        "Created_By": SYSTEM_USER,
                        "Modified_By": "",
                        "cashbank": BANK_ACCOUNT_CODE,
                        "cb": BANK_ACCOUNT_ID,
                    }
                    
                    br_details = [{
                        "rowaction": "add",
                        "detail_id": 1,
                        "Tran_Type": "BR",
                        "doc_date": doc_date,
                        "doc_no": 0,
                        "debit_ac": BANK_ACCOUNT_CODE,
                        "da": BANK_ACCOUNT_ID,
                        "credit_ac": ac_code,
                        "ca": accoid,
                        "amount": f"{txn_amount:.2f}",
                        "narration": f"{Pmode}/{utr_number}/{Sndr_nm}/{Sndr_acnt}/{Sndr_nm1}/{Sndr_acnt1}",
                        "Company_Code": COMPANY_CODE,
                        "Year_Code": YEAR_CODE,
                        "Group_Code": 1,
                        "drcr": "C",
                        "TDS_Amt": "0.00",
                        "TDS_Rate": "0.00",
                        "Branch_Code": 1,
                        "ac": accoid,
                        "gcid": 71,
                        "drpFilterValue": "O"
                    }]

                    br_url = f"{API_URL_SERVER}/insert-receiptpaymentbank"
                    br_response = requests.post(br_url, json={
                        "head_data": br_head,
                        "detail_data": br_details,
                        "head_exists": False
                    }, timeout=30)

                if br_response.status_code in [200, 201]:
                    br_success = True
                    br_response_data = br_response.json()
                    app.logger.info(f"BR {'updated' if head_exists else 'created'} successfully for UTR: {utr_number}")
                else:
                    br_success = False
                    error_msg = br_response.text if br_response else 'No response'
                    app.logger.error(f"BR API failed with status {br_response.status_code if br_response else 'N/A'}: {error_msg}")
            else:
                app.logger.warning("API_SERVER not configured, skipping BR creation")
                br_success = False
        
        except requests.exceptions.RequestException as req_e:
            app.logger.error(f"Network error calling BR API: {req_e}")
            br_success = False
        except Exception as e:
            app.logger.error(f"Unexpected error during BR API call: {e}")
            br_success = False

        new_record = AxisbankAPiValidation(
            UTR=utr_number,
            Bene_acc_no=bene_acc_no_full,
            Req_type=new_record_data.get('Req_type'),
            Req_dt_time=req_dt_time,
            Txn_amnt=txn_amount,
            Corp_code=new_record_data.get('Corp_code'),
            Pmode=new_record_data.get('Pmode'),
            Sndr_acnt=new_record_data.get('Sndr_acnt'),
            Sndr_nm=new_record_data.get('Sndr_nm'),
            Sndr_acnt1=new_record_data.get('Sndr_acnt1'),
            Sndr_nm1=new_record_data.get('Sndr_nm1'),
            Sndr_ifsc=new_record_data.get('Sndr_ifsc'),
            Tran_id=new_record_data.get('Tran_id'),
            Stts_flg="S" if br_success else "P",
            Err_cd="000" if br_success else "003",
            Message="Success" if br_success else "Notification received but BR creation failed"
        )
        
        new_record.Client_IP = client_ip
        db.session.add(new_record)
        
        db.session.commit()

        serializable_br_response = None
        if br_response_data and isinstance(br_response_data, (dict, list)):
            serializable_br_response = json.loads(json.dumps(br_response_data, default=str))
        elif br_response_data:
            serializable_br_response = str(br_response_data)

        socketio.emit("notification_success", {
            "status": "success" if br_success else "partial",
            "data": {
                'Stts_flg': new_record.Stts_flg,
                'Err_cd': new_record.Err_cd,
                'Message': new_record.Message,
            },
            "br_created": br_success,
            "br_response": serializable_br_response
        })
        
        return jsonify({
            "Stts_flg": "S" if br_success else "P",
            "Err_cd": "000" if br_success else "003",
            "Message": "Success" if br_success else "Notification received but BR creation failed",
            # "BR_Response": br_response_data
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        app.logger.error(f"Database error: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            "Stts_flg": "F",
            "Err_cd": "500", 
            "Message": "Database error occurred"
        }), 500

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Unexpected error: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            "Stts_flg": "F",
            "Err_cd": "500",
            "Message": "Internal server error"
        }), 500