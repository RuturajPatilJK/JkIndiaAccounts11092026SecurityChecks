from flask import jsonify, request
from app import app, db
import bcrypt
import os
from app.models.UserRegistration.UserRegistration import User

API_URL = os.getenv('API_URL')

# User Registration API
@app.route(API_URL + "/register-user", methods=["POST"])
def register_user():
    try:
        user_data = request.json
        
        email = user_data.get('email')
        password = user_data.get('password')

        if not email or not password:
            return jsonify({'error': 'All fields are required (email, password)'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 409

        if 'password' in user_data:
            user_data['password'] = bcrypt.hashpw(
                user_data['password'].encode('utf-8'), bcrypt.gensalt()
            ).decode('utf-8')

        new_user = User(**user_data)

        db.session.add(new_user)
        db.session.commit()

        return jsonify({'message': 'User registered successfully', 'user_id': new_user.ID}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500