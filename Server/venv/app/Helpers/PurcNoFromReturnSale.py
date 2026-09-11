from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
import os
from sqlalchemy.engine import Row

API_URL = os.getenv('API_URL')

@app.route(API_URL+'/PurcNoFromReturnSale', methods=['GET'])
def PurcNoFromReturnSale():
    try:
        CompanyCode = request.args.get('Company_Code')

        if CompanyCode is None:
            return jsonify({'error': 'Missing CompanyCode parameter'}), 400

        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
                Select doc_no,doc_dateConverted as doc_date,millshortname as MillName,billtoname as PartyName, Bill_Amount, Quantal,
                             Year_Code,prid from  qrysugarpurchasereturnbalance 
                             where Company_Code=:CompanyCode
                             and Quantal!=0 
                             order by doc_no desc
            '''), {'CompanyCode': CompanyCode})

            result = query.fetchall()

        # Map the result directly to a list of dictionaries
        response = [row._asdict() for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
