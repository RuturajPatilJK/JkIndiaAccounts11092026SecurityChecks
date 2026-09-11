
from flask import jsonify
from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL+'/purchno', methods=['GET'])
def purcno():
    try:
        CompanyCode = request.args.get('CompanyCode')
        MillCode = request.args.get('MillCode')

        #Tender_No = request.args.get('Tender_No')

        if  CompanyCode is None or MillCode is None:
            return jsonify({'error': 'Missing MillCode or CompanyCode parameter'}), 400
        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
           SELECT  dbo.qrytenderdobalanceview.Tender_No, dbo.qrytenderdobalanceview.Tender_DateConverted AS Tender_Date, dbo.qrytenderdobalanceview.buyername AS Party2, 
                         dbo.qrytenderdobalanceview.buyerpartyname AS Party, dbo.qrytenderdobalanceview.Mill_Rate, ISNULL(CONVERT(NVARCHAR(200), dbo.qrytenderdobalanceview.Grade), N'') + CASE WHEN NULLIF (CONVERT(NVARCHAR(200), 
                         dbo.nt_1_systemmaster.System_Name_E), N'') IS NULL THEN N'' ELSE N' - ' + CONVERT(NVARCHAR(200), dbo.nt_1_systemmaster.System_Name_E) END AS Grade, dbo.qrytenderdobalanceview.Sale_Rate, 
                         dbo.qrytenderdobalanceview.Buyer_Quantal, dbo.qrytenderdobalanceview.DESPATCH, dbo.qrytenderdobalanceview.BALANCE, dbo.qrytenderdobalanceview.tenderdoname AS doname, 
                         dbo.qrytenderdobalanceview.Lifting_DateConverted AS Lifting_Date, dbo.qrytenderdobalanceview.ID, dbo.qrytenderdobalanceview.tenderdetailid, dbo.qrytenderdobalanceview.tenderid, 
                         dbo.qrytenderdobalanceview.Delivery_Type, dbo.qrytenderdobalanceview.shiptoname, dbo.qrytenderdobalanceview.tenderdoshortname, dbo.qrytenderdobalanceview.season, 
                         ISNULL(dbo.qrytenderdobalanceview.Purchase_Rate, dbo.qrytenderdobalanceview.Party_Bill_Rate) AS Party_Bill_Rate, dbo.qrytenderdobalanceview.gradeid, dbo.qrytenderdobalanceview.gradeCode, 
                         CASE WHEN dbo.qrytenderdobalanceview.MillRate = 0 THEN mill_rate ELSE millrate END AS MillRate, dbo.qrytenderdobalanceview.Buyer_Party, dbo.qrytenderdobalanceview.buyerpartyid, 
                         dbo.qrytenderdobalanceview.Sauda_Date, dbo.qrytenderdobalanceview.Lifting_Date AS PaymentDate, dbo.qrytenderdobalanceview.Sauda_Lifting_Date, dbo.qrytenderdobalanceview.buyerid, 
                         dbo.qrytenderdobalanceview.Buyer
FROM            dbo.qrytenderdobalanceview LEFT OUTER JOIN
                         dbo.nt_1_systemmaster ON dbo.qrytenderdobalanceview.gradeid = dbo.nt_1_systemmaster.systemid
WHERE  (dbo.qrytenderdobalanceview.BALANCE <> 0) AND (dbo.qrytenderdobalanceview.Company_Code = :CompanyCode) AND (dbo.qrytenderdobalanceview.Mill_Code = :MillCode)
ORDER BY dbo.qrytenderdobalanceview.Tender_No DESC
            '''),{'CompanyCode':CompanyCode, 'MillCode':MillCode})

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'Tender_No': row.Tender_No,
                'Tender_DateConverted': row.Tender_Date,
                'buyername': row.Party2,
                'buyerpartyname': row.Party,
                'Mill_Rate': row.Mill_Rate,
                'Grade':row.Grade,
                'Sale_Rate':row.Sale_Rate,
                'Buyer_Quantal':row.Buyer_Quantal,
                'DESPATCH':row.DESPATCH,
                'BALANCE':row.BALANCE,
                'tenderdoname':row.doname,
                'Lifting_DateConverted':row.Lifting_Date,
                'ID':row.ID,
                'tenderdetailid':row.tenderdetailid,
                'tenderid':row.tenderid,
                'Delivery_Type':row.Delivery_Type,
                'shiptoname':row.shiptoname,
                'tenderdoshortname':row.tenderdoshortname,
                'season':row.season,
                'Party_Bill_Rate':row.Party_Bill_Rate,
                'gradeid': row.gradeid,
                'gradeCode': row.gradeCode,
                'Mill_Rate': row.MillRate,
                'Buyer_Party': row.Buyer_Party,
                'buyerpartyid': row.buyerpartyid,
                'Sauda_Date': row.Sauda_Date,
                'PaymentDate': row.PaymentDate,
                'Sauda_Lifting_Date': row.Sauda_Lifting_Date,
                'buyerid': row.buyerid,
                'Buyer': row.Buyer
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    


@app.route(API_URL + "/getTenderNo_Data", methods=["GET"])
def getTenderNo_Data():
    try:
        Company_Code = request.args.get('CompanyCode')
        Tenderno = request.args.get('Tender_No')
        Year_Code = request.args.get('Year_Code')
        ID = request.args.get('ID')

        if not all([Company_Code, Tenderno, ID]):
            return jsonify({"error": "Missing required parameters"}), 400

        with db.session.begin_nested():
            # Execute query2 first
            query2 = db.session.execute(
                text('''
                    SELECT        dbo.nt_1_companyparameters.SELF_AC, dbo.nt_1_accountmaster.accoid, dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_accountmaster.GSTStateCode, dbo.gststatemaster.State_Name
                        FROM            dbo.gststatemaster RIGHT OUTER JOIN
                         dbo.nt_1_accountmaster ON dbo.gststatemaster.State_Code = dbo.nt_1_accountmaster.GSTStateCode RIGHT OUTER JOIN
                         dbo.nt_1_companyparameters ON dbo.nt_1_accountmaster.company_code = dbo.nt_1_companyparameters.Company_Code AND dbo.nt_1_accountmaster.Ac_Code = dbo.nt_1_companyparameters.SELF_AC
                      WHERE dbo.nt_1_companyparameters.Year_Code = :Year_Code 
                      AND dbo.nt_1_companyparameters.Company_Code = :Company_Code
                '''),
                {'Year_Code': Year_Code, 'Company_Code': Company_Code}
            )
            SelfAc_data = [dict(row._mapping) for row in query2.fetchall()]
            selfacname=SelfAc_data[0].get('Ac_Name_E', None)
            selfac=SelfAc_data[0].get('SELF_AC', None)
            selfacid=SelfAc_data[0].get('accoid', None)
            selfacstatecode=SelfAc_data[0].get('GSTStateCode', None)
            selfacstatename=SelfAc_data[0].get('State_Name', None)
            
            # Now execute query1
            query = db.session.execute(
                text('''
                     SELECT d.Buyer, d.buyername, d.Buyer_Party, d.buyerpartyname, d.Voucher_By, d.voucherbyname,
       ISNULL(s.System_Name_E,d.Grade) AS Grade,
       d.Buyer_Quantal AS Quantal, d.Packing, d.Bags, d.Excise_Rate, d.Mill_Rate, d.Sale_Rate,
       d.Tender_DO, d.tenderdoname, d.Broker,d.bk AS brokerbk, d.brokername, d.Commission_Rate AS CR,
       d.Delivery_Type AS DT, d.Payment_To, d.paymenttoname, d.gstratecode, d.gstratename,
       d.itemcode, d.itemname, d.tenderdetailid, d.ShipToname, d.shiptoid, d.ShipTo, d.season,
      d.AutoPurchaseBill, d.buyerpartygststatecode, d.buyerpartystatename,
       d.buyerpartyid, d.buyerid, d.shiptoid, d.pt, d.ic, d.td, d.gstrate, d.gstid, d.gradeid,
       d.gradeCode, ISNULL(d.MillRate,d.Mill_Rate) as MillRate,
       (CASE WHEN d.Delivery_Type='DO' THEN d.Buyer     ELSE :selfac          END) AS Getpassno,
       (CASE WHEN d.Delivery_Type='DO' THEN d.buyerid   ELSE :selfacid        END) AS Getpassnoid,
       (CASE WHEN d.Delivery_Type='DO' THEN d.buyername ELSE :selfacname      END) AS Getpassnoname,
       (CASE WHEN d.Delivery_Type='DO' THEN d.buyergststatecode ELSE :selfacstatecode END) AS Getpassnonamestatecode,
       (CASE WHEN d.Delivery_Type='DO' THEN d.buyeridcitystate ELSE :selfacstatename END) AS Getpassnonamestatename,
       d.buyergststatecode, d.buyeridcitystate, d.shiptostatecode, d.shiptostatename,
       d.millstatecode, d.millStatename, d.tenderid, CASE WHEN ISNULL(d .Purchase_Rate, 0) = 0 THEN ISNULL(d .Party_Bill_Rate, 0) ELSE d .Purchase_Rate END AS Party_Bill_Rate
FROM dbo.qrytenderheaddetail AS d
LEFT JOIN dbo.nt_1_systemmaster AS s
  ON d.gradeid = s.systemid
WHERE d.Company_Code = :Company_Code
  AND d.Tender_No    = :Tender_No
  AND d.ID           = :ID;
                '''),
                 {'Company_Code': Company_Code, 'Tender_No': Tenderno, 'ID': ID,
                   'selfac': selfac,'selfacname':selfacname,'selfacid':selfacid ,'selfacstatename' :selfacstatename,'selfacstatecode' :selfacstatecode}
     
            )

            result = query.fetchall()
            last_details_data = [dict(row._mapping) for row in result]

            if last_details_data:
                tender_no = Tenderno
                tender_id = last_details_data[0].get('tenderid')
                tender_detail_id = last_details_data[0].get('tenderdetailid')

                balance_query = db.session.execute(
                    text('''
                        SELECT BALANCE 
                        FROM qrytenderdobalanceview
                        WHERE Tender_No = :Tender_No AND tenderid = :tenderid AND tenderdetailid = :tenderdetailid
                    '''), {
                        'Tender_No': tender_no,
                        'tenderid': tender_id,
                        'tenderdetailid': tender_detail_id
                    }
                )
                balance_result = balance_query.fetchone()
                balance_value = balance_result.BALANCE if balance_result else 0

                last_details_data[0]['BALANCE'] = float(balance_value)

            response = {
                "last_details_data": last_details_data,
               
            }

            return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
@app.route(API_URL + "/getTenderNo_DataByTenderdetailId", methods=["GET"])
def getTenderNo_DataByTenderdetailId():
    try:
       
        tenderdetailid = request.args.get('tenderdetailid')

        if not all([tenderdetailid]):
            return jsonify({"error": "Missing required parameters"}), 400

        with db.session.begin_nested():
            # Fetch self-AC details including GST state for Getpassno CASE expressions
            query2 = db.session.execute(
                text('''
                    SELECT dbo.nt_1_companyparameters.SELF_AC, dbo.nt_1_accountmaster.accoid,
                           dbo.nt_1_accountmaster.Ac_Name_E, dbo.nt_1_accountmaster.GSTStateCode,
                           dbo.gststatemaster.State_Name
                    FROM dbo.nt_1_companyparameters
                    INNER JOIN dbo.nt_1_accountmaster
                           ON dbo.nt_1_companyparameters.Company_Code = dbo.nt_1_accountmaster.company_code
                          AND dbo.nt_1_companyparameters.SELF_AC = dbo.nt_1_accountmaster.Ac_Code
                    LEFT JOIN dbo.gststatemaster
                           ON dbo.nt_1_accountmaster.GSTStateCode = dbo.gststatemaster.State_Code
                ''')
            )
            SelfAc_data = [dict(row._mapping) for row in query2.fetchall()]
            selfacname      = SelfAc_data[0].get('Ac_Name_E', None)
            selfac          = SelfAc_data[0].get('SELF_AC', None)
            selfacid        = SelfAc_data[0].get('accoid', None)
            selfacstatecode = SelfAc_data[0].get('GSTStateCode', None)
            selfacstatename = SelfAc_data[0].get('State_Name', None)

            # Now execute main query — mirrors getTenderNo_Data fields plus PendingDeliveryOrder columns
            query = db.session.execute(
                text('''
                    SELECT
                         dbo.qrytenderheaddetail.Buyer, dbo.qrytenderheaddetail.buyername,
                         dbo.qrytenderheaddetail.Buyer_Party, dbo.qrytenderheaddetail.buyerpartyname,
                         dbo.qrytenderheaddetail.Voucher_By, dbo.qrytenderheaddetail.voucherbyname,
                         dbo.qrytenderheaddetail.Grade, dbo.qrytenderheaddetail.Buyer_Quantal AS Quantal,
                         dbo.qrytenderheaddetail.Packing, dbo.qrytenderheaddetail.Bags,
                         dbo.qrytenderheaddetail.Excise_Rate, dbo.qrytenderheaddetail.Mill_Rate,
                         dbo.qrytenderheaddetail.Sale_Rate, dbo.qrytenderheaddetail.Purc_Rate,
                         dbo.qrytenderheaddetail.Tender_DO, dbo.qrytenderheaddetail.tenderdoname,
                         dbo.qrytenderheaddetail.Broker,dbo.qrytenderheaddetail.bk AS brokerbk, dbo.qrytenderheaddetail.brokername,
                         dbo.qrytenderheaddetail.Commission_Rate AS CR,
                         dbo.qrytenderheaddetail.Delivery_Type AS DT,
                         dbo.qrytenderheaddetail.Payment_To, dbo.qrytenderheaddetail.paymenttoname,
                         dbo.qrytenderheaddetail.gstratecode, dbo.qrytenderheaddetail.gstratename,
                         dbo.qrytenderheaddetail.itemcode, dbo.qrytenderheaddetail.itemname,
                         dbo.qrytenderheaddetail.tenderdetailid, dbo.qrytenderheaddetail.ShipToname,
                         dbo.qrytenderheaddetail.shiptoid, dbo.qrytenderheaddetail.ShipTo,
                         dbo.qrytenderheaddetail.season, dbo.qrytenderheaddetail.Party_Bill_Rate,
                         dbo.qrytenderheaddetail.AutoPurchaseBill,
                         dbo.qrytenderheaddetail.buyerpartygststatecode,
                         dbo.qrytenderheaddetail.buyerpartystatename,
                         dbo.qrytenderheaddetail.buyerpartyid, dbo.qrytenderheaddetail.buyerid,
                         dbo.qrytenderheaddetail.pt, dbo.qrytenderheaddetail.ic,
                         dbo.qrytenderheaddetail.td, dbo.qrytenderheaddetail.gstrate,
                         dbo.qrytenderheaddetail.Tender_No, dbo.qrytenderheaddetail.ID,
                         dbo.qrytenderheaddetail.tenderid,
                         dbo.qrytenderheaddetail.Mill_Code, dbo.qrytenderheaddetail.mc,
                         dbo.qrytenderheaddetail.millname,
                         dbo.qrytenderheaddetail.millstatecode, dbo.qrytenderheaddetail.millStatename,
                         dbo.qrytenderheaddetail.buyergststatecode, dbo.qrytenderheaddetail.buyeridcitystate,
                         dbo.qrytenderheaddetail.shiptostatename, dbo.qrytenderheaddetail.shiptostatecode,
                         dbo.qrytenderheaddetail.gradeid, dbo.qrytenderheaddetail.gradeCode,
                         dbo.qrytenderheaddetail.gstid,
                         ISNULL(dbo.qrytenderheaddetail.MillRate, dbo.qrytenderheaddetail.Mill_Rate) AS MillRate,
                         pd.TruckNo AS truck_no,
                         pd.BillTo_Accoid AS bill_to_accoid, pd.ShipTo_Accoid AS ship_to_accoid,
                         pd.BillTo_Ac_Code AS bill_to_ac_code, pd.ShipTo_Ac_Code AS ship_to_ac_code,
                         billto.Ac_Name_E AS Bill_TO_Name, shipto.Ac_Name_E AS Ship_To_name,
                         billto.Gst_No AS bill_to_gst_no, shipto.Gst_No AS ship_to_gst_no,
                         billto.GSTStateCode AS bill_to_gst_state_code,
                         shipto.GSTStateCode AS ship_to_gst_state_code,
                         (CASE WHEN Delivery_Type=\'DO\' THEN Buyer       ELSE :selfac          END) AS Getpassno,
                         (CASE WHEN Delivery_Type=\'DO\' THEN buyerid     ELSE :selfacid        END) AS Getpassnoid,
                         (CASE WHEN Delivery_Type=\'DO\' THEN buyername   ELSE :selfacname      END) AS Getpassnoname,
                         (CASE WHEN Delivery_Type=\'DO\' THEN dbo.qrytenderheaddetail.buyergststatecode ELSE :selfacstatecode END) AS Getpassnonamestatecode,
                         (CASE WHEN Delivery_Type=\'DO\' THEN dbo.qrytenderheaddetail.buyeridcitystate  ELSE :selfacstatename  END) AS Getpassnonamestatename
                    FROM dbo.nt_1_accountmaster AS shipto
                    RIGHT OUTER JOIN dbo.nt_1_PendingDeliveryOrder AS pd ON shipto.accoid = pd.ShipTo_Accoid
                    LEFT  OUTER JOIN dbo.nt_1_accountmaster AS billto ON pd.BillTo_Accoid = billto.accoid
                    RIGHT OUTER JOIN dbo.qrytenderheaddetail ON pd.tenderdetailid = dbo.qrytenderheaddetail.tenderdetailid
                    WHERE dbo.qrytenderheaddetail.tenderdetailid = :tenderdetailid
                '''),
                {
                    'tenderdetailid': tenderdetailid,
                    'selfac': selfac, 'selfacname': selfacname, 'selfacid': selfacid,
                    'selfacstatecode': selfacstatecode, 'selfacstatename': selfacstatename
                }
            )

            result = query.fetchall()
            last_details_data = [dict(row._mapping) for row in result]

            if last_details_data:
                tender_no = last_details_data[0].get('Tender_No')
                tender_id = last_details_data[0].get('tenderid')   # use tenderid, not ID
                tdid = last_details_data[0].get('tenderdetailid')

                balance_query = db.session.execute(
                    text('''
                        SELECT BALANCE 
                        FROM qrytenderdobalanceview
                        WHERE Tender_No = :Tender_No AND tenderid = :tenderid AND tenderdetailid = :tenderdetailid
                    '''), {
                        'Tender_No': tender_no,
                        'tenderid': tender_id,
                        'tenderdetailid': tdid
                    }
                )
                balance_result = balance_query.fetchone()
                balance_value = balance_result.BALANCE if balance_result else 0
                last_details_data[0]['BALANCE'] = float(balance_value)

            response = {
                "last_details_data": last_details_data,
               
            }

            return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500



