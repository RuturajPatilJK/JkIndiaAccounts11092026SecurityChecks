# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db, socketio
from app.models.Masters.OtherMasters.GstStateMaster import GSTStateMaster
import os
from sqlalchemy import text
from flask_socketio import SocketIO, emit

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

app.config['SECRET_KEY'] = 'ABCDEFGHIJKLMNOPQRST'

# Get all groups API
@app.route(API_URL + "/getall-gststatemaster", methods=["GET"])
def get_all_gst_state_master():
    gst_state_masters = GSTStateMaster.query.order_by(GSTStateMaster.State_Code.desc()).all()
    gst_state_master_list = []
    for gst_state_master in gst_state_masters:
        gst_state_master_dict = {
            'State_Code': gst_state_master.State_Code,
            'State_Name': gst_state_master.State_Name
        }
        gst_state_master_list.append(gst_state_master_dict)

    alldata = {'alldata': gst_state_master_list}
    return jsonify(alldata)


# Get last State_Code
@app.route(API_URL+"/get-last-state-data", methods=["GET"])
def get_last_state_data():
    try:
        last_state_data = db.session.query(GSTStateMaster).filter_by(State_Code=db.session.query(db.func.max(GSTStateMaster.State_Code)).scalar()).first()

        if not last_state_data:
            return jsonify({'error': 'No data found for the last State_Code'}), 404

        data = {
            'State_Code': last_state_data.State_Code,
            'State_Name': last_state_data.State_Name,
        }

        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
#GET Particular State Code whole data 
@app.route(API_URL + "/getdatabyStateCode", methods=["GET"])
def get_state_data():
    try:
        state_code = request.args.get('State_Code')

        if not state_code:
            return jsonify({'error': 'State_Code parameter is missing'}), 400

        state_data = GSTStateMaster.query.filter_by(State_Code=state_code).all()

        if not state_data:
            return jsonify({'error': 'No data found for the provided State_Code'}), 404

        serialized_data = []
        for state in state_data:
            serialized_state = {
                'State_Code': state.State_Code,
                'State_Name': state.State_Name,
            }
            serialized_data.append(serialized_state)

        return jsonify(serialized_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


#create a new GSt state
@app.route(API_URL+"/create-gststatemaster", methods=["POST"])
def create_gst_state_master():
    try:
        state_name = request.json.get('State_Name')
        if not state_name:
            return jsonify({'error': 'Missing State_Name parameter'}), 400

        state_code = request.json.get('State_Code')

        query = text("INSERT INTO gststatemaster (State_Code, State_Name) VALUES (:state_code, :state_name)")
        db.session.execute(query, {"state_code": state_code, "state_name": state_name})
        db.session.commit()


        return jsonify({'message': 'GST State Master record created successfully', 'State_Code': state_code}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
# Update GST State Master record
@app.route(API_URL+"/update-gststatemaster", methods=["PUT"])
def update_gst_state_master():
    try:
        state_code = request.args.get('State_Code', type=int)
        state_name = request.json.get('State_Name')

        if state_code is None:
            return jsonify({'error': 'Missing State_Code parameter'}), 400
        if not state_name:
            return jsonify({'error': 'Missing State_Name parameter'}), 400

        gst_state_master = GSTStateMaster.query.filter_by(State_Code=state_code).first()
        if not gst_state_master:
            return jsonify({'error': 'GST State Master record not found'}), 404

        gst_state_master.State_Name = state_name

        db.session.commit()

        return jsonify({'message': 'GST State Master record updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

# Delete GST State Master record
@app.route(API_URL+"/delete-gststatemaster", methods=["DELETE"])
def delete_gst_state_master():
    try:
        state_code = request.args.get('State_Code', type=int)

        if state_code is None:
            return jsonify({'error': 'Missing State_Code parameter'}), 400

        gst_state_master = GSTStateMaster.query.filter_by(State_Code=state_code).first()
        if not gst_state_master:
            return jsonify({'error': 'GST State Master record not found'}), 404

        db.session.delete(gst_state_master)
        db.session.commit()
        return jsonify({'message': 'GST State Master record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

#Navigation APIS
@app.route(API_URL+"/get-first-GSTStateMaster", methods=["GET"])
def get_first_GSTStateMaster():
    try:
        first_user_creation = GSTStateMaster.query.order_by(GSTStateMaster.State_Code.asc()).first()
        if first_user_creation:
            serialized_user_creation = {key: value for key, value in first_user_creation.__dict__.items() if not key.startswith('_')}
            return jsonify([serialized_user_creation])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-last-GSTStateMaster", methods=["GET"])
def get_last_GSTStateMaster():
    try:
        last_user_creation = GSTStateMaster.query.order_by(GSTStateMaster.State_Code.desc()).first()
        if last_user_creation:
            serialized_last_user_creation = {}
            for key, value in last_user_creation.__dict__.items():
                if not key.startswith('_'):
                    serialized_last_user_creation [key] = value
            return jsonify([serialized_last_user_creation])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-previous-GSTStateMaster", methods=["GET"])
def get_previous_GSTStateMaster():
    try:
        Selected_Record = request.args.get('State_Code')
        if Selected_Record is None:
            return jsonify({'errOr': 'Selected_Record parameter is required'}), 400

        previous_selected_record = GSTStateMaster.query.filter(GSTStateMaster.State_Code < Selected_Record)\
            .order_by(GSTStateMaster.State_Code.desc()).first()
        if previous_selected_record:
            serialized_previous_selected_record = {key: value for key, value in previous_selected_record.__dict__.items() if not key.startswith('_')}
            return jsonify(serialized_previous_selected_record)
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-next-GSTStateMaster", methods=["GET"])
def get_next_GSTStateMaster():
    try:
        Selected_Record = request.args.get('State_Code')
        if Selected_Record is None:
            return jsonify({'error': 'Selected_Record parameter is required'}), 400

        next_Selected_Record = GSTStateMaster.query.filter(GSTStateMaster.State_Code > Selected_Record)\
            .order_by(GSTStateMaster.State_Code.asc()).first()
        if next_Selected_Record:
            serialized_next_Selected_Record = {key: value for key, value in next_Selected_Record.__dict__.items() if not key.startswith('_')}
            return jsonify({'nextSelectedRecord': serialized_next_Selected_Record})
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500