from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
import os
from sqlalchemy.engine import Row

API_URL = os.getenv('API_URL')

@app.route(API_URL+'/PurcNoFromReturnPurchase', methods=['GET'])
def PurcNoFromReturnPurchase():
    try:
        CompanyCode = request.args.get('Company_Code')
        yearCode = request.args.get('Year_Code')

        if CompanyCode is None or yearCode is None:
            return jsonify({'error': 'Missing MillCode or CompanyCode parameter'}), 400

        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
                Select doc_no, Tran_Type, convert(varchar(10), doc_date, 103) as doc_date, PartyName, MillName, Bill_Amount, NETQNTL as Quantal, Year_Code, saleid from 
                qrySugarSaleAndVouchersForReturnNew  
                where Company_Code= :CompanyCode and Year_Code= :yearCode
                order by doc_no desc
            '''), {'CompanyCode': CompanyCode, 'yearCode': yearCode})

            result = query.fetchall()

        # Map the result directly to a list of dictionaries
        response = [row._asdict() for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
