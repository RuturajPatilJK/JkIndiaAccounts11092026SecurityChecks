import ast
from datetime import datetime
import traceback
from flask import Flask, jsonify, request
from app import app, db
import requests
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
import os

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

# Import schemas from the schemas module
from app.models.Utilities.UserCreationWithPermission.UserCreationWithPermissionModel import TblUser, TblUserDetail
from app.models.Utilities.UserCreationWithPermission.UserCreationWithPermissionSchema import TblUserSchema, TblUserDetailSchema

tbl_user_schema = TblUserSchema()
tbl_user_schemas = TblUserSchema(many=True)

tbl_user_detail_schema = TblUserDetailSchema()
tbl_user_detail_schemas = TblUserDetailSchema(many=True)

VIEW_PERMISSION = 1
EDIT_PERMISSION = 2
DELETE_PERMISSION = 4
SAVE_PERMISSION = 8

userQuery = '''
SELECT        dbo.tbluser.User_Id, dbo.tbluser.User_Name, dbo.tbluser.User_Type, dbo.tbluser.Password, dbo.tbluser.EmailId, dbo.tbluser.EmailPassword, dbo.tbluser.uid, dbo.tbluser.userfullname, dbo.tbluser.Mobile, 
                         dbo.tbluser.User_Security, dbo.tbluser.PaymentsPassword, dbo.tbluser.User_Password, dbo.tbluserdetail.Detail_Id, dbo.tbluserdetail.Program_Name, dbo.tbluserdetail.Tran_Type, dbo.tbluserdetail.udid, 
                         dbo.tbluserdetail.canView, dbo.tbluserdetail.canEdit, dbo.tbluserdetail.canSave, dbo.tbluserdetail.canDelete, dbo.tbluserdetail.DND, dbo.tbluserdetail.menuNames
FROM            dbo.tbluser INNER JOIN
                         dbo.tbluserdetail ON dbo.tbluser.uid = dbo.tbluserdetail.uid
WHERE dbo.tbluser.uid =:uid
'''

#     return formatted_data
def format_dates(data):
    # Convert the data to a dictionary if it's an object
    formatted_data = (
        {column.name: getattr(data, column.name) for column in data.__table__.columns}
        if not isinstance(data, dict)
        else data.copy()
    )
    date_fields = ["Created_Date", "Modified_Date", "LastActivityDate", "LockedDateTime"]
    for date_field in date_fields:
        if date_field in formatted_data and formatted_data[date_field]:
            formatted_data[date_field] = formatted_data[date_field].strftime('%Y-%m-%d')

    return formatted_data


@app.route(API_URL + "/get-users", methods=["GET"])
def get_users():
    try:
        query = """
        SELECT User_Id, User_Type, EmailId, userfullname, uid, Mobile
        FROM dbo.tbluser
        """
        result = db.session.execute(text(query))
        users = [dict(row._mapping) for row in result]
        return jsonify({"users_data": users}), 200
    
    except Exception as e:
        print("Error fetching user data:", e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/insert-user", methods=["POST"])
def insert_user_with_permissions():
    try:
        data = request.get_json()
        user_data = data.get('user_data')
        permission_data = data.get('permission_data')

        # Input validation
        if not user_data or not permission_data:
            return jsonify({"error": "Missing parameters"}), 400

        max_doc_no = db.session.query(func.max(TblUser.User_Id)).scalar() or 0
        new_doc_no = max_doc_no + 1
        user_data['User_Id'] = new_doc_no

        if 'Created_Date' in user_data:
            user_data['Created_Date'] = datetime.strptime(user_data['Created_Date'], '%Y-%m-%d')
        if 'Modified_Date' in user_data:
            user_data['Modified_Date'] = datetime.strptime(user_data['Modified_Date'], '%Y-%m-%d')

        new_user = TblUser(**user_data)
        db.session.add(new_user)
        db.session.flush()  
        uId = new_user.uid

        createdDetails = []

        for perm_item in permission_data:
            perm_item['User_Id'] = new_doc_no
            perm_item['uid'] = uId
            new_permission = TblUserDetail(**perm_item)
            new_user.details.append(new_permission)
            createdDetails.append(new_permission)

        db.session.commit()  

        return jsonify({
            "message": "User and permissions inserted successfully!",
            "head": tbl_user_schema.dump(new_user),
            "addedDetails": tbl_user_detail_schemas.dump(createdDetails),
        }), 201

    except Exception as e:
        print("Traceback", traceback.format_exc())
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/update-user", methods=["PUT"])
def update_user():
    try:
        uid = request.args.get('uid')
        data = request.get_json()
        user_data = data.get('user_data')
        permission_data = data.get('permission_data')

        if not user_data or not permission_data:
            return jsonify({"error": "Missing parameters"}), 400

        user = TblUser.query.filter_by(uid=uid).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        updatedPermissions = []

        for key, value in user_data.items():
            if key in ['Created_Date', 'Modified_Date', "LastActivityDate", "LockedDateTime"] and isinstance(value, str):
                value = datetime.strptime(value, '%Y-%m-%d')
            setattr(user, key, value)

        for perm_item in permission_data:
            if 'Created_Date' in perm_item and isinstance(perm_item['Created_Date'], str):
                perm_item['Created_Date'] = datetime.strptime(perm_item['Created_Date'], '%Y-%m-%d')
            if 'Modified_Date' in perm_item and isinstance(perm_item['Modified_Date'], str):
                perm_item['Modified_Date'] = datetime.strptime(perm_item['Modified_Date'], '%Y-%m-%d')
                
            perm_item['User_Id'] = user.User_Id
            perm_item['uid'] = uid

            existing_permission = TblUserDetail.query.filter_by(
                User_Id=user.User_Id,
                Program_Name=perm_item.get('Program_Name'),
                Tran_Type=perm_item.get('Tran_Type')
            ).first()

            if existing_permission:
                for field, value in perm_item.items():
                    setattr(existing_permission, field, value)
                existing_permission.Modified_Date = datetime.now()
                updatedPermissions.append(existing_permission)
            else:
                new_permission = TblUserDetail(**perm_item)
                db.session.add(new_permission)
                updatedPermissions.append(new_permission)
        db.session.commit()

        return jsonify({
            "message": "User and permissions updated successfully!",
            "head": tbl_user_schema.dump(user),
            "updatedDetails": tbl_user_detail_schemas.dump(updatedPermissions),
        }), 200

    except Exception as e:
        print("Traceback", traceback.format_exc())
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/delete_user", methods=["DELETE"])
def delete_user():
    try:
        uid = request.args.get('uid')
        companyCode = request.args.get('Company_Code')
        if not uid:
            return jsonify({"error": "Missing required parameter"}), 400

        with db.session.begin():
            deleted_contact_rows = TblUserDetail.query.filter_by(uid=uid).delete()
            deleted_master_rows = TblUser.query.filter_by(uid=uid).delete()

        db.session.commit()

        return jsonify({
            "message": f"Deleted {deleted_master_rows} master row(s) and {deleted_contact_rows} contact row(s) successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/get-next-user-Id", methods=["GET"])
def get_next_user_id():
    try:
        company_code = request.args.get('Company_Code')
        if not company_code:
            return jsonify({"error": "Missing 'Company_Code'"}), 400

        max_doc_no = db.session.query(func.max(TblUser.User_Id)).filter_by(Company_Code=company_code).scalar()

        next_doc_no = max_doc_no + 1 if max_doc_no else 1

        response = {
            "next_doc_no": next_doc_no
        }

        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/get_user_permissions", methods=["GET"])
def get_user_permissions():
    """Retrieve a specific OtherGSTInput record by document number."""
    try:
        company_code = request.args.get('Company_Code')
        Program_Name = request.args.get('Program_Name')
        uid = request.args.get('uid')
        if not all([company_code,Program_Name, uid]):
            return jsonify({'error': 'Missing parameters'}), 400

        try:
            company_code = int(company_code)
            Program_Name = str(Program_Name)
            uid = int(uid)
        except ValueError:
            return jsonify({'error': 'Invalid parameter type'}), 400

        user_detail_record = TblUserDetail.query.filter_by(Company_Code=company_code,Program_Name=Program_Name, uid=uid).first()
        if not user_detail_record:
            return jsonify({'error': 'No user detail record found'}), 404

        user_detail_data = tbl_user_detail_schema.dump(user_detail_record)

        
        return jsonify({ 'UserDetails': user_detail_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route(API_URL + "/getLastUserWithPermissions", methods=["GET"])
def getLastUserWithPermissions():
    try:
        Company_Code = request.args.get('Company_Code')
        if not Company_Code:
            return jsonify({"error": "Missing required parameters"}), 400

        last_user = TblUser.query.filter_by(Company_Code=Company_Code).order_by(TblUser.User_Id.desc()).first()

        if last_user is None:
            return jsonify({"error": "No records found"}), 404

        lastUid = last_user.uid

        additional_data = db.session.execute(text(userQuery), {'uid': lastUid})
        additional_data_rows = additional_data.fetchall()

        lastUserData = format_dates({column.name: getattr(last_user, column.name) for column in last_user.__table__.columns})

        lastUserPermissionData = [dict(row._mapping) for row in additional_data_rows]

        lastUserPermissionData = [format_dates(data) for data in lastUserPermissionData]

        response = {
            "lastUserData": lastUserData,
            "lastUserPermissionData": lastUserPermissionData
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/getProgramNames", methods=["GET"])
def get_program_names():
    try:
        program_names_raw = db.session.query(TblUserDetail.Program_Name).distinct().all()

        program_names = [name[0] for name in program_names_raw if name[0] and name[0].startswith('/')]

        def format_menu_name(program_name):
            name = program_name.lstrip('/')  
            name = name.replace('_', '-') 
            name = name.replace('utility', '')  
            name = name.replace('-', ' ')  
            return name.strip().title()

        menu_names = [format_menu_name(name) for name in program_names]

        return jsonify({
            "programNames": program_names,
            "menuNames": menu_names
        }), 200

    except Exception as e:
        print("Error fetching program names:", e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/getFirstUserWithPermissions", methods=["GET"])
def getFirstUserWithPermissions():
    try:
        Company_Code = request.args.get('Company_Code')
        if not Company_Code:
            return jsonify({"error": "Missing required parameters"}), 400

        first_user = TblUser.query.filter_by(Company_Code=Company_Code).order_by(TblUser.User_Id.asc()).first()

        if first_user is None:
            return jsonify({"error": "No records found"}), 404

        firstUid = first_user.uid

        additional_data = db.session.execute(text(userQuery), {'uid': firstUid})
        additional_data_rows = additional_data.fetchall()

        firstUserData = format_dates({column.name: getattr(first_user, column.name) for column in first_user.__table__.columns})

        firstUserPermissionData = [dict(row._mapping) for row in additional_data_rows]

        firstUserPermissionData = [format_dates(data) for data in firstUserPermissionData]
        response = {
            "lastUserData": firstUserData,
            "lastUserPermissionData": firstUserPermissionData
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/getNextUserWithPermissions", methods=["GET"])
def getNextUserWithPermissions():
    try:
        Company_Code = request.args.get('Company_Code')
        current_user_id = request.args.get('User_Id')
        
        if not Company_Code or not current_user_id:
            return jsonify({"error": "Missing required parameters"}), 400

        # Query the next user by Company_Code with a User_Id greater than the current one, ordered ascending
        next_user = TblUser.query.filter(
            TblUser.Company_Code == Company_Code,
            TblUser.User_Id > current_user_id
        ).order_by(TblUser.User_Id.asc()).first()

        if next_user is None:
            return jsonify({"error": "No next user found"}), 404

        nextUid = next_user.uid

        # Execute the additional query to fetch permissions or other related data
        additional_data = db.session.execute(text(userQuery), {'uid': nextUid})
        additional_data_rows = additional_data.fetchall()

        nextUserData = format_dates({column.name: getattr(next_user, column.name) for column in next_user.__table__.columns})
        nextUserPermissionData = [format_dates(dict(row._mapping)) for row in additional_data_rows]

        response = {
            "lastUserData": nextUserData,
            "lastUserPermissionData": nextUserPermissionData
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getPreviousUserWithPermissions", methods=["GET"])
def getPreviousUserWithPermissions():
    try:
        Company_Code = request.args.get('Company_Code')
        current_user_id = request.args.get('User_Id')
        
        if not Company_Code or not current_user_id:
            return jsonify({"error": "Missing required parameters"}), 400

        # Query the previous user by Company_Code with a User_Id less than the current one, ordered descending
        previous_user = TblUser.query.filter(
            TblUser.Company_Code == Company_Code,
            TblUser.User_Id < current_user_id
        ).order_by(TblUser.User_Id.desc()).first()

        if previous_user is None:
            return jsonify({"error": "No previous user found"}), 404

        previousUid = previous_user.uid

        # Execute the additional query to fetch permissions or other related data
        additional_data = db.session.execute(text(userQuery), {'uid': previousUid})
        additional_data_rows = additional_data.fetchall()

        previousUserData = format_dates({column.name: getattr(previous_user, column.name) for column in previous_user.__table__.columns})
        previousUserPermissionData = [format_dates(dict(row._mapping)) for row in additional_data_rows]

        response = {
            "lastUserData": previousUserData,
            "lastUserPermissionData": previousUserPermissionData
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/getUserWithPermissionById", methods=["GET"])
def getUserWithPermissionById():
    try:
        Company_Code = request.args.get('Company_Code')
        user_id = request.args.get('User_Id')
        
        if not Company_Code or not user_id:
            return jsonify({"error": "Missing required parameters"}), 400

        # Query the next user by Company_Code with a User_Id greater than the current one, ordered ascending
        user = TblUser.query.filter(
            TblUser.Company_Code == Company_Code,
            TblUser.User_Id == user_id
        ).first()

        if user is None:
            return jsonify({"error": "No next user found"}), 404

        uid = user.uid

        # Execute the additional query to fetch permissions or other related data
        additional_data = db.session.execute(text(userQuery), {'uid': uid})
        additional_data_rows = additional_data.fetchall()

        userData = format_dates({column.name: getattr(user, column.name) for column in user.__table__.columns})
        userPermissionData = [format_dates(dict(row._mapping)) for row in additional_data_rows]

        response = {
            "lastUserData": userData,
            "lastUserPermissionData": userPermissionData
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
