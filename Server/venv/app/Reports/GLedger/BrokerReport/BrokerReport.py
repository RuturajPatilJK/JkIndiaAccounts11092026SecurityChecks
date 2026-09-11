from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
from flask import Flask, jsonify, request
import os

API_URL = os.getenv('API_URL')

#Purchase Broker Report
@app.route(API_URL+'/purchase-broker-report', methods=['GET'])
def get_purchase_broker_report():
    try:
        ac_code = request.args.get('Ac_Code', '')
        start_date = request.args.get('start_date') 
        end_date = request.args.get('end_date')  

        if not start_date or not end_date:
            return jsonify({'error': 'Both start_date and end_date are required'}), 400

        if ac_code:
            query = """
                SELECT DISTINCT 
                    Tender_No, Tender_Date, millname, paymenttoname, Quantal, brokername, Broker, Brokrage, millshortname, Tender_DateConverted 
                FROM qrytenderheaddetail 
                WHERE Broker = :ac_code AND Tender_Date BETWEEN :start_date AND :end_date
            """
        else:
            query = """
                SELECT DISTINCT 
                    Tender_No, Tender_Date, millname, paymenttoname, Quantal, brokername, Broker, Brokrage, millshortname, Tender_DateConverted 
                FROM qrytenderheaddetail 
                WHERE Broker !='2' AND Tender_Date BETWEEN :start_date AND :end_date
            """

        result = db.session.execute(
            text(query),
            {"start_date": start_date, "end_date": end_date}
        )

       
        data = [dict(row._mapping) for row in result]

        return jsonify({'data': data})

    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

#Self Broker Report
