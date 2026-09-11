from flask import jsonify, request
from app import app, db
from app.models.Masters.CompanyParameters.CompanyParameterModels import CompanyParameters
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL + '/get_default_gstrate', methods=['GET'])
def get_default_gstrate():
    company_code = request.args.get('Company_Code')
    if not company_code:
        return jsonify({'error': 'Missing company_code parameter'}), 400

    try:
        # Query for the default GSTRate based on the company code
        parameter = CompanyParameters.query.filter_by(Company_Code=company_code).first()

        if parameter and parameter.def_gst_rate_code:  # Check if the parameter exists and has a value
            return jsonify({'def_gst_rate_code': parameter.def_gst_rate_code}), 200
        else:
            return jsonify({'error': 'No default GSTRate found for this company'}), 404
    except Exception as e:
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500
