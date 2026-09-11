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
        "payment_Date": task['payment_Date'].strftime('%Y-%m-%d') if task['payment_Date'] else None,
        "Sauda_Date": task['Sauda_Date'].strftime('%Y-%m-%d') if task['Sauda_Date'] else None,
        "Tender_Date": task['Tender_Date'].strftime('%Y-%m-%d') if task['Tender_Date'] else None,
    }

# Initialize Mail object
mail = Mail(app)

@app.route(API_URL+'/pendingreport-SaudaSummary', methods=['GET'])
def Pendingreport_SaudaSummary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
                select * from qrysaudabalancesummarymain where AMT!=0 and Sauda_Date BETWEEN :from_date AND :to_date
                                            and year_code =:Year_Code and Company_Code =:Company_Code
               
            '''), {'from_date': from_date, 'to_date': to_date,'Year_Code' : Year_Code,'Company_Code' : Company_Code})

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
