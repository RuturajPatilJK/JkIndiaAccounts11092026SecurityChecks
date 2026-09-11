from app import app, db, socketio
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from flask import jsonify, request
from datetime import datetime
from flask_socketio import SocketIO
from app.models.EwayBillonlinePortal.EWayBillReportModels import EWayBillPortal
import os
from flask_mail import Mail, Message

API_URL = os.getenv('API_URL')

mail = Mail(app)

# Purchase Bill Report Data
@app.route(API_URL + '/send-pdf-email-onlineportal', methods=['POST'])
def send_pdf_email_onlineportal():
    try:
        emails = request.form.get('email')
        pdf_file = request.files.get('pdf')
        message = request.form.get('message')
        messagebody = request.form.get('messagebody')
        ewbNo = request.form.get('ewbNo')
        query_label = request.form.get('query_label')

        if not emails or not pdf_file or not ewbNo or not query_label:
            return jsonify({'error': 'Email, PDF file, ewbNo, and query_label are required'}), 400

        email_list = emails.split(',') 
        recipients = [email.strip() for email in email_list if email.strip()] 

        # Send email to multiple recipients
        msg = Message(message, recipients=recipients)
        msg.body = messagebody
        msg.attach(pdf_file.filename, 'application/pdf', pdf_file.read())
        mail.send(msg)

        # Update database based on query_label
        if query_label == 'SaleBill':
            update_query = text("UPDATE EWayBillPortalDetails SET SaleBill_Print = 'Y' WHERE ewbNo = :ewbNo")
        elif query_label == 'EwayBill':
            update_query = text("UPDATE EWayBillPortalDetails SET EWayBill_Print = 'Y' WHERE ewbNo = :ewbNo")
        else:
            return jsonify({'error': 'Invalid query_label. Use "sale bill" or "eway bill".'}), 400

        db.session.execute(update_query, {'ewbNo': ewbNo})
        db.session.commit()

        socketio.emit('pdf_email_status', {'status': 'success', 'message': 'Email sent and database updated successfully', 'ewbNo': ewbNo})
        return jsonify({'message': 'Email sent and database updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify({'error': 'Failed to process the request'}), 500
    
#Update the record on the basis of the Button Sale Bill and EwayBill Print
@app.route(API_URL + '/update-ewb-status', methods=['POST'])
def update_ewb_status():
    try:
        ewbNo = request.args.get('ewbNo')
        query_label = request.args.get('query_label')

        if not ewbNo or not query_label:
            return jsonify({'error': 'ewbNo and query_label are required'}), 400
        
        socketio.emit('pdf_email_status', {'status': 'updating', 'message': 'Updating database...', 'ewbNo': ewbNo})

        if query_label == 'SaleBill':
            update_query = text("""
                UPDATE EWayBillPortalDetails
                SET SaleBill_Print = 'Y'
                WHERE ewbNo = :ewbNo
            """)
        elif query_label == 'EwayBill':
            update_query = text("""
                UPDATE EWayBillPortalDetails
                SET EWayBill_Print = 'Y'
                WHERE ewbNo = :ewbNo
            """)
        else:
            return jsonify({'error': 'Invalid query_label. Use "SaleBill" or "EwayBill".'}), 400

        db.session.execute(update_query, {'ewbNo': ewbNo})
        db.session.commit()

        socketio.emit('pdf_email_status', {'status': 'success', 'message': 'Database updated successfully', 'ewbNo': ewbNo})

        return jsonify({'message': 'Database updated successfully'}), 200

    except SQLAlchemyError as db_err:
        db.session.rollback()
        socketio.emit('pdf_email_status', {'status': 'error', 'message': 'Failed to update the database', 'ewbNo': ewbNo})
        return jsonify({'error': 'Failed to update the database'}), 500

    except Exception as e:
        socketio.emit('pdf_email_status', {'status': 'error', 'message': 'Failed to process the request', 'ewbNo': ewbNo})
        return jsonify({'error': 'Failed to process the request'}), 500

