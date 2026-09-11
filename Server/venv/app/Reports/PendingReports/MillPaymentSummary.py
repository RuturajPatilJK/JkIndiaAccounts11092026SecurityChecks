from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
from flask import Flask, jsonify, request
import os

API_URL = os.getenv('API_URL')

def format_dates(task):
    return {
        "Tender_Date": task['Tender_Date'].strftime('%Y-%m-%d') if task['Tender_Date'] else None
    }
    
# @app.route(API_URL+'/pendingreport-MillPayment-Summary', methods=['GET'])
# def Pendingreport_MillPayment_Summary():
#     try:
#     #    company_code = request.args.get('Company_Code')
#         from_date = request.args.get('from_date')
#         to_date = request.args.get('to_date')

#         if not from_date or not to_date:
#             return jsonify({'error': 'from_date and to_date are required'}), 400

#         with db.session.begin_nested():
#             query = db.session.execute(text('''
#               select * from qryMillpaymentBalancewithdispatch where
#                  Tender_Date BETWEEN :from_date AND :to_date and (millamount - sum(adjusted + paidamount)) <> 0
                                           
#             '''), {'from_date': from_date, 'to_date': to_date})

#             result = query.fetchall()

#         response = []
#         for row in result:
#             row_dict = row._asdict()
#             formatted_dates = format_dates(row_dict)
#             row_dict.update(formatted_dates)
#             response.append(row_dict)

#         return jsonify(response)

#     except SQLAlchemyError as error:
#         print("Error fetching data:", error)
#         db.session.rollback()
#         return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL+'/pendingreport-MillPayment-Summary', methods=['GET'])
def Pendingreport_MillPayment_Summary():
    try:
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')

        if not from_date or not to_date:
            return jsonify({'error': 'from_date and to_date are required'}), 400

        sql = text("""
            WITH x AS (
                SELECT
                    *,
                    MAX(ISNULL(millamount, 0)) OVER (
                        PARTITION BY Company_Code, Year_Code, Tender_No
                    ) AS MillTotal,
                    SUM(ISNULL(adjusted, 0) + ISNULL(paidamount, 0)) OVER (
                        PARTITION BY Company_Code, Year_Code, Tender_No
                    ) AS UsedTotal
                FROM qryMillpaymentBalancewithdispatch
                WHERE Tender_Date BETWEEN :from_date AND :to_date
            )
            SELECT
                x.*,
                (x.MillTotal - x.UsedTotal) AS PendingAmount
            FROM x
            WHERE (x.MillTotal - x.UsedTotal) <> 0
            ORDER BY Tender_Date, Tender_No;
        """)

        with db.session.begin_nested():
            rows = db.session.execute(sql, {'from_date': from_date, 'to_date': to_date}).fetchall()

        response = []
        for row in rows:
            row_dict = row._asdict()
            row_dict.update(format_dates(row_dict))  # your existing formatter
            response.append(row_dict)

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL + '/millpaymentdetail', methods=['GET'])
def millpaymentdetail():
    cc = request.args.get('Company_Code')
    ac = request.args.get('Ac_Code', '0')
    fd = request.args.get('from_date')
    td = request.args.get('to_date')

    sql = """
      SELECT *
      FROM qrymillpaymentdetail
      WHERE Tender_No IS NOT NULL
        AND Tender_Date BETWEEN :fd AND :td
        AND Company_Code = :cc
    """
    params = {'fd': fd, 'td': td, 'cc': cc}

    if ac and ac != '0':
        sql += " AND Payment_To = :ac"
        params['ac'] = ac

    sql += " ORDER BY Tender_Date, Tender_No"

    rows = db.session.execute(text(sql), params).mappings().all()
    return jsonify([dict(r) for r in rows])
