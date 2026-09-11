import traceback
from flask import Flask, jsonify, request
from app import app, db
from app.models.Transactions.PaymentNote.PaymentNoteModels import PaymentNote
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func
import os
import requests

API_URL= os.getenv('API_URL')

#common query to get all data from the database.
PaymentNote_QUERY = '''
SELECT BankOrCash.Ac_Name_E AS BankCashName, PaymentTo.Ac_Name_E AS PaymentToName
FROM     dbo.PaymentNote INNER JOIN
                  dbo.nt_1_accountmaster AS BankOrCash ON dbo.PaymentNote.bank_ac = BankOrCash.Ac_Code AND dbo.PaymentNote.Company_Code = BankOrCash.company_code AND dbo.PaymentNote.ba = BankOrCash.accoid INNER JOIN
                  dbo.nt_1_accountmaster AS PaymentTo ON dbo.PaymentNote.payment_to = PaymentTo.Ac_Code AND dbo.PaymentNote.pt = PaymentTo.accoid AND dbo.PaymentNote.Company_Code = PaymentTo.company_code
WHERE dbo.PaymentNote.pid =:pid
'''

#format dates
def format_dates(paymentNote):
    return {
        "doc_date": paymentNote.doc_date.strftime('%Y-%m-%d') if paymentNote.doc_date else None
    }

#GET all data from the database.
@app.route(API_URL + "/getData_PaymentNote", methods=["GET"])
def getData_PaymentNote():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        paymentNotesData = PaymentNote.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(PaymentNote.doc_no.desc()).all()

        if not paymentNotesData:
            return jsonify({"error": "No records found"}), 404

        all_records_data = []

        for paymentNote in paymentNotesData:
            newpid = paymentNote.pid

            additional_data = db.session.execute(text(PaymentNote_QUERY), {'pid': newpid})
            additional_data_rows = additional_data.fetchall()

            paymentNoteData = {column.name: getattr(paymentNote, column.name) for column in paymentNote.__table__.columns}
            paymentNoteData.update(format_dates(paymentNote))

            paymentNoteLabels = [dict(row._mapping) for row in additional_data_rows]

            combined_data = paymentNoteData
            combined_data["paymentNoteLabels"] = paymentNoteLabels

            all_records_data.append(combined_data)

        response = {
            "all_payment_notes_data": all_records_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# We have to get the data By the Particular doc_no AND tran_type
@app.route(API_URL+"/PaymentNoteById", methods=["GET"])
def getPaymentNoteById():
    try:
        doc_no = request.args.get('doc_no')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code, doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        paymentNoteDataById = PaymentNote.query.filter_by(doc_no=doc_no,Company_Code=Company_Code,Year_Code=Year_Code).first()

        if paymentNoteDataById is None:
            return jsonify({"error": "No record found"}), 404

        newpid = paymentNoteDataById.pid

        additional_data = db.session.execute(text(PaymentNote_QUERY), {'pid' : newpid})

        additional_data_rows = additional_data.fetchall()
      
        row = additional_data_rows[0] if additional_data_rows else None
        paymentNoteById = {column.name: getattr(paymentNoteDataById, column.name) for column in paymentNoteDataById.__table__.columns}
        paymentNoteById.update(format_dates(paymentNoteDataById))

        paymentNoteLabels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "payment_Note_Data_By_Id": paymentNoteById,
            "paymentNoteLabels": paymentNoteLabels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#POST data from the database
@app.route(API_URL + "/insert-PaymentNote", methods=["POST"])
def insert_PaymentNote():
    try:
        new_record_data = request.json
        if not all([new_record_data.get('Company_Code'), new_record_data.get('Year_Code')]):
            return jsonify({'error': 'Missing Company_Code or Year_Code parameter'}), 400

        Company_Code = new_record_data['Company_Code']
        Year_Code = new_record_data['Year_Code']

        max_doc_no = db.session.query(func.max(PaymentNote.doc_no)).filter_by(Company_Code=Company_Code, Year_Code=Year_Code).scalar()

        if max_doc_no is not None:
            new_record_data['doc_no'] = max_doc_no + 1
        else:
            new_record_data['doc_no'] = 1

        new_record = PaymentNote(**new_record_data)
        db.session.add(new_record)
        db.session.commit()
        
        new_created_data = {column.name: getattr(new_record, column.name) for column in new_record.__table__.columns}
        new_created_data.update(format_dates(new_record))
        return jsonify({'message': 'Record created successfully', 'record': new_created_data}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
#Update data from the database.
@app.route(API_URL + "/update-PaymentNote", methods=["PUT"])
def update_PaymentNote():
    try:
        update_data = request.json
        if not all([update_data.get('doc_no'), update_data.get('Company_Code'), update_data.get('Year_Code')]):
            return jsonify({'error': 'Missing doc_no, Company_Code, or Year_Code parameter'}), 400

        Company_Code = update_data['Company_Code']
        Year_Code = update_data['Year_Code']
        doc_no = update_data['doc_no']

        existing_record = PaymentNote.query.filter_by(doc_no=doc_no, Company_Code=Company_Code, Year_Code=Year_Code).first()

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
    
#Delete data from the database.
@app.route(API_URL + "/delete-PaymentNote", methods=["DELETE"])
def delete_PaymentNote():
    try:
        doc_no = request.args.get('doc_no')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Company_Code, Year_Code, doc_no]):
            return jsonify({'error': 'Missing doc_no, Company_Code or Year_Code parameter'}), 400

        try:
            doc_no = int(doc_no)
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({'error': 'Invalid doc_no, Company_Code or Year_Code parameter'}), 400

        existing_record = PaymentNote.query.filter_by(doc_no=doc_no, Company_Code=Company_Code, Year_Code=Year_Code).first()
        if existing_record is None:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(existing_record)
        db.session.commit()
        return jsonify({'message': 'Record deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
#Navigation APIS
@app.route(API_URL+"/getFirst_PaymentNote", methods=["GET"])
def getFirst_PaymentNote():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        first_PaymentNote = PaymentNote.query.filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(PaymentNote.doc_no.asc()).first()

        firstpid = first_PaymentNote.pid

        additional_data = db.session.execute(text(PaymentNote_QUERY), {'pid' : firstpid})

        additional_data_rows = additional_data.fetchall()
      
        row = additional_data_rows[0] if additional_data_rows else None
        firstPaymentNoteData = {column.name: getattr(first_PaymentNote, column.name) for column in first_PaymentNote.__table__.columns}
        firstPaymentNoteData.update(format_dates(first_PaymentNote))

        paymentNoteLabels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "firstPaymentNoteData": firstPaymentNoteData,
            "paymentNoteLabels": paymentNoteLabels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL+"/getNext_PaymentNote", methods=["GET"])
def getNext_PaymentNote():
    try:
        doc_no = request.args.get('doc_no')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([doc_no, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        doc_no = int(doc_no)
        Company_Code = int(Company_Code)
        Year_Code = int(Year_Code)

        next_PaymentNote = PaymentNote.query.filter(
            PaymentNote.doc_no > doc_no,
            PaymentNote.Company_Code == Company_Code,
            PaymentNote.Year_Code == Year_Code
        ).order_by(PaymentNote.doc_no.asc()).first()

        if next_PaymentNote is None:
            return jsonify({"error": "No next record found"}), 404

        nextpid = next_PaymentNote.pid

        additional_data = db.session.execute(text(PaymentNote_QUERY), {'pid': nextpid})

        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        nextPaymentNoteData = {column.name: getattr(next_PaymentNote, column.name) for column in next_PaymentNote.__table__.columns}
        nextPaymentNoteData.update(format_dates(next_PaymentNote))

        paymentNoteLabels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "nextPaymentNoteData": nextPaymentNoteData,
            "paymentNoteLabels": paymentNoteLabels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

@app.route(API_URL + "/getNextDocNo_PaymentNote", methods=["GET"])
def getNextDocNo_PaymentNote():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        max_doc_no = db.session.query(func.max(PaymentNote.doc_no)).filter_by(Company_Code=Company_Code, Year_Code=Year_Code).scalar()

        if max_doc_no is None:
            next_doc_no = 1  
        else:
            next_doc_no = max_doc_no + 1  

        response = {
            "next_doc_no": next_doc_no
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL+"/getLast_PaymentNote", methods=["GET"])
def getLast_PaymentNote():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_PaymentNote = PaymentNote.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(PaymentNote.doc_no.desc()).first()

        if last_PaymentNote is None:
            return jsonify({"error": "No records found"}), 404

        lastpid = last_PaymentNote.pid

        additional_data = db.session.execute(text(PaymentNote_QUERY), {'pid': lastpid})

        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        lastPaymentNoteData = {column.name: getattr(last_PaymentNote, column.name) for column in last_PaymentNote.__table__.columns}
        lastPaymentNoteData.update(format_dates(last_PaymentNote))

        paymentNoteLabels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "lastPaymentNoteData": lastPaymentNoteData,
            "paymentNoteLabels": paymentNoteLabels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL+"/getPrevious_PaymentNote", methods=["GET"])
def getPrevious_PaymentNote():
    try:
        doc_no = request.args.get('doc_no')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([doc_no, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        doc_no = int(doc_no)
        Company_Code = int(Company_Code)
        Year_Code = int(Year_Code)

        previous_PaymentNote = PaymentNote.query.filter(
            PaymentNote.doc_no < doc_no,
            PaymentNote.Company_Code == Company_Code,
            PaymentNote.Year_Code == Year_Code
        ).order_by(PaymentNote.doc_no.desc()).first()

        if previous_PaymentNote is None:
            return jsonify({"error": "No previous record found"}), 404

        previouspid = previous_PaymentNote.pid

        additional_data = db.session.execute(text(PaymentNote_QUERY), {'pid': previouspid})

        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        previousPaymentNoteData = {column.name: getattr(previous_PaymentNote, column.name) for column in previous_PaymentNote.__table__.columns}
        previousPaymentNoteData.update(format_dates(previous_PaymentNote))

        paymentNoteLabels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "previousPaymentNoteData": previousPaymentNoteData,
            "paymentNoteLabels": paymentNoteLabels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500