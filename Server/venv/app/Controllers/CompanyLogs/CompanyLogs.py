from app import app, db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from flask import jsonify, request
import os
from datetime import datetime

API_URL = os.getenv('API_URL')

@app.route(API_URL + '/get-company-logs', methods=['GET'])
def get_company_logs():
    from_date = request.args.get('fromDate')
    to_date = request.args.get('toDate')
    tran_type = request.args.get('tranType') 
    company_code = request.args.get('companyCode') 
    # year_code = request.args.get('year_code') 
    ac_name_e = request.args.get('acNameE')

    try:
        if not from_date or not to_date:
            return jsonify({'error': 'Missing Required Parameters.!'}), 400

        try:
            from_date = from_date.strip("'")
            from_date = datetime.strptime(from_date, '%Y-%m-%d').date()  
        except ValueError:
            return jsonify({'error': 'Invalid fromDate format. Use YYYY-MM-DD.'}), 400

        try:
            to_date = to_date.strip("'")
            to_date = datetime.strptime(to_date, '%Y-%m-%d').date() 
        except ValueError:
            return jsonify({'error': 'Invalid toDate format. Use YYYY-MM-DD.'}), 400

        query = text("""
            SELECT 
                dbo.CompanyLogs.Tran_Type, 
                dbo.CompanyLogs.Doc_No, 
                CONVERT(varchar, dbo.CompanyLogs.Doc_Date, 23) AS Doc_Date,
                CONVERT(varchar, dbo.CompanyLogs.Updated_Doc_Date, 23) AS Updated_Doc_Date,
                dbo.tbluser.User_Name, 
                dbo.CompanyLogs.User_Id, 
                dbo.CompanyLogs.Updated_Time, 
                CONVERT(varchar, dbo.CompanyLogs.Record_Date, 23) AS Record_Date,
                COUNT(*) AS count, 
                dbo.CompanyLogs.Company_Code, 
                dbo.CompanyLogs.Year_Code
            FROM dbo.CompanyLogs
            INNER JOIN dbo.tbluser 
                ON dbo.CompanyLogs.User_Id = dbo.tbluser.User_Id
            INNER JOIN dbo.nt_1_accountmaster 
                ON dbo.CompanyLogs.Ac_Code = dbo.nt_1_accountmaster.Ac_Code  
                AND dbo.CompanyLogs.Company_Code = dbo.nt_1_accountmaster.company_code
            WHERE 
                dbo.CompanyLogs.Record_Date BETWEEN :from_date AND :to_date
        """)

        if tran_type and tran_type != 'All':
            query = text(query.text + " AND dbo.CompanyLogs.Tran_Type = :tran_type")

        if company_code:
            query = text(query.text + " AND dbo.CompanyLogs.Company_Code = :company_code")

        if ac_name_e:
            query = text(query.text + " AND dbo.nt_1_accountmaster.Ac_Name_E LIKE :ac_name_pattern")

        query = text(query.text + """
            GROUP BY 
                dbo.CompanyLogs.Tran_Type, 
                dbo.CompanyLogs.Doc_No, 
                dbo.CompanyLogs.Doc_Date, 
                dbo.CompanyLogs.Updated_Doc_Date, 
                dbo.tbluser.User_Name, 
                dbo.CompanyLogs.User_Id, 
                dbo.CompanyLogs.Updated_Time, 
                dbo.CompanyLogs.Record_Date, 
                dbo.CompanyLogs.Company_Code, 
                dbo.CompanyLogs.Year_Code
      
        """)

        params = {
            'from_date': from_date,
            'to_date': to_date
        }

        if tran_type and tran_type != 'All':
            params['tran_type'] = tran_type

        if company_code:
            params['company_code'] = company_code

        if ac_name_e:
            params['ac_name_pattern'] = f"%{ac_name_e}%"

        result = db.session.execute(query, params)
        
        company_logs = []
        for row in result:
            row_dict = dict(row._mapping)
            for key, value in row_dict.items():
                if hasattr(value, 'isoformat'): 
                    row_dict[key] = value.isoformat()
            company_logs.append(row_dict)

        return jsonify({'companyLogs': company_logs})

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    
@app.route(API_URL + '/get-company-log-details', methods=['GET'])
def get_company_log_details():
    try:
        tran_type = request.args.get('tranType')
        company_code = request.args.get('companyCode')
        # year_code = request.args.get('yearCode')
        doc_no = request.args.get('docNo')
        updated_time = request.args.get('updatedTime') 
        ac_code = request.args.get('acCode')

        if not all([tran_type, company_code, doc_no]):
            return jsonify({
                'error': 'Missing required parameters',
                'required': ['tranType', 'companyCode',  'docNo']
            }), 400

        query = """
           SELECT 
    dbo.CompanyLogs.Tran_Type, 
    dbo.CompanyLogs.Doc_No, 
    dbo.CompanyLogs.Doc_Date, 
    dbo.CompanyLogs.Updated_Doc_Date,
    dbo.tbluser.User_Name, 
    dbo.CompanyLogs.User_Id, 
    dbo.CompanyLogs.Updated_Time, 
    dbo.CompanyLogs.Record_Date AS count, 
    dbo.CompanyLogs.Company_Code, 
    dbo.CompanyLogs.Year_Code, 
    dbo.CompanyLogs.Ac_Code, 
    dbo.CompanyLogs.Bank_Ac,
    dbo.CompanyLogs.Narration, 
    dbo.nt_1_accountmaster.Ac_Name_E, 
    dbo.CompanyLogs.Value, 
    dbo.CompanyLogs.Record_Type,
    dbo.CompanyLogs.Item_Code,
    dbo.CompanyLogs.Quintal,
    dbo.CompanyLogs.Sale_Rate,
    dbo.CompanyLogs.Purchase_Rate,
    dbo.CompanyLogs.Sale_TDS,
    dbo.CompanyLogs.Purchase_TDS,
    dbo.CompanyLogs.DO_No,
    dbo.CompanyLogs.Rate,
    CASE dbo.CompanyLogs.SaleTDSApplicable
        WHEN 'L' THEN 'Lock'
        WHEN 'Y' THEN 'Sale TDS By Limit'
        WHEN 'N' THEN 'Sale TCS By Limit'
        WHEN 'T' THEN 'TCS Bill 1 Sale'
        WHEN 'S' THEN 'TDS Bill 1 Sale'
        WHEN 'U' THEN 'URP'
        WHEN 'B' THEN 'Sale TDS On Total Bill'
        WHEN 'X' THEN 'No TDS on Sale'
        ELSE ''
    END AS SaleTDSApplicable,

    CASE dbo.CompanyLogs.PurchaseTDSApplicable
        WHEN 'L' THEN 'Lock'
        WHEN 'Y' THEN 'Purchase TDS By Limit'
        WHEN 'P' THEN 'Purchase TDS By 1st Bill'
        WHEN 'N' THEN 'Purchase TCS By Limit'
        WHEN 'B' THEN 'Purchase TCS By 1st Bill'
        WHEN 'U' THEN 'URP'
        WHEN 'T' THEN 'Purchase TDS On Total Bill'
        WHEN 'X' THEN 'No TDS on Purchase'
        ELSE ''
    END AS PurchaseTDSApplicable

FROM dbo.CompanyLogs
INNER JOIN dbo.tbluser 
    ON dbo.CompanyLogs.User_Id = dbo.tbluser.User_Id
LEFT JOIN dbo.nt_1_accountmaster 
    ON dbo.CompanyLogs.Ac_Code = dbo.nt_1_accountmaster.Ac_Code
WHERE dbo.CompanyLogs.Tran_Type = :tran_type
    AND dbo.CompanyLogs.Company_Code = :company_code
    AND dbo.CompanyLogs.Doc_No = :doc_no

        """

        params = {
            'tran_type': tran_type,
            'company_code': company_code,
            'doc_no': doc_no
        }

        if ac_code:
            query += " AND dbo.CompanyLogs.Ac_Code = :ac_code"
            params['ac_code'] = ac_code

        if updated_time:
            query += " AND dbo.CompanyLogs.Updated_Time = :updated_time"
            params['updated_time'] = updated_time

        query += " ORDER BY dbo.CompanyLogs.Record_Date, dbo.CompanyLogs.Updated_Time"

        result = db.session.execute(text(query), params)

        log_details = []
        for row in result:
            row_dict = dict(row._mapping)
            for key, value in row_dict.items():
                if hasattr(value, 'isoformat'):
                    row_dict[key] = value.isoformat()
            log_details.append(row_dict)

        return jsonify({
            'success': True,
            'count': len(log_details),
            'logDetails': log_details
        })

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Database error', 'message': str(e)}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': 'Server error', 'message': str(e)}), 500
