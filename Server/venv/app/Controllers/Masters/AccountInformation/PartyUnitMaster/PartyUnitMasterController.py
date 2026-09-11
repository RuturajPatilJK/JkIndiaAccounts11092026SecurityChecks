import traceback
from flask import jsonify, request
from app import app, db
from app.models.Masters.AccountInformation.PartyUnitMaster.PartyUnitMasterModels import PartyUnitMaster
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
import os

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

PARTY_UNIT_MASTER_QUERY = '''
SELECT Party.Ac_Name_E AS partyName, Unit.Ac_Name_E AS UnitName
FROM     dbo.nt_1_partyunit INNER JOIN
                  dbo.nt_1_accountmaster AS Party ON dbo.nt_1_partyunit.Company_Code = Party.company_code AND dbo.nt_1_partyunit.Ac_Code = Party.Ac_Code AND dbo.nt_1_partyunit.ac = Party.accoid INNER JOIN
                  dbo.nt_1_accountmaster AS Unit ON dbo.nt_1_partyunit.Company_Code = Unit.company_code AND dbo.nt_1_partyunit.uc = Unit.accoid AND dbo.nt_1_partyunit.Unit_name = Unit.Ac_Code
WHERE dbo.nt_1_partyunit.ucid = :ucid
'''

@app.route(API_URL + "/insert-PartyUnitMaster", methods=["POST"])
def insert_PartyUnitMaster():
    try:
        new_record_data = request.json
        if not all([new_record_data.get('Company_Code'), new_record_data.get('Year_Code')]):
            return jsonify({'error': 'Missing Company_Code or Year_Code parameter'}), 400
        
        Company_Code = new_record_data['Company_Code']
        Year_Code = new_record_data['Year_Code']
        
        max_unit_code = db.session.query(func.max(PartyUnitMaster.unit_code)).filter_by(Company_Code=Company_Code, Year_Code=Year_Code).scalar()

        if max_unit_code is not None:
            new_record_data['unit_code'] = max_unit_code + 1
        else:
            new_record_data['unit_code'] = 1

        new_record = PartyUnitMaster(**new_record_data)
        db.session.add(new_record)
        db.session.commit()

        new_created_data = {column.name: getattr(new_record, column.name) for column in new_record.__table__.columns}
        
        return jsonify({'message': 'Record created successfully', 'record': new_created_data}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL + "/update-PartyUnitMaster", methods=["PUT"])
def update_PartyUnitMaster():
    try:
        update_data = request.json
        if not all([update_data.get('unit_code'), update_data.get('Company_Code'), update_data.get('Year_Code')]):
            return jsonify({'error': 'Missing unit_code, Company_Code, or Year_Code parameter'}), 400

        unit_code = update_data['unit_code']
        Company_Code = update_data['Company_Code']
        Year_Code = update_data['Year_Code']

        existing_record = PartyUnitMaster.query.filter_by(unit_code=unit_code, Company_Code=Company_Code, Year_Code=Year_Code).first()

        if existing_record:
            for key, value in update_data.items():
                setattr(existing_record, key, value)

            updated_data = {column.name: getattr(existing_record, column.name) for column in existing_record.__table__.columns}

            db.session.commit()
            return jsonify({'message': 'Record updated successfully', 'record': updated_data}), 200
        else:
            return jsonify({'error': 'Record not found'}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL + "/delete-PartyUnitMaster", methods=["DELETE"])
def delete_PartyUnitMaster():
    try:
        unit_code = request.args.get('unit_code')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([unit_code, Company_Code, Year_Code]):
            return jsonify({'error': 'Missing unit_code, Company_Code or Year_Code parameter'}), 400

        try:
            unit_code = int(unit_code)
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({'error': 'Invalid unit_code, Company_Code or Year_Code parameter'}), 400

        existing_record = PartyUnitMaster.query.filter_by(unit_code=unit_code, Company_Code=Company_Code, Year_Code=Year_Code).first()
        if existing_record is None:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(existing_record)
        db.session.commit()
        return jsonify({'message': 'Record deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL + "/getFirst_PartyUnitMaster", methods=["GET"])
def getFirst_PartyUnitMaster():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        first_record = PartyUnitMaster.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(PartyUnitMaster.unit_code.asc()).first()

        if first_record is None:
            return jsonify({"error": "No records found"}), 404

        first_ucid = first_record.ucid
        additional_data = db.session.execute(text(PARTY_UNIT_MASTER_QUERY), {'ucid': first_ucid})
        additional_data_rows = additional_data.fetchall()

        firstRecordData = {column.name: getattr(first_record, column.name) for column in first_record.__table__.columns}
        
        additional_labels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "firstRecordData": firstRecordData,
            "additionalLabels": additional_labels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getNext_PartyUnitMaster", methods=["GET"])
def getNext_PartyUnitMaster():
    try:
        unit_code = request.args.get('unit_code')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([unit_code, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        unit_code = int(unit_code)
        Company_Code = int(Company_Code)
        Year_Code = int(Year_Code)

        next_record = PartyUnitMaster.query.filter(
            PartyUnitMaster.unit_code > unit_code,
            PartyUnitMaster.Company_Code == Company_Code,
            PartyUnitMaster.Year_Code == Year_Code
        ).order_by(PartyUnitMaster.unit_code.asc()).first()

        if next_record is None:
            return jsonify({"error": "No next record found"}), 404

        next_ucid = next_record.ucid
        additional_data = db.session.execute(text(PARTY_UNIT_MASTER_QUERY), {'ucid': next_ucid})
        additional_data_rows = additional_data.fetchall()

        nextRecordData = {column.name: getattr(next_record, column.name) for column in next_record.__table__.columns}
       
        additional_labels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "nextRecordData": nextRecordData,
            "additionalLabels": additional_labels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getNextUnitCode_PartyUnitMaster", methods=["GET"])
def getNextUnitCode_PartyUnitMaster():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        max_unit_code = db.session.query(func.max(PartyUnitMaster.unit_code)).filter_by(Company_Code=Company_Code, Year_Code=Year_Code).scalar()

        if max_unit_code is None:
            next_unit_code = 1
        else:
            next_unit_code = max_unit_code + 1

        response = {
            "next_unit_code": next_unit_code
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/getLast_PartyUnitMaster", methods=["GET"])
def getLast_PartyUnitMaster():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_record = PartyUnitMaster.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(PartyUnitMaster.unit_code.desc()).first()

        if last_record is None:
            return jsonify({"error": "No records found"}), 404

        last_ucid = last_record.ucid
        additional_data = db.session.execute(text(PARTY_UNIT_MASTER_QUERY), {'ucid': last_ucid})
        additional_data_rows = additional_data.fetchall()

        lastRecordData = {column.name: getattr(last_record, column.name) for column in last_record.__table__.columns}
        
        additional_labels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "lastRecordData": lastRecordData,
            "additionalLabels": additional_labels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getPrevious_PartyUnitMaster", methods=["GET"])
def getPrevious_PartyUnitMaster():
    try:
        unit_code = request.args.get('unit_code')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([unit_code, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        unit_code = int(unit_code)
        Company_Code = int(Company_Code)
        Year_Code = int(Year_Code)

        previous_record = PartyUnitMaster.query.filter(
            PartyUnitMaster.unit_code < unit_code,
            PartyUnitMaster.Company_Code == Company_Code,
            PartyUnitMaster.Year_Code == Year_Code
        ).order_by(PartyUnitMaster.unit_code.desc()).first()

        if previous_record is None:
            return jsonify({"error": "No previous record found"}), 404

        previous_ucid = previous_record.ucid
        additional_data = db.session.execute(text(PARTY_UNIT_MASTER_QUERY), {'ucid': previous_ucid})
        additional_data_rows = additional_data.fetchall()

        previousRecordData = {column.name: getattr(previous_record, column.name) for column in previous_record.__table__.columns}
    
        additional_labels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "previousRecordData": previousRecordData,
            "additionalLabels": additional_labels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getByunit_code_PartyUnitMaster", methods=["GET"])
def getByunit_code_PartyUnitMaster():
    try:
        unit_code = request.args.get('unit_code')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([unit_code, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        unit_code = int(unit_code)
        Company_Code = int(Company_Code)
        Year_Code = int(Year_Code)

        record = PartyUnitMaster.query.filter_by(unit_code=unit_code, Company_Code=Company_Code, Year_Code=Year_Code).first()

        if record is None:
            return jsonify({"error": "No record found"}), 404

        recordData = {column.name: getattr(record, column.name) for column in record.__table__.columns}
    
        additional_data = db.session.execute(text(PARTY_UNIT_MASTER_QUERY), {'ucid': record.ucid})
        additional_data_rows = additional_data.fetchall()
        additional_labels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "recordData": recordData,
            "additionalLabels": additional_labels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getAll_PartyUnitMaster", methods=["GET"])
def getAll_PartyUnitMaster():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        records = PartyUnitMaster.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(PartyUnitMaster.unit_code.desc()).all()

        if not records:
            return jsonify({"error": "No records found"}), 404

        all_records_data = []

        for record in records:
            recordData = {column.name: getattr(record, column.name) for column in record.__table__.columns}

            additional_data = db.session.execute(text(PARTY_UNIT_MASTER_QUERY), {'ucid': record.ucid})
            additional_data_row = additional_data.fetchone() 

            if additional_data_row:
                additional_data_dict = dict(additional_data_row._mapping)
                combined_record = {**recordData, **additional_data_dict}  
            else:
                combined_record = recordData  

            all_records_data.append(combined_record)

        response = {
            "all_records_data": all_records_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
