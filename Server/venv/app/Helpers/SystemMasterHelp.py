from flask import jsonify, request
from app import app, db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
import os

API_URL = os.getenv('API_URL')


@app.route(API_URL+'/system_master_help', methods=['GET'])
def system_master():
    try:
        # Extract SystemType and CompanyCode from query parameters
        SystemType = request.args.get('SystemType')
        CompanyCode = request.args.get('CompanyCode')

        if SystemType is None or CompanyCode is None:
            return jsonify({'error': 'Missing SystemType or CompanyCode parameter'}), 400

        try:
            CompanyCode = int(CompanyCode)
        except ValueError:
            return jsonify({'error': 'Invalid CompanyCode parameter'}), 400

        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT        System_Code AS Category_Code, System_Name_E AS Category_Name, systemid AS accoid, HSN, Gst_Code,Purchase_AC,Sale_AC,RatePer,pac,sac
FROM            dbo.nt_1_systemmaster 
                WHERE System_Type = :system_type 
                AND Company_Code = :company_code
            '''), {'system_type': SystemType, 'company_code': CompanyCode})

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'Category_Code': row.Category_Code,
                'Category_Name': row.Category_Name,
                'accoid': row.accoid,
                'HSN':row.HSN,
                'Gst_Code':row.Gst_Code,
                'Purchase_AC' : row.Purchase_AC,
                'Sale_AC' : row.Sale_AC,
                'RatePer' : row.RatePer,
                'pac' : row.pac,
                'sac' : row.sac
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
