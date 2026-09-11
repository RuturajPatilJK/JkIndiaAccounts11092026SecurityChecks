from flask import jsonify, request
from app import app, db
from app.models.Masters.WhatsAppURL.WhatsAppURLModels import WhatsAppURL
import os

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')


@app.route(API_URL + "/get-WhatsAppURL-Record", methods=["GET"])
def get_WhatsAppURL_Record():
    try:
        company_code = request.args.get('Company_Code')

        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
            
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        record = WhatsAppURL.query.filter_by(Company_Code=company_code).first()

        if record is None:
            return jsonify({'error': 'No record found for the provided Company_Code'}), 404

        record_data={column.name: getattr(record, column.name) for column in record.__table__.columns}
       

        response = {
            "WhatsAppURL_data": record_data,
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL + "/create-or-update-WhatsAppURL", methods=["POST"])
def create_or_update_WhatsAppURL():
    try:
        company_code = request.json.get('Company_Code')
        

        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
           
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or Year_Code parameter'}), 400

        existing_record = WhatsAppURL.query.filter_by(Company_Code=company_code).first()

        if existing_record:
            update_data = request.json
            for key, value in update_data.items():
                setattr(existing_record, key, value)
            
            updated_data = {column.name: getattr(existing_record, column.name) for column in existing_record.__table__.columns}
            db.session.commit()
            return jsonify({'message': 'Record updated successfully', 'record': updated_data}), 200
        else:
            new_record_data = request.json
            new_record = WhatsAppURL(**new_record_data)
            db.session.add(new_record)
            db.session.commit()
            
            new_created_data = {column.name: getattr(new_record, column.name) for column in new_record.__table__.columns}
            return jsonify({'message': 'Record created successfully', 'record': new_created_data}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500




