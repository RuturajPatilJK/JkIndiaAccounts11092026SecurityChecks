from flask import jsonify
from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
import os



API_URL = os.getenv('API_URL')


@app.route(API_URL+'/SaudaBookUtilityHelp', methods=['GET'])
def SaudaBookUtilityHelp():
    try:
        CompanyCode = request.args.get('CompanyCode')
        MillCode = request.args.get('MillCode')

        #Tender_No = request.args.get('Tender_No')

        if  CompanyCode is None or MillCode is None:
            return jsonify({'error': 'Missing MillCode or CompanyCode parameter'}), 400
        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
               select Tender_No,millshortname,convert(varchar(10),Lifting_Date,103) as Lifting_Date,tenderdoname,Grade,Mill_Rate,balance,Quantal,tenderid,Mill_Code,mc,season,Purc_Rate,
                    ID from qrytenderdobalanceview where Buyer=2 and Company_Code= :CompanyCode and Mill_Code=:MillCode and (balance <> 0)
                           order by Tender_No desc
            '''),{'CompanyCode':CompanyCode, 'MillCode':MillCode})

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'Tender_No': row.Tender_No,
                'Lifting_Date': row.Lifting_Date,
                'tenderdoname': row.tenderdoname,
                'Mill_Rate': row.Mill_Rate,
                'Grade':row.Grade,
                'balance':row.balance,
                'Quantal':row.Quantal,
                'tenderid':row.tenderid,
                'Mill_Code':row.Mill_Code,
                'mc':row.mc,
                'season':row.season,
                'ID':row.ID,
                'Purc_Rate':row.Purc_Rate


            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    

