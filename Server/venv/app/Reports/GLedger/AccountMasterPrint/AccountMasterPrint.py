import traceback
from flask import Flask, jsonify, request
from app import app, db
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import os

API_URL = os.getenv('API_URL')

ACCOUNT_MASTER_QUERY_BASE = '''
SELECT
    dbo.nt_1_accountmaster.Ac_Code,
    dbo.nt_1_accountmaster.Ac_Name_E,
    dbo.nt_1_accountmaster.Ac_type,
    dbo.nt_1_accountmaster.Address_E,
    dbo.nt_1_accountmaster.City_Code,
    dbo.nt_1_accountmaster.Pincode,
    dbo.nt_1_accountmaster.Tin_No,
    dbo.nt_1_accountmaster.Gst_No,
    dbo.nt_1_accountmaster.Email_Id,
    dbo.nt_1_accountmaster.Bank_Ac_No,
    dbo.nt_1_accountmaster.Group_Code,
    dbo.nt_1_accountmaster.Short_Name,
    dbo.nt_1_accountmaster.Mobile_No,
    dbo.nt_1_accountmaster.accoid,
    dbo.nt_1_accountmaster.cityid,
    dbo.nt_1_bsgroupmaster.group_Name_E,
    dbo.nt_1_bsgroupmaster.group_Name_R,
    dbo.nt_1_bsgroupmaster.group_Type,
    dbo.nt_1_bsgroupmaster.group_Summary,
    dbo.nt_1_bsgroupmaster.group_Order,
    dbo.nt_1_bsgroupmaster.Company_Code,
    dbo.nt_1_citymaster.city_name_e AS cityname,
    dbo.nt_1_citymaster.pincode AS citypincode,
    dbo.nt_1_citymaster.state AS citystate,
    dbo.nt_1_citymaster.GstStateCode AS citygststatecode,
    dbo.nt_1_accountmaster.whatsup_no,
    dbo.gststatemaster.State_Name,
    dbo.nt_1_accountmaster.adhar_no,
    dbo.nt_1_accountmaster.TDSApplicable,
    dbo.nt_1_accountmaster.PanLink,
    dbo.nt_1_accountmaster.PurchaseTDSApplicable,
    dbo.nt_1_accountmaster.Bank_Name,
    dbo.nt_1_accountmaster.CompanyPan,
    dbo.nt_1_accountmaster.AC_Pan,
    dbo.nt_1_accountmaster.GSTStateCode,
    dbo.nt_1_accountmaster.Created_Date
FROM
    dbo.nt_1_accountmaster
    LEFT OUTER JOIN dbo.nt_1_bsgroupmaster
        ON dbo.nt_1_accountmaster.Group_Code = dbo.nt_1_bsgroupmaster.group_Code
        AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_bsgroupmaster.Company_Code
    LEFT OUTER JOIN dbo.nt_1_citymaster
        ON dbo.nt_1_accountmaster.City_Code = dbo.nt_1_citymaster.city_code
        AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_citymaster.company_code
    LEFT OUTER JOIN dbo.gststatemaster
        ON dbo.nt_1_accountmaster.GSTStateCode = dbo.gststatemaster.State_Code
WHERE
    dbo.nt_1_accountmaster.company_code = :company_code
'''

def format_dates(record):
    formatted_record = {}
    for key, value in record.items():
        if isinstance(value, datetime):
            formatted_record[key] = value.strftime('%Y-%m-%d')
        else:
            formatted_record[key] = value
    return formatted_record

@app.route(API_URL + "/accountmaster-print", methods=["GET"])
def get_account_master_print():
    try:
        company_code = request.args.get('Company_Code', 4)
        ac_type = request.args.get('Ac_type', '').strip()
        group_code = request.args.get('Group_Code', '').strip()
        state_wise = request.args.get('Statewise', 'false').lower() in ('true', '1', 'yes')

        query = ACCOUNT_MASTER_QUERY_BASE
        params = {'company_code': company_code}

        if ac_type and ac_type.upper() != 'ALL':
            query += ' AND dbo.nt_1_accountmaster.Ac_type = :ac_type'
            params['ac_type'] = ac_type

        if group_code:
            query += ' AND dbo.nt_1_accountmaster.Group_Code = :group_code'
            params['group_code'] = group_code

        query += ' ORDER BY dbo.nt_1_accountmaster.Ac_Name_E ASC'

        result = db.session.execute(text(query), params)
        rows = result.fetchall()

        all_records_data = []
        for row in rows:
            row_dict = dict(row._mapping)
            formatted_row = format_dates(row_dict)
            all_records_data.append(formatted_row)

        return jsonify({
            "success": True,
            "company_code": company_code,
            "count": len(all_records_data),
            "data": all_records_data
        }), 200

    except SQLAlchemyError as e:
        app.logger.error(f"Database error: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": "Database error", "message": str(e)}), 500

    except Exception as e:
        app.logger.error(f"Internal server error: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
