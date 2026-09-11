from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from app import app, db
from sqlalchemy import text
from app.utils.CommonSugarPurchaseStatusCheck import get_match_status
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL+"/get_match_status", methods=['GET'])
def api_get_match_status():
    ac_code = request.args.get('Ac_Code') 
    company_code = request.args.get('Company_Code') 
    year_code = request.args.get('Year_Code') 

    match_status = get_match_status(ac_code, company_code, year_code)

    if match_status is not None:
        return jsonify({'match_status': match_status})
    else:
        return jsonify({'error': 'Match status not found or database error'}), 404

