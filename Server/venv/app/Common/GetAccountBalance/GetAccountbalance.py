from flask import jsonify, request
from app import app, db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL+'/get_balance', methods=['GET'])
def get_balance():
    try:
        ac_code = request.args.get('ac_code')
        company_code = request.args.get('company_code')
        year_code = request.args.get('year_code')

        if not ac_code or not company_code:
            return jsonify({'error': 'Missing required parameters'}), 400

        try:
            ac_code = int(ac_code)
            company_code = int(company_code)
            year_code = int(year_code) if year_code else None
        except ValueError:
            return jsonify({'error': 'Invalid parameter type'}), 400

        with db.session.begin():
            group_type_query = text('''
                SELECT dbo.nt_1_bsgroupmaster.group_Type 
                FROM dbo.nt_1_gledger 
                INNER JOIN dbo.nt_1_accountmaster 
                    ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code 
                    AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code 
                INNER JOIN dbo.nt_1_bsgroupmaster 
                    ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code 
                    AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
                WHERE dbo.nt_1_gledger.AC_CODE=:ac_code 
                  AND dbo.nt_1_gledger.COMPANY_CODE=:company_code
                ORDER BY dbo.nt_1_gledger.AC_CODE OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
            ''')

            group_type_result = db.session.execute(group_type_query, {'ac_code': ac_code, 'company_code': company_code}).fetchone()

            if not group_type_result:
                return jsonify({'error': 'Data Not Found !'}), 404

            group_type = group_type_result[0].strip() if group_type_result[0] else ''

            query_str = '''
                SELECT SUM(CASE dbo.nt_1_gledger.DRCR 
                           WHEN 'D' THEN dbo.nt_1_gledger.AMOUNT 
                           WHEN 'C' THEN - dbo.nt_1_gledger.AMOUNT END) AS Balance,
                       dbo.nt_1_bsgroupmaster.group_Type,dbo.nt_1_accountmaster.Gst_No
                FROM dbo.nt_1_gledger
                INNER JOIN dbo.nt_1_accountmaster 
                    ON dbo.nt_1_gledger.AC_CODE = dbo.nt_1_accountmaster.Ac_Code 
                    AND dbo.nt_1_gledger.COMPANY_CODE = dbo.nt_1_accountmaster.company_code 
                INNER JOIN dbo.nt_1_bsgroupmaster 
                    ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code 
                    AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
                WHERE dbo.nt_1_gledger.AC_CODE = :ac_code 
                  AND dbo.nt_1_gledger.COMPANY_CODE = :company_code
            '''

            query_params = {'ac_code': ac_code, 'company_code': company_code}

            if group_type.upper() != 'B' and year_code:
                query_str += ' AND dbo.nt_1_gledger.YEAR_CODE = :year_code'
                query_params['year_code'] = year_code
            else:
                print("Skipping Year_Code condition") 

            query_str += ' GROUP BY dbo.nt_1_bsgroupmaster.group_Type,dbo.nt_1_accountmaster.Gst_No'

            query = text(query_str)
            result = db.session.execute(query, query_params).fetchone()

            if not result:
                return jsonify({
                    'Balance': 0.0,
                    'Gst_No': ""
                })

            return jsonify({
                'Balance': result.Balance,'Gst_No':result.Gst_No or ""
            })

    except SQLAlchemyError as error:
        print("Error fetching balance:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500