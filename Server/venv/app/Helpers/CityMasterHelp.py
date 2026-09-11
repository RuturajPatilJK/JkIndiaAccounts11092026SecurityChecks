
import os
from flask import jsonify, request
from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text

API_URL = os.getenv('API_URL')


@app.route(API_URL+'/group_city_master', methods=['GET'])
def group_city_master():
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
               select city_code,city_name_e,city_name_r,state,cityid, pincode from nt_1_citymaster WHERE Company_Code=:company_code order by city_name_e
            '''),{'company_code': Company_Code})

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'city_code': row.city_code,
                'city_name_e': row.city_name_e,
                'city_name_r': row.city_name_r,
                'state': row.state,
                'cityid': row.cityid,
                'pincode': row.pincode
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500