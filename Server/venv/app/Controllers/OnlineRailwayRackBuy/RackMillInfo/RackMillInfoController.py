from flask import jsonify, request, Flask
from app import app, db
from app.models.OnlineRailwayRackBuy.RackMillInfo.RackMillInfoModel import RackMillInfo
import os
from sqlalchemy import text,func
from datetime import datetime

API_URL = os.getenv('API_URL')


task_details_query = '''
SELECT dbo.gststatemaster.State_Name, dbo.Rack_Mill_Info.State_Code
FROM     dbo.Rack_Mill_Info LEFT OUTER JOIN
                  dbo.gststatemaster ON dbo.Rack_Mill_Info.State_Code = dbo.gststatemaster.State_Code
                  where dbo.Rack_Mill_Info.Id = :id
'''

# def format_dates(task):
#     return {
#         "Created_Date": task.Created_Date.strftime('%Y-%m-%d') if task.Created_Date else None,
#         "Modified_Date": task.Modified_Date.strftime('%Y-%m-%d') if task.Modified_Date else None,
#     }

# GET All Records
@app.route(API_URL+'/getAllmillinfo', methods=['GET'])
def getAllmillinfo():
    try:
        millData = RackMillInfo.query.all()
        result = [item.as_dict for item in millData]
        response = {
            "all_data_millInfo": result
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route(API_URL + "/get-next-mill-id", methods=["GET"])
def get_next_mill_id():
    try:

        max_id = db.session.query(func.max(RackMillInfo.Id)).scalar()
        next_id = max_id + 1 if max_id else 1
        response = {
            "next_id": next_id
        }

        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

# Get all groups API
@app.route(API_URL + "/getall_millmaster", methods=["GET"])
def getall_millmaster():
    records = RackMillInfo.query.order_by(RackMillInfo.Id.desc()).all()
    records_list = []
    for i in records:
        records_dict = {
            'Id': i.Id,
            'Mill_name': i.Mill_name
        }
        records_list.append(records_dict)

    alldata = {'alldata': records_list}
    return jsonify(alldata)


# GET Record By ID
@app.route(API_URL+'/getmillbyId', methods=['GET'])
def getmillbyId():
    try:
        id = request.args.get('Id')
        if not id:
            return jsonify({'error': 'Missing id parameter'}), 400

        transaction = RackMillInfo.query.filter_by(Id=id).first()

        if not transaction:
            return jsonify({'error': 'Record not found'}), 404

        additional_data = db.session.execute(text(task_details_query), {"id": transaction.Id})
        additional_data_rows = additional_data.fetchall()

        record_data = transaction.as_dict
        label_names = [{"State_Code": row.State_Code, "State_Name": row.State_Name} for row in additional_data_rows]

        response = {
            "message": "Record Found Successfully",
            "Mill_data": record_data,
            "label_names": label_names
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500



# INSERT Record
@app.route(API_URL+'/insertmillrecord', methods=['POST'])
def insertmillrecord():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Data Not Found!"}), 400

        station_info = RackMillInfo(**data)

        db.session.add(station_info)
        db.session.commit()
        return jsonify({"Success": "Record Inserted!", "record": station_info.as_dict}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"Error": "Failed to insert!", "details": str(e)}), 500


# UPDATE Record
@app.route(API_URL+"/updateMillInfo", methods=["PUT"])
def updateMillInfo():
    try:
        Id = request.args.get('Id')
        if not Id:
            return jsonify({'error': 'Missing id parameter'}), 400
        
        try:
            Id = int(Id)
        except ValueError:
            return jsonify({'error': 'Invalid ID format'}), 400 
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing Data'}), 400

        millinfo = RackMillInfo.query.filter_by(Id=Id).first()
        if not millinfo:
            return jsonify({'error': 'Mill record not found'}), 404

        for key, value in data.items():
            if key != "Id" and hasattr(millinfo, key):
                setattr(millinfo, key, value)

        db.session.commit()

        return jsonify({
            'message': 'Record updated successfully', 
            'record': millinfo.as_dict
            }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE Record
@app.route(API_URL+"/delete_mill_info", methods=["DELETE"])
def delete_mill_info():
    try:
        id = request.args.get('Id')

        if not id:
            return jsonify({'error': 'Missing id parameter'}), 400

        transaction = RackMillInfo.query.filter_by(Id=id).first()

        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404

        db.session.delete(transaction)
        db.session.commit()

        return jsonify({'message': 'Transaction deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

@app.route(API_URL+'/get-first-mill', methods=['GET'])
def get_first_mill():
    try:

        first_record = RackMillInfo.query.order_by(RackMillInfo.Id.asc()).first()
        if not first_record:
            return jsonify({'error': 'No record found for the provided Id'}), 404

        first_record_data = first_record.as_dict

        # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": first_record.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_first_record_data = {**first_record_data}

        response = {    
            "first_Mill_data": formatted_first_record_data,
            "label_names": [{"State_Code": row.State_Code, "State_Name": row.State_Name} for row in additional_data_rows]
            }


        return jsonify(response), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


 
@app.route(API_URL+'/get-previous-mill', methods=['GET'])
def get_previous_mill():
    try:
        id = request.args.get('Id')

        if not id:
            return jsonify({'error': 'Missing id parameter'}), 400

        try:
            id = int(id)
        except ValueError:
            return jsonify({'error': 'Invalid id parameter'}), 400

        previous_record = RackMillInfo.query.filter(RackMillInfo.Id < id).order_by(RackMillInfo.Id.desc()).first()

        if not previous_record:
            return jsonify({'error': 'No previous record found'}), 404

        previous_record_data = previous_record.as_dict

         # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": previous_record.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_first_record_data = {**previous_record_data}

        response = {    
            "previous_Mill_data": formatted_first_record_data,
            "label_names": [{"State_Code": row.State_Code, "State_Name": row.State_Name} for row in additional_data_rows]
            }

        return jsonify(response), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500



# API to Get Next Record
@app.route(API_URL+'/get-next-mill', methods=['GET'])
def get_next_mill():
    try:
        id = request.args.get('Id')

        if not id:
            return jsonify({'error': 'Missing id parameter'}), 400

        try:
            id = int(id)
        except ValueError:
            return jsonify({'error': 'Invalid id parameter'}), 400

        next_record = RackMillInfo.query.filter(RackMillInfo.Id > id).order_by(RackMillInfo.Id.asc()).first()

        if not next_record:
            return jsonify({'error': 'No next record found'}), 404

        next_record_data = next_record.as_dict

         # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": next_record.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_first_record_data = {**next_record_data}

        response = {    
            "Next_Mill_data": formatted_first_record_data,
            "label_names": [{"State_Code": row.State_Code, "State_Name": row.State_Name} for row in additional_data_rows]
            }

        return jsonify(response), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


# API to Get Last Record
@app.route(API_URL+'/get-last-mill', methods=['GET'])
def get_last_mill():
    try:
        last_record = RackMillInfo.query.order_by(RackMillInfo.Id.desc()).first()

        if not last_record:
            return jsonify({'error': 'No records found'}), 404

        last_record_data = last_record.as_dict
        # last_record_data.update(format_dates(last_record))

        # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": last_record.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_first_record_data = {**last_record_data}

        

        response = {    
            "last_Mill_data": formatted_first_record_data,
            "label_names": [{"State_Code": row.State_Code, "State_Name": row.State_Name} for row in additional_data_rows]
            }

        return jsonify(response), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500