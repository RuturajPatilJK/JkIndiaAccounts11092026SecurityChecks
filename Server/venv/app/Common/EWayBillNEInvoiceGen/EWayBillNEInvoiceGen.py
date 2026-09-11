from flask import Flask, jsonify, request
from app import app, db
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
import requests
from datetime import datetime
import uuid

API_URL= os.getenv('API_URL')

API_URL_EINVOICE = os.getenv('API_URL_EINVOICE')
TOKEN_URL = os.getenv('TOKEN_URL')
GSP_APP_ID = os.getenv('GSP_APP_ID')
GSP_APP_SECRET = os.getenv('GSP_APP_SECRET')
USER_NAME=os.getenv('USER_NAME')
EWAY_PASSWORD=os.getenv('EWAY_PASSWORD')
EWAY_GSTIN=os.getenv('EWAY_GSTIN')

def generate_request_id():
    return str(uuid.uuid4())


# # Genrate Eway bill Token genration.
@app.route(API_URL+'/get-token', methods=['POST'])
def get_token():
    try:
        headers = {
            'gspappid': GSP_APP_ID,
            'gspappsecret': GSP_APP_SECRET,
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        params = {'grant_type': 'token'}

        response = requests.post(TOKEN_URL, headers=headers, params=params)

        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'message': 'Error during token generation', 'error': response.text}), 500
    except Exception as e:
        return jsonify({'message': 'Error during token generation', 'error': str(e)}), 500

# Genrate Eway bill and E-Invoice
@app.route(API_URL+'/create-invoice', methods=['POST'])
def create_invoice():
    try:
        token = request.json.get('token')
        if not token:
            return jsonify({'message': 'Token is required'}), 400
        
        request_id = generate_request_id()

        api_url = f"{API_URL_EINVOICE}/invoice"

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
            'user_name': USER_NAME,
            'password': EWAY_PASSWORD,
            'gstin': EWAY_GSTIN,
            'requestid': request_id
        }

        body = request.json.get('invoice_data')

        if not body:
            return jsonify({'message': 'Invoice data is required'}), 400

        response = requests.post(api_url, json=body, headers=headers)

        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'message': 'Error during invoice creation', 'error': response.text}), 500

    except Exception as e:
        return jsonify({'message': 'Error during invoice creation', 'error': str(e)}), 500


@app.route(API_URL + '/updateEInvoiceData', methods=['PUT'])
def updateEInvoiceData():
    try:
        doc_no = request.args.get("doc_no")
        Company_Code = request.args.get("Company_Code")
        Year_Code = request.args.get("Year_Code")
        tran_type = request.args.get("tran_type")
        do_no = request.args.get("do_no")

        if not (doc_no and Company_Code and Year_Code and tran_type):
            return jsonify({
                "error": "doc_no, Company_Code, Year_Code, and tran_type are required as query parameters."
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required."}), 400

        ackno = data.get('AckNo')
        invoiceno = data.get('Irn')
        QRCode = data.get('SignedQRCode')
        EwbDt = data.get('EwbDt') or None
        EwbNo = data.get('EwbNo') or None
        EwbValidTill = data.get('EwbValidTill') or None

        valid_debitcredit_types = ['DN', 'DS', 'CN', 'CS']

        if tran_type in valid_debitcredit_types:
            if not ackno:
                return jsonify({"error": "AckNo is required in the JSON body for debit/credit note types."}), 400

            update_query = text('''
                UPDATE debitnotehead
                SET ackno = :ackno,
                    Ewaybillno = :invoiceno,
                    QRCode = :QRCode
                WHERE company_code = :Company_Code
                  AND year_code = :Year_Code
                  AND tran_type = :tran_type
                  AND doc_no = :doc_no
            ''')
            db.session.execute(update_query, {
                'ackno': ackno, 'invoiceno': invoiceno, 'QRCode': QRCode,
                'doc_no': doc_no, 'Company_Code': Company_Code,
                'Year_Code': Year_Code, 'tran_type': tran_type
            })
            db.session.commit()
            return jsonify({"message": f"Successfully updated E-Invoice data in 'debitnotehead' for doc_no={doc_no}."}), 200

        elif tran_type == 'RB':
            if not ackno:
                return jsonify({"error": "AckNo is required in the JSON body for rent bills (RB)."}), 400

            update_query = text('''
                UPDATE nt_1_rentbillhead
                SET ackno = :ackno,
                    einvoiceno = :invoiceno,
                    QRCode = :QRCode
                WHERE company_code = :Company_Code
                  AND year_code = :Year_Code
                  AND doc_no = :doc_no
            ''')
            db.session.execute(update_query, {
                'ackno': ackno, 'invoiceno': invoiceno, 'QRCode': QRCode,
                'doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
            })
            db.session.commit()
            return jsonify({"message": f"Successfully updated E-Invoice data in 'nt_1_rentbillhead' for doc_no={doc_no}."}), 200

        elif tran_type == 'PR':
            if not ackno:
                return jsonify({"error": "AckNo is required in the JSON body for rent bills (RB)."}), 400

            update_query = text('''
                UPDATE nt_1_sugarpurchasereturn
                SET ackno = :ackno,
                    einvoiceno = :invoiceno,
                    QRCode = :QRCode
                WHERE company_code = :Company_Code
                  AND year_code = :Year_Code
                  AND doc_no = :doc_no
            ''')
            db.session.execute(update_query, {
                'ackno': ackno, 'invoiceno': invoiceno, 'QRCode': QRCode,
                'doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
            })
            db.session.commit()
            return jsonify({"message": f"Successfully updated E-Invoice data in 'nt_1_rentbillhead' for doc_no={doc_no}."}), 200

        elif tran_type == 'RS':
            if EwbNo and invoiceno:
                update_query = text('''
                    UPDATE nt_1_sugarsalereturn
                    SET ackno = :ackno,
                        einvoiceno = :invoiceno,
                        QRCode = :QRCode,
                        Eway_Bill_No = :EwbNo
                    WHERE company_code = :Company_Code
                      AND year_code = :Year_Code
                      AND doc_no = :doc_no
                ''')
                db.session.execute(update_query, {
                    'ackno': ackno, 'invoiceno': invoiceno, 'QRCode': QRCode,
                    'EwbNo': EwbNo, 'doc_no': doc_no,
                    'Company_Code': Company_Code, 'Year_Code': Year_Code
                })
                db.session.commit()
                return jsonify({"message": f"Successfully updated E-Invoice and E-WayBill data in 'nt_1_sugarsalereturn' for doc_no={doc_no}."}), 200

            elif EwbNo:
                update_query = text('''
                    UPDATE nt_1_sugarsalereturn
                    SET Eway_Bill_No = :EwbNo
                    WHERE company_code = :Company_Code
                      AND year_code = :Year_Code
                      AND doc_no = :doc_no
                ''')
                db.session.execute(update_query, {
                    'EwbNo': EwbNo, 'doc_no': doc_no,
                    'Company_Code': Company_Code, 'Year_Code': Year_Code
                })
                db.session.commit()
                return jsonify({"message": f"Successfully updated E-WayBill data in 'nt_1_sugarsalereturn' for doc_no={doc_no}."}), 200

            elif invoiceno:
                if not ackno:
                    return jsonify({"error": "AckNo is required in the JSON body for rent bills (RS)."}), 400

                update_query = text('''
                    UPDATE nt_1_sugarsalereturn
                    SET ackno = :ackno,
                        einvoiceno = :invoiceno,
                        QRCode = :QRCode
                    WHERE company_code = :Company_Code
                      AND year_code = :Year_Code
                      AND doc_no = :doc_no
                ''')
                db.session.execute(update_query, {
                    'ackno': ackno, 'invoiceno': invoiceno, 'QRCode': QRCode,
                    'doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                })
                db.session.commit()
                return jsonify({"message": f"Successfully updated E-Invoice data in 'nt_1_sugarsalereturn' for doc_no={doc_no}."}), 200

            else:
                return jsonify({"error": "At least EwbNo or Invoiceno must be provided for RS type."}), 400
    
        elif tran_type == 'LV':
            if not ackno:
                return jsonify({"error": "AckNo is required in the JSON body for sale bills (LV)."}), 400

            if invoiceno:
                if not do_no or int(do_no) == 0:
                    # From DO screen
                    update_query_sale = text('''
                        UPDATE commission_bill 
                        SET ackno = :ackno, einvoiceno = :invoiceno, QRCode = :QRCode
                        WHERE company_code = :Company_Code
                        AND year_code = :Year_Code
                        AND doc_no = :doc_no and tran_type = 'LV'
                    ''')
                    db.session.execute(update_query_sale, {
                        'ackno': ackno, 'invoiceno': invoiceno, 'QRCode': QRCode,
                        'doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                    })
                    db.session.commit()

                    return jsonify({
                        "message": f"Successfully updated E-Invoice  from LV screen for doc_no={doc_no}.",
                        "from_type": "LV"
                    }), 200
                    
                else:

                    updateDO = text('''
                        UPDATE NT_1_deliveryorder 
                        SET ackno = :ackno, einvoiceno = :invoiceno
                        WHERE company_code = :Company_Code
                        AND year_code = :Year_Code
                        AND voucher_no = :doc_no
                        AND tran_type = 'DO'
                    ''')
                    db.session.execute(updateDO, {
                        'ackno': ackno, 'invoiceno': invoiceno,
                        'doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                    })
                    db.session.commit()

                    updateSale = text('''
                        UPDATE commission_bill 
                        SET ackno = :ackno, einvoiceno = :invoiceno, QRCode = :QRCode
                        WHERE company_code = :Company_Code
                        AND year_code = :Year_Code
                        AND doc_no = :doc_no and tran_type = 'LV'
                    ''')
                    db.session.execute(updateSale, {
                        'ackno': ackno, 'invoiceno': invoiceno, 'QRCode': QRCode,
                        'doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                    })
                    db.session.commit()

                    return jsonify({
                        "message": f"Successfully updated E-Invoice from DO screen for doc_no={doc_no}.",
                        "from_type": "DO"
                    }), 200
                    # From SB screen

        elif tran_type == 'SO':
            if not ackno:
                return jsonify({"error": "AckNo is required in the JSON body for sale bills (SO)."}), 400

            if not invoiceno:
                return jsonify({"error": "Irn (einvoiceno) is required for SO type."}), 400

            update_query_sale = text('''
                UPDATE NT_1_SugarSale 
                SET ackno = :ackno, einvoiceno = :invoiceno, QRCode = :QRCode
                WHERE company_code = :Company_Code
                AND year_code = :Year_Code
                AND doc_no = :doc_no
            ''')
            db.session.execute(update_query_sale, {
                'ackno': ackno, 'invoiceno': invoiceno, 'QRCode': QRCode,
                'doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
            })
            db.session.commit()

            return jsonify({
                "message": f"Successfully updated E-Invoice from SO screen for doc_no={doc_no}.",
                "from_type": "SO"
            }), 200


        elif tran_type == 'SB':
            if not ackno:
                return jsonify({"error": "AckNo is required in the JSON body for sale bills (SB)."}), 400

            if invoiceno and EwbNo:
                if not do_no or int(do_no) == 0:
                    update_query_sale = text('''
                        UPDATE NT_1_SugarSale 
                        SET ackno = :ackno, einvoiceno = :invoiceno, QRCode = :QRCode,
                        EWay_Bill_No =:EwbNo,
                        EwayBillValidDate =:EwbValidTill
                        WHERE company_code = :Company_Code
                        AND year_code = :Year_Code
                        AND doc_no = :doc_no
                    ''')
                    db.session.execute(update_query_sale, {
                        'ackno': ackno, 'invoiceno': invoiceno, 'QRCode': QRCode,
                        'EwbNo':EwbNo,'EwbValidTill':EwbValidTill,
                        'doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                    })
                    db.session.commit()

                    return jsonify({
                        "message": f"Successfully updated E-Invoice and ewayBill from SB screen for doc_no={doc_no}.",
                        "from_type": "SB"
                    }), 200
                   
                else:
                    # From SB screen
                    updateDO = text('''
                        UPDATE NT_1_deliveryorder 
                        SET ackno = :ackno, einvoiceno = :invoiceno, EWay_Bill_No =:EwbNo,
                        EwayBillValidDate =:EwbValidTill
                        WHERE company_code = :Company_Code
                        AND year_code = :Year_Code
                        AND SB_No = :doc_no 
                        AND tran_type = 'DO'
                    ''')
                    db.session.execute(updateDO, {
                        'ackno': ackno, 'invoiceno': invoiceno, 'EwbNo':EwbNo,'EwbValidTill':EwbValidTill,
                        'doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                    })
                    db.session.commit()

                    updateSale = text('''
                        UPDATE NT_1_SugarSale 
                        SET ackno = :ackno, einvoiceno = :invoiceno, QRCode = :QRCode,
                        EWay_Bill_No =:EwbNo,
                        EwayBillValidDate =:EwbValidTill
                        WHERE company_code = :Company_Code
                        AND year_code = :Year_Code
                        AND doc_no = :sb_doc_no
                    ''')
                    db.session.execute(updateSale, {
                        'ackno': ackno, 'invoiceno': invoiceno, 'QRCode': QRCode,
                        'EwbNo':EwbNo,'EwbValidTill':EwbValidTill,
                        'sb_doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                    })
                    db.session.commit()

                    return jsonify({
                        "message": f"Successfully updated E-Invoice from DO screen for doc_no={doc_no}.",
                        "from_type": "DO"
                    }), 200

            elif invoiceno:
                if not do_no or int(do_no) == 0:
                    update_query_sale = text('''
                        UPDATE nt_1_sugarsale 
                        SET ackno = :ackno, einvoiceno = :invoiceno, QRCode = :QRCode 
                        WHERE company_code = :Company_Code
                        AND year_code = :Year_Code
                        AND doc_no = :doc_no
                    ''')
                    db.session.execute(update_query_sale, {
                        'ackno': ackno, 'invoiceno': invoiceno, 'QRCode': QRCode,
                        'doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                    })
                    db.session.commit()

                    return jsonify({
                        "message": f"Successfully updated E-Invoice from SB screen for doc_no={doc_no}.",
                        "from_type": "SB"
                    }), 200

                else:
                    # From DO screen
                    updateDO = text('''
                        UPDATE nt_1_deliveryorder 
                        SET ackno = :ackno, einvoiceno = :invoiceno 
                        WHERE company_code = :Company_Code
                        AND year_code = :Year_Code
                        AND SB_No = :doc_no 
                        AND tran_type = 'DO'
                    ''')
                    db.session.execute(updateDO, {
                        'ackno': ackno, 'invoiceno': invoiceno,
                        'doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                    })
                    db.session.commit()

                    updateSale = text('''
                        UPDATE nt_1_sugarsale 
                        SET ackno = :ackno, einvoiceno = :invoiceno, QRCode = :QRCode 
                        WHERE company_code = :Company_Code
                        AND year_code = :Year_Code
                        AND doc_no = :sb_doc_no
                    ''')
                    db.session.execute(updateSale, {
                        'ackno': ackno, 'invoiceno': invoiceno, 'QRCode': QRCode,
                        'sb_doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                    })
                    db.session.commit()

                    return jsonify({
                        "message": f"Successfully updated E-Invoice from DO screen for doc_no={doc_no}.",
                        "from_type": "DO"
                    }), 200
                    # From SB screen
            elif EwbNo:
                if not do_no or int(do_no) == 0:
                    updateSale = text('''
                        UPDATE nt_1_sugarsale 
                        SET EWay_Bill_No =:EwbNo,
                        EwayBillValidDate =:EwbValidTill
                        WHERE company_code = :Company_Code
                        AND year_code = :Year_Code
                        AND doc_no = :sb_doc_no
                    ''')
                    db.session.execute(updateSale, {
                        'EwbNo': EwbNo, 'EwbValidTill': EwbValidTill,
                        'sb_doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                    })
                    db.session.commit()

                    return jsonify({
                        "message": f"Successfully updated E-Invoice from DO screen for doc_no={doc_no}.",
                        "from_type": "DO"
                    }), 200

                else:
                    updateDO = text('''
                        UPDATE nt_1_deliveryorder 
                        SET EWay_Bill_No =:EwbNo,
                        EwayBillValidDate =:EwbValidTill
                        WHERE company_code = :Company_Code
                        AND year_code = :Year_Code
                        AND doc_no = :doc_no 
                        AND tran_type = 'DO'
                    ''')
                    db.session.execute(updateDO, {
                        'EwbNo': EwbNo, 'EwbValidTill': EwbValidTill,
                        'doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                    })
                    db.session.commit()

                    updateSale = text('''
                        UPDATE nt_1_sugarsale 
                        SET EWay_Bill_No =:EwbNo,
                        EwayBillValidDate =:EwbValidTill
                        WHERE company_code = :Company_Code
                        AND year_code = :Year_Code
                        AND DO_No = :sb_doc_no
                    ''')
                    db.session.execute(updateSale, {
                        'EwbNo': EwbNo, 'EwbValidTill': EwbValidTill,
                        'sb_doc_no': doc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code
                    })
                    db.session.commit()

                    return jsonify({
                        "message": f"Successfully updated E-Invoice from DO screen for doc_no={doc_no}.",
                        "from_type": "DO"
                    }), 200
                    
        else:
            return jsonify({
                "error": f"Tran type '{tran_type}' is not supported. Expected one of {valid_debitcredit_types} or 'RB', 'SB', 'PR', 'RS'."
            }), 400

    except Exception as e:
        db.session.rollback()
        print(f"Error occurred: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500