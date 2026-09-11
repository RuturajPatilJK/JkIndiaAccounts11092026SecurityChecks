from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
import os
from sqlalchemy.engine import Row

API_URL = os.getenv('API_URL')

@app.route(API_URL+'/ProformaServiceBill', methods=['GET'])
def ProformaServiceBill():
    try:
        Company_Code = request.args.get('Company_Code')
        Customer_Code = request.args.get('Customer_Code')

        if Company_Code is None or Customer_Code is None:
            return jsonify({'error': 'Missing Customer_Code or CompanyCode parameter'}), 400

        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
               SELECT DISTINCT 
                         dbo.nt_1_proformaservicebillhead.rbid, dbo.nt_1_proformaservicebillhead.Doc_No, CONVERT(varchar,dbo.nt_1_proformaservicebillhead.Date,103) as Date, dbo.nt_1_proformaservicebillhead.Customer_Code, dbo.nt_1_proformaservicebillhead.GstRateCode, 
                         dbo.nt_1_proformaservicebillhead.Subtotal, dbo.nt_1_proformaservicebillhead.CGSTRate, dbo.nt_1_proformaservicebillhead.CGSTAmount, dbo.nt_1_proformaservicebillhead.SGSTRate, 
                         dbo.nt_1_proformaservicebillhead.SGSTAmount, dbo.nt_1_proformaservicebillhead.IGSTRate, dbo.nt_1_proformaservicebillhead.IGSTAmount, dbo.nt_1_proformaservicebillhead.Total, 
                         dbo.nt_1_proformaservicebillhead.Round_Off, dbo.nt_1_proformaservicebillhead.Final_Amount, dbo.nt_1_proformaservicebillhead.IsTDS, dbo.nt_1_proformaservicebillhead.TDS_Ac, dbo.nt_1_proformaservicebillhead.TDS_Per, 
                         dbo.nt_1_proformaservicebillhead.TDSAmount, dbo.nt_1_proformaservicebillhead.TDS, dbo.nt_1_proformaservicebillhead.Branch_Code, dbo.nt_1_proformaservicebillhead.Created_By, 
                         dbo.nt_1_proformaservicebillhead.Modified_By, dbo.nt_1_proformaservicebillhead.billno, dbo.nt_1_proformaservicebillhead.cc, dbo.nt_1_proformaservicebillhead.ta, dbo.nt_1_proformaservicebillhead.TCS_Rate, 
                         dbo.nt_1_proformaservicebillhead.TCS_Amt, dbo.nt_1_proformaservicebillhead.TCS_Net_Payable, dbo.nt_1_proformaservicebillhead.einvoiceno, dbo.nt_1_proformaservicebillhead.ackno, 
                         dbo.nt_1_proformaservicebillhead.QRCode, dbo.nt_1_proformaservicebillhead.gstid, dbo.nt_1_proformaservicebillhead.LockedRecord, dbo.nt_1_proformaservicebillhead.LockedUser, 
                         dbo.nt_1_proformaservicebillhead.Company_Code, dbo.nt_1_proformaservicebillhead.Year_Code, dbo.nt_1_proformaservicebilldetail.Doc_No AS proformadetailDocNo, dbo.nt_1_proformaservicebilldetail.Detail_Id, 
                         dbo.nt_1_proformaservicebilldetail.Item_Code, dbo.nt_1_proformaservicebilldetail.Description, dbo.nt_1_proformaservicebilldetail.Amount, dbo.nt_1_proformaservicebilldetail.rbid AS detailrbid, 
                         dbo.nt_1_proformaservicebilldetail.rbdid, dbo.nt_1_proformaservicebilldetail.Company_Code AS Detailcompanycode, dbo.nt_1_proformaservicebilldetail.Year_Code AS detailYearCode, dbo.nt_1_accountmaster.Ac_Code, 
                         dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_gstratemaster.GST_Name, dbo.nt_1_proformaservicebilldetail.Group_Code, dbo.nt_1_proformaservicebilldetail.ic, nt_1_systemmaster_1.systemid, 
                         nt_1_systemmaster_1.System_Type, nt_1_systemmaster_1.System_Code, nt_1_systemmaster_1.System_Name_E, dbo.nt_1_proformaservicebilldetail.gcid, dbo.nt_1_systemmaster.System_Type AS GroupCodeSystemtype, 
                         dbo.nt_1_systemmaster.System_Code AS GroupCodeSystemCode, dbo.nt_1_systemmaster.System_Name_E AS GroupCodeSystemName, dbo.nt_1_accountmaster.accoid, dbo.nt_1_rentbillhead.ProformaServicebillno, 
                         dbo.nt_1_rentbillhead.Proformaid,dbo.nt_1_proformaservicebillhead.Taxable_Amount

FROM            dbo.nt_1_proformaservicebillhead LEFT OUTER JOIN
                         dbo.nt_1_rentbillhead ON dbo.nt_1_proformaservicebillhead.Company_Code = dbo.nt_1_rentbillhead.Company_Code AND dbo.nt_1_proformaservicebillhead.rbid = dbo.nt_1_rentbillhead.Proformaid AND 
                         dbo.nt_1_proformaservicebillhead.Doc_No = dbo.nt_1_rentbillhead.ProformaServicebillno LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_proformaservicebillhead.gstid = dbo.nt_1_gstratemaster.gstid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_proformaservicebillhead.Company_Code = dbo.nt_1_accountmaster.company_code AND dbo.nt_1_proformaservicebillhead.cc = dbo.nt_1_accountmaster.accoid FULL OUTER JOIN
                         dbo.nt_1_proformaservicebilldetail LEFT OUTER JOIN
                         dbo.nt_1_systemmaster AS nt_1_systemmaster_1 ON dbo.nt_1_proformaservicebilldetail.Company_Code = nt_1_systemmaster_1.Company_Code AND 
                         dbo.nt_1_proformaservicebilldetail.ic = nt_1_systemmaster_1.systemid LEFT OUTER JOIN
                         dbo.nt_1_systemmaster ON dbo.nt_1_proformaservicebilldetail.Company_Code = dbo.nt_1_systemmaster.Company_Code AND dbo.nt_1_proformaservicebilldetail.gcid = dbo.nt_1_systemmaster.systemid ON 
                         dbo.nt_1_proformaservicebillhead.Year_Code = dbo.nt_1_proformaservicebilldetail.Year_Code AND dbo.nt_1_proformaservicebillhead.Company_Code = dbo.nt_1_proformaservicebilldetail.Company_Code AND 
                         dbo.nt_1_proformaservicebillhead.rbid = dbo.nt_1_proformaservicebilldetail.rbid
                WHERE  (dbo.nt_1_proformaservicebillhead.rbid <> ISNULL(dbo.nt_1_rentbillhead.Proformaid, 0))
                        AND dbo.nt_1_proformaservicebillhead.Company_Code = :Company_Code
                        AND dbo.nt_1_proformaservicebillhead.Customer_Code = :Customer_Code
                        ORDER BY dbo.nt_1_proformaservicebillhead.Doc_No DESC
            '''), {'Company_Code': Company_Code, 'Customer_Code': Customer_Code})

            result = query.fetchall()

        # Map the result directly to a list of dictionaries
        response = [row._asdict() for row in result]

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
