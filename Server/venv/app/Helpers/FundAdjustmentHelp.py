from flask import jsonify, request
from app import app, db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
import os
# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

@app.route(API_URL + '/get-fundadjustment-data', methods=['GET'])
def get_fund_adjustment_data():
    try:
        # Extract Company_Code from query parameters
        Company_Code = request.args.get('Company_Code')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
             SELECT        dbo.FundManagements.Doc_no, dbo.FundManagements.Doc_date, dbo.FundManagements.Riceipt_date, dbo.FundManagements.Riceipt_amount, dbo.FundManagements.Funding_from, dbo.FundManagements.ff, 
                         dbo.FundManagements.Funding_rate, dbo.FundManagements.Bill_to, dbo.FundManagements.Bill_rate, dbo.FundManagements.TDS_rate, dbo.FundManagements.gstid, dbo.FundManagements.GST_rate_code, 
                         dbo.FundManagements.Total_amount, dbo.FundManagements.GST_rate, dbo.FundManagements.GST_amount, dbo.FundManagements.TDS_amount, dbo.FundManagements.Purchase_TDS_rate, 
                         dbo.FundManagements.Purchase_GST_amount, dbo.FundManagements.Purchase_TDS_amount, dbo.FundManagements.Purchase_GST_rate, dbo.FundManagements.Ref_no, dbo.FundManagements.Due_days, 
                         dbo.FundManagements.Interest_rate, dbo.FundManagements.Interest_amount, dbo.FundManagements.Purchase_rate, dbo.FundManagements.Purchase_bill_amount, dbo.FundManagements.Actual_payment_date, 
                         dbo.FundManagements.Interest_adjusted_rate, dbo.FundManagements.Payment_adjustment_no, dbo.FundManagements.Payment_adjustment_amount, dbo.FundManagements.less_rate, 
                         dbo.FundManagements.Actual_payment_amount, dbo.FundManagements.Other_amount, dbo.FundManagements.Company_code, dbo.FundManagements.Created_By, dbo.FundManagements.Modify_By, 
                         dbo.FundManagements.PurcBillTo, dbo.FundManagements.Remark, dbo.FundManagements.Is_completed, dbo.FundManagements.fundId, dbo.nt_1_gstratemaster.GST_Name, 
                         nt_1_accountmaster_1.Ac_Name_E AS FundingFromName, dbo.nt_1_accountmaster.Ac_Name_E AS bill_to_name, dbo.FundManagements.Quintal, dbo.FundManagements.bt, dbo.FundManagements.pt, 
                         nt_1_accountmaster_2.Ac_Name_E AS purches_bill_to_name, DATEDIFF(DAY, DATEADD(DAY, dbo.FundManagements.Due_days, dbo.FundManagements.Riceipt_date), dbo.FundManagements.Actual_payment_date) 
                         AS PaymentDelayDays, dbo.FundManagements.Advance_amount, dbo.FundManagements.Purchase_taxable_amount, dbo.FundManagements.Funding_Adjust
FROM            dbo.nt_1_gstratemaster RIGHT OUTER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_1 RIGHT OUTER JOIN
                         dbo.nt_1_accountmaster RIGHT OUTER JOIN
                         dbo.FundManagements ON dbo.nt_1_accountmaster.accoid = dbo.FundManagements.bt ON nt_1_accountmaster_1.accoid = dbo.FundManagements.ff LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_2 ON dbo.FundManagements.pt = nt_1_accountmaster_2.accoid ON dbo.nt_1_gstratemaster.gstid = dbo.FundManagements.gstid
WHERE        (dbo.FundManagements.Company_code = :company_code) AND (dbo.FundManagements.Advance_amount <> 0) AND (dbo.FundManagements.Ref_no = 0)
            '''), {'company_code': Company_Code})
            
            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'Doc_no': row.Doc_no,
                'Doc_date': row.Doc_date,
                'Riceipt_date': row.Riceipt_date,
                'Riceipt_amount': row.Riceipt_amount,
                'Funding_from': row.Funding_from,
                'ff': row.ff,
                'Funding_rate': row.Funding_rate,
                'Bill_to': row.Bill_to,
                'Bill_rate': row.Bill_rate,
                'TDS_rate': row.TDS_rate,
                'gstid': row.gstid,
                'GST_rate_code': row.GST_rate_code,
                'Total_amount': row.Total_amount,
                'GST_rate': row.GST_rate,
                'GST_amount': row.GST_amount,
                'TDS_amount': row.TDS_amount,
                'Purchase_TDS_rate':row.Purchase_TDS_rate,
                'Purchase_TDS_amount':row.Purchase_TDS_amount,
                'Purchase_GST_amount':row.Purchase_GST_amount,
                'Purchase_GST_rate':row.Purchase_GST_rate,
                'Ref_no': row.Ref_no,
                'Due_days': row.Due_days,
                'Interest_rate': row.Interest_rate,
                'Interest_amount': row.Interest_amount,
                'Purchase_rate': row.Purchase_rate,
                'Purchase_bill_amount': row.Purchase_bill_amount,
                'Actual_payment_date': row.Actual_payment_date,
                'Interest_adjusted_rate': row.Interest_adjusted_rate,
                'Payment_adjustment_no': row.Payment_adjustment_no,
                'Payment_adjustment_amount': row.Payment_adjustment_amount,
                'less_rate': row.less_rate,
                'Actual_payment_amount': row.Actual_payment_amount,
                'Other_amount': row.Other_amount,
                'Company_code': row.Company_code,
                'Created_By': row.Created_By,
                'Modify_By': row.Modify_By,
                'PurcBillTo': row.PurcBillTo,
                'Remark': row.Remark,
                'Is_completed': row.Is_completed,
                'fundId': row.fundId,
                'GST_Name': row.GST_Name,
                'FundingFromName': row.FundingFromName,
                'bill_to_name': row.bill_to_name,
                'Quintal': row.Quintal,
                'bt': row.bt,
                'pt': row.pt,
                'purches_bill_to_name': row.purches_bill_to_name,
                'PaymentDelayDays': row.PaymentDelayDays,
                'Advance_amount': row.Advance_amount,
                'Funding_Adjust':row.Funding_Adjust,
            
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


