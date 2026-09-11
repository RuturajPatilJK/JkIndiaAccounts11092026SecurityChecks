from flask import jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from app import app
from app.models.LoginModels.LoginModels import GroupUser
from datetime import timedelta
import os
import bcrypt
API_URL= os.getenv('API_URL')

# API route for user login
@app.route(API_URL + '/login', methods=['POST'])
def login():
    login_data = request.json
    if not login_data:
        return jsonify({'error': 'No data provided'}), 400
    login_name = login_data.get('Login_Name')
    password = login_data.get('Password')

    if not login_name or not password:
        return jsonify({'error': 'Login name and password are required'}), 400
    user = GroupUser.query.filter_by(Login_Name=login_name).first()

    if not user:
        return jsonify({'error': 'Invalid Login Credentials'}), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user.Password.encode('utf-8')):
        return jsonify({'error': 'Invalid Login Credentials'}), 401

    user_data = user.__dict__

    user_data.pop('_sa_instance_state', None)
    user_data.pop('Password', None)

    access_token = create_access_token(identity=login_name, fresh=True, expires_delta=timedelta(minutes=30))
    refresh_token = create_refresh_token(identity=login_name, expires_delta=timedelta(days=7))

    resp = jsonify({'message': 'Login successful', 'user_data': user_data})
    set_access_cookies(resp, access_token)
    set_refresh_cookies(resp, refresh_token)
    return resp, 200

# Mints a new access token cookie from a still-valid refresh token cookie.
@app.route(API_URL + '/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity, fresh=False, expires_delta=timedelta(minutes=30))
    resp = jsonify({'message': 'Token refreshed'})
    set_access_cookies(resp, access_token)
    return resp, 200

@app.route(API_URL + '/logout', methods=['POST'])
def logout():
    resp = jsonify({'message': 'Logged out'})
    unset_jwt_cookies(resp)
    return resp, 200

@app.route(API_URL + '/check-token', methods=['GET'])
@jwt_required()
def check_token():
    identity = get_jwt_identity()
    new_token = create_access_token(identity=identity, expires_delta=timedelta(minutes=30))
    return jsonify({
        "msg": "Token is valid",
        "new_token": new_token
    }), 200