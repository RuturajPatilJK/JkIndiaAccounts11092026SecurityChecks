import traceback
from flask import Flask, jsonify, request
from app import app, db
from app.models.Outword.UnregisterBill.UnregisterBillModels import UnregisterBill
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
import os

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

Bill_QUERY = '''
SELECT customer.Ac_Name_E AS customername, saleac.Ac_Name_E AS salename, dbo.OtherInvoice.ac_code, dbo.OtherInvoice.sale_code
FROM     dbo.OtherInvoice LEFT OUTER JOIN
                  dbo.nt_1_accountmaster AS customer ON dbo.OtherInvoice.Company_Code = customer.company_code AND dbo.OtherInvoice.ac_code = customer.Ac_Code AND dbo.OtherInvoice.ac = customer.accoid LEFT OUTER JOIN
                  dbo.nt_1_accountmaster AS saleac ON dbo.OtherInvoice.Company_Code = saleac.company_code AND dbo.OtherInvoice.sale_code = saleac.Ac_Code AND dbo.OtherInvoice.sa = saleac.accoid

WHERE dbo.OtherInvoice.bill_id =:bill_id
'''

def format_dates(bill):
    return {
        "doc_date": bill.doc_date.strftime('%Y-%m-%d') if bill.doc_date else None
    }

@app.route(API_URL + "/insert-UnregisterBill", methods=["POST"])
def insert_UnregisterBill():
    try:
        new_record_data = request.json
        if not all([new_record_data.get('Company_Code'), new_record_data.get('Year_Code')]):
            return jsonify({'error': 'Missing Company_Code or Year_Code parameter'}), 400

        Company_Code = new_record_data['Company_Code']
        Year_Code = new_record_data['Year_Code']

        max_doc_no = db.session.query(func.max(UnregisterBill.doc_no)).filter_by(Company_Code=Company_Code, Year_Code=Year_Code).scalar()

       
        if max_doc_no is not None:
            new_record_data['doc_no'] = max_doc_no + 1
        else:
            new_record_data['doc_no'] = 1

        new_record = UnregisterBill(**new_record_data)
        db.session.add(new_record)
        db.session.commit()

        new_created_data = {column.name: getattr(new_record, column.name) for column in new_record.__table__.columns}
        new_created_data.update(format_dates(new_record))
        return jsonify({'message': 'Record created successfully', 'record': new_created_data}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL + "/update-UnregisterBill", methods=["PUT"])
def update_UnregisterBill():
    try:
        update_data = request.json
        if not all([update_data.get('doc_no'), update_data.get('Company_Code'), update_data.get('Year_Code')]):
            return jsonify({'error': 'Missing doc_no, Company_Code, or Year_Code parameter'}), 400

        Company_Code = update_data['Company_Code']
        Year_Code = update_data['Year_Code']
        doc_no = update_data['doc_no']

        # Find the existing record
        existing_record = UnregisterBill.query.filter_by(doc_no=doc_no, Company_Code=Company_Code, Year_Code=Year_Code).first()

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

@app.route(API_URL + "/delete-UnregisterBill", methods=["DELETE"])
def delete_UnregisterBill():
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

        existing_record = UnregisterBill.query.filter_by(doc_no=doc_no, Company_Code=Company_Code, Year_Code=Year_Code).first()
        if existing_record is None:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(existing_record)
        db.session.commit()
        return jsonify({'message': 'Record deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL + "/getFirst_UnregisterBill", methods=["GET"])
def getFirst_UnregisterBill():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        first_UnregisterBill = UnregisterBill.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(UnregisterBill.doc_no.asc()).first()

        if first_UnregisterBill is None:
            return jsonify({"error": "No records found"}), 404

        firstbill_id = first_UnregisterBill.bill_id

        additional_data = db.session.execute(text(Bill_QUERY), {'bill_id': firstbill_id})
        additional_data_rows = additional_data.fetchall()

        firstBillData = {column.name: getattr(first_UnregisterBill, column.name) for column in first_UnregisterBill.__table__.columns}
        firstBillData.update(format_dates(first_UnregisterBill))

        billLabels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "firstBillData": firstBillData,
            "billLabels": billLabels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getNext_UnregisterBill", methods=["GET"])
def getNext_UnregisterBill():
    try:
        doc_no = request.args.get('doc_no')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([doc_no, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        doc_no = int(doc_no)
        Company_Code = int(Company_Code)
        Year_Code = int(Year_Code)

        next_UnregisterBill = UnregisterBill.query.filter(
            UnregisterBill.doc_no > doc_no,
            UnregisterBill.Company_Code == Company_Code,
            UnregisterBill.Year_Code == Year_Code
        ).order_by(UnregisterBill.doc_no.asc()).first()

        if next_UnregisterBill is None:
            return jsonify({"error": "No next record found"}), 404

        nextbill_id = next_UnregisterBill.bill_id

        additional_data = db.session.execute(text(Bill_QUERY), {'bill_id': nextbill_id})
        additional_data_rows = additional_data.fetchall()

        nextBillData = {column.name: getattr(next_UnregisterBill, column.name) for column in next_UnregisterBill.__table__.columns}
        nextBillData.update(format_dates(next_UnregisterBill))

        billLabels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "nextBillData": nextBillData,
            "billLabels": billLabels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getLast_UnregisterBill", methods=["GET"])
def getLast_UnregisterBill():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_UnregisterBill = UnregisterBill.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(UnregisterBill.doc_no.desc()).first()

        if last_UnregisterBill is None:
            return jsonify({"error": "No records found"}), 404

        lastbill_id = last_UnregisterBill.bill_id

        additional_data = db.session.execute(text(Bill_QUERY), {'bill_id': lastbill_id})
        additional_data_rows = additional_data.fetchall()

        lastBillData = {column.name: getattr(last_UnregisterBill, column.name) for column in last_UnregisterBill.__table__.columns}
        lastBillData.update(format_dates(last_UnregisterBill))

        billLabels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "lastBillData": lastBillData,
            "billLabels": billLabels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getPrevious_UnregisterBill", methods=["GET"])
def getPrevious_UnregisterBill():
    try:
        doc_no = request.args.get('doc_no')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([doc_no, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        doc_no = int(doc_no)
        Company_Code = int(Company_Code)
        Year_Code = int(Year_Code)

        previous_UnregisterBill = UnregisterBill.query.filter(
            UnregisterBill.doc_no < doc_no,
            UnregisterBill.Company_Code == Company_Code,
            UnregisterBill.Year_Code == Year_Code
        ).order_by(UnregisterBill.doc_no.desc()).first()

        if previous_UnregisterBill is None:
            return jsonify({"error": "No previous record found"}), 404

        previousbill_id = previous_UnregisterBill.bill_id

        additional_data = db.session.execute(text(Bill_QUERY), {'bill_id': previousbill_id})
        additional_data_rows = additional_data.fetchall()

        previousBillData = {column.name: getattr(previous_UnregisterBill, column.name) for column in previous_UnregisterBill.__table__.columns}
        previousBillData.update(format_dates(previous_UnregisterBill))

        billLabels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "previousBillData": previousBillData,
            "billLabels": billLabels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getByDocNo_UnregisterBill", methods=["GET"])
def getByDocNo_UnregisterBill():
    try:
        doc_no = request.args.get('doc_no')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([doc_no, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        doc_no = int(doc_no)
        Company_Code = int(Company_Code)
        Year_Code = int(Year_Code)

        bill = UnregisterBill.query.filter_by(doc_no=doc_no, Company_Code=Company_Code, Year_Code=Year_Code).first()

        if bill is None:
            return jsonify({"error": "No record found"}), 404

        billData = {column.name: getattr(bill, column.name) for column in bill.__table__.columns}
        billData.update(format_dates(bill))

        additional_data = db.session.execute(text(Bill_QUERY), {'bill_id': bill.bill_id})
        additional_data_rows = additional_data.fetchall()

        billLabels = [dict(row._mapping) for row in additional_data_rows]

        response = {
            "billData": billData,
            "billLabels": billLabels
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getAll_UnregisterBill", methods=["GET"])
def getAll_UnregisterBill():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        bills = UnregisterBill.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).all()

        if not bills:
            return jsonify({"error": "No records found"}), 404

        all_records_data = []

        for bill in bills:
            billData = {column.name: getattr(bill, column.name) for column in bill.__table__.columns}
            billData.update(format_dates(bill))

            additional_data = db.session.execute(text(Bill_QUERY), {'bill_id': bill.bill_id})
            additional_data_rows = additional_data.fetchall()

            billLabels = [dict(row._mapping) for row in additional_data_rows]

            record_response = {
                "billData": billData,
                "billLabels": billLabels
            }

            all_records_data.append(record_response)

        response = {
            "all_UnregisterBills_data": all_records_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
