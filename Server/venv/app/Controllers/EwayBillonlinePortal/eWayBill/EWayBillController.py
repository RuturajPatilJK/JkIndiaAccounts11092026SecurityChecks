from app import app, db,socketio
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from sqlalchemy import text
from flask import jsonify, request
from datetime import datetime,time,timedelta
from flask_socketio import SocketIO
from app.models.EwayBillonlinePortal.EWayBillReportModels import EWayBillPortal
# from app.models.EWayBillMissingRecordModels import EWayMissingEWayBills
import os
import requests
import uuid
from itertools import combinations

API_URL = os.getenv('API_URL')
API_URL_EWAYBILL = os.getenv('API_URL_EINVOICE')
TOKEN_URL = os.getenv('TOKEN_URL')
GSP_APP_ID = os.getenv('GSP_APP_ID')
GSP_APP_SECRET = os.getenv('GSP_APP_SECRET')
USER_NAME=os.getenv('USER_NAME')
EWAY_PASSWORD=os.getenv('EWAY_PASSWORD')
EWAY_GSTIN=os.getenv('EWAY_GSTIN')

# Function to generate a random request ID.
def generate_request_id():
    return str(uuid.uuid4())

#Format Dated
def format_dates(task):
    return {
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
        "EWayBillDate": task.EWayBillDate.strftime('%Y-%m-%d') if task.EWayBillDate else None,
    }

# Purchase Bill Report Data
@app.route(API_URL + '/purchasebill-reportdata', methods=['GET'])
def purchasebill_reportdata():
    try:
        doc_date = request.args.get('doc_date')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not doc_date:
            return jsonify({'error': 'doc_date is required'}), 400
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

        with db.session.begin_nested():
            query = db.session.execute(text('''
           SELECT        ROW_NUMBER() OVER(ORDER BY dbo.nt_1_sugarpurchase.doc_date, dbo.nt_1_sugarpurchase.doc_no) AS SR_No, 
'PS' + CONVERT(NVARCHAR, dbo.nt_1_sugarpurchase.doc_no) AS OurNo,
             dbo.nt_1_sugarpurchase.Bill_No,
nt_1_accountmaster_1.Gst_No  AS FromGSTNo,
dbo.nt_1_sugarpurchase.Ac_Code  AS Party_Code,
nt_1_accountmaster_1.Ac_Name_E AS Party_Name, 
                         nt_1_accountmaster_1.GSTStateCode  AS FromStateCode,
						 dbo.nt_1_sugarpurchase.doc_date AS Date, 
						 dbo.nt_1_sugarpurchase.LORRYNO AS Vehicle_No,
						 dbo.nt_1_sugarpurchase.NETQNTL AS Quintal,
						 case when dbo.nt_1_sugarpurchase.NETQNTL = 0 then 0 else dbo.nt_1_sugarpurchase.subTotal/dbo.nt_1_sugarpurchase.NETQNTL end AS Rate,
						 dbo.nt_1_sugarpurchase.subTotal  AS TaxableAmount,
						 dbo.nt_1_sugarpurchase.CGSTAmount AS CGST, 
                         dbo.nt_1_sugarpurchase.SGSTAmount AS SGST,
						 dbo.nt_1_sugarpurchase.IGSTAmount AS IGST,
						 dbo.nt_1_sugarpurchase.Bill_Amount AS Payable_Amount,
						 dbo.nt_1_sugarpurchase.PURCNO AS DO,
						 dbo.nt_1_accountmaster.Short_Name As millshortname, dbo.nt_1_deliveryorder.MillInvoiceNo AS MillInvoiceNo

FROM            dbo.nt_1_sugarpurchase INNER JOIN
                         dbo.nt_1_accountmaster AS nt_1_accountmaster_1 ON dbo.nt_1_sugarpurchase.Ac_Code = nt_1_accountmaster_1.Ac_Code AND dbo.nt_1_sugarpurchase.Company_Code = nt_1_accountmaster_1.company_code INNER JOIN
                         dbo.nt_1_accountmaster ON dbo.nt_1_sugarpurchase.mill_code = dbo.nt_1_accountmaster.Ac_Code AND dbo.nt_1_sugarpurchase.Company_Code = dbo.nt_1_accountmaster.company_code  LEFT OUTER JOIN
                         dbo.nt_1_deliveryorder ON dbo.nt_1_sugarpurchase.Year_Code = dbo.nt_1_deliveryorder.Year_Code AND dbo.nt_1_sugarpurchase.Company_Code = dbo.nt_1_deliveryorder.company_code AND 
                         dbo.nt_1_sugarpurchase.PURCNO = dbo.nt_1_deliveryorder.doc_no
                WHERE 
                    dbo.nt_1_sugarpurchase.doc_date = :doc_date AND dbo.nt_1_sugarpurchase.Company_Code = :Company_Code AND dbo.nt_1_sugarpurchase.Year_Code = :Year_Code  
            '''), {
                'doc_date': doc_date,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code
            })

            results = query.mappings().all()
            response_data = [dict(row) for row in results]

            return jsonify(response_data)

    except SQLAlchemyError as e:
        print(f"Error occurred: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

#Create a EWay Bills
@app.route(API_URL + '/create-eway-bill', methods=['POST'])
def create_eway_bill():
    try:
        data = request.get_json()

        if isinstance(data, list):
            new_eway_bills = []
            
            for bill_data in data:
                # ewbdateupdate always mirrors ewayBillDate at insert time -
                # managed here so the frontend doesn't need to send it.
                bill_data['ewbdateupdate'] = bill_data.get('ewayBillDate')
                new_eway_bill = EWayBillPortal(**bill_data)
                new_eway_bills.append(new_eway_bill)

            db.session.add_all(new_eway_bills)
            db.session.commit()
            socketio.emit('createdata',data)

            return jsonify({"message": "E-Way Bills created successfully!"}), 201
        else:
            return jsonify({"error": "Expected an array of E-Way Bills"}), 400

    except KeyError as e:
        db.session.rollback()
        return jsonify({"error": f"Missing key: {str(e)}"}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

#GET All record from the database according to the that particular date.
@app.route(API_URL + '/get-eway-bills', methods=['GET'])
def get_all_eway_bills():
    try:
        eway_bill_date_str = request.args.get('ewayBillDate', None)

        if eway_bill_date_str:
            try:
                filter_date = datetime.strptime(eway_bill_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid date format. Please use YYYY-MM-DD."}), 400

            # ewayBillDate is a DATETIME column (it now stores the actual
            # generation time, not just midnight), so an exact equality
            # match against a bare date would miss every row - filter by
            # the day's full range instead.
            start_of_day = datetime.combine(filter_date, datetime.min.time())
            end_of_day = start_of_day + timedelta(days=1)
            eway_bills = EWayBillPortal.query.filter(
                EWayBillPortal.ewayBillDate >= start_of_day,
                EWayBillPortal.ewayBillDate < end_of_day
            ).all()
        else:
            eway_bills = EWayBillPortal.query.all()

        records = []
        for bill in eway_bills:
            bill_dict = bill.__dict__

            bill_dict.pop('_sa_instance_state', None)

            if 'ewayBillDate' in bill_dict and bill_dict['ewayBillDate']:
                bill_dict['ewayBillDate'] = bill_dict['ewayBillDate'].strftime('%d/%m/%Y %H:%M:%S')
            if 'ewbdateupdate' in bill_dict and bill_dict['ewbdateupdate']:
                bill_dict['ewbdateupdate'] = bill_dict['ewbdateupdate'].strftime('%d/%m/%Y %H:%M:%S')
            if 'docDate' in bill_dict and bill_dict['docDate']:
                bill_dict['docDate'] = bill_dict['docDate'].strftime('%d/%m/%Y')
            if 'validUpto' in bill_dict and bill_dict['validUpto']:
                bill_dict['validUpto'] = bill_dict['validUpto'].strftime('%d/%m/%Y')

            records.append(bill_dict)

        return jsonify({"data": records, "message": "E-Way Bills fetched successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

#Remove all eway bills that already present in the database API
@app.route(API_URL + '/check-remove-eway-bills', methods=['POST'])
def check_remove_eway_bills():
    try:
        data = request.get_json()

        if not isinstance(data, list):
            return jsonify({"error": "Expected an array of E-Way Bill Numbers"}), 400
        
        existing_eway_bills = EWayBillPortal.query.filter(EWayBillPortal.ewbNo.in_(data)).all()

        existing_eway_bill_nos = {bill.ewbNo for bill in existing_eway_bills}

        remaining_eway_bills = [bill_no for bill_no in data if bill_no not in existing_eway_bill_nos]

        return jsonify({"remainingEwayBillNos": remaining_eway_bills}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

#GET max Doc_no in the sail ID
@app.route(API_URL + '/update-doc-no', methods=['POST'])
def update_doc_no():
    try:
        data = request.get_json()
        saleids = data.get('saleids')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
       
        if not Company_Code or not Year_Code:
            return jsonify({'error': 'Company_Code and Year_Code are required'}), 400
     
        if not saleids or not isinstance(saleids, list):
            return jsonify({"error": "saleids should be an array of saleid values."}), 400

        for saleid in saleids:
            query = db.session.execute(text(''' 
                SELECT MAX(doc_no) AS max_doc_no 
                FROM dbo.nt_1_sugarsale  
                WHERE  Company_Code = :Company_Code AND Year_Code= :Year_Code
            '''), {'Company_Code':Company_Code,'Year_Code':Year_Code})
            result = query.fetchone()
            max_doc_no = result[0] if result and result[0] else 0 

            new_doc_no = max_doc_no + 1

            db.session.execute(text(''' 
                UPDATE dbo.nt_1_sugarsale 
                SET doc_no = :new_doc_no 
                WHERE saleid = :saleid AND Company_Code = :Company_Code AND Year_Code= :Year_Code
            '''), {'new_doc_no': new_doc_no, 'saleid': saleid,'Company_Code':Company_Code,'Year_Code':Year_Code})

            db.session.execute(text(''' 
                UPDATE dbo.nt_1_sugarsaledetails 
                SET doc_no = :new_doc_no 
                WHERE saleid = :saleid AND Company_Code = :Company_Code AND Year_Code= :Year_Code
            '''), {'new_doc_no': new_doc_no, 'saleid': saleid,'Company_Code':Company_Code,'Year_Code':Year_Code})

            sugarsale_query = db.session.execute(text(''' 
                SELECT DO_No 
                FROM dbo.nt_1_sugarsale 
                WHERE saleid = :saleid AND Company_Code = :Company_Code AND Year_Code= :Year_Code
            '''), {'saleid': saleid,'Company_Code':Company_Code,'Year_Code':Year_Code})
            sugarsale_result = sugarsale_query.fetchone()

            if sugarsale_result:
                do_no = sugarsale_result[0]

                db.session.execute(text(''' 
                    UPDATE dbo.nt_1_deliveryorder 
                    SET SB_No = :new_doc_no 
                    WHERE Doc_No = :do_no AND Company_Code = :Company_Code AND Year_Code= :Year_Code
                '''), {'new_doc_no': new_doc_no, 'do_no': do_no,'Company_Code':Company_Code,'Year_Code':Year_Code})

                db.session.execute(text(''' 
                UPDATE dbo.nt_1_gledger 
                SET DOC_NO = :new_doc_no 
                WHERE saleid = :saleid AND TRAN_TYPE = 'SB' AND Company_Code = :Company_Code AND Year_Code= :Year_Code
            '''), {'new_doc_no': new_doc_no, 'saleid': saleid,'Company_Code':Company_Code,'Year_Code':Year_Code})

        db.session.commit()
        socketio.emit('updatedocno')

        return jsonify({"message": f"Document numbers and SB_No updated successfully for saleids {', '.join(map(str, saleids))}."}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

#EWayGenration 
@app.route(API_URL + "/get_eWayBill_generationData", methods=["GET"])
def get_eWayBill_generationData():
    try:
        saleId = request.args.get('saleId')
        companyCode = request.args.get('Company_Code')
        yearCode = request.args.get('Year_Code')

        if not saleId or not companyCode or not yearCode:
            return jsonify({"error": "Missing 'saleId', 'Company_Code', or 'Year_Code' parameter"}), 400

        corporate_sale_check_query = '''
            SELECT Carporate_Sale_No 
            FROM dbo.NT_1qryEInvoiceCarporateSale
            WHERE Company_Code = :companyCode AND Year_Code = :yearCode AND saleId = :saleId
        '''

        corporate_sale_check = db.session.execute(
            text(corporate_sale_check_query), 
            {"companyCode": companyCode, "yearCode": yearCode, "saleId": saleId}
        ).fetchone()

        print('corporate_sale_check',corporate_sale_check)

        if corporate_sale_check and corporate_sale_check[0] != 0:
            query = '''
  SELECT  dbo.NT_1qryEInvoiceCarporateSale.doc_no AS Doc_No, CONVERT(varchar, dbo.NT_1qryEInvoiceCarporateSale.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEInvoiceCarporateSale.BuyerGst_No) AS BuyerGst_No, 
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
                         dbo.NT_1qryEInvoiceCarporateSale.LESS_FRT_RATE, dbo.NT_1qryEInvoiceCarporateSale.saleid, dbo.NT_1qryEInvoiceCarporateSale.Bill_Amount AS billAmount, dbo.company.Company_Name_E, dbo.company.Address_E, 
                         dbo.company.City_E, dbo.company.State_E, dbo.company.PIN, dbo.company.PHONE, dbo.company.GST, dbo.tbluser.EmailId, dbo.eway_bill.Branch, dbo.eway_bill.Account_Details, dbo.eway_bill.Mode_of_Payment, 
                         dbo.nt_1_companyparameters.GSTStateCode, dbo.accountingyear.year,dbo.company.EmailId AS CompanyEmailId
FROM  dbo.eway_bill RIGHT OUTER JOIN
                         dbo.nt_1_companyparameters INNER JOIN
                         dbo.NT_1qryEInvoiceCarporateSale ON dbo.nt_1_companyparameters.Company_Code = dbo.NT_1qryEInvoiceCarporateSale.Company_Code AND 
                         dbo.nt_1_companyparameters.Year_Code = dbo.NT_1qryEInvoiceCarporateSale.Year_Code INNER JOIN
                         dbo.accountingyear ON dbo.NT_1qryEInvoiceCarporateSale.Company_Code = dbo.accountingyear.Company_Code AND dbo.NT_1qryEInvoiceCarporateSale.Year_Code = dbo.accountingyear.yearCode ON 
                         dbo.eway_bill.Company_Code = dbo.NT_1qryEInvoiceCarporateSale.Company_Code LEFT OUTER JOIN
                         dbo.company ON dbo.NT_1qryEInvoiceCarporateSale.Company_Code = dbo.company.Company_Code LEFT OUTER JOIN
                         dbo.tbluser ON dbo.company.Company_Code = dbo.tbluser.Company_Code AND dbo.company.Created_By = dbo.tbluser.EmailId
            WHERE dbo.NT_1qryEInvoiceCarporateSale.Company_Code = :companyCode
              AND dbo.NT_1qryEInvoiceCarporateSale.Year_Code = :yearCode
              AND dbo.NT_1qryEInvoiceCarporateSale.saleId = :saleId
            '''
        else:
            query = '''
         SELECT        dbo.NT_1qryEInvoice.doc_no AS Doc_No, CONVERT(varchar, dbo.NT_1qryEInvoice.doc_date, 103) AS doc_date, UPPER(dbo.NT_1qryEInvoice.BuyerGst_No) AS BuyerGst_No, UPPER(dbo.NT_1qryEInvoice.Buyer_Name) 
                         AS Buyer_Name, UPPER(dbo.NT_1qryEInvoice.Buyer_Address) AS Buyer_Address, UPPER(dbo.NT_1qryEInvoice.Buyer_City) AS Buyer_City, (CASE Buyer_Pincode WHEN 0 THEN 999999 ELSE Buyer_Pincode END) 
                         AS Buyer_Pincode, UPPER(dbo.NT_1qryEInvoice.Buyer_State_name) AS Buyer_State_name, dbo.NT_1qryEInvoice.Buyer_State_Code, dbo.NT_1qryEInvoice.Buyer_Phno, dbo.NT_1qryEInvoice.Buyer_Email_Id, 
                         UPPER(dbo.NT_1qryEInvoice.DispatchGst_No) AS DispatchGst_No, UPPER(dbo.NT_1qryEInvoice.Dispatch_Name) AS Dispatch_Name, UPPER(dbo.NT_1qryEInvoice.Dispatch_Address) AS Dispatch_Address, 
                         UPPER(dbo.NT_1qryEInvoice.DispatchCity_City) AS DispatchCity_City, dbo.NT_1qryEInvoice.Dispatch_GSTStateCode, (CASE Dispatch_Pincode WHEN 0 THEN 999999 ELSE Dispatch_Pincode END) AS Dispatch_Pincode, 
                         UPPER(dbo.NT_1qryEInvoice.ShipToGst_No) AS ShipToGst_No, UPPER(dbo.NT_1qryEInvoice.ShipTo_Name) AS ShipTo_Name, UPPER(dbo.NT_1qryEInvoice.ShipTo_Address) AS ShipTo_Address, 
                         UPPER(dbo.NT_1qryEInvoice.ShipTo_City) AS ShipTo_City, dbo.NT_1qryEInvoice.ShipTo_GSTStateCode, (CASE ShipTo_Pincode WHEN 0 THEN 999999 ELSE ShipTo_Pincode END) AS ShipTo_Pincode, 
                         dbo.NT_1qryEInvoice.NETQNTL, dbo.NT_1qryEInvoice.rate, dbo.NT_1qryEInvoice.CGSTAmount, dbo.NT_1qryEInvoice.SGSTAmount, dbo.NT_1qryEInvoice.IGSTAmount, dbo.NT_1qryEInvoice.TaxableAmount, 
                         ISNULL(dbo.NT_1qryEInvoice.CGSTRate, 0) AS CGSTRate, ISNULL(dbo.NT_1qryEInvoice.SGSTRate, 0) AS SGSTRate, ISNULL(dbo.NT_1qryEInvoice.IGSTRate, 0) AS IGSTRate, dbo.NT_1qryEInvoice.Distance, 
                         dbo.NT_1qryEInvoice.LORRYNO, dbo.NT_1qryEInvoice.System_Name_E, dbo.NT_1qryEInvoice.HSN, dbo.NT_1qryEInvoice.GSTRate, dbo.NT_1qryEInvoice.LESS_FRT_RATE, dbo.nt_1_companyparameters.GSTStateCode, 
                         dbo.company.Company_Name_E, dbo.company.Address_E, dbo.company.City_E, dbo.company.State_E, dbo.company.PIN, dbo.company.PHONE, dbo.company.GST, dbo.eway_bill.Mode_of_Payment, 
                         dbo.eway_bill.Account_Details, dbo.tbluser.EmailId, dbo.eway_bill.Branch, dbo.NT_1qryEInvoice.saleid, dbo.NT_1qryEInvoice.IsService, dbo.NT_1qryEInvoice.Bill_Amount AS billAmount, dbo.accountingyear.year,dbo.company.EmailId AS CompanyEmailId
FROM  dbo.accountingyear INNER JOIN
                         dbo.NT_1qryEInvoice ON dbo.accountingyear.yearCode = dbo.NT_1qryEInvoice.Year_Code AND dbo.accountingyear.Company_Code = dbo.NT_1qryEInvoice.Company_Code LEFT OUTER JOIN
                         dbo.tbluser RIGHT OUTER JOIN
                         dbo.nt_1_companyparameters ON dbo.tbluser.User_Name = dbo.nt_1_companyparameters.Created_By ON dbo.NT_1qryEInvoice.Company_Code = dbo.nt_1_companyparameters.Company_Code AND 
                         dbo.NT_1qryEInvoice.Year_Code = dbo.nt_1_companyparameters.Year_Code LEFT OUTER JOIN
                         dbo.company ON dbo.NT_1qryEInvoice.Company_Code = dbo.company.Company_Code LEFT OUTER JOIN
                         dbo.eway_bill ON dbo.NT_1qryEInvoice.Company_Code = dbo.eway_bill.Company_Code
            WHERE dbo.NT_1qryEInvoice.Company_Code = :companyCode
              AND dbo.NT_1qryEInvoice.Year_Code = :yearCode
              AND dbo.NT_1qryEInvoice.saleId = :saleId
            '''

        # Execute the chosen query
        additional_data = db.session.execute(
            text(query), 
            {"companyCode": companyCode, "yearCode": yearCode, "saleId": saleId}
        )

        # Process the results
        additional_data_rows = additional_data.fetchall()
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' in data and data['doc_date']:
                date_obj = datetime.strptime(data['doc_date'], "%d/%m/%Y")
                data['doc_date'] = date_obj.strftime("%Y-%m-%d")
            else:
                data['doc_date'] = None

        # Return the response
        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

#Eway Bill Print
@app.route(API_URL + "/get_eWayBill_print_onlineportal", methods=["GET"])
def get_eWayBill_print_onlineportal():
    try:
        saleId = request.args.get('saleId')
       
        if not saleId :
            return jsonify({"error": "Missing 'saleId', parameter"}), 400

        corporate_sale_check_query = '''
            SELECT Carporate_Sale_No 
            FROM dbo.NT_1qryEInvoiceCarporateSale
            WHERE saleid = :saleId
        '''

        corporate_sale_check = db.session.execute(
            text(corporate_sale_check_query), 
            {"saleId": saleId}
        ).fetchone()


        if corporate_sale_check and corporate_sale_check[0] != 0:
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
            WHERE  dbo.NT_1qryEInvoiceCarporateSale.saleId = :saleId
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
            WHERE dbo.NT_1qryEInvoice.saleId = :saleId
            '''

        additional_data = db.session.execute(
            text(query), 
            {"saleId": saleId}
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
    

# # Genrate Eway bill Token genration.
@app.route(API_URL+'/get-token-onlineportal', methods=['POST'])
def get_token_onlineportal():
    try:
        headers = {
            'gspappid': GSP_APP_ID,
            'gspappsecret': GSP_APP_SECRET,
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        params = {'grant_type': 'token'}

        response = requests.post(TOKEN_URL, headers=headers, params=params)

        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'message': 'Error during token generation', 'error': response.text}), 500
    except Exception as e:
        return jsonify({'message': 'Error during token generation', 'error': str(e)}), 500

# Genrate Eway bill and E-Invoice
@app.route(API_URL+'/create-invoice-onlineportal', methods=['POST'])
def create_invoice_onlineportal():
    try:
        token = request.json.get('token')
        if not token:
            return jsonify({'message': 'Token is required'}), 400
        
        request_id = generate_request_id()

        api_url = f"{API_URL_EWAYBILL}/invoice"

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
            'USER_NAME': USER_NAME,
            'password': EWAY_PASSWORD,
            'gstin': EWAY_GSTIN,
            'requestid': request_id
        }

        body = request.json.get('invoice_data')

        if not body:
            return jsonify({'message': 'Invoice data is required'}), 400

        response = requests.post(api_url, json=body, headers=headers)

        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'message': 'Error during invoice creation', 'error': response.text}), 500

    except Exception as e:
        return jsonify({'message': 'Error during invoice creation', 'error': str(e)}), 500
    
#Update Eway bill invoice data
@app.route(API_URL + '/update-salesugar', methods=['PUT'])
def update_salesugar():
    MAX_RETRIES = 3
    retries = 0

    while True:
        try:
            saleid = request.args.get("saleid")
            Company_Code = request.args.get("Company_Code")
            Year_Code = request.args.get("Year_Code")
            
            if not saleid or not Company_Code or not Year_Code :
                return jsonify({"error": "saleid and Company_Code and Year Code is required."}), 400

            query = db.session.execute(text('''
                SELECT doc_no 
                FROM dbo.nt_1_sugarsale
                WHERE saleid = :saleid 
                AND Company_Code = :Company_Code 
                AND Year_Code = :Year_Code
            '''), {'saleid': saleid, 'Company_Code': Company_Code, 'Year_Code': Year_Code})

            result = query.fetchone()

            if not result:
                return jsonify({"error": f"No doc_no found for saleid {saleid}."}), 404

            doc_no = result[0]

            data = request.get_json()
            if not data:
                return jsonify({"error": "Request body is required."}), 400

            ackno = data.get('AckNo')
            invoiceno = data.get('Irn')
            QRCode = data.get('SignedQRCode')
            EWay_Bill_No = data.get('EwbNo')
            EwayBillValidDate = data.get('EwbValidTill')
            Actual_Distance= data.get('Actual_Distance')
            EwbDt=data.get('EwbDt')

            print("EwayBillValidDate",EwayBillValidDate)
            if ackno:
                db.session.execute(text('''
                    UPDATE dbo.nt_1_sugarsale 
                    SET ackno = :ackno,
                        einvoiceno = :invoiceno,
                        QRCode = :QRCode,
                        EWay_Bill_No = :EWay_Bill_No,
                        EwayBillValidDate = :EwayBillValidDate,
                        Actual_Distance = :Actual_Distance,
                        EwbDt = :EwbDt
                    WHERE doc_no = :doc_no 
                    AND Company_Code = :Company_Code 
                    AND Year_Code = :Year_Code
                '''), {
                    'ackno': ackno, 
                    'invoiceno': invoiceno, 
                    'QRCode': QRCode,
                    'EWay_Bill_No': EWay_Bill_No,
                    'EwayBillValidDate': EwayBillValidDate,
                    'Actual_Distance' : Actual_Distance,
                    'EwbDt' : EwbDt,
                    'doc_no': doc_no,
                    'Company_Code': Company_Code,
                    'Year_Code': Year_Code
                })

                sugarsale_query = db.session.execute(text('''
                    SELECT DO_No 
                    FROM dbo.nt_1_sugarsale 
                    WHERE saleid = :saleid 
                    AND Company_Code = :Company_Code 
                    AND Year_Code = :Year_Code
                '''), {'saleid': saleid, 'Company_Code': Company_Code, 'Year_Code': Year_Code})

                sugarsale_result = sugarsale_query.fetchone()

                if sugarsale_result:
                    do_no = sugarsale_result[0]

                    db.session.execute(text('''
                        UPDATE dbo.nt_1_deliveryorder 
                        SET ackno = :ackno,
                            einvoiceno = :invoiceno,
                            EWay_Bill_No = :EWay_Bill_No,
                            EwayBillValidDate = :EwayBillValidDate,
                            Distance = :Actual_Distance
                        WHERE doc_no = :do_no 
                        AND Company_Code = :Company_Code 
                        AND Year_Code = :Year_Code
                    '''), {
                        'ackno': ackno,
                        'invoiceno': invoiceno,
                        'EWay_Bill_No': EWay_Bill_No,
                        'EwayBillValidDate': EwayBillValidDate,
                        'Actual_Distance' : Actual_Distance,
                        'do_no': do_no,
                        'Company_Code': Company_Code,
                        'Year_Code': Year_Code
                    })

            db.session.commit()
            socketio.emit('updatesalesugar')

            return jsonify({"message": f"SugarSale updated successfully for doc_no {doc_no}."}), 200

        except OperationalError as e:
            if '1205' in str(e):
                db.session.rollback()  # Rollback before retry
                retries += 1
                if retries < MAX_RETRIES:
                    time.sleep(1)  # short pause before next try
                    continue
                else:
                    raise
            else:
                db.session.rollback()
                raise
        except Exception as e:
            db.session.rollback()
            print(f"Error occurred: {e}")
            return jsonify({"error": "Internal server error"}), 500

    
#GEnrate Sale Bill Report
@app.route(API_URL+"/generating_saleBill_report_onlineportal", methods=["GET"])
def generating_saleBill_report_onlineportal():
    try:
        company_code = request.args.get('Company_Code')
        saleid = request.args.get('saleid')

        if not company_code  or not saleid:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''SELECT        dbo.qrysalehead.doc_no, dbo.qrysalehead.PURCNO, dbo.qrysalehead.doc_date, dbo.qrysalehead.Ac_Code, dbo.qrysalehead.Unit_Code, dbo.qrysalehead.mill_code, dbo.qrysalehead.FROM_STATION, 
                         dbo.qrysalehead.TO_STATION, dbo.qrysalehead.LORRYNO, dbo.qrysalehead.BROKER, dbo.qrysalehead.wearhouse, dbo.qrysalehead.subTotal, dbo.qrysalehead.LESS_FRT_RATE, dbo.qrysalehead.freight, 
                         dbo.qrysalehead.cash_advance, dbo.qrysalehead.bank_commission, dbo.qrysalehead.OTHER_AMT, dbo.qrysalehead.Bill_Amount, dbo.qrysalehead.Due_Days, dbo.qrysalehead.NETQNTL, dbo.qrysalehead.Company_Code, 
                         dbo.qrysalehead.Year_Code, dbo.qrysalehead.Branch_Code, dbo.qrysalehead.Created_By, dbo.qrysalehead.Modified_By, dbo.qrysalehead.Tran_Type, dbo.qrysalehead.DO_No, dbo.qrysalehead.Transport_Code, 
                         ISNULL(dbo.qrysalehead.RateDiff,0) AS RateDiff , dbo.qrysalehead.ASN_No, dbo.qrysalehead.GstRateCode, dbo.qrysalehead.CGSTRate, dbo.qrysalehead.CGSTAmount, dbo.qrysalehead.SGSTRate, dbo.qrysalehead.SGSTAmount, 
                         dbo.qrysalehead.IGSTRate, dbo.qrysalehead.IGSTAmount, dbo.qrysalehead.TaxableAmount, dbo.qrysalehead.EWay_Bill_No, dbo.qrysalehead.EWayBill_Chk, dbo.qrysalehead.MillInvoiceNo, dbo.qrysalehead.RoundOff, 
                         dbo.qrysalehead.saleid, dbo.qrysalehead.ac, dbo.qrysalehead.uc, dbo.qrysalehead.mc, dbo.qrysalehead.bk, dbo.qrysalehead.billtoname, dbo.qrysalehead.billtoaddress, dbo.qrysalehead.billtogstno, 
                         dbo.qrysalehead.billtopanno, dbo.qrysalehead.billtopin, dbo.qrysalehead.billtopincode, dbo.qrysalehead.billtocitystate, dbo.qrysalehead.billtogststatecode, dbo.qrysalehead.shiptoname, dbo.qrysalehead.shiptoaddress, 
                         dbo.qrysalehead.shiptogstno, dbo.qrysalehead.shiptopanno, dbo.qrysalehead.shiptocityname, dbo.qrysalehead.shiptocitypincode, dbo.qrysalehead.shiptocitystate, dbo.qrysalehead.shiptogststatecode, 
                         dbo.qrysalehead.billtoemail, dbo.qrysalehead.shiptoemail, dbo.qrysalehead.millname, dbo.qrysalehead.brokername, dbo.qrysalehead.GST_Name, dbo.qrysalehead.gstrate, dbo.qrysaledetail.detail_id AS itemcode, 
                         dbo.qrysaledetail.item_code, dbo.qrysaledetail.narration, dbo.qrysaledetail.Quantal, dbo.qrysaledetail.packing, dbo.qrysaledetail.bags, dbo.qrysaledetail.rate AS salerate, dbo.qrysaledetail.item_Amount, dbo.qrysaledetail.ic, 
                         dbo.qrysaledetail.saledetailid, dbo.qrysaledetail.itemname, dbo.qrysaledetail.HSN, dbo.qrysalehead.doc_dateConverted, dbo.qrysalehead.tc, dbo.qrysalehead.transportname, dbo.qrysalehead.transportmobile, 
                         dbo.qrysalehead.billtomobileto, dbo.qrysalehead.GSTStateCode AS partygststatecode, dbo.qrysalehead.shiptostatecode, dbo.qrysalehead.DoNarrtion, dbo.qrysalehead.TCS_Rate, dbo.qrysalehead.TCS_Amt, 
                         dbo.qrysalehead.TCS_Net_Payable, dbo.qrysalehead.newsbno, dbo.qrysalehead.newsbdate, dbo.qrysalehead.einvoiceno, dbo.qrysalehead.ackno, dbo.qrysalehead.Delivery_type, dbo.qrysalehead.millshortname, 
                         dbo.qrysalehead.billtostatename, dbo.qrysalehead.shiptoshortname, dbo.qrysalehead.shiptomobileno, dbo.qrysalehead.shiptotinno, dbo.qrysalehead.shiptolocallicno, dbo.qrysaledetail.Brand_Code, CONVERT(varchar, 
                         dbo.qrysalehead.EwayBillValidDate, 103) AS EwayBillValidDate, dbo.qrysalehead.FSSAI_BillTo, dbo.qrysalehead.FSSAI_ShipTo, dbo.qrysalehead.BillToTanNo, dbo.qrysalehead.ShipToTanNo, dbo.qrysalehead.TDS_Rate, 
                         dbo.qrysalehead.TDS_Amt, dbo.qrysalehead.IsDeleted, dbo.qrysalehead.SBNarration, dbo.qrysalehead.QRCode, dbo.qrysalehead.MillFSSAI_No, dbo.qrysaledetail.Brand_Name, '' AS FreightPerQtl, 
                         dbo.company.State_E AS companyStateName, dbo.nt_1_companyparameters.GSTStateCode AS companyGSTStateCode, dbo.qrysalehead.grade, dbo.tblvoucherheadaddress.bankdetail, dbo.company.GST AS companyGSTNo, 
                         dbo.company.City_E AS companyCity, dbo.company.FSSAI_No AS companyFSSAI, dbo.company.Pan_No AS companyPan, dbo.company.TIN AS companyTIN, dbo.tblvoucherheadaddress.AL1, dbo.tblvoucherheadaddress.AL2, 
                         dbo.tblvoucherheadaddress.AL3, dbo.tblvoucherheadaddress.AL4, dbo.tblvoucherheadaddress.Other, dbo.tblvoucherheadaddress.BillFooter, dbo.company.Company_Name_E, dbo.qrysalehead.season, 
                         dbo.qrysalehead.driver_no, dbo.company.PHONE, dbo.carporatehead.created_by AS Expr1, dbo.carporatehead.pono, dbo.accountingyear.year, dbo.qrysalehead.Carporate_Sale_No AS carporateSaleDoc, 
                         dbo.qrysalehead.CarporateBillToGst_No, dbo.qrysalehead.CarporateBillToEmailID, dbo.qrysalehead.Carporate_Tanno, dbo.qrysalehead.CarporateState_Code, dbo.qrysalehead.Carporate_Pan, 
                         dbo.qrysalehead.Carporate_Address, dbo.qrysalehead.CarporateBillTo_Name, dbo.qrysalehead.Mobile_No AS carporateBillToMobileNo, dbo.qrysalehead.cityname AS carporateBillToCityName, 
                         dbo.qrysalehead.Pincode AS carporateBillToPincode, dbo.qrysalehead.State_Name AS carporateBillToStateName, dbo.qrysalehead.FSSAI AS carporateBillToFSSAI, dbo.qrysalehead.sale_rate AS DOSalerate, 
                         dbo.qrysalehead.Tender_Commission, dbo.carporatehead.selling_type, dbo.qrysalehead.BillToWpNo, dbo.qrysalehead.TransportWpNo, dbo.qrysalehead.ShipToWpNo, dbo.qrysalehead.CarporateBillToWpNo, 
                         dbo.qrysalehead.RefWpNo, dbo.qrysalehead.RefMail, dbo.qrysalehead.TransportEmail,dbo.qrysalehead.millstatename, dbo.qrysalehead.millstatecode,dbo.qrysalehead.brokermobno
FROM            dbo.nt_1_companyparameters INNER JOIN
                         dbo.tblvoucherheadaddress ON dbo.nt_1_companyparameters.Company_Code = dbo.tblvoucherheadaddress.Company_Code INNER JOIN
                         dbo.accountingyear ON dbo.nt_1_companyparameters.Company_Code = dbo.accountingyear.Company_Code AND dbo.nt_1_companyparameters.Year_Code = dbo.accountingyear.yearCode RIGHT OUTER JOIN
                         dbo.carporatehead RIGHT OUTER JOIN
                         dbo.qrysalehead ON dbo.carporatehead.doc_no = dbo.qrysalehead.Carporate_Sale_No AND dbo.carporatehead.company_code = dbo.qrysalehead.Company_Code ON 
                         dbo.nt_1_companyparameters.Year_Code = dbo.qrysalehead.Year_Code AND dbo.nt_1_companyparameters.Company_Code = dbo.qrysalehead.Company_Code LEFT OUTER JOIN
                         dbo.qrysaledetail ON dbo.qrysalehead.saleid = dbo.qrysaledetail.saleid FULL OUTER JOIN
                         dbo.company ON dbo.qrysalehead.Company_Code = dbo.company.Company_Code
                 where dbo.qrysalehead.Company_Code = :company_code  and dbo.qrysalehead.saleid = :saleid
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "saleid": saleid})

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        for data in all_data:
            if 'doc_date' in data:
                data['doc_date'] = data['doc_date'].strftime('%Y-%m-%d') if data['doc_date'] else None
        response = {
            "all_data": all_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#GET all Eway Bill Data from that particular date.
@app.route(API_URL + '/getMatchingPurchaseewaybills', methods=['GET'])
def getMatchingPurchaseewaybills():
    MAX_RETRIES = 3
    retries = 0

    while True:
        try:
            doc_date = request.args.get('doc_date')
            Company_Code = request.args.get('Company_Code')
            Year_Code = request.args.get('Year_Code')

            if not doc_date:
                return jsonify({'error': 'doc_date is required'}), 400
            if not Company_Code or not Year_Code:
                return jsonify({'error': 'Company_Code and Year_Code are required'}), 400

            # Call the stored procedure
            query = db.session.execute(text('''
                EXEC ComparePortalEwayBillData 
                    :DocDate, 
                    :Company_Code, 
                    :Year_Code
            '''), {
                'DocDate': doc_date,
                'Company_Code': Company_Code,
                'Year_Code': Year_Code
            })

            # Fetch the results
            results = query.mappings().all()
            response_data = [dict(row) for row in results]

            return jsonify(response_data)

        except OperationalError as e:
            if '1205' in str(e):
                db.session.rollback()
                retries += 1
                if retries < MAX_RETRIES:
                    time.sleep(1)
                    continue
                else:
                        raise
            else:
                db.session.rollback()
                raise
        except Exception as e:
                db.session.rollback()
                print(f"Error occurred: {e}")
                return jsonify({'error': 'Internal server error'}), 500


#GET all Eway Bill Data from that particular date.
@app.route(API_URL + '/getMatchingPurchaseewaybillsMissing', methods=['GET'])
def getMatchingPurchaseewaybillsMissing():
    MAX_RETRIES = 3
    retries = 0

    while True:
        try:
            doc_date = request.args.get('doc_date')

            if not doc_date:
                return jsonify({'error': 'doc_date is required'}), 400

            with db.session.begin_nested():
                query = db.session.execute(text('''
    SELECT        dbo.EWayBillPortalDetails.supplyType, dbo.EWayBillPortalDetails.ewbNo, dbo.EWayBillPortalDetails.ewayBillDate, dbo.EWayBillPortalDetails.docNo, dbo.EWayBillPortalDetails.docDate, dbo.EWayBillPortalDetails.fromPlace,
                            dbo.EWayBillPortalDetails.fromStateCode, dbo.EWayBillPortalDetails.fromAddr1, dbo.EWayBillPortalDetails.fromAddr2, dbo.EWayBillPortalDetails.toAddr1, dbo.EWayBillPortalDetails.toAddr2, 
                            dbo.EWayBillPortalDetails.toPlace, dbo.EWayBillPortalDetails.toStateCode, dbo.EWayBillPortalDetails.vehicleNo, dbo.EWayBillPortalDetails.taxableAmount, dbo.EWayBillPortalDetails.cgstValue, 
                            dbo.EWayBillPortalDetails.sgstValue, dbo.EWayBillPortalDetails.igstValue, dbo.EWayBillPortalDetails.hsnCode, dbo.EWayBillPortalDetails.productId, dbo.EWayBillPortalDetails.productName, 
                            dbo.EWayBillPortalDetails.transporterId, dbo.EWayBillPortalDetails.actualDist, dbo.EWayBillPortalDetails.quantity, dbo.EWayBillPortalDetails.id, dbo.EWayBillPortalDetails.toGstin, dbo.EWayBillPortalDetails.fromGstin, 
                            dbo.EWayBillPortalDetails.SaleBill_Print, dbo.EWayBillPortalDetails.EWayBill_Print, dbo.EWayBillPortalDetails.totInvValue, dbo.nt_1_sugarpurchase.LORRYNO
    FROM   dbo.EWayBillPortalDetails LEFT OUTER JOIN
                            dbo.nt_1_sugarpurchase ON CAST(dbo.EWayBillPortalDetails.ewayBillDate AS DATE) = dbo.nt_1_sugarpurchase.doc_date AND dbo.EWayBillPortalDetails.vehicleNo = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(nt_1_sugarpurchase.LORRYNO, ' ', ''), '-', ''),'/',''),'  ',''),'_',''),'=',''),':',''),'.','')
    WHERE  (dbo.nt_1_sugarpurchase.LORRYNO IS NULL) and CAST(dbo.EWayBillPortalDetails.ewayBillDate AS DATE) = :doc_date
                '''), {
                    'doc_date': doc_date,
                })

                results = query.mappings().all()
                response_data = [dict(row) for row in results]

                return jsonify(response_data)

        except OperationalError as e:
            if '1205' in str(e):
                db.session.rollback()
                retries += 1
                if retries < MAX_RETRIES:
                    time.sleep(1)
                    continue
                else:
                        raise
            else:
                db.session.rollback()
                raise
        except Exception as e:
                db.session.rollback()
                print(f"Error occurred: {e}")
                return jsonify({'error': 'Internal server error'}), 500
    

# @app.route(API_URL + '/updatemillinvoiceno', methods=['PUT'])
# def updatemillinvoiceno():
#     try:
#         doc_date = request.args.get('doc_date')
#         Company_Code = request.args.get('Company_Code')
#         Year_Code = request.args.get('Year_Code')
#         vehicle_no = request.args.get('vehicle_no')

#         if not all([doc_date, Company_Code, Year_Code, vehicle_no]):
#             return jsonify({'error': 'Missing required params'}), 400

        
#         # Fetch EWBs
#         ewb_data = db.session.execute(text('''
#             SELECT ewbNo, docNo, quantity, totInvValue
#             FROM EWayBillPortalDetails
#             WHERE ewayBillDate = :doc_date AND 
#            vehicleNo = :vehicle_no
#         '''), {'doc_date': doc_date, 'vehicle_no': vehicle_no}).fetchall()

#         if not ewb_data:
#             return jsonify({'error': 'No EWayBill data found'}), 404

#         # Fetch DOs/Purchases
#         purchase_data = db.session.execute(text('''
#             SELECT PURCNO, NETQNTL FROM nt_1_sugarpurchase
#             WHERE doc_date = :doc_date AND Company_Code = :Company_Code AND Year_Code = :Year_Code
#             LORRYNO = :vehicle_no
#         '''), {
#             'doc_date': doc_date, 'Company_Code': Company_Code, 'Year_Code': Year_Code, 'vehicle_no': vehicle_no
#         }).fetchall()

#         if not purchase_data:
#             return jsonify({'error': 'No purchase records found'}), 404

#         ewb_list = list(ewb_data)
#         purc_list = list(purchase_data)
#         matched = False

#         # 1️⃣ Exact 1 DO, multiple EWBs (sum quantity)
#         if len(purc_list) == 1 and len(ewb_list) > 1:
#             total_qty = sum(float(e[2]) for e in ewb_list)
#             purc_qty = float(purc_list[0][1])
#             if round(total_qty, 2) == round(purc_qty, 2):
#                 purc_no = purc_list[0][0]
#                 combined_ewb = ",".join(str(e[0]) for e in ewb_list)
#                 bill_no = max(int(e[1]) for e in ewb_list)

#                 db.session.execute(text('''
#                     UPDATE nt_1_deliveryorder
#                     SET MillEwayBill = :ewb_no, MillInvoiceNo = :invoice_no
#                     WHERE doc_no = :purc_no AND company_code = :Company_Code AND Year_Code = :Year_Code
#                       AND truck_no = :vehicle_no AND quantal = :qty
#                 '''), {
#                     'ewb_no': combined_ewb,
#                     'invoice_no': bill_no,
#                     'purc_no': purc_no,
#                     'Company_Code': Company_Code,
#                     'Year_Code': Year_Code,
#                     'vehicle_no': vehicle_no,
#                     'qty': purc_qty
#                 })

#                 db.session.execute(text('''
#                     UPDATE nt_1_sugarpurchase
#                     SET EWay_Bill_No = :ewb_no, Bill_No = :invoice_no
#                     WHERE PURCNO = :purc_no AND company_code = :Company_Code AND Year_Code = :Year_Code
#                       AND LORRYNO = :vehicle_no AND NETQNTL = :qty
#                 '''), {
#                     'ewb_no': combined_ewb,
#                     'invoice_no': bill_no,
#                     'purc_no': purc_no,
#                     'Company_Code': Company_Code,
#                     'Year_Code': Year_Code,
#                     'vehicle_no': vehicle_no,
#                     'qty': purc_qty
#                 })

#                 db.session.commit()
#                 return jsonify({'message': f'Multi-EWB combined and updated for DO {purc_no}'}), 200

#         # 2️⃣ Try one-to-one quantity matches
#         used_ewbs = set()
#         used_purcs = set()

#         for ewb in ewb_list:
#             for purc in purc_list:
#                 if purc[0] in used_purcs:
#                     continue
#                 if round(float(ewb[2]), 2) == round(float(purc[1]), 2):
#                     ewb_no = ewb[0]
#                     bill_no = ewb[1]
#                     purc_no = purc[0]
#                     qty = float(purc[1])

#                     db.session.execute(text('''
#                         UPDATE nt_1_deliveryorder
#                         SET MillEwayBill = :ewb_no, MillInvoiceNo = :bill_no
#                         WHERE doc_no = :purc_no AND company_code = :Company_Code AND Year_Code = :Year_Code
#                           AND truck_no = :vehicle_no AND quantal = :qty
#                     '''), {
#                         'ewb_no': ewb_no, 'bill_no': bill_no,
#                         'purc_no': purc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code,
#                         'vehicle_no': vehicle_no, 'qty': qty
#                     })

#                     db.session.execute(text('''
#                         UPDATE nt_1_sugarpurchase
#                         SET EWay_Bill_No = :ewb_no, Bill_No = :bill_no
#                         WHERE PURCNO = :purc_no AND company_code = :Company_Code AND Year_Code = :Year_Code
#                           AND LORRYNO = :vehicle_no AND NETQNTL = :qty
#                     '''), {
#                         'ewb_no': ewb_no, 'bill_no': bill_no,
#                         'purc_no': purc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code,
#                         'vehicle_no': vehicle_no, 'qty': qty
#                     })

#                     used_ewbs.add(ewb)
#                     used_purcs.add(purc[0])
#                     matched = True
#                     break

#         if matched:
#             db.session.commit()
#             return jsonify({'message': 'Updated one-to-one matched EWBs to DOs'}), 200

#         # 3️⃣ Brute-force: Try group matches
#         for r in range(2, len(purc_list) + 1):
#             for combo in combinations(purc_list, r):
#                 total_purc_qty = sum(float(p[1]) for p in combo)
#                 for ewb in ewb_list:
#                     if round(float(ewb[2]), 2) == round(total_purc_qty, 2):
#                         ewb_no = ewb[0]
#                         bill_no = ewb[1]
#                         for purc in combo:
#                             purc_no = purc[0]
#                             qty = purc[1]
#                             db.session.execute(text('''
#                                 UPDATE nt_1_deliveryorder
#                                 SET MillEwayBill = :ewb_no, MillInvoiceNo = :bill_no
#                                 WHERE doc_no = :purc_no AND company_code = :Company_Code AND Year_Code = :Year_Code
#                                   AND truck_no = :vehicle_no AND quantal = :qty
#                             '''), {
#                                 'ewb_no': ewb_no, 'bill_no': bill_no,
#                                 'purc_no': purc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code,
#                                 'vehicle_no': vehicle_no, 'qty': qty
#                             })

#                             db.session.execute(text('''
#                                 UPDATE nt_1_sugarpurchase
#                                 SET EWay_Bill_No = :ewb_no, Bill_No = :bill_no
#                                 WHERE PURCNO = :purc_no AND company_code = :Company_Code AND Year_Code = :Year_Code
#                                   AND LORRYNO = :vehicle_no AND NETQNTL = :qty
#                             '''), {
#                                 'ewb_no': ewb_no, 'bill_no': bill_no,
#                                 'purc_no': purc_no, 'Company_Code': Company_Code, 'Year_Code': Year_Code,
#                                 'vehicle_no': vehicle_no, 'qty': qty
#                             })

#                         db.session.commit()
#                         return jsonify({'message': f'Matched multi-purchase combo to EWB {ewb_no}'}), 200

#         return jsonify({'error': 'No valid quantity match found'}), 409

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'error': 'Internal error', 'details': str(e)}), 500



@app.route(API_URL + '/updatemillinvoiceno', methods=['PUT'])
def updatemillinvoiceno():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        doNo = request.args.get('doNo')
        millDoc_No = request.args.get('millDoc_No')
        ewayBillNo = request.args.get('ewayBillNo')

        if not all([doNo, Company_Code, Year_Code, millDoc_No, ewayBillNo]):
            return jsonify({'error': 'Missing required params'}), 400

        db.session.execute(text('''
            UPDATE nt_1_deliveryorder 
            SET MillEwayBill = :ewayBillNo, MillInvoiceNo = :millDoc_No 
            WHERE tran_type = 'DO' AND doc_no = :doNo AND company_code = :Company_Code 
              AND Year_Code = :Year_Code
        '''), {
            'ewayBillNo': ewayBillNo,
            'millDoc_No': millDoc_No,
            'doNo': doNo,
            'Company_Code': Company_Code,
            'Year_Code': Year_Code
        })

        db.session.execute(text('''
            UPDATE nt_1_sugarpurchase
            SET EWay_Bill_No = :ewayBillNo, Bill_No = :millDoc_No
            WHERE PURCNO = :doNo AND company_code = :Company_Code AND Year_Code = :Year_Code
        '''), {
            'ewayBillNo': ewayBillNo,
            'millDoc_No': millDoc_No,
            'doNo': doNo,
            'Company_Code': Company_Code,
            'Year_Code': Year_Code
        })

        db.session.commit()
        return jsonify({'message': f'Multi-EWB combined and updated for DO {doNo}'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal error', 'details': str(e)}), 500


@app.route(API_URL + "/deleteewaybillandimport", methods=["DELETE"])
def deleteewaybillandimport():
    try:
        ewbNo = request.args.get('ewbNo')
        if ewbNo is None:
            return jsonify({'error': 'Missing ewbNo parameter'}), 400

        try:
            ewbNo = int(ewbNo)
        except ValueError:
            return jsonify({'error': 'Invalid ewbNo'}), 400

        deletedEwbNo = EWayBillPortal.query.filter_by(ewbNo=ewbNo).first()
        if deletedEwbNo is None:
            return jsonify({'error': 'EWayBill not found'}), 404

        db.session.delete(deletedEwbNo)
        db.session.commit()
        socketio.emit('deletedEwbNo')

        return jsonify({'message': 'ewbNo deleted successfully', 'deletedEwbNo': ewbNo})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
