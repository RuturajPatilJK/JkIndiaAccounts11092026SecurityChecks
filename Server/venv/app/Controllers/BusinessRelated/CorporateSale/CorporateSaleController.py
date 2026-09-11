import traceback
from flask import Flask, jsonify, request
from app import app, db

from app.models.Reports.GLedeger.GLedgerModels import Gledger
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
import requests

from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getSaleAc,get_acShort_Name,create_gledger_entry,send_gledger_entries
from flask_socketio import SocketIO
from datetime import datetime
from app.utils.CommonCompanyLogs.CompanyLogsUtils import create_company_log_entry
from decimal import Decimal
import threading
# Get the base URL from environment variables

API_URL= os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')

# Import schemas from the schemas module
from app.models.BusinessReleted.CorporateSale.CorporateSaleModel import CorporateSaleHead, CorporateSaleDetail
from app.models.BusinessReleted.CorporateSale.CorporateSaleSchema import CorporateSaleHeadSchema, CorporateSaleDetailSchema

# Global SQL Query
CORPORATE_DETAILS_QUERY = '''
    SELECT        accode.Ac_Name_E AS partyname, unit.Ac_Name_E AS unitname, broker.Ac_Name_E AS brokername, billto.Ac_Name_E AS billtoname, dbo.carporatedetail.scheduale_qntl, dbo.carporatedetail.schedule_date, 
                         dbo.carporatedetail.transit_days, dbo.carporatedetail.carpdetailid, CONVERT(VARCHAR(10), DATEADD(day, - dbo.carporatedetail.transit_days, dbo.carporatedetail.schedule_date), 103) AS remind_date
FROM            dbo.carporatedetail RIGHT OUTER JOIN
                         dbo.nt_1_accountmaster AS unit RIGHT OUTER JOIN
                         dbo.carporatehead ON unit.accoid = dbo.carporatehead.uc ON dbo.carporatedetail.carpid = dbo.carporatehead.carpid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS broker ON dbo.carporatehead.br = broker.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS billto ON dbo.carporatehead.bt = billto.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS accode ON dbo.carporatehead.ac = accode.accoid
                         WHERE dbo.carporatehead.carpid = :carpid
'''

# Define schemas
corporate_head_schema = CorporateSaleHeadSchema()
corporate_head_schemas = CorporateSaleHeadSchema(many=True)

corporate_detail_schema = CorporateSaleDetailSchema()
corporate_detail_schemas = CorporateSaleDetailSchema(many=True)

def format_dates(task):
    return {
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
       # "schedule_date": task.schedule_date.strftime('%Y-%m-%d') if task.schedule_date else None,
       
    }
def format_date(date_str):
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").strftime("%Y-%m-%d")
    except ValueError:
        return date_str
# Get data from both tables CorporateHead and CorporateDetail
@app.route(API_URL + "/getdata-corporate", methods=["GET"])
def getdata_corporate():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        query = ('''select doc_no,doc_date,selling_type,sell_rate,remark,carporatepartyaccountname,carporatepartybrokername,carpid,
                 carporatepartyunitname,DeliveryType,pono,quantal
                  from qrycarporatehead
                 where Company_Code = :company_code  order by doc_no desc
                                 '''
            )
        additional_data = db.session.execute(text(query), {"company_code": company_code, "year_code": year_code})

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

# Get data by the particular doc_no
@app.route(API_URL + "/getcorporateSaleByid", methods=["GET"])
def getcorporateByid():
    try:
        # Extract doc_no and company_code from request query parameters
        carpid = request.args.get('carpid')
        company_code = request.args.get('Company_Code')
    

        if not all([carpid, company_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        corporate_head = CorporateSaleHead.query.filter_by(carpid=carpid, company_code=company_code).first()

        if not corporate_head:
            return jsonify({"error": "No records found"}), 404

        carpid = corporate_head.carpid
        additional_data = db.session.execute(text(CORPORATE_DETAILS_QUERY), {"carpid": carpid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        last_head_data = {column.name: getattr(corporate_head, column.name) for column in corporate_head.__table__.columns}
        last_head_data.update(format_dates(corporate_head))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Fetch the last record from the database by carpid
@app.route(API_URL + "/get-lastcorporatedata", methods=["GET"])
def get_lastcorporatedata():
    try:
        company_code = request.args.get('Company_Code')

        if not all([company_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_corporate_head = CorporateSaleHead.query.filter_by(company_code=company_code).order_by(CorporateSaleHead.doc_no.desc()).first()

        if not last_corporate_head:
            return jsonify({"error": "No records found"}), 404

        carpid = last_corporate_head.carpid
        additional_data = db.session.execute(text(CORPORATE_DETAILS_QUERY), {"carpid": carpid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        last_head_data = {column.name: getattr(last_corporate_head, column.name) for column in last_corporate_head.__table__.columns}
        last_head_data.update(format_dates(last_corporate_head))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }       
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get first record from the database
@app.route(API_URL + "/get-firstcorporate-navigation", methods=["GET"])
def get_firstcorporate_navigation():
    try:
        company_code = request.args.get('Company_Code')
    
        if not all([company_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        first_corporate_head = CorporateSaleHead.query.filter_by(company_code=company_code).order_by(CorporateSaleHead.doc_no.asc()).first()

        if not first_corporate_head:
            return jsonify({"error": "No records found"}), 404

        carpid = first_corporate_head.carpid
        additional_data = db.session.execute(text(CORPORATE_DETAILS_QUERY), {"carpid": carpid})
        additional_data_rows = additional_data.fetchall()

        corporate_head_data = {column.name: getattr(first_corporate_head, column.name) for column in first_corporate_head.__table__.columns}
        corporate_head_data.update(format_dates(first_corporate_head))

       
        row = additional_data_rows[0] if additional_data_rows else None

        first_head_data = {column.name: getattr(first_corporate_head, column.name) for column in first_corporate_head.__table__.columns}
        first_head_data.update(format_dates(first_corporate_head))

        first_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "first_head_data": first_head_data,
            "first_details_data": first_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get previous record from the database
@app.route(API_URL + "/get-previouscorporate-navigation", methods=["GET"])
def get_previouscorporate_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        company_code = request.args.get('Company_Code')
        

        if not all([current_doc_no, company_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        previous_corporate_head = CorporateSaleHead.query.filter(CorporateSaleHead.doc_no < current_doc_no).filter_by(company_code=company_code).order_by(CorporateSaleHead.doc_no.desc()).first()

        if not previous_corporate_head:
            return jsonify({"error": "No previous records found"}), 404

        carpid = previous_corporate_head.carpid
        additional_data = db.session.execute(text(CORPORATE_DETAILS_QUERY), {"carpid": carpid})
        additional_data_rows = additional_data.fetchall()

        corporate_head_data = {column.name: getattr(previous_corporate_head, column.name) for column in previous_corporate_head.__table__.columns}
        corporate_head_data.update(format_dates(previous_corporate_head))

        row = additional_data_rows[0] if additional_data_rows else None
        previous_head_data = {column.name: getattr(previous_corporate_head, column.name) for column in previous_corporate_head.__table__.columns}
        previous_head_data.update(format_dates(previous_corporate_head))

        previous_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "previous_head_data": previous_head_data,
            "previous_details_data": previous_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get next record from the database
@app.route(API_URL + "/get-nextcorporate-navigation", methods=["GET"])
def get_nextcorporate_navigation():
    try:
        current_doc_no = request.args.get('current_doc_no')
        company_code = request.args.get('company_code')
        

        if not all([current_doc_no, company_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        next_corporate_head = CorporateSaleHead.query.filter(CorporateSaleHead.doc_no > current_doc_no).filter_by(company_code=company_code).order_by(CorporateSaleHead.doc_no.asc()).first()

        if not next_corporate_head:
            return jsonify({"error": "No next records found"}), 404

        carpid = next_corporate_head.carpid
        additional_data = db.session.execute(text(CORPORATE_DETAILS_QUERY), {"carpid": carpid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        next_head_data = {column.name: getattr(next_corporate_head, column.name) for column in next_corporate_head.__table__.columns}
        next_head_data.update(format_dates(next_corporate_head))

        next_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Prepare response data
        response = {
            "next_head_data": next_head_data,
            "next_details_data": next_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Insert record for CorporateHead and CorporateDetail
@app.route(API_URL + "/insert-corporate", methods=["POST"])
def insert_corporate():
    def get_max_doc_no():
        return db.session.query(func.max(CorporateSaleHead.doc_no)).scalar() or 0
    try:


        data = request.get_json()
        head_data = data['headData']
        detail_data = data['detailData']


        max_doc_no = get_max_doc_no()
        new_doc_no = max_doc_no + 1
        head_data['doc_no'] = new_doc_no

        new_head = CorporateSaleHead(**head_data)
        db.session.add(new_head)

        created_details = []
        updated_details = []
        deleted_detail_ids = []
        
        for item in detail_data:
            item['doc_no'] = new_doc_no
            item['carpid'] = new_head.carpid
            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    new_detail = CorporateSaleDetail(**item)
                    new_head.details.append(new_detail)
                    created_details.append(new_detail)


                elif item['rowaction'] == "update":
                    carpdetailid = item['carpdetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('carpdetailid', 'rowaction', 'carpid')}
                    db.session.query(CorporateSaleDetail).filter(CorporateSaleDetail.carpdetailid == carpdetailid).update(update_values)
                    updated_details.append(carpdetailid)

                elif item['rowaction'] == "delete":
                    carpdetailid = item['carpdetailid']
                    detail_to_delete = db.session.query(CorporateSaleDetail).filter(CorporateSaleDetail.carpdetailid == carpdetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deleted_detail_ids.append(carpdetailid)

        

        db.session.commit()

        corporate_head_schema = CorporateSaleHeadSchema()
        corporate_detail_schema = CorporateSaleDetailSchema(many=True)
            
        return jsonify({
            "message": "Data Inserted successfully",
            "head": corporate_head_schema.dump(new_head),
            "added_details": corporate_detail_schema.dump(created_details),
            "updatedDetails": updated_details,
            "deletedDetailIds": deleted_detail_ids
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Update record for CorporateHead and CorporateDetail
@app.route(API_URL + "/update-corporate", methods=["PUT"])
def update_corporate():
    try:
        carpid = request.args.get('carpid')
        if not carpid:
            return jsonify({"error": "Missing 'carpid' parameter"}), 400

        data = request.get_json()
        head_data = data['headData']
        detail_data = data['detailData']

        # Update the head data
        db.session.query(CorporateSaleHead).filter(CorporateSaleHead.carpid == carpid).update(head_data)
        updated_head = CorporateSaleHead.query.filter_by(carpid=carpid).first()
        updated_head_doc_no = updated_head.doc_no

        created_details = []
        updated_details = []
        deleted_detail_ids = []

        for item in detail_data:
            item['carpid'] = updated_head.carpid

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['doc_no'] = updated_head_doc_no
                    new_detail = CorporateSaleDetail(**item)
                    db.session.add(new_detail)
                    created_details.append(new_detail)

                elif item['rowaction'] == "update":
                    carpdetailid = item['carpdetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('carpdetailid', 'rowaction', 'carpid')}
                    db.session.query(CorporateSaleDetail).filter(CorporateSaleDetail.carpdetailid == carpdetailid).update(update_values)
                    updated_details.append(carpdetailid)

                elif item['rowaction'] == "delete":
                    carpdetailid = item['carpdetailid']
                    detail_to_delete = db.session.query(CorporateSaleDetail).filter(CorporateSaleDetail.carpdetailid == carpdetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deleted_detail_ids.append(carpdetailid)

        db.session.commit()

        return jsonify({
            "message": "Data updated successfully",
            "head": corporate_head_schema.dump(updated_head),
            "created_details": corporate_detail_schemas.dump(created_details),
            "updated_details": updated_details,
            "deleted_detail_ids": deleted_detail_ids
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#GET Next Doc_no from database
@app.route(API_URL + "/get-next-doc-no-carp", methods=["GET"])
def get_next_doc_no_carp():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        max_doc_no = db.session.query(func.max(CorporateSaleHead.doc_no)).filter_by(company_code=company_code).scalar()
        next_doc_no = max_doc_no + 1 if max_doc_no else 1
        response = {
            "next_doc_no": next_doc_no
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Delete record from database based on carpid
@app.route(API_URL + "/delete_data_by_carpid", methods=["DELETE"])
def delete_data_by_carpid():
    try:
        carpid = request.args.get('carpid')
        company_code = request.args.get('Company_Code')
    

        if not all([carpid, company_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        # Start a transaction
        with db.session.begin():
            # Delete records from CorporateDetail table
            deleted_detail_rows = CorporateSaleDetail.query.filter_by(carpid=carpid).delete()

            # Delete record from CorporateHead table
            deleted_head_rows = CorporateSaleHead.query.filter_by(carpid=carpid).delete()

        # Commit the transaction 
        db.session.commit()

        return jsonify({
            "message": f"Deleted {deleted_head_rows} head row(s) and {deleted_detail_rows} detail row(s) successfully"
        }), 200

    except Exception as e:
        # Roll back the transaction if any error occurs
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL+"/CarporateBillByDocNo", methods=["GET"])
def CarporateBillByDocNo():
    try:
        doc_no = request.args.get('doc_no')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code, doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        saleBill_head = CorporateSaleHead.query.filter_by(doc_no=doc_no,company_code=Company_Code).first()

        newsaleid = saleBill_head.carpid

        additional_data = db.session.execute(text(CORPORATE_DETAILS_QUERY), {"carpid": newsaleid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        last_head_data = {column.name: getattr(saleBill_head, column.name) for column in saleBill_head.__table__.columns}
        last_head_data.update(format_dates(saleBill_head))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

    
@app.route(API_URL + '/CarporateSaleBalance-Register', methods=['GET'])
def CarporateSaleBalance_Register():
    try:
        # Get query parameters
        from_dt = request.args.get("fromDT")
        to_dt = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
       
        acCode = request.args.get("acCode")

        # Validate required parameters
        if not from_dt or not to_dt:
            return jsonify({"error": "fromDT and toDT are required."}), 400
        if not company_code :
            return jsonify({"error": "Company_Code and Year_Code are required."}), 400

        # Format dates safely
        try:
            from_dt = format_date(from_dt)
            to_dt = format_date(to_dt)
        except ValueError as ve:
            return jsonify({"error": f"Invalid date format: {ve}"}), 400

        # Shared SQL part
        base_query = """
           select  doc_no,doc_dateConverted as Doc_Date,carporatepartyunitname as Unit,sell_rate as Sale_Rate, pono as podetail, quantal as Qntl, dispatched as desp ,
            carporatepartyaccountname as Party,ac_code as Party_Code
                FROM qrycarporatedobalance
            WHERE Company_Code = :company_code
                AND Doc_Date BETWEEN :from_dt AND :to_dt
              
        """

        if acCode:
            base_query += " AND ac_code = :acCode"

        base_query += " ORDER BY doc_date"

        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt,
           
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
       

# @app.route(API_URL + '/CarporateSaleDetail-Register', methods=['GET'])
# def CarporateSaleDetail_Register():
#     try:
#         # Get query parameters
#         from_dt = request.args.get("fromDT")
#         to_dt = request.args.get("toDT")
#         company_code = request.args.get("Company_Code")
#         acCode= request.args.get("acCode")
#         lotno= request.args.get("lotno")
#         PDS=request.args.get('accountType')
#         # Validate required parameters
#         if not from_dt or not to_dt:
#             return jsonify({"error": "fromDT and toDT are required."}), 400
#         if not company_code :
#             return jsonify({"error": "Company_Code and Year_Code are required."}), 400

#         # Format dates (ensure format_date returns a valid date string)
#         # from_dt = format_date(from_dt)
#         # to_dt = format_date(to_dt)

#         # Base query
#         tender_query = """
#             SELECT  doc_no AS CSNo, dodate AS DODate,doc_date, doqntl AS DODesp, millshortname AS DOMill, remark, carporatepartyaccountname,  truck_no AS DOLorryNo,
#  Freight_Amount AS DOFrt, transportname AS DOTransport, salebillname AS DOGetpass,voucher_no AS VN,  voucher_type AS VT,  dono AS MM, SB_No AS SB, shiptoname AS shiptoshortname,
#  vasuli_amount + FreightPerQtl AS Addition,carpid,dono as dispatchno,ASN_No ,doc_dateConverted as CSDate,carporatepartyunitname as CSUnitName,pono as CSPodetails,
#  sell_rate as CSSaleRate,quantal as CSQntl
#  FROM qrycarporatedodetail  
#             WHERE Company_Code = :company_code
#                 AND doc_date BETWEEN :from_dt AND :to_dt
#                and Carporate_Sale_No!=0 and selling_type=:PDS
            
#         """

#         tender_params = {
#             "company_code": company_code,
#             "from_dt": from_dt,
#             "to_dt": to_dt,
#             "PDS" : PDS
#         }
#         if acCode:
#             tender_query += " AND acCode = :acCode"
#         if lotno:
#             tender_query += " AND Doc_No = :lotno"

       
#         # Execute query
#         tender_results = db.session.execute(text(tender_query), tender_params).fetchall()

#         # Convert results to list of dicts
#         response = [dict(row._mapping) for row in tender_results]

#         return jsonify(response)

#     except Exception as e:
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 500

@app.route(API_URL + '/CarporateSaleDetail-Register', methods=['GET'])
def CarporateSaleDetail_Register():
    try:
        # Get and validate query parameters
        from_dt_str = request.args.get("fromDT")
        to_dt_str = request.args.get("toDT")
        company_code = request.args.get("Company_Code")
        acCode = request.args.get("acCode")
        lotno = request.args.get("lotNo")
        PDS = request.args.get("accountType")

        # Validation
        if not from_dt_str or not to_dt_str:
            return jsonify({"error": "fromDT and toDT are required in YYYY-MM-DD or YYYY/MM/DD format."}), 400
        if not company_code:
            return jsonify({"error": "Company_Code is required."}), 400

        # Parse date safely — allow YYYY-MM-DD or YYYY/MM/DD
        def parse_date_safe(date_str):
            for fmt in ("%Y-%m-%d", "%Y/%m/%d"):
                try:
                    return datetime.strptime(date_str, fmt).date()
                except ValueError:
                    continue
            raise ValueError("Invalid date format.")

        try:
            from_dt = parse_date_safe(from_dt_str)
            to_dt = parse_date_safe(to_dt_str)
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD or YYYY/MM/DD."}), 400

        # SQL query
        tender_query = """
            SELECT
                doc_no AS CSNo,
                convert(varchar(30),dodate,103) AS DODate,
                convert(varchar(30),doc_date,103) as doc_date,
                doqntl AS DODesp,
                millshortname AS DOMill,
                remark,
                carporatepartyaccountname,
                truck_no AS DOLorryNo,
                Freight_Amount AS DOFrt,
                transportname AS DOTransport,
                salebillname AS DOGetpass,
                voucher_no AS VN,
                voucher_type AS VT,
                dono AS MM,
                SB_No AS SB,
                shiptoname AS shiptoshortname,
                vasuli_amount + FreightPerQtl AS Addition,
                carpid,
                dono AS dispatchno,
                ASN_No,
                doc_dateConverted AS CSDate,
                carporatepartyunitname AS CSUnitName,
                pono AS CSPodetails,
                sell_rate AS CSSaleRate,
                quantal AS CSQntl
            FROM qrycarporatedodetail  
            WHERE Company_Code = :company_code
              AND doc_date BETWEEN :from_dt AND :to_dt
              AND Carporate_Sale_No != 0
              AND selling_type = :PDS
        """

        # SQL parameters
        tender_params = {
            "company_code": company_code,
            "from_dt": from_dt,
            "to_dt": to_dt,
            "PDS": PDS
        }

        # Optional filters
        if acCode:
            tender_query += " AND acCode = :acCode"
            tender_params["acCode"] = acCode

        if lotno:
            tender_query += " AND Doc_No = :lotno"
            tender_params["lotno"] = lotno

        # Execute query
        tender_results = db.session.execute(text(tender_query), tender_params).fetchall()

        # Format results as list of dicts
        response = [dict(row._mapping) for row in tender_results]

        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500