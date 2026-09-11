from flask import request, jsonify
from sqlalchemy import text
from app import app, db
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL + '/get-normal-sauda', methods=['GET'])
def get_normal_sauda():
    try:
        acccode = request.args.get('accode', default="", type=str)
        popconfirmvalue = request.args.get('popconfirmvalue', default="", type=str)
        company_code = request.args.get('Company_Code', type=int)
        year_code = request.args.get('Year_Code', type=int)
        from_date = request.args.get('from_date', default='2024-04-01', type=str)
        to_date = request.args.get('to_date', default='2025-03-31', type=str)

        if not company_code or not year_code:
            return jsonify({"error": "Company_Code and Year_Code are required"}), 400

        print('AcCode', acccode)

        if not acccode or int(acccode) == "0":
            query = '''
                SELECT * FROM qrytenderheaddetail
                WHERE Sauda_Date BETWEEN :start_date AND :end_date
                  AND Company_Code = :company_code AND Year_Code = :year_code
                  ORDER BY Sauda_Date ASC
            '''
            params = {
                "start_date": from_date,
                "end_date": to_date,
                "company_code": company_code,
                "year_code": year_code
            }
        else:
            if popconfirmvalue == "N":
                query = '''
                    SELECT * FROM qrytenderheaddetail
                    WHERE Sauda_Date BETWEEN :start_date AND :end_date
                      AND Mill_Code = :accode
                      AND Company_Code = :company_code AND Year_Code = :year_code
                      ORDER BY Sauda_Date ASC
                '''
            else:
                query = '''
                    SELECT * FROM qrytenderheaddetail
                    WHERE Sauda_Date BETWEEN :start_date AND :end_date
                      AND Buyer = :accode
                      AND Company_Code = :company_code AND Year_Code = :year_code
                      ORDER BY Sauda_Date ASC
                '''
            params = {
                "start_date": from_date,
                "end_date": to_date,
                "accode": acccode,
                "company_code": company_code,
                "year_code": year_code
            }

        result = db.session.execute(text(query), params).fetchall()
        data = [dict(row._mapping) for row in result]

        return jsonify({"data": data}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500