import pathlib
from app import app, db
from app.models.AxisBankApiIntegration.AxisBankTransferModels import TransferPayment, PaymentStatus  # Import both models
import os
import requests
import json
import uuid
import hashlib
from datetime import datetime
from flask import jsonify, request
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from requests_pkcs12 import Pkcs12Adapter 
import base64
import random
import string

API_URL = os.getenv('API_URL')
KEY_HEX_128 = os.getenv('AXIS_BANK_KEY')
IV_BYTES = bytes([0x8E, 0x12, 0x39, 0x9C, 0x07, 0x72, 0x6F, 0x5A, 0x8E, 0x12, 0x39, 0x9C, 0x07, 0x72, 0x6F, 0x5A])

X_IBM_CLIENT_ID = os.getenv('AXIS_CLIENT_ID')
X_IBM_CLIENT_SECRET = os.getenv('AXIS_CLIENT_SECRET')

BANK_TRANSFER_URL = os.getenv('AXIS_BANK_TRANSFER_URL')
BANK_GET_STATUS_URL = os.getenv('AXIS_BANK_GET_STATUS_URL')

CHANNEL_ID = os.getenv('AXIS_CHANNEL_ID')
CORPORATE_CODE = os.getenv('AXIS_CORPORATE_CODE')

CERT_FILE = str(pathlib.Path(__file__).parent.joinpath('accounts.ebuysugar.com.p12'))
CERT_PASSWORD = os.getenv('AXIS_CERT_PASSWORD')

def generate_cust_uniq_ref(length=30):
    uuid_base = str(uuid.uuid4()).replace('-', '')
    
    if length < 32:
        return uuid_base[:length]
    
    if length > 32:
        additional_chars = length - 32
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=additional_chars))
        return uuid_base + random_suffix
    
    return uuid_base


# ====== CHECKSUM CALCULATION ======
def normalize_value(val):
    if val is None:
        return ""
    if isinstance(val, (int, float)):
        return str(val)
    s = str(val).strip()
    return "" if s.lower() == "null" or s == "" else s

def calculate_checksum_correct(body_part):
    import copy
    body_copy = copy.deepcopy(body_part)
    
    if 'checksum' in body_copy:
        del body_copy['checksum']
    
    print(json.dumps(body_copy, indent=2))
    
    def extract_values_flat(obj, path=""):
        values = []
        
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key == "checksum":
                    continue
                if isinstance(value, (dict, list)):
                    values.extend(extract_values_flat(value, f"{path}.{key}" if path else key))
                else:
                    normalized = normalize_value(value)
                    values.append(normalized)
                    print(f"Checksum value - {key}: '{normalized}'")
        
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                if isinstance(item, (dict, list)):
                    values.extend(extract_values_flat(item, f"{path}[{i}]" if path else f"[{i}]"))
                else:
                    normalized = normalize_value(item)
                    values.append(normalized)
                    print(f"Checksum value - {path}[{i}]: '{normalized}'")
        
        else:
            normalized = normalize_value(obj)
            values.append(normalized)
            print(f"Checksum value - {path}: '{normalized}'")
        
        return values
    
    all_values = extract_values_flat(body_copy)
    
    checksum_string = "".join(all_values)

    checksum = hashlib.md5(checksum_string.encode('utf-8')).hexdigest().lower()
    
    return checksum

# ====== ENCRYPTION/DECRYPTION ======
def aes128_cbc_encrypt_prepend_iv(utf8_str, key_hex, iv_bytes):
    key = bytes.fromhex(key_hex)
    
    padder = padding.PKCS7(algorithms.AES.block_size).padder()
    padded_data = padder.update(utf8_str.encode('utf-8')) + padder.finalize()
    
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv_bytes), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()
    
    iv_plus_cipher = iv_bytes + ciphertext
    
    return base64.b64encode(iv_plus_cipher).decode('utf-8')

def aes128_cbc_decrypt_iv_prepended(b64_str, key_hex):
    key = bytes.fromhex(key_hex)
    iv_plus_cipher = base64.b64decode(b64_str)
    
    iv_from_payload = iv_plus_cipher[:16]
    ciphertext_from_payload = iv_plus_cipher[16:]
    
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv_from_payload), backend=default_backend())
    decryptor = cipher.decryptor()
    padded_data = decryptor.update(ciphertext_from_payload) + decryptor.finalize()
    
    unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
    unpadded_data = unpadder.update(padded_data) + unpadder.finalize()
    
    return unpadded_data.decode('utf-8')

# ====== DATABASE HELPER FUNCTIONS ======
def save_transfer_request_to_db(request_data, request_uuid, cust_uniq_ref, checksum):
    """Save transfer payment request to database"""
    try:
        transfer_request = request_data.get('TransferPaymentRequest', {})
        body_part = transfer_request.get('TransferPaymentRequestBody', {})
        payment_details = body_part.get('paymentDetails', [{}])[0] if body_part.get('paymentDetails') else {}
        invoice_details = payment_details.get('invoiceDetails', [{}])[0] if payment_details.get('invoiceDetails') else {}
        
        transfer_record = TransferPayment(
            requestUUID=request_uuid,
            serviceRequestId=transfer_request.get('SubHeader', {}).get('serviceRequestId', 'OpenAPI'),
            serviceRequestVersion=transfer_request.get('SubHeader', {}).get('serviceRequestVersion', '1.0'),
            channelId=transfer_request.get('SubHeader', {}).get('channelId', CHANNEL_ID),
            
            corpCode=body_part.get('corpCode', CORPORATE_CODE),
            
            txnPaymode=payment_details.get('txnPaymode', ''),
            custUniqRef=cust_uniq_ref, 
            corpAccNum=payment_details.get('corpAccNum', ''),
            valueDate=datetime.strptime(payment_details.get('valueDate', ''), '%Y-%m-%d').date(),
            txnAmount=payment_details.get('txnAmount', '0'),
            beneLEI=payment_details.get('beneLEI', ''),
            beneName=payment_details.get('beneName', ''),
            beneCode=payment_details.get('beneCode', ''),
            beneAccNum=payment_details.get('beneAccNum', ''),
            beneAcType=payment_details.get('beneAcType', ''),
            beneAddr1=payment_details.get('beneAddr1', ''),
            beneAddr2=payment_details.get('beneAddr2', ''),
            beneAddr3=payment_details.get('beneAddr3', ''),
            beneCity=payment_details.get('beneCity', ''),
            beneState=payment_details.get('beneState', ''),
            benePincode=payment_details.get('benePincode', ''),
            beneIfscCode=payment_details.get('beneIfscCode', ''),
            beneBankName=payment_details.get('beneBankName', ''),
            baseCode=payment_details.get('baseCode', ''),
            chequeNumber=payment_details.get('chequeNumber', ''),
            chequeDate=payment_details.get('chequeDate', ''),
            payableLocation=payment_details.get('payableLocation', ''),
            printLocation=payment_details.get('printLocation', ''),
            beneEmailAddr1=payment_details.get('beneEmailAddr1', ''),
            beneMobileNo=payment_details.get('beneMobileNo', ''),
            productCode=payment_details.get('productCode', ''),
            txnType=payment_details.get('txnType', 'VEND'),
            enrichment1=payment_details.get('enrichment1', ''),
            enrichment2=payment_details.get('enrichment2', ''),
            enrichment3=payment_details.get('enrichment3', ''),
            enrichment4=payment_details.get('enrichment4', ''),
            enrichment5=payment_details.get('enrichment5', ''),
            senderToReceiverInfo=payment_details.get('senderToReceiverInfo', ''),
            
            invoiceAmount=invoice_details.get('invoiceAmount', '0'),
            invoiceNumber=invoice_details.get('invoiceNumber', ''),
            invoiceDate=invoice_details.get('invoiceDate', ''),
            cashDiscount=invoice_details.get('cashDiscount', '0.00'),
            tax=invoice_details.get('tax', '0.00'),
            netAmount=invoice_details.get('netAmount', '0.00'),
            invoiceInfo1=invoice_details.get('invoiceInfo1', ''),
            invoiceInfo2=invoice_details.get('invoiceInfo2', ''),
            invoiceInfo3=invoice_details.get('invoiceInfo3', ''),
            invoiceInfo4=invoice_details.get('invoiceInfo4', ''),
            invoiceInfo5=invoice_details.get('invoiceInfo5', ''),
            
            checksum=checksum,
            
            status='PENDING'
        )
        
        db.session.add(transfer_record)
        db.session.commit()
        print(f"Transfer request saved to database with UUID: {request_uuid}, custUniqRef: {cust_uniq_ref}")
        return transfer_record
        
    except Exception as e:
        db.session.rollback()
        print(f"Error saving transfer request to database: {str(e)}")
        return None

def update_transfer_response_in_db(request_uuid, bank_response, decrypted_response=None):
    try:
        transfer_record = TransferPayment.query.filter_by(requestUUID=request_uuid).first()
        if not transfer_record:
            print(f" No record found for UUID: {request_uuid}")
            return None
        
        transfer_record.encryptedResponse = json.dumps(bank_response)
        
        if decrypted_response:
            transfer_record.decryptedResponse = json.dumps(decrypted_response)
            
            transfer_response = decrypted_response.get('TransferPaymentResponse', {})
            if transfer_response:
                response_data = transfer_response.get('TransferPaymentResponse', {})
                if not response_data:
                    response_data = transfer_response
                
                transfer_record.responseMessage = response_data.get('message', '')
                transfer_record.status = 'SUCCESS' if response_data.get('status') == 'S' else 'FAILED'
                
                data_field = response_data.get('data')
                if data_field and isinstance(data_field, dict):
                    transfer_record.bankReferenceNo = data_field.get('bankReferenceNo')
                    transfer_record.responseCode = data_field.get('responseCode')
                    transfer_record.approvalNumber = data_field.get('approvalNumber')
                    transfer_record.utrNumber = data_field.get('utrNumber')
                    if data_field.get('transactionDate'):
                        try:
                            transfer_record.transactionDate = datetime.strptime(
                                data_field.get('transactionDate'), 
                                '%Y-%m-%d %H:%M:%S'
                            )
                        except:
                            transfer_record.transactionDate = datetime.utcnow()
        
        transfer_record.updated_at = datetime.utcnow()
        db.session.commit()
        print(f"Transfer response updated for UUID: {request_uuid}")
        return transfer_record
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating transfer response in database: {str(e)}")
        return None

def save_or_update_payment_status(request_uuid, get_status_request, bank_response, decrypted_response=None):
    try:
        status_record = PaymentStatus.query.filter_by(requestUUID=request_uuid).first()
        
        if status_record:
            print(f"Updating existing payment status record for UUID: {request_uuid}")
        else:
            status_record = PaymentStatus(requestUUID=request_uuid)
            print(f"Creating new payment status record for UUID: {request_uuid}")
        
        get_status_body = get_status_request.get("GetStatusRequestBody", {})
        
        status_record.channelId = get_status_body.get('channelId', '')
        status_record.corpCode = get_status_body.get('corpCode', '')
        status_record.crn = json.dumps(get_status_body.get('crn', []))
        status_record.checksum = get_status_body.get('checksum', '')
        status_record.encryptedRequest = json.dumps(get_status_request)
        
        status_record.encryptedResponse = json.dumps(bank_response)
        
        if decrypted_response:
            status_record.decryptedResponse = json.dumps(decrypted_response)
            
            get_status_response = decrypted_response.get('GetStatusResponse', {})
            response_body = get_status_response.get('GetStatusResponseBody', {})
            
            if response_body:
                status_record.responseMessage = response_body.get('message', '')
                status_record.overallStatus = response_body.get('status', '')
                
                data_field = response_body.get('data', {})
                if data_field:
                    status_record.errorMessage = data_field.get('errorMessage')
                    status_record.responseChecksum = data_field.get('checksum')
                    
                    cur_txn_enq = data_field.get('CUR_TXN_ENQ', [])
                    if cur_txn_enq:
                        first_txn = cur_txn_enq[0]
                        status_record.corpCodeResponse = first_txn.get('corpCode')
                        status_record.statusDescription = first_txn.get('statusDescription')
                        status_record.batchNo = first_txn.get('batchNo')
                        status_record.utrNo = first_txn.get('utrNo')
                        
                        processing_date_str = first_txn.get('processingDate')
                        if processing_date_str:
                            try:
                                status_record.processingDate = datetime.strptime(
                                    processing_date_str, '%d-%m-%Y %H:%M:%S'
                                )
                            except ValueError:
                                try:
                                    status_record.processingDate = datetime.strptime(
                                        processing_date_str, '%Y-%m-%d %H:%M:%S'
                                    )
                                except:
                                    status_record.processingDate = None
                        
                        status_record.responseCode = first_txn.get('responseCode')
                        status_record.crnResponse = first_txn.get('crn')
                        status_record.transactionStatus = first_txn.get('transactionStatus')
                        
                        status_record.allTransactions = json.dumps(cur_txn_enq)
        
        status_record.updated_at = datetime.utcnow()
        
        if not status_record.id:
            db.session.add(status_record)
        
        db.session.commit()
        print(f"Payment status saved/updated for UUID: {request_uuid}")
        return status_record
        
    except Exception as e:
        db.session.rollback()
        print(f"Error saving/updating payment status in database: {str(e)}")
        return None

# ====== TRANSFER PAYMENT API ======
@app.route(API_URL + '/transfer-payment', methods=['POST'])
def transfer_payment():
    try:
        raw_data = request.get_json()
        
        if not raw_data:
            return jsonify({
                "TransferPaymentResponse": {
                    "SubHeader": {
                        "requestUUID": str(uuid.uuid4()).replace('-', ''),
                        "serviceRequestId": "OpenAPI",
                        "serviceRequestVersion": "1.0",
                        "channelId": CHANNEL_ID
                    },
                    "TransferPaymentResponse": {
                        "data": "",
                        "message": "Invalid request body",
                        "status": "F"
                    }
                }
            }), 400

        print("=== INCOMING TRANSFER PAYMENT REQUEST ===")
        print(json.dumps(raw_data, indent=2))

        transfer_request = raw_data.get('TransferPaymentRequest', {})
        sub_header = transfer_request.get('SubHeader', {})
        body_part = transfer_request.get('TransferPaymentRequestBody', {})
        
        if not body_part:
            return jsonify({
                "TransferPaymentResponse": {
                    "SubHeader": {
                        "requestUUID": str(uuid.uuid4()).replace('-', ''),
                        "serviceRequestId": "OpenAPI",
                        "serviceRequestVersion": "1.0",
                        "channelId": CHANNEL_ID
                    },
                    "TransferPaymentResponse": {
                        "data": "",
                        "message": "Missing TransferPaymentRequestBody",
                        "status": "F"
                    }
                }
            }), 400


        request_uuid = sub_header.get('requestUUID', str(uuid.uuid4()).replace('-', ''))
        
        cust_uniq_ref = generate_cust_uniq_ref(30)
        print(f"Generated custUniqRef: {cust_uniq_ref}")
        
        sub_header_correct = {
            "requestUUID": request_uuid,
            "serviceRequestId": "OpenAPI",
            "serviceRequestVersion": "1.0",
            "channelId": CHANNEL_ID
        }

        body_part['channelId'] = CHANNEL_ID

        body_part['corpCode'] = CORPORATE_CODE
        
        if 'paymentDetails' not in body_part or not body_part['paymentDetails']:
            body_part['paymentDetails'] = [{}]
        
        body_part['paymentDetails'][0]['custUniqRef'] = cust_uniq_ref

        checksum = calculate_checksum_correct(body_part)
        body_part['checksum'] = checksum

        print("=== FINAL BODY WITH CHECKSUM ===")
        print(json.dumps(body_part, indent=2))

        transfer_record = save_transfer_request_to_db(raw_data, request_uuid, cust_uniq_ref, checksum)

        body_json_min = json.dumps(body_part, separators=(',', ':'))
        encrypted_body = aes128_cbc_encrypt_prepend_iv(body_json_min, KEY_HEX_128, IV_BYTES)

        final_payload = {
            "TransferPaymentRequest": {
                "SubHeader": sub_header_correct,
                "TransferPaymentRequestBodyEncrypted": encrypted_body
            }
        }

        print("=== SENDING TO BANK TRANSFER API ===")
        print(f"Request UUID: {request_uuid}")
        print(f"custUniqRef: {cust_uniq_ref}")
        print(f"URL: {BANK_TRANSFER_URL}")
        print(f"Encrypted body length: {len(encrypted_body)}")

        headers = {
            "X-IBM-Client-Id": X_IBM_CLIENT_ID,
            "X-IBM-Client-Secret": X_IBM_CLIENT_SECRET,
            "Content-Type": "application/json"
        }

        with requests.Session() as s:
            s.mount('https://', Pkcs12Adapter(pkcs12_filename=CERT_FILE, pkcs12_password=CERT_PASSWORD))
            bank_response = s.post(
                BANK_TRANSFER_URL, 
                headers=headers, 
                json=final_payload, 
                verify=True, 
                timeout=30
            )

        bank_response.raise_for_status()
        bank_data = bank_response.json()

        print("=== RAW BANK RESPONSE (TRANSFER) ===")
        print(json.dumps(bank_data, indent=2))

        response_data, decrypted_response = format_transfer_response(bank_data, request_uuid)
        
        update_transfer_response_in_db(request_uuid, bank_data, decrypted_response)
        
        return jsonify(response_data), 200

    except requests.exceptions.HTTPError as e:
        error_msg = f"Bank API HTTP Error: {e.response.status_code} - {e.response.text}"
        
        if 'request_uuid' in locals():
            error_response = {
                "error": error_msg,
                "http_status": e.response.status_code
            }
            update_transfer_response_in_db(request_uuid, error_response)
        
        return jsonify({
            "TransferPaymentResponse": {
                "SubHeader": {
                    "requestUUID": str(uuid.uuid4()).replace('-', ''),
                    "serviceRequestId": "OpenAPI",
                    "serviceRequestVersion": "1.0",
                    "channelId": CHANNEL_ID
                },
                "TransferPaymentResponse": {
                    "data": "",
                    "message": error_msg,
                    "status": "F"
                }
            }
        }), 200
        
    except Exception as e:
        error_msg = f"An unexpected error occurred: {str(e)}"
        import traceback
        print(traceback.format_exc())
        
        if 'request_uuid' in locals():
            error_response = {
                "error": error_msg,
                "exception": str(e)
            }
            update_transfer_response_in_db(request_uuid, error_response)
        
        return jsonify({
            "TransferPaymentResponse": {
                "SubHeader": {
                    "requestUUID": str(uuid.uuid4()).replace('-', ''),
                    "serviceRequestId": "OpenAPI",
                    "serviceRequestVersion": "1.0",
                    "channelId": CHANNEL_ID
                },
                "TransferPaymentResponse": {
                    "data": "",
                    "message": error_msg,
                    "status": "F"
                }
            }
        }), 200

def format_transfer_response(bank_data, request_uuid):
    decrypted_response = None
    
    if 'TransferPaymentResponse' not in bank_data:
        response_data = {
            "TransferPaymentResponse": {
                "SubHeader": {
                    "requestUUID": request_uuid,
                    "serviceRequestId": "OpenAPI",
                    "serviceRequestVersion": "1.0",
                    "channelId": CHANNEL_ID
                },
                "TransferPaymentResponse": {
                    "data": "",
                    "message": "Invalid response format from bank",
                    "status": "F"
                }
            }
        }
        return response_data, None
    
    bank_resp = bank_data['TransferPaymentResponse']
    sub_header = bank_resp.get('SubHeader', {})
    
    if 'TransferPaymentResponseBodyEncrypted' in bank_resp:
        try:
            encrypted_body = bank_resp['TransferPaymentResponseBodyEncrypted']
            decrypted_body_str = aes128_cbc_decrypt_iv_prepended(encrypted_body, KEY_HEX_128)
            decrypted_body = json.loads(decrypted_body_str)
            decrypted_response = decrypted_body
            
            response_data = {
                "TransferPaymentResponse": {
                    "SubHeader": sub_header,
                    "TransferPaymentResponse": decrypted_body
                }
            }
            return response_data, decrypted_response
            
        except Exception as e:
            response_data = {
                "TransferPaymentResponse": {
                    "SubHeader": sub_header,
                    "TransferPaymentResponse": {
                        "data": "",
                        "message": f"Response decryption failed: {str(e)}",
                        "status": "F"
                    }
                }
            }
            return response_data, None
    else:
        decrypted_response = bank_data
        return bank_data, decrypted_response


def save_or_update_payment_status(request_uuid, get_status_request, bank_response, decrypted_response=None):
    try:
        status_record = PaymentStatus.query.filter_by(requestUUID=request_uuid).first()
        
        if status_record:
            print(f"Updating existing payment status record for UUID: {request_uuid}")
        else:
            status_record = PaymentStatus(requestUUID=request_uuid)
            db.session.add(status_record)
            print(f"Creating new payment status record for UUID: {request_uuid}")

        get_status_body = get_status_request.get("GetStatusRequestBody", {})
        
        status_record.channelId = get_status_body.get('channelId', CHANNEL_ID)
        status_record.corpCode = get_status_body.get('corpCode', CORPORATE_CODE)
        
        crn_data = get_status_body.get('crn', [])
        if isinstance(crn_data, list):
            status_record.crn = json.dumps(crn_data)
        else:
            status_record.crn = json.dumps([crn_data])
            
        status_record.checksum = get_status_body.get('checksum', '')
        status_record.encryptedRequest = json.dumps(get_status_request)
        
        status_record.encryptedResponse = json.dumps(bank_response)
        
        response_to_process = decrypted_response if decrypted_response else bank_response
        
        if response_to_process:
            status_record.decryptedResponse = json.dumps(response_to_process)
            
            get_status_response = response_to_process.get('GetStatusResponse', {})
            response_body = get_status_response.get('GetStatusResponseBody', {})
            
            if not response_body:
                response_body = get_status_response
            
            print("=== PROCESSING GET STATUS RESPONSE ===")
            print(json.dumps(response_body, indent=2))
            
            status_record.responseMessage = response_body.get('message', '')
            status_record.overallStatus = response_body.get('status', '') 
            
            data_field = response_body.get('data', {})
            if data_field:
                status_record.errorMessage = data_field.get('errorMessage')
                status_record.responseChecksum = data_field.get('checksum')
                
                cur_txn_enq = data_field.get('CUR_TXN_ENQ', [])
                
                if cur_txn_enq:
                    print(f"Found {len(cur_txn_enq)} transaction(s) in CUR_TXN_ENQ")
                    
                    status_record.allTransactions = json.dumps(cur_txn_enq)
                    
                    if len(cur_txn_enq) >= 1:
                        first_txn = cur_txn_enq[0]
                        process_transaction_data(status_record, first_txn)
                                           
                else:
                    print("No transactions found in CUR_TXN_ENQ array")
                    if status_record.errorMessage:
                        print(f"Error Message: {status_record.errorMessage}")
                        status_record.transactionStatus = "NOT_FOUND"
                        status_record.statusDescription = status_record.errorMessage
            else:
                print("No data field found in response")
        
        status_record.updated_at = datetime.utcnow()
        db.session.commit()
        
        print(f"Payment status successfully saved/updated for UUID: {request_uuid}")
        log_payment_status_summary(status_record)
        
        return status_record
        
    except Exception as e:
        db.session.rollback()
        print(f"Error saving/updating payment status in database: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return None

def process_transaction_data(status_record, transaction_data):
    try:
        status_record.corpCodeResponse = transaction_data.get('corpCode')
        status_record.statusDescription = transaction_data.get('statusDescription')
        status_record.batchNo = transaction_data.get('batchNo')
        status_record.utrNo = transaction_data.get('utrNo')
        status_record.responseCode = transaction_data.get('responseCode')
        status_record.crnResponse = transaction_data.get('crn')
        status_record.transactionStatus = transaction_data.get('transactionStatus')
        
        processing_date_str = transaction_data.get('processingDate')
        status_record.processingDate = parse_processing_date(processing_date_str)
        
        if status_record.transactionStatus:
            print(f"🔍 Processing transaction with status: {status_record.transactionStatus}")
            
    except Exception as e:
        print(f"Error processing transaction data: {str(e)}")

def parse_processing_date(date_str):
    if not date_str:
        return None
        
    try:
        formats_to_try = [
            '%d-%m-%Y %H:%M:%S',  
            '%Y-%m-%d %H:%M:%S',  
            '%d/%m/%Y %H:%M:%S', 
            '%Y-%m-%d',           
            '%d-%m-%Y'            
        ]
        
        for fmt in formats_to_try:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
                
        print(f"Could not parse processingDate: {date_str}")
        return None
        
    except Exception as e:
        print(f"Error parsing date {date_str}: {str(e)}")
        return None

def log_payment_status_summary(status_record):
    print("=== PAYMENT STATUS SAVED SUMMARY ===")
    print(f"Request UUID: {status_record.requestUUID}")
    print(f"Transaction Status: {status_record.transactionStatus}")
    print(f"Status Description: {status_record.statusDescription}")
    print(f"Batch No: {status_record.batchNo}")
    print(f"CRN: {status_record.crnResponse}")
    print(f"UTR No: {status_record.utrNo}")
    print(f"Response Code: {status_record.responseCode}")
    print(f"Response Message: {status_record.responseMessage}")
    print(f"Overall Status: {status_record.overallStatus}")
    print(f"Error Message: {status_record.errorMessage}")
    print(f"Processing Date: {status_record.processingDate}")

def format_get_status_response(bank_data, request_uuid):
    try:
        if 'GetStatusResponse' not in bank_data:
            return create_error_response(request_uuid, "Invalid response format from bank")
        
        resp = bank_data['GetStatusResponse']
        sub_header = resp.get('SubHeader', {})
        decrypted_response = None
        
        if 'GetStatusResponseBodyEncrypted' in resp:
            try:
                encrypted_body = resp['GetStatusResponseBodyEncrypted']
                decrypted_str = aes128_cbc_decrypt_iv_prepended(encrypted_body, KEY_HEX_128)
                decrypted_body = json.loads(decrypted_str)
                decrypted_response = {
                    "GetStatusResponse": {
                        "SubHeader": sub_header,
                        "GetStatusResponseBody": decrypted_body
                    }
                }
                
                save_or_update_payment_status(request_uuid, {}, bank_data, decrypted_response)
                return decrypted_response
                
            except Exception as e:
                error_msg = f"Response decryption failed: {str(e)}"
                print(f" {error_msg}")
                error_response = create_error_response(request_uuid, error_msg)
                save_or_update_payment_status(request_uuid, {}, bank_data, error_response)
                return error_response
        else:
            decrypted_response = bank_data
            save_or_update_payment_status(request_uuid, {}, bank_data, decrypted_response)
            return bank_data
            
    except Exception as e:
        error_msg = f"Error formatting get status response: {str(e)}"
        print(f"{error_msg}")
        return create_error_response(request_uuid, error_msg)

def create_error_response(request_uuid, error_message):
    return {
        "GetStatusResponse": {
            "SubHeader": {
                "requestUUID": request_uuid,
                "serviceRequestId": "OpenAPI",
                "serviceRequestVersion": "1.0",
                "channelId": CHANNEL_ID
            },
            "GetStatusResponseBody": {
                "data": "",
                "message": error_message,
                "status": "F"
            }
        }
    }



@app.route(API_URL + '/get-status', methods=['POST'])
def get_status():
    try:
        raw_data = request.get_json()

        if not raw_data:
            return jsonify(create_error_response(
                str(uuid.uuid4()).replace('-', ''), 
                "Invalid request body"
            )), 400

        print("=== INCOMING GET STATUS REQUEST ===")
        print(json.dumps(raw_data, indent=2))

        get_status_request = raw_data.get("GetStatusRequest", {})
        sub_header = get_status_request.get("SubHeader", {})
        body_part = get_status_request.get("GetStatusRequestBody", {})

        if not body_part:
            return jsonify(create_error_response(
                str(uuid.uuid4()).replace('-', ''),
                "Missing GetStatusRequestBody"
            )), 400

        if 'crn' not in body_part or not body_part['crn']:
            return jsonify(create_error_response(
                str(uuid.uuid4()).replace('-', ''),
                "Missing CRN (Customer Reference Number) in request"
            )), 400

        body_part['channelId'] = CHANNEL_ID
        body_part['corpCode'] = CORPORATE_CODE

        checksum = calculate_checksum_correct(body_part)
        body_part['checksum'] = checksum

        print("=== FINAL GET STATUS BODY WITH CHECKSUM ===")
        print(json.dumps(body_part, indent=2))

        body_json_min = json.dumps(body_part, separators=(',', ':'))
        encrypted_body = aes128_cbc_encrypt_prepend_iv(body_json_min, KEY_HEX_128, IV_BYTES)

        request_uuid = sub_header.get('requestUUID', str(uuid.uuid4()).replace('-', ''))

        sub_header_correct = {
            "requestUUID": request_uuid,
            "serviceRequestId": "OpenAPI",
            "serviceRequestVersion": "1.0",
            "channelId": CHANNEL_ID
        }

        final_payload = {
            "GetStatusRequest": {
                "SubHeader": sub_header_correct,
                "GetStatusRequestBodyEncrypted": encrypted_body
            }
        }

        print("=== SENDING TO BANK GET STATUS API ===")
        print(f"URL: {BANK_GET_STATUS_URL}")
        print(f"Request UUID: {request_uuid}")
        print(f"CRN: {body_part.get('crn')}")

        headers = {
            "X-IBM-Client-Id": X_IBM_CLIENT_ID,
            "X-IBM-Client-Secret": X_IBM_CLIENT_SECRET,
            "Content-Type": "application/json"
        }

        with requests.Session() as s:
            s.mount('https://', Pkcs12Adapter(pkcs12_filename=CERT_FILE, pkcs12_password=CERT_PASSWORD))
            response = s.post(
                BANK_GET_STATUS_URL,
                headers=headers,
                json=final_payload,
                verify=True,
                timeout=30
            )

        response.raise_for_status()
        bank_response = response.json()

        print("=== RAW BANK RESPONSE (GET STATUS) ===")
        print(json.dumps(bank_response, indent=2))

        formatted_response = format_get_status_response(bank_response, request_uuid)
        return jsonify(formatted_response), 200

    except requests.exceptions.HTTPError as e:
        error_msg = f"Bank API HTTP Error: {e.response.status_code} - {e.response.text}"
        print(f" {error_msg}")
        
        request_uuid = locals().get('request_uuid', str(uuid.uuid4()).replace('-', ''))
        error_response_data = {
            "error": error_msg,
            "http_status": e.response.status_code
        }
        save_or_update_payment_status(request_uuid, {}, error_response_data)
        
        return jsonify(create_error_response(request_uuid, error_msg)), 200

    except Exception as e:
        import traceback
        error_msg = f"An unexpected error occurred: {str(e)}"
        print(f" {error_msg}")
        print(traceback.format_exc())
        
        request_uuid = locals().get('request_uuid', str(uuid.uuid4()).replace('-', ''))
        error_response_data = {
            "error": error_msg,
            "exception": traceback.format_exc()
        }
        save_or_update_payment_status(request_uuid, {}, error_response_data)
        
        return jsonify(create_error_response(request_uuid, error_msg)), 200
    

def analyze_transaction_status(payment_status_record):
    if not payment_status_record:
        return "No status record available"
    
    status_info = {
        "request_uuid": payment_status_record.requestUUID,
        "crn": payment_status_record.crnResponse,
        "transaction_status": payment_status_record.transactionStatus,
        "status_description": payment_status_record.statusDescription,
        "response_code": payment_status_record.responseCode,
        "utr_number": payment_status_record.utrNo,
        "batch_number": payment_status_record.batchNo,
        "processing_date": payment_status_record.processingDate,
        "overall_status": payment_status_record.overallStatus,
        "error_message": payment_status_record.errorMessage
    }
    
    interpretation = interpret_transaction_status(status_info)
    status_info["interpretation"] = interpretation
    
    return status_info

def interpret_transaction_status(status_info):
    status = status_info.get("transaction_status", "").upper()
    response_code = status_info.get("response_code", "")
    status_description = status_info.get("status_description", "")
    
    interpretations = {
        "PROCESSED": " Transaction successfully processed and completed",
        "PENDING": " Transaction is pending processing",
        "REJECTED": " Transaction was rejected",
        "RETURN": "Transaction was returned",
        "NOT_FOUND": " Transaction not found for given CRN"
    }
    
    base_interpretation = interpretations.get(status, " Unknown transaction status")
    
    if status == "PENDING":
        if "To be Authorized" in status_description:
            base_interpretation += " - Awaiting authorization"
        elif "To be Processed" in status_description:
            base_interpretation += " - Awaiting processing"
    
    elif status == "REJECTED":
        if response_code == "F403":
            base_interpretation += " - Beneficiary IFSC code is invalid"
        elif response_code == "F404":
            base_interpretation += " - Duplicate payment detected"
    
    elif status == "RETURN":
        if "ACCOUNT DOES NOT EXIST" in status_description:
            base_interpretation += " - Beneficiary account does not exist"
    
    return base_interpretation