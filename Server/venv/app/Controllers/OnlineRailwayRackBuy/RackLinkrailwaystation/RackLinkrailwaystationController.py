from flask import jsonify, request, Flask
from app import app, db
from app.models.OnlineRailwayRackBuy.RackLinkrailwaystation.RackLinkrailwaystationModel import RackLinkrailwaystation
import os
from sqlalchemy import text, func

API_URL = os.getenv('API_URL')

task_details_query = '''
SELECT dbo.Rack_Link_railway_station.Id, dbo.Rack_Link_railway_station.Mill_id, dbo.Rack_Link_railway_station.Railway_station_id, dbo.Rack_Mill_Info.Mill_name, dbo.Rack_Railway_station_Master.Station_name
FROM     dbo.Rack_Link_railway_station LEFT OUTER JOIN
                  dbo.Rack_Mill_Info ON dbo.Rack_Link_railway_station.Mill_id = dbo.Rack_Mill_Info.Id LEFT OUTER JOIN
                  dbo.Rack_Railway_station_Master ON dbo.Rack_Link_railway_station.Railway_station_id = dbo.Rack_Railway_station_Master.Id
                  where dbo.Rack_Link_railway_station.Id = :id
'''

# def format_dates(task):
#     return {
#         "Created_Date": task.Created_Date.strftime('%Y-%m-%d') if task.Created_Date else None,
#         "Modified_Date": task.Modified_Date.strftime('%Y-%m-%d') if task.Modified_Date else None,
#     }


# GET ALL RECORDS
@app.route(API_URL+'/getAlllinkstation', methods=['GET'])
def getAlllinkstation():
    try:
        stationData = RackLinkrailwaystation.query.all()
        result = [item.as_dict for item in stationData]
        response = {
            "all_link_station_Info": result
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route(API_URL + "/get-next-linkRail-id", methods=["GET"])
def get_next_linkRail_id():
    try:

        max_id = db.session.query(func.max(RackLinkrailwaystation.Id)).scalar()
        next_id = max_id + 1 if max_id else 1
        response = {
            "next_id": next_id
        }

        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# GET RECORD BY ID
@app.route(API_URL+'/getlinkstationbyId', methods=['GET'])
def getlinkstationbyId():
    try:
        id = request.args.get('Id')

        if not id:
            return jsonify({'error': 'Missing id parameter'}), 400

        transaction = RackLinkrailwaystation.query.filter_by(Id=id).first()

        if not transaction:
            return jsonify({'error': 'Station not found'}), 404

        additional_data = db.session.execute(text(task_details_query), {"id": transaction.Id})
        additional_data_rows = additional_data.fetchall()

        record_data = transaction.as_dict
        label_names = [{"Id": row.Id,"Mill_id": row.Mill_id, "Railway_station_id": row.Railway_station_id,"Mill_name": row.Mill_name, "Station_name": row.Station_name}for row in additional_data_rows]

        response = {
            "message": "Record Found Successfully",
            "Link_Station_data": record_data,
            "label_names": label_names
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


#INSERT RECORD
@app.route(API_URL+'/insertlinkstationrecord', methods=['POST'])
def insertlinkstationrecord():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Data Not Found!"}), 400

        linkstation_info = RackLinkrailwaystation(**data)
        db.session.add(linkstation_info)
        db.session.commit()

        return jsonify({
            "message": "Record Inserted Successfully","Record": linkstation_info.as_dict
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to insert!", "details": str(e)}), 500


#update record
@app.route(API_URL+"/updatelinkstationInfo", methods=["PUT"])
def updatelinkstationInfo():
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

        linkstationinfo = RackLinkrailwaystation.query.filter_by(Id=Id).first()
        if not linkstationinfo:
            return jsonify({'error': 'Link station record not found'}), 404

        for key, value in data.items():
            if key != "Id" and hasattr(linkstationinfo, key):
                setattr(linkstationinfo, key, value)

        db.session.commit()

        return jsonify({
            'message': 'Record updated successfully',
            'record': linkstationinfo.as_dict
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# delete record
@app.route(API_URL+"/delete_linkstation_info", methods=["DELETE"])
def delete_linkstation_info():
    try:
        id = request.args.get('Id')

        if not id:
            return jsonify({'error': 'Missing id parameter'}), 400

        transaction = RackLinkrailwaystation.query.filter_by(Id=id).first()

        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404

        db.session.delete(transaction)
        db.session.commit()

        return jsonify({
            'message': 'Transaction deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

#GET FIRST RECORD
@app.route(API_URL+'/getFirstlinkstation', methods=['GET'])
def getFirstlinkstation():
    try:
        transaction = RackLinkrailwaystation.query.order_by(RackLinkrailwaystation.Id.asc()).first()
        
        if not transaction:
            return jsonify({'error': 'No record found'}), 404
        first_record_data = transaction.as_dict
        
        # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": transaction.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_first_record_data = {**first_record_data}
        label_names = [{"Id": row.Id, "Mill_id": row.Mill_id, "Railway_station_id": row.Railway_station_id,"Mill_name": row.Mill_name, "Station_name": row.Station_name}for row in additional_data_rows]

        response = {    
            "first_link_station_data": formatted_first_record_data,
            "label_names": label_names
            }


        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# API to Get Last Record
@app.route(API_URL+'/getLastlinkstation', methods=['GET'])
def getLastlinkstation():
    try:
        last_record = RackLinkrailwaystation.query.order_by(RackLinkrailwaystation.Id.desc()).first() or 0

        if not last_record:
            return jsonify({'error': 'No records found'}), 404

        last_record_data = last_record.as_dict
        # last_record_data.update(format_dates(last_record))

        # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": last_record.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_first_record_data = {**last_record_data}

        response = {    
            "last_link_station_data": formatted_first_record_data,
            "label_names": [{"Id": row.Id, "Mill_id": row.Mill_id, "Railway_station_id": row.Railway_station_id,"Mill_name": row.Mill_name, "Station_name": row.Station_name}for row in additional_data_rows]
            }

        return jsonify(response), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500



# GET NEXT RECORD
@app.route(API_URL+'/getNextlinkstation', methods=['GET'])
def getNextlinkstation():
    try:
        current_id = request.args.get('Id')

        if not current_id:
            return jsonify({'error': 'Missing Id parameter'}), 400

        transaction = RackLinkrailwaystation.query.filter(RackLinkrailwaystation.Id > current_id).order_by(RackLinkrailwaystation.Id.asc()).first()
        
        if not transaction:
            return jsonify({'error': 'No next record found'}), 404
        
        next_record_data = transaction.as_dict

         # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": transaction.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_first_record_data = {**next_record_data}
        label_names = [{"Id": row.Id, "Mill_id": row.Mill_id, "Railway_station_id": row.Railway_station_id,"Mill_name": row.Mill_name, "Station_name": row.Station_name}for row in additional_data_rows]

        response = {    
            "Next_Link_Station_data": formatted_first_record_data,
            "label_names": label_names
            }

        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET PREVIOUS RECORD
@app.route(API_URL+'/getPreviouslinkstation', methods=['GET'])
def getPreviouslinkstation():
    try:
        current_id = request.args.get('Id')

        if not current_id:
            return jsonify({'error': 'Missing Id parameter'}), 400

        transaction = RackLinkrailwaystation.query.filter(RackLinkrailwaystation.Id < current_id).order_by(RackLinkrailwaystation.Id.desc()).first()
        
        if not transaction:
            return jsonify({'error': 'No previous record found'}), 404
        
        previous_record_data = transaction.as_dict

         # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(task_details_query), {"id": transaction.Id})
        additional_data_rows = additional_data.fetchall()
 
        formatted_first_record_data = {**previous_record_data}
        label_names = [{"Id": row.Id, "Railway_station_id": row.Railway_station_id,"Mill_name": row.Mill_name, "Station_name": row.Station_name}for row in additional_data_rows]

        response = {    
            "previous_link_station_data": formatted_first_record_data,
            "label_names": label_names
            }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
