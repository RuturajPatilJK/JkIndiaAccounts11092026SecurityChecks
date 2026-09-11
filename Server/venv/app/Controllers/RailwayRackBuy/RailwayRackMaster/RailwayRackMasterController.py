import traceback
from flask import Flask, jsonify, request
from app import app, db
from app.models.Outword.SaleBill.SaleBillModels import SaleBillHead,SaleBillDetail
from app.models.RailwayRackBuy.RailwayRackMaster.RailwayRackMasterModel import RailHead, RailDetail
from app.models.Reports.GLedeger.GLedgerModels import Gledger
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
import requests
from app.models.Outword.SaleBill.SaleBillSchema import SaleBillDetailSchema, SaleBillHeadSchema
from app.models.RailwayRackBuy.RailwayRackMaster.RailwayRackMasterSchema import RailHeadSchema, RailDetailSchema
from flask_socketio import SocketIO
from datetime import datetime
from decimal import Decimal
import threading

API_URL= os.getenv('API_URL')
API_URL_SERVER = os.getenv('API_URL_SERVER')

# Define schemas
Rail_head_schema = RailHeadSchema()
Rail_head_schemas = RailHeadSchema(many=True)

Rail_detail_schema = RailDetailSchema()
Rail_detail_schemas = RailDetailSchema(many=True)


#Common Query to GET the all lable from the database
TASK_DETAILS_QUERY = '''
SELECT dbo.RailShedDetail.Raildetailid, dbo.RailShedDetail.Doc_No, dbo.RailShedDetail.ac, dbo.nt_1_accountmaster.Ac_Name_E, dbo.RailShedDetail.Local_Exp, dbo.RailShedDetail.Ac_Code, dbo.RailShedHead.RailId, 
                  dbo.RailShedDetail.detail_id
FROM     dbo.nt_1_accountmaster RIGHT OUTER JOIN
                  dbo.RailShedDetail ON dbo.nt_1_accountmaster.accoid = dbo.RailShedDetail.ac RIGHT OUTER JOIN
                  dbo.RailShedHead ON dbo.RailShedDetail.RailId = dbo.RailShedHead.RailId
WHERE   dbo.RailShedHead.RailId=:RailId
'''

# #Format Dated
# def format_dates(task):
#     return {
#         "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
#         "newsbdate": task.newsbdate.strftime('%Y-%m-%d') if task.newsbdate else None,
#         "EwayBillValidDate": task.EwayBillValidDate.strftime('%Y-%m-%d') if task.EwayBillValidDate else None,
#         "EwbDt": task.EwbDt.strftime('%Y-%m-%d') if task.EwbDt else None,
#     }
#GET Next Doc_no from database
@app.route(API_URL + "/get-next-doc-no-RackRailway", methods=["GET"])
def get_next_doc_no_RackRailway():
    
    try:
        max_doc_no = db.session.query(func.max(RailHead.Doc_No)).scalar()
        next_doc_no = max_doc_no + 1 if max_doc_no else 1
        response = {
            "next_doc_no": next_doc_no
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# # We have to get the data By the Particular Id 
@app.route(API_URL+"/RackRailwayByRailid", methods=["GET"])
def getRackRailwayByRailid():
    try:
        RailId = request.args.get('RailId')
        if not all([RailId]):
            return jsonify({"error": "Missing required parameters"}), 400

        rail_head = RailHead.query.filter_by(RailId=RailId).first()

        newraild = rail_head.RailId

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"RailId": newraild})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        last_head_data = {column.name: getattr(rail_head, column.name) for column in rail_head.__table__.columns}
        # last_head_data.update(format_dates(rail_head))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get data from both tables SaleBill and SaleBilllDetail
@app.route(API_URL+"/getdata-RailwayRack", methods=["GET"])
def getdata_RailwayRack():
    try:

        query = ('''SELECT dbo.RailShedHead.RailId, dbo.RailShedHead.Doc_No, dbo.RailShedHead.RailwayStation_Name, dbo.RailShedDetail.Ac_Code, dbo.RailShedDetail.ac, dbo.nt_1_accountmaster.Ac_Name_E, 
                  dbo.RailShedDetail.Local_Exp, dbo.RailShedHead.Address, dbo.RailShedHead.City, dbo.RailShedHead.Pincode
FROM     dbo.nt_1_accountmaster RIGHT OUTER JOIN
                  dbo.RailShedDetail ON dbo.nt_1_accountmaster.accoid = dbo.RailShedDetail.ac RIGHT OUTER JOIN
                  dbo.RailShedHead ON dbo.RailShedDetail.RailId = dbo.RailShedHead.RailId
                  order by dbo.RailShedHead.Doc_No desc
                                 '''
            )
        additional_data = db.session.execute(text(query))

        additional_data_rows = additional_data.fetchall()
        
        all_data = [dict(row._mapping) for row in additional_data_rows]

        # for data in all_data:
        #     if 'doc_date' in data:
        #         data['doc_date'] = data['doc_date'].strftime('%Y-%m-%d') if data['doc_date'] else None
 
        response = {
            "all_data": all_data
        }

        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500




@app.route(API_URL+"/RailByDocNo", methods=["GET"])
def RailByDocNo():
    try:
        Doc_No = request.args.get('Doc_No')
        
        if not all([Doc_No]):
            return jsonify({"error": "Missing required parameters"}), 400

        rail_head = RailHead.query.filter_by(Doc_No=Doc_No).first()

        newrailid = rail_head.RailId

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"RailId": newrailid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        last_head_data = {column.name: getattr(rail_head, column.name) for column in rail_head.__table__.columns}
        # last_head_data.update(format_dates(rail_head))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/insert-RailShed", methods=["POST"])
def insert_RailShed():

    try:
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']

        # new_doc_no = 0
        # dono = headData.get('DO_No')

        max_doc_no = db.session.query(func.max(RailHead.Doc_No)).scalar() or 0
        new_doc_no = max_doc_no + 1
        headData['Doc_No'] = new_doc_no

        new_head = RailHead(**headData)
        db.session.add(new_head)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        headData['RailId'] = new_head.RailId

        for item in detailData:
            item['Doc_No'] = new_doc_no
            item['RailId'] = new_head.RailId

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    new_detail = RailDetail(**item)
                    new_head.details.append(new_detail)
                    createdDetails.append(new_detail)

                elif item['rowaction'] == "update":
                    Raildetailid = item['Raildetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('Raildetailid', 'rowaction', 'RailId')}
                    db.session.query(RailDetail).filter(RailDetail.Raildetailid == Raildetailid).update(update_values)
                    updatedDetails.append(Raildetailid)

                elif item['rowaction'] == "delete":
                    Raildetailid = item['Raildetailid']
                    detail_to_delete = db.session.query(RailDetail).filter(RailDetail.Raildetailid == Raildetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(Raildetailid)

        db.session.commit()

        return jsonify({
            "message": "Data Inserted successfully",
            "head": Rail_head_schema.dump(new_head),
            "addedDetails": Rail_detail_schemas.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except  Exception as e:
        print("Trackback", traceback.format_exc())


    

#Update Record and Gldger Effects of SaleBill and SaleBill
@app.route(API_URL + "/update-RailShed", methods=["PUT"])
def update_RailShed():     
    try:
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']
        # dono=headData['DO_No']
        # doc_no=headData['Doc_No']
        # if dono!=0  :
        #     if doc_no == 0 :
        #         headData['doc_no'] = 0
        #         updateddoc_no = 0

        RailId = request.args.get('RailId')
        if RailId is None:
            return jsonify({"error": "Missing 'RailId' parameter"}), 400
    

        existing_head = RailHead.query.filter_by(RailId=RailId).first()

        if not existing_head:
            return jsonify({"error": "SaleBillHead with the given SaleBillHead not found"}), 404

        updatedHeadCount = db.session.query(RailHead).filter(RailHead.RailId == RailId).update(headData)
        updated_debit_head = db.session.query(RailHead).filter(RailHead.RailId == RailId).one()
        updateddoc_no = updated_debit_head.Doc_No
        updatedRailid = updated_debit_head.RailId

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []
        # dono=headData['DO_No']
        for item in detailData:
            item['RailId'] = updated_debit_head.RailId

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['Doc_No'] = updateddoc_no
                    new_detail = RailDetail(**item)
                    updated_debit_head.details.append(new_detail)
                    createdDetails.append(new_detail)

                elif item['rowaction'] == "update":
                    Raildetailid = item['Raildetailid']                  
                    update_values = {k: v for k, v in item.items() if k not in ('Raildetailid', 'rowaction', 'RailId')}
                    db.session.query(RailDetail).filter(RailDetail.RailId == RailId).update(update_values)
                    updatedDetails.append(Raildetailid)   

                elif item['rowaction'] == "delete":
                        Raildetailid = item['Raildetailid']
                        detail_to_delete = db.session.query(RailDetail).filter(RailDetail.Raildetailid == Raildetailid).one_or_none()
                        if detail_to_delete:
                            db.session.delete(detail_to_delete)
                            deletedDetailIds.append(Raildetailid)
        
        db.session.commit()

        return jsonify({
            "message": "Data Inserted successfully",
            "head": updatedHeadCount,
            "addedDetails": Rail_detail_schemas.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except Exception as e:
        db.session.rollback()
        print("Traceback", traceback.format_exc())
        return jsonify({"error": "Update failed","message": str(e)}), 500


@app.route(API_URL + "/delete_data_by_railid", methods=["DELETE"])
def delete_data_by_railid():
    try:
        RailId = request.args.get('RailId')
        Doc_No = request.args.get('Doc_No')

        if not all([RailId, Doc_No]):
            return jsonify({"error": "Missing required parameters"}), 400

        deleted_head = RailHead.query.filter_by(RailId=RailId).first()

        if not deleted_head:
            return jsonify({"error": "Sale bill not found"}), 404

        try:
            deleted_railDetail_rows = RailDetail.query.filter_by(RailId=RailId).delete()
            
            deleted_railHead_rows = RailHead.query.filter_by(RailId=RailId).delete()

            db.session.commit()

            return jsonify({
                "message": f"Deleted {deleted_railHead_rows} saleBillHead row(s) and {deleted_railDetail_rows} saleBillDetail row(s) successfully"
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Transaction failed", "message": str(e)}), 500

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Navigations API 


#Get last Record from Database
@app.route(API_URL+"/get-lastRailRack-navigation", methods=["GET"])
def get_lastRailRack_navigation():
    try:

        last_rail = db.session.query(RailHead).order_by(RailHead.RailId.desc()).first()

        if not last_rail:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        last_railid = last_rail.RailId

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"RailId": last_railid})

        additional_data_rows = additional_data.fetchall()
      
        row = additional_data_rows[0] if additional_data_rows else None
        last_head_data = {column.name: getattr(last_rail, column.name) for column in last_rail.__table__.columns}
        # last_head_data.update(format_dates(last_rail))

        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
#Get First record from database 
@app.route(API_URL+"/get-firstRailRack-navigation", methods=["GET"])
def get_firstRailRack_navigation():
    try:

        # Company_Code = request.args.get('Company_Code')
        # Year_Code = request.args.get('Year_Code')
        # if not all([Company_Code, Year_Code]):
        #     return jsonify({"error": "Missing required parameters"}), 400
        
        first_rail = db.session.query(RailHead).order_by(RailHead.RailId.asc()).first()

        if not first_rail:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        first_railid = first_rail.RailId

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"RailId": first_railid})

        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None

        first_head_data = {column.name: getattr(first_rail, column.name) for column in first_rail.__table__.columns}
        # first_head_data.update((first_rail))

        first_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "first_head_data": first_head_data,
            "first_details_data": first_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500



    
#Get Previous record by database 
@app.route(API_URL+"/get-previousRailRack-navigation", methods=["GET"])
def get_previousRailRack_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')

        previous_Rail = RailHead.query.filter(RailHead.Doc_No < current_doc_no).order_by(RailHead.Doc_No.desc()).first()
    
        
        if not previous_Rail:
            return jsonify({"error": "No previous records found"}), 404

        previous_rail_id = previous_Rail.RailId
        
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"RailId": previous_rail_id})

        additional_data_rows = additional_data.fetchall()
        
        row = additional_data_rows[0] if additional_data_rows else None
        previous_head_data = {column.name: getattr(previous_Rail, column.name) for column in previous_Rail.__table__.columns}
        # previous_head_data.update(format_dates(previous_Rail))

        previous_details_data = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "previous_head_data": previous_head_data,
            "previous_details_data": previous_details_data
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Get Next record by database 
@app.route(API_URL+"/get-nextRailRack-navigation", methods=["GET"])
def get_nextRailRack_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')

        next_rail = RailHead.query.filter(RailHead.Doc_No > current_doc_no).order_by(RailHead.Doc_No.asc()).first()

        if not next_rail:
            return jsonify({"error": "No next records found"}), 404

        next_rail_id = next_rail.RailId

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"RailId": next_rail_id})
        
        additional_data_rows = additional_data.fetchall()
        
        row = additional_data_rows[0] if additional_data_rows else None
        next_head_data = {column.name: getattr(next_rail, column.name) for column in next_rail.__table__.columns}
        # next_head_data.update(format_dates(next_rail))

        next_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Prepare response data
        response = {
            "next_head_data": next_head_data,
            "next_details_data": next_details_data
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
