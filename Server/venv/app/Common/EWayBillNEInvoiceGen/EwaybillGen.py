from flask import Flask, jsonify, request
from app import app, db
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
import requests
from datetime import datetime
import traceback
import uuid

API_URL= os.getenv('API_URL')

API_URL_EWAYBILL = os.getenv('API_URL_EWAYBILL')
TOKEN_URL = os.getenv('TOKEN_URL')
GSP_APP_ID = os.getenv('GSP_APP_ID')
GSP_APP_SECRET = os.getenv('GSP_APP_SECRET')
USER_NAME=os.getenv('USER_NAME')
EWAY_PASSWORD=os.getenv('EWAY_PASSWORD')
EWAY_GSTIN=os.getenv('EWAY_GSTIN')

def generate_request_id():
    return str(uuid.uuid4())

@app.route(API_URL+'/create-ewaybill', methods=['POST'])
def create_ewaybill():
    try:
        token = request.json.get('token')
        if not token:
            return jsonify({'message': 'Token is required'}), 400
        
        request_id = generate_request_id()

        api_url = f"{API_URL_EWAYBILL}"

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
            'username': USER_NAME,
            'password': EWAY_PASSWORD,
            'gstin': EWAY_GSTIN,
            'requestid': request_id
        }

        body = request.json.get('eWayBillData')

        if not body:
            return jsonify({'message': 'Invoice data is required'}), 400

        response = requests.post(api_url, json=body, headers=headers)

        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'message': 'Error during invoice creation', 'error': response.text}), 500

    except Exception as e:
        return jsonify({'message': 'Error during invoice creation', 'error': str(e)}), 500


from flask import request, jsonify
from datetime import datetime
from sqlalchemy import text

@app.route(API_URL + '/updateEwayBillData', methods=['PUT'])
def updateEwayBillData():
    try:
        # Extract query parameters
        doc_no = request.args.get("doc_no")
        Company_Code = request.args.get("Company_Code")
        Year_Code = request.args.get("Year_Code")
        tran_type = request.args.get("tran_type")
        do_no = request.args.get("do_no")

        if not (doc_no and Company_Code and Year_Code and tran_type):
            return jsonify({
                "error": "doc_no, Company_Code, Year_Code, and tran_type are required as query parameters."
            }), 400

        # Parse the JSON body
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required."}), 400

        ewayBillDate = data.get('ewayBillDate')
        validUpto = data.get('validUpto')
        ewayBillNo = data.get('ewayBillNo')
        distance = data.get('distance')

        if not ewayBillDate or not validUpto:
            return jsonify({"error": "ewayBillDate or validUpto is required in the JSON body."}), 400

        try:
            formatted_date = datetime.strptime(ewayBillDate, "%d/%m/%Y %I:%M:%S %p").date()
            formattedValidateDate = datetime.strptime(validUpto, "%d/%m/%Y %I:%M:%S %p").date()
        except ValueError:
            return jsonify({"error": "Invalid ewayBillDate format. Expected 'dd/mm/yyyy hh:mm:ss AM/PM'."}), 400

        if not ewayBillNo:
            return jsonify({"error": "ewayBillNo is required in the JSON body."}), 400

        # SQL logic for different transaction types
        if tran_type == 'SB':
            if not do_no or str(do_no) == "0":
                update_query = text('''
                    UPDATE NT_1_SugarSale
                    SET EWay_Bill_No = :ewayBillNo,
                        EwayBillValidDate = :formattedValidateDate,
                        EwbDt = :ewayBillDate,
                        Actual_Distance = :distance
                    WHERE company_code = :Company_Code
                    AND year_code = :Year_Code
                    AND doc_no = :doc_no
                ''')

                # Common parameters
                params = {
                    'ewayBillNo': ewayBillNo,
                    'formattedValidateDate': formattedValidateDate,
                    'ewayBillDate': formatted_date,
                    'distance': distance,
                    'Company_Code': Company_Code,
                    'Year_Code': Year_Code,
                    'doc_no': doc_no
                }

                db.session.execute(update_query, params)

            else:

                update_query = text('''
                    UPDATE NT_1_deliveryorder 
                    SET EWay_Bill_No = :ewayBillNo,
                        EwayBillValidDate = :formattedValidateDate
                    WHERE company_code = :Company_Code
                    AND year_code = :Year_Code
                    AND SB_No = :doc_no
                ''')

                update_sale_query = text('''
                    UPDATE NT_1_SugarSale
                    SET EWay_Bill_No = :ewayBillNo,
                        EwayBillValidDate = :formattedValidateDate,
                        EwbDt = :ewayBillDate,
                        Actual_Distance = :distance
                    WHERE company_code = :Company_Code
                    AND year_code = :Year_Code
                    AND doc_no = :doc_no
                ''')

                # Common parameters
                params = {
                    'ewayBillNo': ewayBillNo,
                    'formattedValidateDate': formattedValidateDate,
                    'ewayBillDate': formatted_date,
                    'distance': distance,
                    'Company_Code': Company_Code,
                    'Year_Code': Year_Code,
                    'doc_no': doc_no
                }

                db.session.execute(update_query, params)
                db.session.execute(update_sale_query, params)

                
        elif tran_type == 'RS':
            update_query = text('''
                UPDATE NT_1_SugarSaleReturn
                SET EWay_Bill_No = :ewayBillNo
                WHERE company_code = :Company_Code
                  AND year_code = :Year_Code
                  AND doc_no = :doc_no
            ''')

            params = {
                'ewayBillNo': ewayBillNo,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code,
                'doc_no': doc_no
            }

            db.session.execute(update_query, params)

        else:
            return jsonify({
                "error": f"Tran type '{tran_type}' is not supported. Only 'SB' and 'RS' are allowed."
            }), 400

        db.session.commit()

        return jsonify({
            "message": f"Successfully updated E-WayBill data for doc_no={doc_no}, tran_type={tran_type}."
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error occurred: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500
    
@app.route(API_URL + "/get_eWayBill_print", methods=["GET"])
def get_eWayBill_print():
    try:
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        Company_Code = request.args.get('Company_Code')
       
        if not all([doc_no, Year_Code, Company_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        corporate_sale_check_query = '''
            SELECT Carporate_Sale_No 
            FROM dbo.NT_1qryEInvoiceCarporateSale
            WHERE doc_no = :doc_no and Year_Code = :Year_Code and Company_Code = :Company_Code
        '''

        corporate_sale_check = db.session.execute(
            text(corporate_sale_check_query), 
            {"doc_no": doc_no, "Year_Code":Year_Code, "Company_Code":Company_Code}
        ).fetchone()


        if corporate_sale_check and 'Carporate_Sale_No' in corporate_sale_check and corporate_sale_check['Carporate_Sale_No'] != 0:
            query = '''
SELECT        dbo.NT_1qryEInvoiceCarporateSale.doc_no, CONVERT(varchar, dbo.NT_1qryEInvoiceCarporateSale.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEInvoiceCarporateSale.BuyerGst_No) AS BuyerGst_No, 
                         UPPER(dbo.NT_1qryEInvoiceCarporateSale.Buyer_Name) AS Buyer_Name, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Buyer_Address) AS Buyer_Address, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Buyer_City) 
                         AS Buyer_City, (CASE Buyer_Pincode WHEN 0 THEN 999999 ELSE Buyer_Pincode END) AS Buyer_Pincode, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Buyer_State_name) AS Buyer_State_name, 
                         dbo.NT_1qryEInvoiceCarporateSale.Buyer_State_Code, dbo.NT_1qryEInvoiceCarporateSale.Buyer_Phno, dbo.NT_1qryEInvoiceCarporateSale.Buyer_Email_Id, UPPER(dbo.NT_1qryEInvoiceCarporateSale.DispatchGst_No) 
                         AS DispatchGst_No, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Dispatch_Name) AS Dispatch_Name, UPPER(dbo.NT_1qryEInvoiceCarporateSale.Dispatch_Address) AS Dispatch_Address, 
                         UPPER(dbo.NT_1qryEInvoiceCarporateSale.DispatchCity_City) AS DispatchCity_City, dbo.NT_1qryEInvoiceCarporateSale.Dispatch_GSTStateCode, (CASE Dispatch_Pincode WHEN 0 THEN 999999 ELSE Dispatch_Pincode END) 
                         AS Dispatch_Pincode, UPPER(dbo.NT_1qryEInvoiceCarporateSale.ShipToGst_No) AS ShipToGst_No, UPPER(dbo.NT_1qryEInvoiceCarporateSale.ShipTo_Name) AS ShipTo_Name, 
                         UPPER(dbo.NT_1qryEInvoiceCarporateSale.ShipTo_Address) AS ShipTo_Address, UPPER(dbo.NT_1qryEInvoiceCarporateSale.ShipTo_City) AS ShipTo_City, dbo.NT_1qryEInvoiceCarporateSale.ShipTo_GSTStateCode, 
                         (CASE ShipTo_Pincode WHEN 0 THEN 999999 ELSE ShipTo_Pincode END) AS ShipTo_Pincode, dbo.NT_1qryEInvoiceCarporateSale.NETQNTL, dbo.NT_1qryEInvoiceCarporateSale.rate, 
                         dbo.NT_1qryEInvoiceCarporateSale.CGSTAmount, dbo.NT_1qryEInvoiceCarporateSale.SGSTAmount, dbo.NT_1qryEInvoiceCarporateSale.IGSTAmount, dbo.NT_1qryEInvoiceCarporateSale.TaxableAmount, 
                         ISNULL(dbo.NT_1qryEInvoiceCarporateSale.CGSTRate, 0) AS CGSTRate, ISNULL(dbo.NT_1qryEInvoiceCarporateSale.SGSTRate, 0) AS SGSTRate, ISNULL(dbo.NT_1qryEInvoiceCarporateSale.IGSTRate, 0) AS IGSTRate, 
                         0 AS Expr1, dbo.NT_1qryEInvoiceCarporateSale.LORRYNO, dbo.NT_1qryEInvoiceCarporateSale.System_Name_E, dbo.NT_1qryEInvoiceCarporateSale.HSN, dbo.NT_1qryEInvoiceCarporateSale.GSTRate, 
                         dbo.NT_1qryEInvoiceCarporateSale.LESS_FRT_RATE, dbo.NT_1qryEInvoiceCarporateSale.saleid, ISNULL(dbo.NT_1qryEInvoiceCarporateSale.CGSTAmount, 0) + ISNULL(dbo.NT_1qryEInvoiceCarporateSale.SGSTAmount, 0) 
                         + ISNULL(dbo.NT_1qryEInvoiceCarporateSale.IGSTAmount, 0) + ISNULL(dbo.NT_1qryEInvoiceCarporateSale.TaxableAmount, 0) + ISNULL(dbo.NT_1qryEInvoiceCarporateSale.OTHER_AMT, 0) AS billAmount, 
                         dbo.company.Company_Name_E, dbo.company.Address_E, dbo.company.City_E, dbo.company.State_E, dbo.company.PIN, dbo.company.PHONE, dbo.company.GST, dbo.tbluser.EmailId, dbo.eway_bill.Branch, 
                         dbo.eway_bill.Account_Details, dbo.eway_bill.Mode_of_Payment, dbo.NT_1qryEInvoiceCarporateSale.EWay_Bill_No, dbo.NT_1qryEInvoiceCarporateSale.einvoiceno, CONVERT(varchar, 
                         dbo.NT_1qryEInvoiceCarporateSale.EwayBillValidDate, 103) AS validUpTo, dbo.nt_1_accountmaster.Ac_Name_E AS millname, dbo.accountingyear.year, dbo.NT_1qryEInvoiceCarporateSale.OTHER_AMT, 
                         ISNULL(dbo.NT_1qryEInvoiceCarporateSale.Actual_Distance, 0) AS Distance, ISNULL(dbo.NT_1qryEInvoiceCarporateSale.Carporate_Sale_No, 0) AS CarporateSaleNo, dbo.NT_1qryEInvoiceCarporateSale.BuyerWpNo, 
                         dbo.NT_1qryEInvoiceCarporateSale.ShipToWpNo, dbo.NT_1qryEInvoiceCarporateSale.Actual_Distance, dbo.NT_1qryEInvoiceCarporateSale.EwbDt,dbo.NT_1qryEInvoiceCarporateSale.driver_no, dbo.NT_1qryEInvoiceCarporateSale.shiptoemail

FROM            dbo.accountingyear INNER JOIN
                         dbo.eway_bill INNER JOIN
                         dbo.NT_1qryEInvoiceCarporateSale ON dbo.eway_bill.Company_Code = dbo.NT_1qryEInvoiceCarporateSale.Company_Code INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.NT_1qryEInvoiceCarporateSale.Company_Code = dbo.nt_1_accountmaster.company_code AND dbo.NT_1qryEInvoiceCarporateSale.mill_code = dbo.nt_1_accountmaster.Ac_Code ON 
                         dbo.accountingyear.Company_Code = dbo.NT_1qryEInvoiceCarporateSale.Company_Code AND dbo.accountingyear.yearCode = dbo.NT_1qryEInvoiceCarporateSale.Year_Code FULL OUTER JOIN
                         dbo.company ON dbo.NT_1qryEInvoiceCarporateSale.Company_Code = dbo.company.Company_Code FULL OUTER JOIN
                         dbo.tbluser ON dbo.company.Company_Code = dbo.tbluser.Company_Code AND dbo.company.Created_By = dbo.tbluser.EmailId
            WHERE  dbo.NT_1qryEInvoiceCarporateSale.doc_no = :doc_no and dbo.NT_1qryEInvoiceCarporateSale.Year_Code = :Year_Code and dbo.NT_1qryEInvoiceCarporateSale.Company_Code = :Company_Code
            '''
        else:
            query = '''
SELECT        dbo.NT_1qryEInvoice.doc_no, CONVERT(varchar, dbo.NT_1qryEInvoice.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEInvoice.BuyerGst_No) AS BuyerGst_No, UPPER(dbo.NT_1qryEInvoice.Buyer_Name) AS Buyer_Name, 
                         UPPER(dbo.NT_1qryEInvoice.Buyer_Address) AS Buyer_Address, UPPER(dbo.NT_1qryEInvoice.Buyer_City) AS Buyer_City, (CASE Buyer_Pincode WHEN 0 THEN 999999 ELSE Buyer_Pincode END) AS Buyer_Pincode, 
                         UPPER(dbo.NT_1qryEInvoice.Buyer_State_name) AS Buyer_State_name, dbo.NT_1qryEInvoice.Buyer_State_Code, dbo.NT_1qryEInvoice.Buyer_Phno, dbo.NT_1qryEInvoice.Buyer_Email_Id, 
                         UPPER(dbo.NT_1qryEInvoice.DispatchGst_No) AS DispatchGst_No, UPPER(dbo.NT_1qryEInvoice.Dispatch_Name) AS Dispatch_Name, UPPER(dbo.NT_1qryEInvoice.Dispatch_Address) AS Dispatch_Address, 
                         UPPER(dbo.NT_1qryEInvoice.DispatchCity_City) AS DispatchCity_City, dbo.NT_1qryEInvoice.Dispatch_GSTStateCode, (CASE Dispatch_Pincode WHEN 0 THEN 999999 ELSE Dispatch_Pincode END) AS Dispatch_Pincode, 
                         UPPER(dbo.NT_1qryEInvoice.ShipToGst_No) AS ShipToGst_No, UPPER(dbo.NT_1qryEInvoice.ShipTo_Name) AS ShipTo_Name, UPPER(dbo.NT_1qryEInvoice.ShipTo_Address) AS ShipTo_Address, 
                         UPPER(dbo.NT_1qryEInvoice.ShipTo_City) AS ShipTo_City, dbo.NT_1qryEInvoice.ShipTo_GSTStateCode, (CASE ShipTo_Pincode WHEN 0 THEN 999999 ELSE ShipTo_Pincode END) AS ShipTo_Pincode, 
                         dbo.NT_1qryEInvoice.NETQNTL, dbo.NT_1qryEInvoice.rate, dbo.NT_1qryEInvoice.CGSTAmount, dbo.NT_1qryEInvoice.SGSTAmount, dbo.NT_1qryEInvoice.IGSTAmount, dbo.NT_1qryEInvoice.TaxableAmount, 
                         ISNULL(dbo.NT_1qryEInvoice.CGSTRate, 0) AS CGSTRate, ISNULL(dbo.NT_1qryEInvoice.SGSTRate, 0) AS SGSTRate, ISNULL(dbo.NT_1qryEInvoice.IGSTRate, 0) AS IGSTRate, dbo.NT_1qryEInvoice.LORRYNO, 
                         dbo.NT_1qryEInvoice.System_Name_E, dbo.NT_1qryEInvoice.HSN, dbo.NT_1qryEInvoice.GSTRate, dbo.NT_1qryEInvoice.LESS_FRT_RATE, dbo.nt_1_companyparameters.GSTStateCode AS fromGSTCode, 
                         dbo.company.Company_Name_E AS fromName, dbo.company.Address_E AS fromAddress, dbo.company.City_E AS fromCity, dbo.company.State_E AS fromStateName, dbo.company.PIN AS fromPinCode, 
                         dbo.company.PHONE AS fromPhone, dbo.company.GST AS fromGSTNo, dbo.eway_bill.Mode_of_Payment, dbo.eway_bill.Account_Details, dbo.tbluser.EmailId AS fromEmail, dbo.eway_bill.Branch, dbo.NT_1qryEInvoice.saleid, 
                         dbo.NT_1qryEInvoice.IsService, dbo.NT_1qryEInvoice.TaxableAmount + ISNULL(dbo.NT_1qryEInvoice.CGSTAmount, 0) + ISNULL(dbo.NT_1qryEInvoice.SGSTAmount, 0) + ISNULL(dbo.NT_1qryEInvoice.IGSTAmount, 0) 
                         + ISNULL(dbo.NT_1qryEInvoice.OTHER_AMT, 0) AS billAmount, CONVERT(varchar, dbo.NT_1qryEInvoice.EwayBillValidDate, 103) AS validUpTo, dbo.NT_1qryEInvoice.einvoiceno, dbo.NT_1qryEInvoice.EWay_Bill_No, 
                         dbo.nt_1_accountmaster.Ac_Name_E AS millname, dbo.accountingyear.year, dbo.NT_1qryEInvoice.OTHER_AMT, ISNULL(dbo.NT_1qryEInvoice.Actual_Distance, 0) AS Distance, dbo.NT_1qryEInvoice.EwbDt AS genratedDate, 
                         ISNULL(dbo.nt_1_deliveryorder.Carporate_Sale_No, 0) AS CarporateSaleNo, dbo.NT_1qryEInvoice.TransportWpNo, dbo.NT_1qryEInvoice.ShipToWpNo, dbo.NT_1qryEInvoice.BuyerWpNo, dbo.NT_1qryEInvoice.Actual_Distance, 
                         dbo.nt_1_deliveryorder.driver_no, dbo.NT_1qryEInvoice.shiptoemail 
FROM            dbo.NT_1qryEInvoice INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.NT_1qryEInvoice.mill_code = dbo.nt_1_accountmaster.Ac_Code AND dbo.NT_1qryEInvoice.Company_Code = dbo.nt_1_accountmaster.company_code INNER JOIN
                         dbo.accountingyear ON dbo.NT_1qryEInvoice.Company_Code = dbo.accountingyear.Company_Code AND dbo.NT_1qryEInvoice.Year_Code = dbo.accountingyear.yearCode INNER JOIN
                         dbo.nt_1_deliveryorder ON dbo.NT_1qryEInvoice.DO_No = dbo.nt_1_deliveryorder.doc_no AND dbo.NT_1qryEInvoice.Company_Code = dbo.nt_1_deliveryorder.company_code AND 
                         dbo.NT_1qryEInvoice.Year_Code = dbo.nt_1_deliveryorder.Year_Code LEFT OUTER JOIN
                         dbo.nt_1_companyparameters ON dbo.NT_1qryEInvoice.Company_Code = dbo.nt_1_companyparameters.Company_Code AND dbo.NT_1qryEInvoice.Year_Code = dbo.nt_1_companyparameters.Year_Code LEFT OUTER JOIN
                         dbo.company ON dbo.NT_1qryEInvoice.Company_Code = dbo.company.Company_Code LEFT OUTER JOIN
                         dbo.tbluser ON dbo.nt_1_companyparameters.Created_By = dbo.tbluser.User_Name LEFT OUTER JOIN
                         dbo.eway_bill ON dbo.NT_1qryEInvoice.Company_Code = dbo.eway_bill.Company_Code
            WHERE dbo.NT_1qryEInvoice.doc_no = :doc_no and dbo.NT_1qryEInvoice.Year_Code = :Year_Code and dbo.NT_1qryEInvoice.Company_Code = :Company_Code
            '''

        additional_data = db.session.execute(
            text(query), 
            {"doc_no": doc_no, "Year_Code":Year_Code, "Company_Code":Company_Code}
        )

        additional_data_rows = additional_data.fetchall()
        all_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

