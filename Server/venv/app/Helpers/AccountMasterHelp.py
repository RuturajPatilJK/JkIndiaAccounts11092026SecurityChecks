from flask import jsonify, request
from app import app, db, socketio
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
import os

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

@app.route(API_URL+'/account_master_all', methods=['GET'])
def account_master_all():
    try:
        # Extract Company_Code and Ac_type from query parameters
        Company_Code = request.args.get('Company_Code')
        Ac_type = request.args.get('Ac_type')

        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Start a database transaction
        with db.session.begin_nested():
            if Ac_type:
                query = db.session.execute(text(''' 
                    SELECT        dbo.nt_1_accountmaster.Ac_Code, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_accountmaster.Ac_type, dbo.nt_1_citymaster.city_name_e AS cityname, dbo.nt_1_accountmaster.Gst_No, 
                         dbo.nt_1_accountmaster.accoid, dbo.nt_1_accountmaster.Mobile_No, dbo.nt_1_accountmaster.TDSApplicable, dbo.nt_1_accountmaster.GSTStateCode, dbo.nt_1_accountmaster.Commission, 
                         dbo.gststatemaster.State_Name,dbo.nt_1_accountmaster.EbuyDailyLimit,
                           dbo.nt_1_accountmaster.EbuyDailySellLimit
FROM            dbo.nt_1_accountmaster LEFT OUTER JOIN
                         dbo.gststatemaster ON dbo.nt_1_accountmaster.GSTStateCode = dbo.gststatemaster.State_Code LEFT OUTER JOIN
                         dbo.nt_1_citymaster ON dbo.nt_1_accountmaster.City_Code = dbo.nt_1_citymaster.city_code AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_citymaster.company_code
                    WHERE dbo.nt_1_accountmaster.Company_Code=:company_code  
                    AND dbo.nt_1_accountmaster.Ac_type IN :Ac_type
                    ORDER BY Ac_Code DESC
                '''), {'company_code': Company_Code, 'Ac_type':  tuple(Ac_type)})
            else:
                query = db.session.execute(text(''' 
                    SELECT        dbo.nt_1_accountmaster.Ac_Code, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_accountmaster.Ac_type, dbo.nt_1_citymaster.city_name_e AS cityname, dbo.nt_1_accountmaster.Gst_No, 
                         dbo.nt_1_accountmaster.accoid, dbo.nt_1_accountmaster.Mobile_No, dbo.nt_1_accountmaster.TDSApplicable, dbo.nt_1_accountmaster.GSTStateCode, dbo.nt_1_accountmaster.Commission, 
                         dbo.gststatemaster.State_Name,dbo.nt_1_accountmaster.EbuyDailyLimit,
                           dbo.nt_1_accountmaster.EbuyDailySellLimit
FROM            dbo.nt_1_accountmaster LEFT OUTER JOIN
                         dbo.gststatemaster ON dbo.nt_1_accountmaster.GSTStateCode = dbo.gststatemaster.State_Code LEFT OUTER JOIN
                         dbo.nt_1_citymaster ON dbo.nt_1_accountmaster.City_Code = dbo.nt_1_citymaster.city_code AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_citymaster.company_code 
                    WHERE dbo.nt_1_accountmaster.Company_Code=:company_code
                    ORDER BY Ac_Code DESC
                '''), {'company_code': Company_Code})

            result = query.fetchall()

        # Format the results into a response list
        response = []
        for row in result:
            response.append({
                'Ac_Code': row.Ac_Code,
                'Ac_type': row.Ac_type,
                'Ac_Name_E': row.Ac_Name_E,
                'cityname': row.cityname,
                'Gst_No': row.Gst_No,
                'accoid': row.accoid,
                'Mobile_No': row.Mobile_No,
                'TDSApplicable': row.TDSApplicable,
                'GSTStateCode': row.GSTStateCode,
                'Commission': row.Commission,
                'State_Name': row.State_Name,
                'EbuyDailyLimit': float(row.EbuyDailyLimit or 0),       
                'EbuyDailySellLimit': float(row.EbuyDailySellLimit or 0),
            })
        socketio.emit("get_accounts")
        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
