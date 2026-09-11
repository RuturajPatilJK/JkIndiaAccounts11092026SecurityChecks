from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
import os
from sqlalchemy.engine import Row

API_URL = os.getenv('API_URL')

@app.route(API_URL+'/DoUTRNoHelp', methods=['GET'])
def DoUTRNoHelp():
    try:
        CompanyCode = request.args.get('Company_Code')
        millCode = request.args.get('Bank_Code')

        if CompanyCode is None or millCode is None:
            return jsonify({'error': 'Missing CompanyCode or Bank Code parameter'}), 400

        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
                select doc_no,utr_no,bankname,'' as UTRAmount,lot_no,amount as amountDetail,paidamount as UsedAmt,balanceamount as balance,narration_header,Year_Code,
           utrdateConverted as doc_date, utrdetailid,Company_Code from  qryutrdobalanceforfinalview  where balanceamount!=0 and Company_Code= :CompanyCode and mill_code= :millCode order by doc_no desc
            '''), {'CompanyCode': CompanyCode, 'millCode':millCode})

            result = query.fetchall()

        # Map the result directly to a list of dictionaries
        response = [row._asdict() for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
