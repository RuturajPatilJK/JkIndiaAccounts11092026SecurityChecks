from flask import Flask, jsonify, request
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from app import app, db
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL + '/profit-loss-report', methods=['GET'])
def profit_loss_report():
    try:
        mill_code = request.args.get('Mill_Code')
        lot_no = request.args.get('Lot_No')
        start_date = request.args.get('Start_Date')
        end_date = request.args.get('End_Date')

        if not start_date or not end_date:
            return jsonify({"error": "Missing 'Start_Date' or 'End_Date' parameter"}), 400

        query = ''
        params = {
            'start_date': start_date,
            'end_date': end_date,
        }

        if mill_code:
            params['mill_code'] = mill_code
            if lot_no:
                params['lot_no'] = lot_no
                query = '''
                    SELECT * 
                    FROM qryProfitLossReport 
                    WHERE Mill_Code = :mill_code 
                      AND Tender_No = :lot_no 
                      AND Tender_Date BETWEEN :start_date AND :end_date 
                    ORDER BY doc_date
                '''
            else:
                query = '''
                    SELECT * 
                    FROM qryProfitLossReport 
                    WHERE Mill_Code = :mill_code 
                      AND Tender_Date BETWEEN :start_date AND :end_date 
                    ORDER BY doc_date
                '''
        else:
            query = '''
                SELECT * 
                FROM qryProfitLossReport 
                WHERE Tender_Date BETWEEN :start_date AND :end_date 
                ORDER BY doc_date
            '''

        with db.session.begin_nested():
            result = db.session.execute(text(query), params).fetchall()

        response = [dict(row._mapping) for row in result]


        for data in response:
            if 'Tender_Date' in data:
                data['Tender_Date'] = data['Tender_Date'].strftime('%d/%m/%Y') if data['Tender_Date'] else None
            if 'Lifting_Date' in data:
                data['Lifting_Date'] = data['Lifting_Date'].strftime('%d/%m/%Y') if data['Lifting_Date'] else None
            if 'doc_date' in data:
                data['doc_date'] = data['doc_date'].strftime('%d/%m/%Y') if data['doc_date'] else None

        return jsonify(response), 200

    except SQLAlchemyError as e:
        print("Error executing query:", e)
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500
