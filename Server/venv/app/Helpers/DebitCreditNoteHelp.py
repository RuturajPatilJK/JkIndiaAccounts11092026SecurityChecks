from flask import jsonify, request
from app import app, db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
import os
import traceback

API_URL = os.getenv('API_URL')

@app.route(API_URL+'/debit_credit_help', methods=['GET'])
def debit_credit_help():
    tran_type = request.args.get('tran_type')
    ac_code = request.args.get('ac_code')
    company_code = request.args.get('company_code')

    try:
        if tran_type in ['CN', 'DN']:
            query = """
            SELECT DISTINCT 
                         dbo.qrySaleBillForDebitnote.Billid, dbo.qrySaleBillForDebitnote.doc_no, dbo.qrySaleBillForDebitnote.docdate, dbo.qrySaleBillForDebitnote.Ac_Code, dbo.qrySaleBillForDebitnote.Ac_Name_E AS Party_Name, 
                         dbo.qrySaleBillForDebitnote.Amount, dbo.qrySaleBillForDebitnote.Tran_Type, dbo.qrySaleBillForDebitnote.ShipTo, dbo.qrySaleBillForDebitnote.ShipToName, dbo.qrySaleBillForDebitnote.MillCode, 
                         dbo.qrySaleBillForDebitnote.MillName, dbo.qrySaleBillForDebitnote.Bill_To, dbo.qrySaleBillForDebitnote.BillToName, dbo.qrySaleBillForDebitnote.uc, dbo.qrySaleBillForDebitnote.mc, dbo.qrySaleBillForDebitnote.bt, 
                         dbo.qrySaleBillForDebitnote.Qty, dbo.qrySaleBillForDebitnote.Year_Code AS BillYC, dbo.nt_1_accountmaster.accoid as ac, dbo.qrySaleBillForDebitnote.subTotal
FROM            dbo.qrySaleBillForDebitnote LEFT OUTER JOIN
                         dbo.nt_1_accountmaster ON dbo.qrySaleBillForDebitnote.Ac_Code = dbo.nt_1_accountmaster.Ac_Code AND dbo.qrySaleBillForDebitnote.Company_Code = dbo.nt_1_accountmaster.company_code

            WHERE qrySaleBillForDebitnote.Ac_Code = :ac_code  AND dbo.qrySaleBillForDebitnote.Company_Code = :company_code
            ORDER BY docdate DESC
            """
            params = {'ac_code': ac_code, 'company_code': company_code}
        else:
            query = """
           SELECT DISTINCT 
                         dbo.qrypurchasebillforDebitnote.purchaseid, dbo.qrypurchasebillforDebitnote.doc_no, dbo.qrypurchasebillforDebitnote.docdate, dbo.qrypurchasebillforDebitnote.Ac_Code, 
                         dbo.qrypurchasebillforDebitnote.Ac_Name_E AS Party_Name, dbo.qrypurchasebillforDebitnote.TCS_Net_Payable AS Amount, dbo.qrypurchasebillforDebitnote.Tran_Type, dbo.qrypurchasebillforDebitnote.ShipTo, 
                         dbo.qrypurchasebillforDebitnote.ShipToName, dbo.qrypurchasebillforDebitnote.mill_code AS MillCode, dbo.qrypurchasebillforDebitnote.MillName, 0 AS Bill_To, '' AS BillToName, dbo.qrypurchasebillforDebitnote.uc, 
                         dbo.qrypurchasebillforDebitnote.mc, 0 AS bt, dbo.qrypurchasebillforDebitnote.Qty, dbo.qrypurchasebillforDebitnote.Year_Code AS BillYC, dbo.nt_1_accountmaster.accoid AS ac
FROM            dbo.qrypurchasebillforDebitnote INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.qrypurchasebillforDebitnote.Ac_Code = dbo.nt_1_accountmaster.Ac_Code AND dbo.qrypurchasebillforDebitnote.Company_Code = dbo.nt_1_accountmaster.company_code
            WHERE dbo.qrypurchasebillforDebitnote.Ac_Code = :ac_code
            """
            params = {'ac_code': ac_code}

        result = db.session.execute(text(query), params)
        records = [dict(row._mapping) for row in result] 
        return jsonify(records)
    except SQLAlchemyError as e:
        print(traceback.format_exc())
        return jsonify({'error': 'Database operation failed'}), 500
    except Exception as e:
        return jsonify({'error': 'An unexpected error occurred'}), 500
