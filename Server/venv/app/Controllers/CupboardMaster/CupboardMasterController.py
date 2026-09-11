from flask import jsonify, request
from app import app, db
from sqlalchemy import func

from app.models.CupboardMaster.CupboardMasterModels import CupboardMaster
from app.models.CupboardMaster.CupboardMasterSchemas import CupboardMasterSchema
# Ported as-is from CupBoardMasterController.js: checkCupboardCode looks the
# code up in File_Info (not Cupboard_Master), same as the original Node code.
from app.models.FileInformation.FileInformationModels import FileInfo

cupboard_master_schema = CupboardMasterSchema()
cupboard_master_schemas = CupboardMasterSchema(many=True)


@app.route('/api/employees/checkCupboardCode/<cupboardCode>', methods=['GET'])
def check_cupboard_code(cupboardCode):
    try:
        cupboard_exists = FileInfo.query.filter_by(Cupboard_Code=cupboardCode).first()
        return jsonify({'exists': cupboard_exists is not None}), 200
    except Exception as e:
        print('Error checking cupboard code:', e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getallCupBoard', methods=['GET'])
def get_all_cupboard_master():
    try:
        cupboard_masters = CupboardMaster.query.order_by(CupboardMaster.Cupboard_Code.desc()).all()
        return jsonify({'alldata': cupboard_master_schemas.dump(cupboard_masters)}), 200
    except Exception as e:
        print('Error fetching user creations:', e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/lastCupBoardCode', methods=['GET'])
def get_last_cupboard_code():
    try:
        last_cupboard_master = db.session.query(func.max(CupboardMaster.Cupboard_Code)).scalar()
        return jsonify({'lastCupBoardMaster': last_cupboard_master}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getlastrecordcupboardmaster', methods=['GET'])
def get_last_cupboard_master_all():
    try:
        last_cupboard_master = CupboardMaster.query.order_by(CupboardMaster.Cupboard_Code.desc()).first()
        return jsonify({'lastCupBoardMaster': cupboard_master_schema.dump(last_cupboard_master) if last_cupboard_master else None}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/insertFilemaster', methods=['POST'])
def create_cupboard_master():
    try:
        data = request.get_json()
        cupboard_name = data.get('Cupboard_Name')
        created_by = data.get('Created_by')
        modified_by = data.get('Modified_by')

        max_cupboard_code = db.session.query(func.max(CupboardMaster.Cupboard_Code)).scalar()
        new_cupboard_code = (max_cupboard_code + 1) if max_cupboard_code else 1

        cupboard_master = CupboardMaster(
            Cupboard_Code=new_cupboard_code,
            Cupboard_Name=cupboard_name,
            Created_by=created_by,
            Modified_by=modified_by,
        )
        db.session.add(cupboard_master)
        db.session.commit()

        return jsonify({'message': 'User creation successful', 'CupBoardMaster': cupboard_master_schema.dump(cupboard_master)}), 201
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/updatecupboardmaster/<Cupboard_Code>', methods=['PUT'])
def update_cupboard_master(Cupboard_Code):
    try:
        data = request.get_json()

        existing_cupboard_master = CupboardMaster.query.filter_by(Cupboard_Code=Cupboard_Code).first()
        if not existing_cupboard_master:
            return jsonify({'error': 'User not found'}), 404

        existing_cupboard_master.Cupboard_Name = data.get('Cupboard_Name')
        existing_cupboard_master.Created_by = data.get('Created_by')
        existing_cupboard_master.Modified_by = data.get('Modified_by')

        db.session.commit()

        return jsonify({'message': 'User update successful', 'CupBoardMaster': cupboard_master_schema.dump(existing_cupboard_master)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/deletcupboardmaster/<Cupboard_Code>', methods=['DELETE'])
def delete_cupboard_master(Cupboard_Code):
    try:
        existing_cupboard_master = CupboardMaster.query.filter_by(Cupboard_Code=Cupboard_Code).first()
        if not existing_cupboard_master:
            return jsonify({'error': 'User not found'}), 404

        db.session.delete(existing_cupboard_master)
        db.session.commit()

        return jsonify({'message': 'User deletion successful'}), 200
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


# Navigations API

@app.route('/api/employees/getfirstnavigationcupboard', methods=['GET'])
def cupboard_get_first_navigation():
    try:
        first_user_creation = CupboardMaster.query.order_by(CupboardMaster.Cupboard_Code.asc()).first()
        return jsonify({'firstUserCreation': cupboard_master_schema.dump(first_user_creation) if first_user_creation else None}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getlastnavigationcupboard', methods=['GET'])
def cupboard_get_last_navigation():
    try:
        last_user_creation = CupboardMaster.query.order_by(CupboardMaster.Cupboard_Code.desc()).first()
        return jsonify({'lastUserCreation': cupboard_master_schema.dump(last_user_creation) if last_user_creation else None}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getpreviousnavigationcupboard/<currentEmployeeCode>', methods=['GET'])
def cupboard_get_previous_navigation(currentEmployeeCode):
    try:
        previous_user_creation = (
            CupboardMaster.query
            .filter(CupboardMaster.Cupboard_Code < currentEmployeeCode)
            .order_by(CupboardMaster.Cupboard_Code.desc())
            .first()
        )
        return jsonify({'previousUserCreation': cupboard_master_schema.dump(previous_user_creation) if previous_user_creation else None}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getnextnavigationcupboard/<currentEmployeeCode>', methods=['GET'])
def cupboard_get_next_navigation(currentEmployeeCode):
    try:
        next_user_creation = (
            CupboardMaster.query
            .filter(CupboardMaster.Cupboard_Code > currentEmployeeCode)
            .order_by(CupboardMaster.Cupboard_Code.asc())
            .first()
        )
        return jsonify({'nextUserCreation': cupboard_master_schema.dump(next_user_creation) if next_user_creation else None}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
