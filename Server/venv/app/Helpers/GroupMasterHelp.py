import os
from flask import jsonify, request
from app import app, db 
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

API_URL = os.getenv('API_URL')


@app.route(API_URL+'/group_master', methods=['GET'])
def group_master():
    try:
        Company_Code = request.args.get('Company_Code')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        
        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
            SELECT group_Code, group_Name_E,  bsid
            FROM nt_1_bsgroupmaster
            WHERE Company_Code=:company_code
            '''), {'company_code': Company_Code})

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'group_Code': row.group_Code,
                'group_Name_E': row.group_Name_E,
                'bsid': row.bsid
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500



