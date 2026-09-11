from flask import jsonify, request
from app import app, db
from app.models.Masters.AccountInformation.AccountMaster.AccountMasterModel import AccountMaster
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL + '/get_default_cashAc', methods=['GET'])
def get_default_cashAc():
    company_code = request.args.get('Company_Code')
    ac_code = request.args.get('ac_code'or 1)
    if not company_code:
        return jsonify({'error': 'Missing company_code parameter'}), 400

    try:
        defaultAc = AccountMaster.query.filter_by(company_code=company_code, Ac_Code = ac_code).first()

        if defaultAc: 
            return jsonify({'Ac_Code': defaultAc.Ac_Code, 'Ac_Name_E':defaultAc.Ac_Name_E, 'accoid': defaultAc.accoid}), 200
        else:
            return jsonify({'error': 'No Account found'}), 404
    except Exception as e:
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500
