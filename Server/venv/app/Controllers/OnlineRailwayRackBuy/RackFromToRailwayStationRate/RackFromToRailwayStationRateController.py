from flask import jsonify, request, Flask
from app import app, db
from app.models.OnlineRailwayRackBuy.RackFromToRailwayStationRate.RackFromToRailwayStationRateModel import RackFromToRailwayStationRate
from app.models.OnlineRailwayRackBuy.RackFromToRailwayStationRate.RackFromToRailwayStationRateSchema import Rack_From_To_Railway_Station_Rate_Schema
import os
from sqlalchemy import text,func
import traceback

API_URL = os.getenv('API_URL')


task_details_query = '''SELECT        dbo.Rack_From_To_Railway_Station_Rate.Id, dbo.Rack_From_To_Railway_Station_Rate.Rail_Id, dbo.Rack_From_To_Railway_Station_Rate.From_id, dbo.Rack_From_To_Railway_Station_Rate.Local_Expenses, 
                         dbo.Rack_From_To_Railway_Station_Rate.To_id, dbo.Rack_From_To_Railway_Station_Rate.Min_rate, dbo.Rack_From_To_Railway_Station_Rate.Full_rate, dbo.Rack_From_To_Railway_Station_Rate.Distance, 
                         dbo.Rack_From_To_Railway_Station_Rate.Remark, dbo.Rack_From_To_Railway_Station_Rate.Created_By, dbo.Rack_From_To_Railway_Station_Rate.Modified_By, dbo.Rack_From_To_Railway_Station_Rate.Created_Date, 
                         dbo.Rack_From_To_Railway_Station_Rate.Modified_Date, dbo.Rack_Mill_Info.Mill_name, dbo.Rack_Mill_Info.Mill_code, dbo.Rack_Mill_Info.Id AS Mill_id, Rack_Railway_station_Master_1.Station_code AS ToStationCode, 
                         Rack_Railway_station_Master_1.Station_name AS ToStationName, Rail.Station_name AS RailStationName
FROM            dbo.Rack_Railway_station_Master AS Rail INNER JOIN
                         dbo.Rack_Link_railway_station ON Rail.Id = dbo.Rack_Link_railway_station.Railway_station_id RIGHT OUTER JOIN
                         dbo.Rack_From_To_Railway_Station_Rate LEFT OUTER JOIN
                         dbo.Rack_Railway_station_Master AS Rack_Railway_station_Master_1 ON dbo.Rack_From_To_Railway_Station_Rate.To_id = Rack_Railway_station_Master_1.Id ON 
                         dbo.Rack_Link_railway_station.Mill_id = dbo.Rack_From_To_Railway_Station_Rate.From_id AND dbo.Rack_Link_railway_station.Railway_station_id = dbo.Rack_From_To_Railway_Station_Rate.Rail_Id LEFT OUTER JOIN
                         dbo.Rack_Mill_Info ON dbo.Rack_Link_railway_station.Mill_id = dbo.Rack_Mill_Info.Id
                  where dbo.Rack_From_To_Railway_Station_Rate.Id = :id
                  '''

def format_dates(task):
    return {
        "Created_Date": task.Created_Date.strftime('%Y-%m-%d') if task.Created_Date else None,
        "Modified_Date": task.Modified_Date.strftime('%Y-%m-%d') if task.Modified_Date else None,
    }

Rack_From_To_Railway_Station_Rate_head_schema= Rack_From_To_Railway_Station_Rate_Schema(many=True)

#GET All records from database
@app.route(API_URL+'/getAllstationRate', methods=['GET'])
def getAllstationRate():
    stationData = RackFromToRailwayStationRate.query.all()
    result = [item.as_dict for item in stationData]  
    response = {
        "all_data": result
    }
    return jsonify(response)

@app.route(API_URL + "/get_next_id_RateInfo", methods=["GET"])
def get_next_id_RateInfo():
    try:

        max_id = db.session.query(func.max(RackFromToRailwayStationRate.Id)).scalar()
        next_id = max_id + 1 if max_id else 1
        response = {
            "next_id": next_id
        }

        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#GET records by ID 
@app.route(API_URL+'/getstationratebyId', methods=['GET'])
def getstationratebyId():
    try:
        id = request.args.get('Id')

        if not id:
            return jsonify({'error': 'Missing id parameter'}), 400

        transaction = RackFromToRailwayStationRate.query.filter_by(Id=id).first()

        if not transaction:
            return jsonify({'error': 'Record not found'}), 404  # Changed to 404

        additional_data = db.session.execute(text(task_details_query), {"id": transaction.Id})
        additional_data_rows = additional_data.fetchall()

        record_data = transaction.as_dict
        label_names = [{"Id": row.Id, "From_id": row.MilFrom_idl_id, "To_id": row.To_id,"Local_enpenses": row.Local_enpenses}for row in additional_data_rows]

        response = {
            "message": "Record Found Successfully",
            "Rate_data": record_data,
            "label_names": label_names
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500





#insert call
@app.route(API_URL+'/insertstationRate', methods=['POST'])
def insertstationRate():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Data Not Found!"}), 400

        rail_ids = list({item.get("Rail_Id") for item in data if "Rail_Id" in item})

        if rail_ids:
            db.session.query(RackFromToRailwayStationRate).filter(
                RackFromToRailwayStationRate.Rail_Id.in_(rail_ids)
            ).delete(synchronize_session=False)

        insertedData = []

        for item in data:
            station_rate_info = RackFromToRailwayStationRate(**item)
            db.session.add(station_rate_info)
            insertedData.append(station_rate_info)
        db.session.commit()

        return jsonify({"Success": "Record Inserted!", "record": Rack_From_To_Railway_Station_Rate_head_schema.dump(insertedData)}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"Error": "Failed to insert!", "details": str(e)}), 500


#Update Record from Database by id   
@app.route(API_URL+"/updatestationRate", methods=["PUT"])
def updatestationRate():
    try:
        Id = request.args.get('Id')

        if not Id:
            return jsonify({'error': 'Missing id parameter'}), 400

        data = request.get_json()

        if not data:
            return jsonify({'error': 'Missing Data'}), 400

        stationrateinfo = RackFromToRailwayStationRate.query.filter_by(Id=Id).first()

        if not stationrateinfo:
            return jsonify({'error': 'Station record not found'}), 404  # Added this check

        for key, value in data.items():
            setattr(stationrateinfo, key, value)

        db.session.commit()

        return jsonify({'message': 'Record updated successfully', 'record': stationrateinfo.as_dict}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


#Delete API   
@app.route(API_URL+"/delete_stationRate", methods=["DELETE"])
def delete_stationRate():
    try:
        id = request.args.get('Id')

        if not id:
            return jsonify({'error': 'Missing id parameter'}), 400
        
        transaction = RackFromToRailwayStationRate.query.filter_by(Id=id).first()

        if not transaction:
            return jsonify({'error': 'transaction not found'}), 400
        
    
        db.session.delete(transaction)
        db.session.commit()
	
        return jsonify({'message': 'transaction deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

# Get the first record
@app.route(API_URL+"/getFirstStationRate", methods=["GET"])
def get_first_station_rate():
    try:
        first_record = RackFromToRailwayStationRate.query.order_by(RackFromToRailwayStationRate.Id.asc()).first()

        if not first_record:
            return jsonify({'error': 'No records found'}), 404

        first_record_data = first_record.as_dict
            
            # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": first_record.Id})
        additional_data_rows = additional_data.fetchall()
    
        formatted_first_record_data = {**first_record_data}
        label_names = [{"Id": row.Id, "From_id": row.MilFrom_idl_id, "To_id": row.To_id,"Local_enpenses": row.Local_enpenses}for row in additional_data_rows]

        response = {    
                "first_Rate_data": formatted_first_record_data,
                "label_names": label_names
                }


        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Get the last record
@app.route(API_URL+"/getLastStationRate", methods=["GET"])
def get_last_station_rate():
    try:
        last_record = RackFromToRailwayStationRate.query.order_by(RackFromToRailwayStationRate.Id.desc()).first()

        if not last_record:
            return jsonify({'error': 'No records found'}), 404

        additional_data = db.session.execute(text(task_details_query), {"id": last_record.Id})
        additional_data_rows = additional_data.fetchall()

        data = [dict(row._mapping) for row in additional_data_rows]
    
        response = {    
                "data": data,
                }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



# Get the next record based on Id
@app.route(API_URL+"/getNextStationRate", methods=["GET"])
def get_next_station_rate():
    try:
        current_id = request.args.get('Id', type=int)

        if current_id is None:
            return jsonify({'error': 'Missing id parameter'}), 400

        next_record = RackFromToRailwayStationRate.query.filter(RackFromToRailwayStationRate.Id > current_id)\
            .order_by(RackFromToRailwayStationRate.Id.asc()).first()

        if not next_record:
            return jsonify({'error': 'No next record found'}), 404

        next_record_data = next_record.as_dict

         # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": next_record.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_first_record_data = {**next_record_data}
        label_names = [{"Id": row.Id, "From_id": row.MilFrom_idl_id, "To_id": row.To_id,"Local_enpenses": row.Local_enpenses}for row in additional_data_rows]

        response = {    
            "Next_Rate_data": formatted_first_record_data,
            "label_names": label_names
            }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Get the previous record based on Id
@app.route(API_URL+"/getPreviousStationRate", methods=["GET"])
def get_previous_station_rate():
    try:
        current_id = request.args.get('Id', type=int)

        if current_id is None:
            return jsonify({'error': 'Missing id parameter'}), 400

        previous_record = RackFromToRailwayStationRate.query.filter(RackFromToRailwayStationRate.Id < current_id)\
            .order_by(RackFromToRailwayStationRate.Id.desc()).first()

        if not previous_record:
            return jsonify({'error': 'No previous record found'}), 404

        previous_record_data = previous_record.as_dict

         # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": previous_record.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_first_record_data = {**previous_record_data}
        label_names = [{"Id": row.Id, "From_id": row.MilFrom_idl_id, "To_id": row.To_id,"Local_enpenses": row.Local_enpenses}for row in additional_data_rows]

        response = {    
            "previous_Rate_data": formatted_first_record_data,
            "label_names": label_names
            }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route(API_URL + "/get_MillStationInfoById", methods=["GET"])
def get_MillStationInfoById():
    try:
        Id = request.args.get('Id')

        if not Id:
            return jsonify({
                "error": "Missing required parameters"
            }), 400

        query = '''
               SELECT        dbo.Rack_Link_railway_station.Mill_id, dbo.Rack_Mill_Info.Mill_name, dbo.Rack_Link_railway_station.Local_enpenses as Local_Expenses, dbo.Rack_Link_railway_station.Railway_station_id
FROM            dbo.Rack_Link_railway_station LEFT OUTER JOIN
                         dbo.Rack_Mill_Info ON dbo.Rack_Link_railway_station.Mill_id = dbo.Rack_Mill_Info.Id
                 WHERE dbo.Rack_Link_railway_station.Railway_station_id = :Id
            '''

        result_data = db.session.execute(
            text(query),
            {
                "Id": Id,
            } 
        )

        rows = result_data.fetchall()
        all_data = [dict(row._mapping) for row in rows]

        toStation = '''
                    SELECT        Station_code as toStationCode, Id as To_id, Station_name as toStationName, Station_type
FROM            dbo.Rack_Railway_station_Master
WHERE        (Station_type = 'T')
                    '''

        toStationData = db.session.execute(text(toStation))
        toStationRows = toStationData.fetchall()

        stationData = [dict(row._mapping) for row in toStationRows]

        response = {
            "all_data": all_data,
            "stationData":stationData
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        print(traceback.format_exc())
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route(API_URL + "/getStationRatesByRailId", methods=["GET"])
def getStationRatesByRailId():
    try:
        rail_id = request.args.get("Rail_Id")
        if not rail_id:
            return jsonify({"error": "Missing Rail_Id parameter"}), 400

        query = '''
            SELECT To_id, Min_rate, Full_rate, Distance
            FROM dbo.Rack_From_To_Railway_Station_Rate
            WHERE Rail_Id = :rail_id
        '''
        result = db.session.execute(text(query), {"rail_id": rail_id})
        rows = result.fetchall()

        rate_data = {row.To_id: dict(row._mapping) for row in rows}

        return jsonify({"rates": rate_data}), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500








 