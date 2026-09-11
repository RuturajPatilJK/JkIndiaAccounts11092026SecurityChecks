from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
from flask import Flask, jsonify, request
from flask_mail import Mail, Message
import os

API_URL = os.getenv('API_URL')

def format_dates(task):
    return {
        "Tender_Date": task['Tender_Date'].strftime('%Y-%m-%d') if task['Tender_Date'] else None,
        "Lifting_Date": task['Lifting_Date'].strftime('%Y-%m-%d') if task['Lifting_Date'] else None,
    }
    
@app.route(API_URL+'/mill-payment-detail-report', methods=['GET'])
def mill_payment_detail_report():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
               select * from qrymillpaymentdetail where Tender_No is not null and Tender_Date BETWEEN :from_date AND :to_date
                                            ORDER BY doc_no, doc_date
            '''), {'from_date': from_date, 'to_date': to_date})

            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            formatted_dates = format_dates(row_dict)
            row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
