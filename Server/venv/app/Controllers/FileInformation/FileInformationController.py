from flask import jsonify, request
from app import app, db
from sqlalchemy import func, text

from app.models.FileInformation.FileInformationModels import FileInfo
from app.models.FileInformation.FileInformationSchemas import FileInfoSchema

file_info_schema = FileInfoSchema()
file_info_schemas = FileInfoSchema(many=True)

FILE_INFO_WITH_CUPBOARD_QUERY = '''
    SELECT dbo.Cupboard_Master.Cupboard_Name, dbo.File_Info.Doc_No, dbo.File_Info.Doc_Date, dbo.File_Info.File_Discription, dbo.File_Info.Cupboard_Code, dbo.File_Info.File_No, dbo.File_Info.File_Name,
           dbo.File_Info.Remark
    FROM dbo.Cupboard_Master INNER JOIN
         dbo.File_Info ON dbo.Cupboard_Master.Cupboard_Code = dbo.File_Info.Cupboard_Code
    ORDER BY dbo.File_Info.Doc_No DESC
'''


@app.route('/api/employees/file-info-with-cupboard', methods=['GET'])
def get_file_info():
    try:
        rows = db.session.execute(text(FILE_INFO_WITH_CUPBOARD_QUERY)).mappings().all()
        results = []
        for row in rows:
            item = dict(row)
            if item.get('Doc_Date') is not None:
                item['Doc_Date'] = item['Doc_Date'].isoformat()
            results.append(item)
        return jsonify(results), 200
    except Exception as e:
        print('Error executing raw SQL query:', e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getfilebycupboardcode', methods=['GET'])
def get_file_by_cupboard_code_file_no():
    cupboard_code = request.args.get('Cupboard_Code')
    file_no = request.args.get('File_No')
    try:
        if not cupboard_code or not file_no:
            return jsonify({'error': 'missing required parameters.!'}), 400

        file_data = FileInfo.query.filter_by(Cupboard_Code=cupboard_code, File_No=file_no).first()

        if not file_data:
            return jsonify({'error': 'File not found for given Cupboard_Code and File_No'}), 404

        return jsonify({'fileData': file_info_schema.dump(file_data)}), 200
    except Exception as e:
        print('Error fetching file data by Cupboard_Code and File_No:', e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getallFiles', methods=['GET'])
def get_all_file_creation():
    try:
        user_creations = FileInfo.query.order_by(FileInfo.Doc_No.desc()).all()
        return jsonify(file_info_schemas.dump(user_creations)), 200
    except Exception as e:
        print('Error fetching user creations:', e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/lastFileCode', methods=['GET'])
def get_last_file_creation_code():
    try:
        last_user_creation = db.session.query(func.max(FileInfo.Doc_No)).scalar()
        return jsonify({'lastUserCreation': last_user_creation}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getLastCupboardCode/<Cupboard_Code>', methods=['GET'])
def get_last_cupboard_code_file_no(Cupboard_Code):
    try:
        max_file_no = db.session.query(func.max(FileInfo.File_No)).filter(FileInfo.Cupboard_Code == Cupboard_Code).scalar()
        return jsonify({'maxFileNo': max_file_no}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getlastfilebyid', methods=['GET'])
def get_last_file_creation():
    try:
        last_user_creation = FileInfo.query.order_by(FileInfo.Doc_No.desc()).first()
        return jsonify({'lastUserCreation': file_info_schema.dump(last_user_creation) if last_user_creation else None}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getdatabyDocNo/<Doc_No>', methods=['GET'])
def get_file_creation_by_doc_no(Doc_No):
    try:
        get_data_by_doc_no = FileInfo.query.filter_by(Doc_No=Doc_No).first()
        if not get_data_by_doc_no:
            return jsonify({'error': 'File information not found'}), 404
        return jsonify({'getdataByDocNo': file_info_schema.dump(get_data_by_doc_no)}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/insertfile', methods=['POST'])
def create_file_information():
    try:
        data = request.get_json()
        doc_date = data.get('Doc_Date')
        file_name = data.get('File_Name')
        file_discription = data.get('File_Discription')
        cupboard_code = data.get('Cupboard_Code')
        cupboard_code_name = data.get('CupBoardCode_Name')
        created_by = data.get('Created_by')
        modified_by = data.get('Modified_by')

        max_doc_no = db.session.query(func.max(FileInfo.Doc_No)).scalar()
        max_file_no = db.session.query(func.max(FileInfo.File_No)).filter(FileInfo.Cupboard_Code == cupboard_code).scalar()

        new_doc_no = (max_doc_no + 1) if max_doc_no else 1
        new_file_no = (max_file_no + 1) if max_file_no else 1

        user_creation = FileInfo(
            File_No=new_file_no,
            Doc_No=new_doc_no,
            Doc_Date=doc_date,
            File_Name=file_name,
            File_Discription=file_discription,
            Cupboard_Code=cupboard_code,
            CupBoardCode_Name=cupboard_code_name,
            Created_by=created_by,
            Modified_by=modified_by,
        )
        db.session.add(user_creation)
        db.session.commit()

        return jsonify({'message': 'User creation successful', 'userCreation': file_info_schema.dump(user_creation)}), 201
    except Exception as e:
        db.session.rollback()
        print('Error during user creation:', e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/updatefile/<Doc_No>', methods=['PUT'])
def update_file_information(Doc_No):
    try:
        data = request.get_json()

        existing_file_information = FileInfo.query.filter_by(Doc_No=Doc_No).first()
        if not existing_file_information:
            return jsonify({'error': 'File information not found'}), 404

        existing_file_information.File_Name = data.get('File_Name')
        existing_file_information.File_Discription = data.get('File_Discription')
        existing_file_information.Cupboard_Code = data.get('Cupboard_Code')
        existing_file_information.Created_by = data.get('Created_by')
        existing_file_information.Modified_by = data.get('Modified_by')
        existing_file_information.Remark = data.get('Remark')

        db.session.commit()

        return jsonify({'message': 'File information update successful', 'fileInformation': file_info_schema.dump(existing_file_information)}), 200
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


# File Shifting update API
@app.route('/api/employees/updatenewcupboardfile/<Doc_No>', methods=['PUT'])
def update_file_in_new_cupboard(Doc_No):
    try:
        data = request.get_json()
        file_name = data.get('File_Name')
        file_discription = data.get('File_Discription')
        cupboard_code = data.get('Cupboard_Code')
        file_no = data.get('File_No')
        modified_by = data.get('Modified_by')
        remark = data.get('Remark')

        current_file = FileInfo.query.filter_by(Doc_No=Doc_No).first()
        if not current_file:
            return jsonify({'error': 'File not found'}), 404

        existing_file_in_new_location = (
            FileInfo.query
            .filter(
                FileInfo.Cupboard_Code == cupboard_code,
                FileInfo.File_No == file_no,
                FileInfo.Doc_No != Doc_No,
            )
            .first()
        )

        if existing_file_in_new_location:
            return jsonify({'error': f'File number {file_no} already exists in cupboard {cupboard_code}'}), 400

        current_file.File_Name = file_name
        current_file.File_Discription = file_discription
        current_file.Cupboard_Code = cupboard_code
        current_file.File_No = file_no
        current_file.Modified_by = modified_by
        current_file.Remark = remark

        db.session.commit()

        updated_file = FileInfo.query.get(Doc_No)
        return jsonify({
            'message': 'File shifted successfully',
            'fileInformation': file_info_schema.dump(updated_file),
        }), 200
    except Exception as e:
        db.session.rollback()
        print('File shift error:', e)
        return jsonify({'error': 'Failed to shift file', 'details': str(e)}), 500


@app.route('/api/employees/deletefile/<Doc_No>', methods=['DELETE'])
def delete_file(Doc_No):
    try:
        existing_user_creation = FileInfo.query.filter_by(Doc_No=Doc_No).first()
        if not existing_user_creation:
            return jsonify({'error': 'User not found'}), 404

        db.session.delete(existing_user_creation)
        db.session.commit()

        return jsonify({'message': 'User deletion successful'}), 200
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


# Navigation API

@app.route('/api/employees/getfirstnavigationfile', methods=['GET'])
def file_get_first_navigation():
    try:
        first_user_creation = FileInfo.query.order_by(FileInfo.Doc_No.asc()).first()
        return jsonify({'firstUserCreation': file_info_schema.dump(first_user_creation) if first_user_creation else None}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getlastnavigationfile', methods=['GET'])
def file_get_last_navigation():
    try:
        last_user_creation = FileInfo.query.order_by(FileInfo.Doc_No.desc()).first()
        return jsonify({'lastUserCreation': file_info_schema.dump(last_user_creation) if last_user_creation else None}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getpreviousnavigationfile/<currentEmployeeCode>', methods=['GET'])
def file_get_previous_navigation(currentEmployeeCode):
    try:
        previous_user_creation = (
            FileInfo.query
            .filter(FileInfo.Doc_No < currentEmployeeCode)
            .order_by(FileInfo.Doc_No.desc())
            .first()
        )
        return jsonify({'previousUserCreation': file_info_schema.dump(previous_user_creation) if previous_user_creation else None}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/employees/getnextnavigationfile/<currentEmployeeCode>', methods=['GET'])
def file_get_next_navigation(currentEmployeeCode):
    try:
        next_user_creation = (
            FileInfo.query
            .filter(FileInfo.Doc_No > currentEmployeeCode)
            .order_by(FileInfo.Doc_No.asc())
            .first()
        )
        return jsonify({'nextUserCreation': file_info_schema.dump(next_user_creation) if next_user_creation else None}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
