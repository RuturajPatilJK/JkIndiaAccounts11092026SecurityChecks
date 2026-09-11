from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from flask import jsonify, request
from flask import Flask, jsonify, request
from flask_mail import Mail, Message
import os

API_URL = os.getenv('API_URL')

mail = Mail(app)

@app.route(API_URL+'/send-pdf-email', methods=['POST'])
def send_pdf_email():
    try:
        email = request.form.get('email')
        pdf_file = request.files.get('pdf')
        message = request.form.get('message')
        messagebody = request.form.get('messagebody')

        if not email or not pdf_file:
            return jsonify({'error': 'Email, PDF file are required'}), 400

        # Send email
        msg = Message(message, recipients=[email])
        msg.body = messagebody
        msg.attach(pdf_file.filename, 'application/pdf', pdf_file.read())
        mail.send(msg)

        return jsonify({'message': 'Email sent successfully'}), 200
    except Exception as e:
        print(f"Error sending email: {e}")
        return jsonify({'error': 'Failed to send email'}), 500