from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
from flask import Flask, jsonify, request
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL+'/get-bank-book', methods=['GET'])
def get_bankBook():
    ac_code = request.args.get('Ac_Code')
    from_date = request.args.get('fromDate')
    to_date = request.args.get('toDate')
    company_code = request.args.get('Company_Code')

    try:
        op_bal_query = text("""
            SELECT AC_CODE, SUM(CASE WHEN drcr = 'D' THEN AMOUNT ELSE -AMOUNT END) AS OpBal
            FROM NT_1_GLEDGER
            WHERE DOC_DATE < :from_date AND Ac_code = :ac_code AND Company_Code = :company_code
            GROUP BY AC_CODE order by AC_CODE
        """)

        result = db.session.execute(op_bal_query, {'from_date': from_date, 'ac_code': ac_code, 'company_code': company_code})
        op_bal = [dict(row._mapping) for row in result]

        transactions_query = text("""
            SELECT        dbo.nt_1_gledger.AC_CODE, dbo.nt_1_gledger.TRAN_TYPE, dbo.nt_1_gledger.DOC_NO, CONVERT(varchar(10), dbo.nt_1_gledger.DOC_DATE, 102) AS DOC_DATE, dbo.nt_1_gledger.NARRATION, dbo.nt_1_gledger.AMOUNT, 
                         dbo.nt_1_gledger.ADJUSTED_AMOUNT, dbo.nt_1_gledger.AC_CODE AS Expr1, dbo.nt_1_gledger.UNIT_Code, dbo.nt_1_gledger.DRCR, dbo.nt_1_gledger.SORT_TYPE, dbo.nt_1_gledger.SORT_NO, 
                         dbo.nt_1_accountmaster.Ac_Name_E
FROM            dbo.nt_1_gledger LEFT OUTER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_gledger.ac = dbo.nt_1_accountmaster.accoid
            WHERE dbo.nt_1_gledger.DRCR_HEAD = :ac_code AND dbo.nt_1_gledger.DOC_DATE BETWEEN :from_date AND :to_date AND dbo.nt_1_gledger.Company_Code = :company_code
            ORDER BY DOC_DATE ASC ,SORT_TYPE,SORT_NO,ORDER_CODE
        """)

        transactions = db.session.execute(transactions_query, {'from_date': from_date, 'to_date': to_date, 'ac_code': ac_code, 'company_code': company_code})
        transaction_list = [dict(row._mapping) for row in transactions]

        return jsonify({'opBal': op_bal, 'transactions': transaction_list})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
