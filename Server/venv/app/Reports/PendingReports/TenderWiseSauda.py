from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
from flask import Flask, jsonify, request
from flask_mail import Mail, Message
import os

API_URL = os.getenv('API_URL')

def format_dates(task):
    return {
        "PaymentDate": task['PaymentDate'].strftime('%Y-%m-%d') if task['PaymentDate'] else None,
        "Sauda_Date": task['Sauda_Date'].strftime('%Y-%m-%d') if task['Sauda_Date'] else None,
    }


    
@app.route(API_URL+'/pendingreport-tenderwisesauda', methods=['GET'])
def Pendingreport_Tenderwisesauda():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
               SELECT   dbo.nt_1_tenderdetails.tenderdetailid, dbo.nt_1_tenderdetails.Sauda_Date, dbo.nt_1_tender.Tender_No, dbo.nt_1_tenderdetails.ID, Customer.Ac_Name_E AS CustomerName, dbo.nt_1_tender.season, 
                         ISNULL(dbo.nt_1_systemmaster.System_Name_E, dbo.nt_1_tender.Grade) AS Grade, dbo.nt_1_tenderdetails.Sale_Rate, dbo.nt_1_tender.Mill_Rate, Mill.Ac_Name_E AS MillName, 
                         dbo.nt_1_accountmaster.Ac_Name_E AS PartyName, dbo.nt_1_tenderdetails.Buyer_Quantal AS Qty, dbo.nt_1_tenderdetails.Delivery_Type AS DispatchType, dbo.nt_1_tenderdetails.CashDiff AS CA, 
                         dbo.nt_1_tenderdetails.Narration, dbo.nt_1_tenderdetails.Lifting_Date AS PaymentDate, dbo.nt_1_tender.Mill_Code, dbo.nt_1_tender.mc, dbo.nt_1_tenderdetails.Buyer_Party, dbo.nt_1_tenderdetails.buyerid
FROM            dbo.nt_1_tender INNER JOIN
                         dbo.nt_1_tenderdetails ON dbo.nt_1_tender.tenderid = dbo.nt_1_tenderdetails.tenderid INNER JOIN
                         dbo.nt_1_accountmaster AS Customer ON dbo.nt_1_tenderdetails.buyerid = Customer.accoid INNER JOIN
                         dbo.nt_1_accountmaster AS Mill ON dbo.nt_1_tender.mc = Mill.accoid INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_tenderdetails.buyerpartyid = dbo.nt_1_accountmaster.accoid LEFT OUTER JOIN
                         dbo.nt_1_systemmaster ON dbo.nt_1_tenderdetails.gradeid = dbo.nt_1_systemmaster.systemid AND dbo.nt_1_tenderdetails.Company_Code = dbo.nt_1_systemmaster.Company_Code
                WHERE           dbo.nt_1_tenderdetails.Sauda_Date BETWEEN :from_date AND :to_date
                                            ORDER BY dbo.nt_1_tender.mc, dbo.nt_1_tenderdetails.Sauda_Date
            '''), {'from_date': from_date, 'to_date': to_date})

            result = query.fetchall()

        response = []
        for row in result:
            row_dict = row._asdict()
            formatted_dates = format_dates(row_dict)
            row_dict.update(formatted_dates)
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
