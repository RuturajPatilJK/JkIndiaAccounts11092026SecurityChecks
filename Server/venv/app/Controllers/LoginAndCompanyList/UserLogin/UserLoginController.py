from flask import jsonify, request
from app import app, db
from app.models.Utilities.UserCreationWithPermission.UserCreationWithPermissionModel import TblUser
from sqlalchemy import text
from app.utils.CommonGLedgerFunctions import get_accoid
from flask_jwt_extended import jwt_required,get_jwt_identity
import os
import bcrypt
API_URL= os.getenv('API_URL')

@app.route(API_URL+'/userlogin', methods=['POST'])
def userlogin():
    login_data = request.get_json()
    if not login_data:
        return jsonify({'error': 'No data provided'}), 400

    login_name = login_data.get('User_Name')
    password = login_data.get('User_Password')
    Company_Code = login_data.get('Company_Code')

    if not login_name or not password:
        return jsonify({'error': 'Both username and password are required'}), 400

    user = TblUser.query.filter_by(User_Name=login_name, Company_Code=Company_Code).first()
    if user is None:
        return jsonify({'error': 'User not found'}), 404

    if not bcrypt.checkpw(password.encode('utf-8'), user.User_Password.encode('utf-8')):
        return jsonify({'error': 'Invalid login credentials'}), 401

    return jsonify({'message': 'Login successful', 'user_id': user.uid,'User_ID':user.User_Id}), 200


@app.route(API_URL+'/get_self_ac', methods=['GET'])
def get_self_ac():
    # Parse query parameters
    company_code = request.args.get('Company_Code')

    if not company_code:
        return jsonify({'error': 'Both Company_Code is required'}), 400

    try:
        company_code = int(company_code)
    except ValueError:
        return jsonify({'error': 'Company_Code  must be integers'}), 400

    query = text("SELECT SELF_AC FROM nt_1_companyparameters WHERE Company_Code=:company_code ")
    result = db.session.execute(query, {'company_code': company_code}).fetchone()

    if result is None:
        return jsonify({'error': 'No data found for the given Company_Code and Year_Code'}), 404

    self_ac = result.SELF_AC

    accoid = get_accoid(self_ac,company_code)

    return jsonify({
        'SELF_AC': self_ac,
        'Self_acid':accoid,
        }), 200

#Change Password Functionality
@app.route(API_URL + '/change_password', methods=['PUT'])
# @jwt_required() 
def change_password():
    # current_user = get_jwt_identity()

    change_data = request.json
    if not change_data:
        return jsonify({'error': 'No data provided'}), 400

    uid = change_data.get('uid')
    old_password = change_data.get('Old_Password')
    new_password = change_data.get('New_Password')

    if not uid or not old_password or not new_password:
        return jsonify({'error': 'uid, Old_Password, and New_Password are required'}), 400

    user = TblUser.query.filter_by(uid=uid).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if not bcrypt.checkpw(old_password.encode('utf-8'), user.User_Password.encode('utf-8')):
        return jsonify({'error': 'Old password is incorrect'}), 401

    user.User_Password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    try:
        db.session.commit()
        return jsonify({'message': 'Password changed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

@app.route(API_URL + '/update_user_profile', methods=['PUT'])
def update_user_profile():
    uid = request.args.get('uid')
    if not uid:
        return jsonify({'error': 'UID query parameter is required'}), 400

    try:
        uid = int(uid)
    except ValueError:
        return jsonify({'error': 'UID must be an integer'}), 400

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided in request body'}), 400

    new_username = data.get('User_Name')
    new_fullname = data.get('userfullname')
    new_email = data.get('EmailId')
    new_phone = data.get('Mobile')

    user = TblUser.query.filter_by(uid=uid).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if new_username:
        user.User_Name = new_username
    if new_fullname:
        user.userfullname = new_fullname
    if new_email:
        user.EmailId = new_email
    if new_phone:
        user.Mobile = new_phone

    try:
        db.session.commit()
        return jsonify({'message': 'User details updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
