from flask import jsonify, request, Flask
from app import app, db
from app.models.OnlineRailwayRackBuy.RackRailwaystationMaster.RackRailwaystationMasterModel import RackRailwaystationMaster
import os
from sqlalchemy import text,func

API_URL = os.getenv('API_URL')

task_details_query = '''
SELECT dbo.gststatemaster.State_Name, dbo.Rack_Railway_station_Master.State_code as State_Code
FROM     dbo.gststatemaster RIGHT OUTER JOIN
                  dbo.Rack_Railway_station_Master ON dbo.gststatemaster.State_Code = dbo.Rack_Railway_station_Master.State_code
                  where dbo.Rack_Railway_station_Master.Id = :id
'''
def format_dates(task):
    return {
        "Created_Date": task.Created_Date.strftime('%Y-%m-%d') if task.Created_Date else None,
        "Modified_Date": task.Modified_Date.strftime('%Y-%m-%d') if task.Modified_Date else None,
    }

# GET ALL RECORDS
@app.route(API_URL+'/getAllstation', methods=['GET'])
def getAllstation():
    stationData = RackRailwaystationMaster.query.all()
    result = [item.as_dict for item in stationData]
    response = {
        "all_data_station_master_Info": result
    }
    return jsonify(response), 200


# Get all groups API
@app.route(API_URL + "/getall_stationmaster", methods=["GET"])
def getall_stationmaster():
    records = RackRailwaystationMaster.query.order_by(RackRailwaystationMaster.Id.desc()).all()
    records_list = []
    for i in records:
        records_dict = {
            'Id': i.Id,
            'Station_name': i.Station_name
        }
        records_list.append(records_dict)

    alldata = {'alldata': records_list}
    return jsonify(alldata)

@app.route(API_URL + "/get-next-rail-id", methods=["GET"])
def get_next_rail_id():
    try:

        max_id = db.session.query(func.max(RackRailwaystationMaster.Id)).scalar()
        next_id = max_id + 1 if max_id else 1
        response = {
            "next_id": next_id
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500



# GET RECORD BY ID
@app.route(API_URL+'/getstationbyId', methods=['GET'])
def getstationbyId():
    try:
        id = request.args.get('Id')

        if not id:
            return jsonify({'error': 'Missing id parameter'}), 400

        transaction = RackRailwaystationMaster.query.filter_by(Id=id).first()

        if not transaction:
            return jsonify({'error': 'Record not found'}), 404

        additional_data = db.session.execute(text(task_details_query), {"id": transaction.Id})
        additional_data_rows = additional_data.fetchall()

        record_data = transaction.as_dict
        label_names = [{"State_Code": row.State_Code, "State_Name": row.State_Name} for row in additional_data_rows]

        response = {
            "message": "Record Found Successfully",
            "Station_data": record_data,
            "label_names": label_names
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


#  INSERT NEW RECORD
@app.route(API_URL+'/insertstationrecord', methods=['POST'])
def insertstationrecord():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Data Not Found!"}), 400

        station_info = RackRailwaystationMaster(**data)

        db.session.add(station_info)
        db.session.commit()

        return jsonify({
            "Success": "Record Inserted!",
            "record": station_info.as_dict
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "Error": "Failed to insert!",
            "details": str(e)
        }), 500


# UPDATE RECORD BY ID
@app.route(API_URL+"/updatestationInfo", methods=["PUT"])
def updatestationInfo():
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

        stationinfo = RackRailwaystationMaster.query.filter_by(Id=Id).first()
        if not stationinfo:
            return jsonify({'error': 'Station record not found'}), 404

        for key, value in data.items():
            if key != "Id" and hasattr(stationinfo, key):  
                setattr(stationinfo, key, value)
        updated_data= {
            'record': {**stationinfo.as_dict}
        }
        db.session.commit()

        return jsonify(updated_data), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# DELETE RECORD BY ID
@app.route(API_URL+"/delete_station_info", methods=["DELETE"])
def delete_station_info():
    try:
        id = request.args.get('Id')

        if not id:
            return jsonify({'error': 'Missing id parameter'}), 400
        
        transaction = RackRailwaystationMaster.query.filter_by(Id=id).first()

        if not transaction:
            return jsonify({'error': 'Record not found'}), 404
        
        db.session.delete(transaction)
        db.session.commit()
    
        return jsonify({'message': 'Record deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# GET FIRST RECORD FROM DATABASE
@app.route(API_URL+'/getFirststation', methods=['GET'])
def getFirststation():
    try:
        record = RackRailwaystationMaster.query.order_by(RackRailwaystationMaster.Id.asc()).first()

        if not record:
            return jsonify({'error': 'No record found'}), 404

        first_record_data = record.as_dict

        # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": record.Id})
        additional_data_rows = additional_data.fetchall()

        formatted_first_record_data = {**first_record_data}

        response = {    
            "first_station_data": formatted_first_record_data,
            "label_names": [{"State_Code": row.State_Code, "State_Name": row.State_Name} for row in additional_data_rows]
            }


        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET LAST RECORD FROM DATABASE
@app.route(API_URL+'/getLaststation', methods=['GET'])
def getLaststation():
    try:
        record = RackRailwaystationMaster.query.order_by(RackRailwaystationMaster.Id.desc()).first()

        if not record:
            return jsonify({'error': 'No record found'}), 404

        last_record_data = record.as_dict
    

        # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": record.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_last_record_data = {**last_record_data}
        

        response = {    
            "last_station_data": formatted_last_record_data,
            "label_names": [{"State_Code": row.State_Code, "State_Name": row.State_Name} for row in additional_data_rows]
            }


        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET NEXT RECORD FROM DATABASE
@app.route(API_URL+'/getNextstation', methods=['GET'])
def getNextstation():
    try:
        current_id = request.args.get('Id')

        if not current_id:
            return jsonify({'error': 'Missing Id parameter'}), 400

        record = RackRailwaystationMaster.query.filter(RackRailwaystationMaster.Id > current_id).order_by(RackRailwaystationMaster.Id.asc()).first()

        if not record:
            return jsonify({'error': 'No next record found'}), 404

        next_record_data = record.as_dict

         # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": record.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_first_record_data = {**next_record_data}

        response = {    
            "Next_station_data": formatted_first_record_data,
            "label_names": [{"State_Code": row.State_Code, "State_Name": row.State_Name} for row in additional_data_rows]
            }

        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET PREVIOUS RECORD FROM DATABASE
@app.route(API_URL+'/getPreviousstation', methods=['GET'])
def getPreviousstation():
    try:
        current_id = request.args.get('Id')

        if not current_id:
            return jsonify({'error': 'Missing Id parameter'}), 400

        record = RackRailwaystationMaster.query.filter(RackRailwaystationMaster.Id < current_id).order_by(RackRailwaystationMaster.Id.desc()).first()

        if not record:
            return jsonify({'error': 'No previous record found'}), 404

        previous_record_data = record.as_dict

         # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": record.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_first_record_data = {**previous_record_data}

        response = {    
            "previous_station_data": formatted_first_record_data,
            "label_names": [{"State_Code": row.State_Code, "State_Name": row.State_Name} for row in additional_data_rows]
            }

        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
