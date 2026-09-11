from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
import os

API_URL = os.getenv('API_URL')

from flask import request, jsonify
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

@app.route(API_URL + '/unlock-delivery-order', methods=['PUT'])
def unlock_delivery_order():
    try:
        doc_nos = request.args.getlist('doc_no', type=int) 
        year_code = request.args.get('year_code', type=int)
        company_code = request.args.get('company_code', type=int)

        if not doc_nos or year_code is None or company_code is None:
            return jsonify({'error': 'Missing Required Parameters!'}), 400

        with db.session.begin_nested():
            update_query = text('''
                UPDATE nt_1_deliveryorder
                SET LockedRecord = 'false',
                    LockedUser = ''
                WHERE doc_no IN :doc_nos
                  AND Year_Code = :year_code
                  AND company_code = :company_code
            ''')

            result = db.session.execute(update_query, {
                'doc_nos': tuple(doc_nos),
                'year_code': year_code,
                'company_code': company_code
            })

        db.session.commit()

        return jsonify({
            'message': 'Record unlocked successfully',
            'rows_affected': result.rowcount
        })

    except SQLAlchemyError as error:
        print("Error updating record:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

    
@app.route(API_URL + '/unlock-tender-purchase', methods=['PUT'])
def unlock_tender_order():
    try:
        Tender_No = request.args.getlist('Tender_No', type=int)
        year_code = request.args.get('year_code', type=int)
        company_code = request.args.get('company_code', type=int)

        if Tender_No is None or year_code is None or company_code is None:
            return jsonify({'error': 'Missing Required Paramters.!'}), 400

        with db.session.begin_nested():
            update_query = text('''
                UPDATE nt_1_tender
                SET LockedRecord = 'false',
                    LockedUser = ''
             WHERE Tender_No IN :Tender_No
                  AND Year_Code = :year_code
                  AND company_code = :company_code
            ''')

            result = db.session.execute(update_query, {
                'Tender_No': tuple(Tender_No),
                'year_code': year_code,
                'company_code': company_code
            })

        db.session.commit()

        return jsonify({'message': 'Record unlocked successfully', 'rows_affected': result.rowcount})

    except SQLAlchemyError as error:
        print("Error updating record:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
