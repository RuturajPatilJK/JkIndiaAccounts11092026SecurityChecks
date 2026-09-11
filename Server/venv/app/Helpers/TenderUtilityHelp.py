from flask import jsonify,request
from app import app, db 
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
import os

API_URL= os.getenv('API_URL')

@app.route(API_URL + '/tenderutility', methods=['GET'])
def tenderutility():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not all([company_code,year_code]):
            return jsonify({'error': 'Missing Required Parameters'}), 404

        with db.session.begin_nested():
            query = db.session.execute(text('''
              SELECT ROW_NUMBER() OVER ( order by Tender_No desc) AS RowNumber,dbo.nt_1_tender.Tender_No, CONVERT(varchar(10), dbo.nt_1_tender.Tender_Date, 103) AS Tender_Date, millto.Short_Name AS millshortname, dbo.nt_1_tender.Quantal, dbo.nt_1_tender.Grade, dbo.nt_1_tender.Mill_Rate, paymentto.Ac_Name_E AS paymenttoname, tenderdo.Ac_Name_E AS tenderdoname, dbo.nt_1_tender.season, broker.Ac_Name_E AS brokershortname, CONVERT(varchar(10), dbo.nt_1_tender.Lifting_Date, 103) AS Lifting_Date, dbo.nt_1_tender.tenderid FROM         dbo.nt_1_tender LEFT OUTER JOIN dbo.nt_1_accountmaster AS tenderdo ON dbo.nt_1_tender.td = tenderdo.accoid LEFT OUTER JOIN dbo.nt_1_accountmaster AS broker ON dbo.nt_1_tender.bk = broker.accoid LEFT OUTER JOIN dbo.nt_1_accountmaster AS paymentto ON dbo.nt_1_tender.pt = paymentto.accoid LEFT OUTER JOIN dbo.nt_1_accountmaster AS millto ON dbo.nt_1_tender.mc = millto.accoid where    dbo.nt_1_tender.Company_Code= :company_code and  dbo.nt_1_tender.Year_Code= :year_code order by dbo.nt_1_tender.Tender_no desc 
            '''),{'company_code':company_code,'year_code':year_code})

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                 'RowNumber': row.RowNumber,
                 'Tender_No': row.Tender_No,
                 'Tender_Date': row.Tender_Date,
                 'tenderid':row.tenderid,
                 'millshortname':row.millshortname,
                 'Quantal':row.Quantal,
                 'Grade':row.Grade,
                 'Mill_Rate':row.Mill_Rate,
                 'paymenttoname':row.paymenttoname  
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


