from app import app, db
from flask import request, jsonify, session
from sqlalchemy import text
import traceback
from datetime import datetime
import os
from sqlalchemy.exc import SQLAlchemyError 
from collections import defaultdict
API_URL = os.getenv('API_URL')
from flask import request, jsonify
from sqlalchemy.sql import text
from collections import defaultdict


def format_date(date_str):
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").strftime("%Y-%m-%d")
    except ValueError:
        return date_str


@app.route(API_URL + '/dispatch-details', methods=['GET'])
def dispatch_details():
    try:
        # Get query parameters
        mill_code = request.args.get("Mill_Code", "")
        from_dt = request.args.get("fromDate")
        to_dt = request.args.get("toDate")
        lot_no = request.args.get("lotNo", "")
        sr_no = request.args.get("srNo", "")
        branch_code = request.args.get("Branch_Code", "")
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")

        # Validate required parameters
        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400

        # Format dates
        from_dt = format_date(from_dt)
        to_dt = format_date(to_dt)

        # Base query for DOHead table
        do_query = """
            SELECT doc_no AS detail_id, doc_dateConverted as DI_Date, salebillname AS Getpass,
                   shiptoshortname AS ShippedTo, truck_no, quantal AS DI_Qty,
                   doshortname AS DI_DO,purc_no, purc_order,tenderdetailid ,(sale_rate + Tender_Commission) as SalerateDO
            FROM qrydohead
            WHERE company_code = :company_code
              AND Year_Code = :year_code
              
              AND tran_type = 'DO'
        """
        do_params = {
            "company_code": company_code,
            "year_code": year_code,
            "from_dt": from_dt,
            "to_dt": to_dt
        }
        if sr_no:
            do_query += " AND purc_order = :sr_no"
            do_params["sr_no"] = sr_no

        # Execute DOHead query
        do_results = db.session.execute(text(do_query), do_params).fetchall()

        # Base query for Tender details
        tender_query = """
            SELECT DISTINCT Tender_No, Tender_DateConverted as Tender_Date , millshortname AS Mill, Mill_Code,
                            Grade, Quantal, Mill_Rate, convert(varchar(10) ,Lifting_Date,103) as Lifting_Date,  tenderdoname AS Tender_DO,ID,Buyer as BuyerCode,
                            buyerpartyname as Buyer,Buyer_Quantal as Qty,Sale_Rate as Sale_Rate,tenderdoname as Tender_DO ,Tender_No,tenderdetailid,millname,(Sale_Rate+Commission_Rate) as TDeatailSaleRate
            FROM qrytenderheaddetail
            WHERE company_code = :company_code
              AND Tender_Date BETWEEN :from_dt AND :to_dt
        """
        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt
        }

        # Apply conditions for Tender details
        if mill_code:
            tender_query += " AND Mill_Code = :mill_code "
            tender_params["mill_code"] = mill_code

            if lot_no:
                tender_query += " AND Tender_No = :lot_no"
                tender_params["lot_no"] = lot_no

                if sr_no:
                    tender_query += " AND ID = :sr_no"
                    tender_params["sr_no"] = sr_no

        elif lot_no:
            tender_query += " AND Tender_No = :lot_no"
            tender_params["lot_no"] = lot_no

            if sr_no:
                tender_query += " AND ID = :sr_no  and Buyer=2 "
                tender_params["sr_no"] = sr_no

        # Execute Tender query
        tender_results = db.session.execute(text(tender_query), tender_params).fetchall()

        # Add Dispatched column to Tender results
        tender_data = []
        for row in tender_results:
            tender_no = row._mapping["Tender_No"]
            dispatched_query = """
                SELECT SUM(Quantal) AS Dispatched
                FROM nt_1_deliveryorder
                WHERE company_code = :company_code
                  AND Year_Code = :year_code
                  AND Purc_No = :tender_no
                  AND Tran_Type = 'DO'
            """
            dispatched = db.session.execute(
                text(dispatched_query),
                {"company_code": company_code, "year_code": year_code, "tender_no": tender_no}
            ).scalar() or 0

            row_data = dict(row._mapping)  
            row_data["Dispatched"] = dispatched
            tender_data.append(row_data)

        # Prepare response
        response_data = {
            "do_results": [dict(row._mapping) for row in do_results], 
            "tender_results": tender_data,
            "do_count": len(do_results),
            "tender_count": len(tender_data)
        }


        return jsonify(response_data)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



@app.route(API_URL + '/DispatchDetailsRegister', methods=['GET'])
def DispatchDetailsRegister():
    mill_code = request.args.get("Mill_Code", "")
    from_dt = request.args.get("fromDate")
    to_dt = request.args.get("toDate")
    lot_no = request.args.get("lotNo", "")
    sr_no = request.args.get("srNo", "")
    company_code = request.args.get("Company_Code")
    year_code = request.args.get("Year_Code")

    try:
        # Query for tender details
        tender_details_query = text('''
            SELECT DISTINCT Tender_No AS Tender_No, Tender_DateConverted AS Tender_Date,
                millshortname AS Mill, Mill_Code, Grade, Quantal, Mill_Rate,
                Lifting_DateConverted AS Lifting_Date, tenderdoname AS Tender_DO
            FROM qrytenderheaddetail
            WHERE Company_Code = :company_code AND Tender_Date BETWEEN :From_date AND :To_Date
            ORDER BY Tender_Date
        ''')
        tender_details_result = db.session.execute(
            tender_details_query,
            {'company_code': company_code, 'From_date': from_dt, 'To_Date': to_dt}
        ).fetchall()

        if not tender_details_result:
            return jsonify({"error": "No tender details found for the given Company_Code"}), 404

        # Query for sales (DO) details
        sales_details_query = text('''
            SELECT doc_no AS detail_id, doc_dateConverted AS DI_Date,
                salebillname AS Getpass, shiptoshortname AS ShippedTo,
                truck_no, quantal AS DI_Qty, doshortname AS DI_DO, purc_no
            FROM qrydohead
            WHERE Company_Code = :company_code 
                AND tran_type = 'DO'
            ORDER BY doc_date
        ''')
        sales_details_result = db.session.execute(
            sales_details_query,
            {'company_code': company_code, 'From_date': from_dt, 'To_Date': to_dt}
        ).fetchall()

        if not sales_details_result:
            return jsonify({"error": "No sales details found for the given Company_Code"}), 404

        # Group tender details by Tender_No
        tender_grouped = defaultdict(list)
        for row in tender_details_result:
            row_dict = dict(row._mapping)
            tender_grouped[row_dict['Tender_No']].append(row_dict)

        # Group sales details by purc_no (linked to Tender_No)
        sales_grouped = defaultdict(list)
        for row in sales_details_result:
            row_dict = dict(row._mapping)
            sales_grouped[row_dict['purc_no']].append(row_dict)

        # Build response structure
        tender_data = []
        do_results = []

        # for tender_no, tenders in tender_grouped.items():
        #     tender_data.append({
        #         "Tender_No": tender_no,
               
        #     })
        #     related_sales = sales_grouped.get(tender_no, [])
        #     for sale in related_sales:
        #         do_results.append(sale)

        response_data = {
            "do_results": do_results,
            "tender_results": tender_grouped,
            "do_count": len(do_results),
            "tender_count": len(tender_data)
        }

        return jsonify(response_data)

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to fetch data due to an error.', 'exception': str(e)}), 500

@app.route(API_URL + '/Newdispatch-details', methods=['GET'])
def Newdispatch_details():
    try:
        # Get query parameters
     
        from_dt = request.args.get("fromDT")
        to_dt = request.args.get("toDT")
      
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")

        # Validate required parameters
        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400

        # Format dates
        from_dt = format_date(from_dt)
        to_dt = format_date(to_dt)

        # Base query for Tender details
        tender_query = """
           SELECT        TOP (100) PERCENT dbo.qrydohead.doc_no, dbo.qrydohead.mill_code, dbo.qrydohead.millshortname AS mill, dbo.qrydohead.FreightPerQtl, dbo.qrydohead.mill_rate AS millrate, dbo.qrydohead.quantal AS qntl, 
                         dbo.qrydohead.shiptoname AS party, dbo.qrydohead.getpassname AS getpass, dbo.qrydohead.truck_no AS lorry, dbo.qrydohead.transportname AS transport, dbo.qrydohead.brokername, dbo.qrydohead.FreightPerQtl AS frieght, 
                         dbo.qrydohead.grade, dbo.qrydohead.sale_rate AS salerate, dbo.qrydohead.purc_no AS tn, dbo.qrydohead.purc_order AS tdn, dbo.qrydohead.DO, dbo.qrydohead.narration1 AS narration, dbo.qrydohead.narration4 AS narr4, 
                         dbo.qrydohead.shiptoname, dbo.qrydohead.Carporate_Sale_No, dbo.qrydohead.memo_no AS refno, dbo.qrydohead.voucher_no AS VN, dbo.qrydohead.voucher_type AS vtype, dbo.qrydohead.FreightPerQtl AS advancefrieght, 
                         dbo.qrydohead.SB_No, dbo.qrydohead.doc_dateConverted, dbo.qrydohead.MM_Rate, dbo.qrydohead.Tender_Commission, dbo.qrydohead.Delivery_Type, dbo.qrydohead.saleid, dbo.qrydohead.doc_dateConverted AS Do_Date, 
                         dbo.qrytenderhead.paymenttoname, dbo.nt_1_sugarsale.TCS_Net_Payable, dbo.nt_1_sugarsale.TCS_Rate, dbo.nt_1_sugarsale.TCS_Amt, dbo.nt_1_sugarsale.Bill_Amount
FROM            dbo.qrydohead LEFT OUTER JOIN
                         dbo.nt_1_sugarsale ON dbo.qrydohead.Year_Code = dbo.nt_1_sugarsale.Year_Code AND dbo.qrydohead.company_code = dbo.nt_1_sugarsale.Company_Code AND 
                         dbo.qrydohead.doc_no = dbo.nt_1_sugarsale.DO_No LEFT OUTER JOIN
                         dbo.qrytenderhead ON dbo.qrydohead.company_code = dbo.qrytenderhead.Company_Code AND dbo.qrydohead.purc_no = dbo.qrytenderhead.Tender_No
                where  dbo.qrydohead.tran_type='DO' and dbo.qrydohead.Delivery_Type !='D'  
             and dbo.qrydohead.purc_no!=0 and dbo.qrydohead.SB_No!=0 and  dbo.qrydohead.company_code = :company_code
              AND dbo.qrydohead.doc_date BETWEEN :from_dt AND :to_dt
             order by dbo.qrydohead.millShortName asc 
           
        """
        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt
        }

        
        # Execute Tender query
        tender_results = db.session.execute(text(tender_query), tender_params).fetchall()

        response = [row._asdict() for row in tender_results]
        return jsonify(response)


        return jsonify(response_data)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# @app.route(API_URL + '/dispatch-detailsForMill', methods=['GET'])
# def dispatch_detailsForMill():
#     try:
#         # Get query parameters
#         mill_code = request.args.get("Mill_Code", "")
#         from_dt = request.args.get("fromDate")
#         to_dt = request.args.get("toDate")
#         lot_no = request.args.get("lotNo", "")
#         sr_no = request.args.get("srNo", "")
#         branch_code = request.args.get("Branch_Code", "")
#         company_code = request.args.get("Company_Code")
#         year_code = request.args.get("Year_Code")

#         # Validate required parameters
#         if not from_dt or not to_dt:
#             return jsonify({"error": "fromDT and toDT are required."}), 400

#         # Format dates
#         from_dt = format_date(from_dt)
#         to_dt = format_date(to_dt)

#         # Base query for DOHead table
#         do_query = """
#             SELECT doc_no AS detail_id, doc_dateConverted as DI_Date, salebillname AS Getpass,
#                    shiptoshortname AS ShippedTo, truck_no, quantal AS DI_Qty,
#                    doshortname AS DI_DO,purc_no, purc_order,tenderdetailid 
#             FROM qrydohead
#             WHERE company_code = :company_code
#               AND Year_Code = :year_code
             
#               AND tran_type = 'DO'  AND desp_type = 'DI'
#         """
#         do_params = {
#             "company_code": company_code,
#             "year_code": year_code,
#             "from_dt": from_dt,
#             "to_dt": to_dt
#         }
#         if sr_no:
#             do_query += " AND purc_order = :sr_no"
#             do_params["sr_no"] = sr_no

#         # Execute DOHead query
#         do_results = db.session.execute(text(do_query), do_params).fetchall()

#         # Base query for Tender details
#         tender_query = """
#             SELECT DISTINCT Tender_No, Tender_DateConverted as Tender_Date , millshortname AS Mill, Mill_Code,
#                             Grade, Quantal, Mill_Rate, convert(varchar(10) ,Lifting_Date,103) as Lifting_Date,  tenderdoname AS Tender_DO,ID,Buyer as BuyerCode,
#                             buyerpartyname as Buyer,Buyer_Quantal as Qty,Sale_Rate as Sale_Rate,tenderdoname as Tender_DO ,Tender_No,tenderdetailid
#             FROM qrytenderheaddetail
#             WHERE company_code = :company_code
#               AND Lifting_Date BETWEEN :from_dt AND :to_dt 
#         """
#         tender_params = {
#             "company_code": company_code,
#             "from_dt": from_dt,
#             "to_dt": to_dt
#         }

#         # Apply conditions for Tender details
#         if mill_code:
#             tender_query += " AND Mill_Code = :mill_code "
#             tender_params["mill_code"] = mill_code

#             if lot_no:
#                 tender_query += " AND Tender_No = :lot_no"
#                 tender_params["lot_no"] = lot_no

#                 if sr_no:
#                     tender_query += " AND ID = :sr_no"
#                     tender_params["sr_no"] = sr_no

#         elif lot_no:
#             tender_query += " AND Tender_No = :lot_no"
#             tender_params["lot_no"] = lot_no

#             if sr_no:
#                 tender_query += " AND ID = :sr_no  and Buyer=2 "
#                 tender_params["sr_no"] = sr_no

#         # Execute Tender query
#         tender_results = db.session.execute(text(tender_query), tender_params).fetchall()

#         # Add Dispatched column to Tender results
#         tender_data = []
#         for row in tender_results:
#             tender_no = row._mapping["Tender_No"]
#             dispatched_query = """
#                 SELECT SUM(Quantal) AS Dispatched
#                 FROM nt_1_deliveryorder
#                 WHERE company_code = :company_code
#                   AND Year_Code = :year_code
#                   AND Purc_No = :tender_no
#                   AND Tran_Type = 'DO'
#             """
#             dispatched = db.session.execute(
#                 text(dispatched_query),
#                 {"company_code": company_code, "year_code": year_code, "tender_no": tender_no}
#             ).scalar() or 0

#             row_data = dict(row._mapping)  # Convert SQLAlchemy row to dictionary
#             row_data["Dispatched"] = dispatched
#             tender_data.append(row_data)

#         # Prepare response
#         response_data = {
#             "do_results": [dict(row._mapping) for row in do_results],  # Convert DOHead rows to list of dictionaries
#             "tender_results": tender_data,
#             "do_count": len(do_results),
#             "tender_count": len(tender_data)
#         }


#         return jsonify(response_data)

#     except Exception as e:
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 500


@app.route(API_URL + '/dispatch-detailsForMill', methods=['GET'])
def dispatch_detailsForMill():
    try:
        mill_code = request.args.get("Mill_Code", "")
        from_dt = request.args.get("fromDate")
        to_dt = request.args.get("toDate")
        lot_no = request.args.get("lotNo", "")
        sr_no = request.args.get("srNo", "")
        branch_code = request.args.get("Branch_Code", "")
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")

        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400

        from_dt = format_date(from_dt)
        to_dt = format_date(to_dt)

        do_query = """
         SELECT        dbo.qrydohead.doc_no AS detail_id, dbo.qrydohead.doc_dateConverted AS DI_Date, dbo.qrydohead.salebillname AS Getpass, dbo.qrydohead.shiptoshortname AS ShippedTo, dbo.qrydohead.truck_no, 
                         dbo.qrydohead.quantal AS DI_Qty, dbo.qrydohead.doshortname AS DI_DO, dbo.qrydohead.purc_no, dbo.qrydohead.purc_order, dbo.qrydohead.tenderdetailid, dbo.nt_1_systemmaster.System_Name_E AS Grade
FROM            dbo.qrydohead LEFT OUTER JOIN
                         dbo.nt_1_systemmaster ON dbo.qrydohead.company_code = dbo.nt_1_systemmaster.Company_Code AND dbo.qrydohead.gradeid = dbo.nt_1_systemmaster.systemid
            WHERE dbo.qrydohead.company_code = :company_code
              AND dbo.qrydohead.Year_Code = :year_code
             
              AND dbo.qrydohead.tran_type = 'DO'  AND dbo.qrydohead.desp_type = 'DI'
        """
        do_params = {
            "company_code": company_code,
            "year_code": year_code,
            "from_dt": from_dt,
            "to_dt": to_dt
        }
        if sr_no:
            do_query += " AND purc_order = :sr_no"
            do_params["sr_no"] = sr_no

        do_results = db.session.execute(text(do_query), do_params).fetchall()

        tender_query = """
            SELECT DISTINCT Tender_No, Tender_DateConverted as Tender_Date , millshortname AS Mill, Mill_Code,
                            Grade, Quantal, Mill_Rate, convert(varchar(10) ,Lifting_Date,103) as Lifting_Date,  tenderdoname AS Tender_DO,ID,Buyer as BuyerCode,
                            buyerpartyname as Buyer,Buyer_Quantal as Qty,Sale_Rate as Sale_Rate,tenderdoname as Tender_DO ,Tender_No,tenderdetailid
            FROM qrytenderheaddetail
            WHERE company_code = :company_code
              AND Tender_Date BETWEEN :from_dt AND :to_dt 
        """
        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt
        }

        where_clauses = []

        if mill_code:
            where_clauses.append("Mill_Code = :mill_code")
            tender_params["mill_code"] = mill_code

        if lot_no:
            where_clauses.append("Tender_No = :lot_no")
            tender_params["lot_no"] = lot_no

        if sr_no:
            where_clauses.append("ID = :sr_no")
            tender_params["sr_no"] = sr_no

        if where_clauses:
            tender_query += " AND " + " AND ".join(where_clauses)

        tender_query += " ORDER BY ID"

        tender_results = db.session.execute(text(tender_query), tender_params).fetchall()

        tender_data = []
        for row in tender_results:
            tender_no = row._mapping["Tender_No"]
            dispatched_query = """
                SELECT SUM(Quantal) AS Dispatched
                FROM nt_1_deliveryorder
                WHERE company_code = :company_code
                  AND Year_Code = :year_code
                  AND Purc_No = :tender_no
                  AND Tran_Type = 'DO'
            """
            dispatched = db.session.execute(
                text(dispatched_query),
                {"company_code": company_code, "year_code": year_code, "tender_no": tender_no}
            ).scalar() or 0

            row_data = dict(row._mapping) 
            row_data["Dispatched"] = dispatched
            tender_data.append(row_data)

        # Prepare response
        response_data = {
            "do_results": [dict(row._mapping) for row in do_results], 
            "tender_results": tender_data,
            "do_count": len(do_results),
            "tender_count": len(tender_data)
        }


        return jsonify(response_data)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route(API_URL + '/DispatchSummary', methods=['GET'])
def DispatchSummary():
    try:
        # Get query parameters
        from_dt = request.args.get("fromDT")
        to_dt = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")

        # Validate required parameters
        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400
        if not company_code or not year_code:
            return jsonify({"error": "Company_Code and Year_Code are required."}), 400

        # Format dates (ensure format_date returns a valid date string)
        from_dt = format_date(from_dt)
        to_dt = format_date(to_dt)

        # Base query
        tender_query = """
            SELECT 
                doc_no AS detail_id,
                doc_dateConverted AS DI_Date,
                salebillname AS Getpass,
                shiptoshortname AS ShippedTo,
                truck_no,
                quantal AS DI_Qty,
                doshortname AS DI_DO,
                purc_no,
                driver_no,
                transportshortname,
                purc_order,
                mill_rate,
                (mill_rate + excise_rate) AS millrateGST,sale_rate,
                billtoshortname,getpassname,
                voucher_no,
                SB_No,
                Eway_Bill_No,
                doc_date,millshortname,purc_no,purc_order,voucher_by,voucherbyname,voucherbyshortname
                voucher_type,grade,mill_code
            FROM qrydohead
            WHERE Company_Code = :company_code
                AND doc_date BETWEEN :from_dt AND :to_dt
                AND tran_type = 'DO'
                AND year_code = :year_code
                AND purc_no != 0
            ORDER BY doc_date
        """

        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt,
            "year_code": year_code
        }

        # Execute query
        tender_results = db.session.execute(text(tender_query), tender_params).fetchall()

        # Convert results to list of dicts
        response = [dict(row._mapping) for row in tender_results]

        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route(API_URL + '/DispatchDiff', methods=['GET'])
def DispatchDiff():
    try:
        # Get query parameters
        from_dt = request.args.get("fromDT")
        to_dt = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")

        # Validate required parameters
        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400
        if not company_code or not year_code:
            return jsonify({"error": "Company_Code and Year_Code are required."}), 400

        # Format dates (ensure format_date returns a valid date string)
        from_dt = format_date(from_dt)
        to_dt = format_date(to_dt)

        # Base query
        tender_query = """
            select doc_dateConverted as tdate,doc_no as tno,getpassname as getpass,millname as mill,voucher_no,voucher_type,quantal as quantal, mill_rate as millrate,
            sale_rate+isnull(Tender_Commission,0) as salerate,brokername as broker ,((sale_rate -mill_rate) *quantal) as amount
            FROM qrydohead
            WHERE Company_Code = :company_code
                AND doc_date BETWEEN :from_dt AND :to_dt
                AND tran_type = 'DO'
                AND year_code = :year_code
                AND purc_no != 0  and desp_type='DO'
            ORDER BY doc_date
        """

        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt,
            "year_code": year_code
        }

        # Execute query
        tender_results = db.session.execute(text(tender_query), tender_params).fetchall()

        # Convert results to list of dicts
        response = [dict(row._mapping) for row in tender_results]

        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route(API_URL + '/DispatchMillWise', methods=['GET'])
def DispatchMillWise():
    try:
        from_dt = request.args.get("fromDT")
        to_dt = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")

        # Validate input
        if not all([from_dt, to_dt, company_code, year_code]):
            return jsonify({"error": "Missing required query parameters."}), 400

        # Format dates if needed
        from_dt = format_date(from_dt)
        to_dt = format_date(to_dt)

        query = """
          SELECT      q.doc_no AS do_no, q.desp_type, q.doc_dateConverted AS do_date, q.quantal, q.mill_rate AS millrate, q.quantal * q.mill_rate AS amount, q.sale_rate AS salerate, q.PurchaseRate, q.paymentshortname, 
                         q.salebillname AS getpass, q.truck_no AS truck, q.mill_code, ISNULL(s.TDS_Amt, 0) AS TDS_Amt, ISNULL(s.CGSTAmount, 0) AS CGSTAmount, ISNULL(s.SGSTAmount, 0) AS SGSTAmount, ISNULL(s.IGSTAmount, 0) 
                         AS IGSTAmount, ISNULL(s.Bill_Amount, 0) AS Bill_Amount, ISNULL(s.TCS_Amt, 0) AS TCS_Amt, ISNULL(s.TCS_Net_Payable, 0) AS TCS_Net_Payable, q.millshortname, q.purc_no, 
                         ISNULL(dbo.nt_1_systemmaster.System_Name_E, q.grade) AS grade
FROM            dbo.qrydohead AS q LEFT OUTER JOIN
                         dbo.nt_1_systemmaster ON q.company_code = dbo.nt_1_systemmaster.Company_Code AND q.gradeid = dbo.nt_1_systemmaster.systemid LEFT OUTER JOIN
                         dbo.nt_1_sugarsale AS s ON q.SB_No = s.doc_no AND q.Year_Code = s.Year_Code AND q.company_code = s.Company_Code AND q.saleid = s.saleid
            WHERE 
                q.tran_type NOT IN ('LV', 'MM')
                AND q.Company_Code = :company_code
                AND q.Year_Code = :year_code
                AND q.doc_date BETWEEN :from_dt AND :to_dt
                AND q.purc_no != 0
            ORDER BY q.doc_no
        """

        params = {
            "company_code": company_code,
            "year_code": year_code,
            "from_dt": from_dt,
            "to_dt": to_dt
        }

        result = db.session.execute(text(query), params).fetchall()
        data = [dict(row._mapping) for row in result]

        return jsonify(data)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    

@app.route(API_URL + '/PartyWiseDO', methods=['GET'])
def PartyWiseDO():
    try:
        # Get query parameters
        from_dt = request.args.get("fromDT")
        to_dt = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")
        acCode = request.args.get("acCode")

        # Validate required parameters
        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400
        if not company_code or not year_code:
            return jsonify({"error": "Company_Code and Year_Code are required."}), 400

        # Format dates safely
        try:
            from_dt = format_date(from_dt)
            to_dt = format_date(to_dt)
        except ValueError as ve:
            return jsonify({"error": f"Invalid date format: {ve}"}), 400

        # Shared SQL part
        base_query = """
            SELECT 
                doc_no AS detail_id,
                doc_dateConverted AS DI_Date,
                salebillname AS Getpass,
                shiptoshortname AS ShippedTo,
                truck_no,
                quantal AS DI_Qty,
                doshortname AS DI_DO,
                purc_no,
                driver_no,
                transportshortname,
                purc_order,
                mill_rate,
                (mill_rate + excise_rate) AS millrateGST,
                sale_rate,
                billtoshortname,
                getpassname,
                voucher_no,
                SB_No,
                Eway_Bill_No,
                doc_date,
                millshortname,
                purc_no,
                purc_order,
                voucher_by,
                voucherbyname,
                voucher_type,
                grade,
                mill_code,
                voucherbyshortname
            FROM qrydohead
            WHERE Company_Code = :company_code
                AND doc_date BETWEEN :from_dt AND :to_dt
                AND tran_type = 'DO'
                AND year_code = :year_code
                AND purc_no != 0
        """

        if acCode:
            base_query += " AND voucher_by = :acCode"

        base_query += " ORDER BY doc_date"

        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt,
            "year_code": year_code
        }
        if acCode:
            tender_params["acCode"] = acCode

        tender_results = db.session.execute(text(base_query), tender_params).fetchall()

        response = [dict(row._mapping) for row in tender_results]

        if not response:
            return jsonify({"message": "No records found for given filters."}), 200

        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
@app.route(API_URL + '/TransportAc-Register', methods=['GET'])
def TransportAc_Register():
    try:
        # Get query parameters
        from_dt = request.args.get("fromDT")
        to_dt = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")
        acCode = request.args.get("acCode")

        # Validate required parameters
        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400
        if not company_code or not year_code:
            return jsonify({"error": "Company_Code and Year_Code are required."}), 400

        # Format dates safely
        try:
            from_dt = format_date(from_dt)
            to_dt = format_date(to_dt)
        except ValueError as ve:
            return jsonify({"error": f"Invalid date format: {ve}"}), 400

        # Shared SQL part
        base_query = """
            select doc_no ,doc_dateConverted as dt,voucherbyshortname as VoucherBy,millshortname as MillShort,truck_no as lorry,quantal as Qntl,Freight_RateMM as Rate,
            Freight_AmountMM as Freight,Paid_Amount1 as Paid1,Paid_Amount2 as Paid2,Paid_Amount3 as Paid3,transport,transportname
           
            from qrydohead 
                where tran_type='DO' and transport!=0   and  Company_Code = :company_code
                AND doc_date BETWEEN :from_dt AND :to_dt
                AND tran_type = 'DO'
                AND year_code = :year_code
                AND purc_no != 0
        """

        # Add conditionally filtered clause
        if acCode:
            base_query += " AND transport = :acCode"

        base_query += " ORDER BY doc_date"

        # Prepare parameters
        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt,
            "year_code": year_code
        }
        if acCode:
            tender_params["acCode"] = acCode

        # Execute query
        tender_results = db.session.execute(text(base_query), tender_params).fetchall()

        # Convert results
        response = [dict(row._mapping) for row in tender_results]

        # Optional: respond with message if empty
        if not response:
            return jsonify({"message": "No records found for given filters."}), 200

        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    


@app.route(API_URL + '/MillWisePurchaseDispatch-Register', methods=['GET'])
def MillWisePurchaseDispatch_Register():
    try:
        # Get query parameters
        from_dt = request.args.get("fromDT")
        to_dt = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")
        acCode = request.args.get("acCode")

        # Validate required parameters
        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400
        if not company_code or not year_code:
            return jsonify({"error": "Company_Code and Year_Code are required."}), 400

        # Format dates safely
        try:
            from_dt = format_date(from_dt)
            to_dt = format_date(to_dt)
        except ValueError as ve:
            return jsonify({"error": f"Invalid date format: {ve}"}), 400

        # Shared SQL part
        base_query = """
            select *
            from qrypurchaseheaddetail 
                where  Company_Code = :company_code
                AND doc_date BETWEEN :from_dt AND :to_dt
               
                AND year_code = :year_code
                AND PURCNO != 0
        """

        # Add conditionally filtered clause
        if acCode:
            base_query += " AND mill_code = :acCode"

        base_query += " ORDER BY doc_date"

        # Prepare parameters
        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt,
            "year_code": year_code
        }
        if acCode:
            tender_params["acCode"] = acCode

        # Execute query
        tender_results = db.session.execute(text(base_query), tender_params).fetchall()

        # Convert results
        response = [dict(row._mapping) for row in tender_results]

        # Optional: respond with message if empty
        if not response:
            return jsonify({"message": "No records found for given filters."}), 200

        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route(API_URL + '/MillpaymentForGST-Register', methods=['GET'])
def MillpaymentForGST_Register():
    try:
        from_dt = request.args.get("fromDT")
        to_dt = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")
        acCode = request.args.get("acCode")

        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400
        if not company_code or not year_code:
            return jsonify({"error": "Company_Code and Year_Code are required."}), 400

        try:
            from_dt = format_date(from_dt)
            to_dt = format_date(to_dt)
        except ValueError as ve:
            return jsonify({"error": f"Invalid date format: {ve}"}), 400

        base_query = """
            SELECT Payment_To,paymentshortname,
                   SUM(quantal) AS qtl,
                   mill_rate,
                   excise_rate AS gst_rate,
                   (mill_rate + excise_rate) AS totalmillrate,
                   CAST((SUM(quantal) * (mill_rate + excise_rate)) AS NUMERIC(18,2)) AS millamount,
                   ISNULL(TCS_Rate,0) AS TCS_Rate,
                   (CAST((SUM(quantal) * (mill_rate + excise_rate)) AS NUMERIC(18,2)) * ISNULL(TCS_Rate,0) / 100) AS TCSAmt,
                   ISNULL(PurchaseTDSRate,0) AS TDSRate,
                   (CAST((SUM(quantal) * mill_rate) AS NUMERIC(18,2)) * ISNULL(PurchaseTDSRate,0) / 100) AS TDSAmt,
                   (CAST((SUM(quantal) * (mill_rate + excise_rate)) AS NUMERIC(18,2)) + 
                    (CAST((SUM(quantal) * (mill_rate + excise_rate)) AS NUMERIC(18,2)) * ISNULL(TCS_Rate,0) / 100) -
                    (CAST((SUM(quantal) * mill_rate) AS NUMERIC(18,2)) * ISNULL(PurchaseTDSRate,0) / 100)) AS TCSNetPayable
            FROM qrydohead
            WHERE purc_no != 0
              AND doc_date BETWEEN :from_dt AND :to_dt
              AND company_code = :company_code
              AND Year_Code = :year_code
              AND Payment_To <> ''
        """

        if acCode:
            base_query += " AND Payment_To = :acCode"

        base_query += """
            GROUP BY mill_rate, excise_rate, TCS_Rate, PurchaseTDSRate, amount, TDSAmt, doc_no, Payment_To,paymentshortname
        """

        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt,
            "year_code": year_code
        }

        if acCode:
            tender_params["acCode"] = acCode

        tender_results = db.session.execute(text(base_query), tender_params).fetchall()
        tender_data = [dict(row._mapping) for row in tender_results]

        # Now for each Payment_To in tender_data, get Balance from NT_1_GLEDGER
        base_query1 = """
            SELECT SUM(CASE DRCR WHEN 'D' THEN AMOUNT WHEN 'C' THEN -AMOUNT END) AS Balance
            FROM NT_1_GLEDGER
            WHERE AC_CODE = :accode AND COMPANY_CODE = :company_code AND YEAR_CODE <= :year_code
            GROUP BY AC_CODE
        """

        for row in tender_data:
            accode = row["Payment_To"]
            balance_params = {
                "accode": accode,
                "company_code": company_code,
                "year_code": year_code
            }
            balance_result = db.session.execute(text(base_query1), balance_params).fetchone()
            row["Balance"] = float(balance_result[0]) if balance_result else 0.0

        if not tender_data:
            return jsonify({"message": "No records found for given filters."}), 200

        return jsonify(tender_data)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    

@app.route(API_URL + '/CategoryWiseDispatch-Register', methods=['GET'])
def CategoryWiseDispatch_Register():
    try:
        from_dt = request.args.get("fromDT")
        to_dt = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")
       
        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400
        if not company_code or not year_code:
            return jsonify({"error": "Company_Code and Year_Code are required."}), 400

        try:
            from_dt = format_date(from_dt)
            to_dt = format_date(to_dt)
        except ValueError as ve:
            return jsonify({"error": f"Invalid date format: {ve}"}), 400

        base_query = """
            select *
            from qrydohead 
                where tran_type='DO'   and  Company_Code = :company_code
                AND doc_date BETWEEN :from_dt AND :to_dt
                AND tran_type = 'DO'
                AND year_code = :year_code
                AND purc_no != 0
        """

        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt,
            "year_code": year_code
        }
        
        tender_results = db.session.execute(text(base_query), tender_params).fetchall()

        response = [dict(row._mapping) for row in tender_results]

        if not response:
            return jsonify({"message": "No records found for given filters."}), 200

        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500







@app.route(API_URL + '/daliy_sudaDispach', methods=['GET'])
def DailySudaDispatch_Register():
    try:
        from_dt = request.args.get("fromDT")
        to_dt = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        year_code = request.args.get("Year_Code")

        # Validation
        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400

        if not company_code or not year_code:
            return jsonify({"error": "Company_Code and Year_Code are required."}), 400

        try:
            from_dt = format_date(from_dt)
            to_dt = format_date(to_dt)
        except ValueError as ve:
            return jsonify({"error": f"Invalid date format: {ve}"}), 400

        base_query = """
            SELECT
                am.Short_Name,
                do.grade,
                do.quantal AS desp,
                td.Buyer_Quantal AS saudaqntl,
                td.Sauda_Date,
                buyer.Ac_Name_E,
                td.Tender_No,
                td.tenderdetailid
            FROM dbo.nt_1_deliveryorder do
            INNER JOIN dbo.nt_1_tenderdetails td
                ON do.tenderdetailid = td.tenderdetailid
            INNER JOIN dbo.nt_1_tender t
                ON do.tenderid = t.tenderid
            INNER JOIN dbo.nt_1_accountmaster am
                ON t.mc = am.accoid
            INNER JOIN dbo.nt_1_accountmaster buyer
                ON td.buyerid = buyer.accoid
            WHERE
                do.doc_date BETWEEN :from_dt AND :to_dt
                AND do.desp_type = 'DI'
                AND do.Company_Code = :company_code
                AND do.Year_Code = :year_code
            ORDER BY
                td.Sauda_Date DESC,
                am.Short_Name,
                td.tenderdetailid
        """

        params = {
            "from_dt": from_dt,
            "to_dt": to_dt,
            "company_code": company_code,
            "year_code": year_code
        }

        result = db.session.execute(text(base_query), params)
        rows = result.fetchall()

        response = [dict(row._mapping) for row in rows]

        if not response:
            return jsonify({"message": "No records found for given filters."}), 200

        return jsonify(response), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



