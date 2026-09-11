import traceback
from flask import Flask, jsonify, request
from app import app, db
from app.models.BusinessReleted.Letter.LetterModels import Letter
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
import os

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

def format_dates(letter):
    return {
        "DOC_DATE": letter.DOC_DATE.strftime('%Y-%m-%d') if letter.DOC_DATE else None,
        "REF_DT": letter.REF_DT.strftime('%Y-%m-%d') if letter.REF_DT else None,
    }

@app.route(API_URL + "/insert-Letter", methods=["POST"])
def insert_Letter():
    try:
        new_record_data = request.json
        if not all([new_record_data.get('Company_Code'), new_record_data.get('Year_Code')]):
            return jsonify({'error': 'Missing Company_Code or Year_Code parameter'}), 400

        new_record = Letter(**new_record_data)
        db.session.add(new_record)
        db.session.commit()

        new_created_data = {column.name: getattr(new_record, column.name) for column in new_record.__table__.columns}
        new_created_data.update(format_dates(new_record))
        return jsonify({'message': 'Record created successfully', 'record': new_created_data}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL + "/update-Letter", methods=["PUT"])
def update_Letter():
    try:
        update_data = request.json
        if not all([update_data.get('DOC_NO'), update_data.get('Company_Code'), update_data.get('Year_Code')]):
            return jsonify({'error': 'Missing DOC_NO, Company_Code, or Year_Code parameter'}), 400

        Company_Code = update_data['Company_Code']
        Year_Code = update_data['Year_Code']
        DOC_NO = update_data['DOC_NO']

        # Find the existing record
        existing_record = Letter.query.filter_by(DOC_NO=DOC_NO, Company_Code=Company_Code, Year_Code=Year_Code).first()

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

@app.route(API_URL + "/delete-Letter", methods=["DELETE"])
def delete_Letter():
    try:
        DOC_NO = request.args.get('DOC_NO')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Company_Code, Year_Code, DOC_NO]):
            return jsonify({'error': 'Missing DOC_NO, Company_Code or Year_Code parameter'}), 400

        try:
            DOC_NO = int(DOC_NO)
            Company_Code = int(Company_Code)
            Year_Code = int(Year_Code)
        except ValueError:
            return jsonify({'error': 'Invalid DOC_NO, Company_Code or Year_Code parameter'}), 400

        existing_record = Letter.query.filter_by(DOC_NO=DOC_NO, Company_Code=Company_Code, Year_Code=Year_Code).first()
        if existing_record is None:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(existing_record)
        db.session.commit()
        return jsonify({'message': 'Record deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL+"/getFirst_Letter", methods=["GET"])
def getFirst_Letter():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        first_Letter = Letter.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(Letter.DOC_NO.asc()).first()

        if first_Letter is None:
            return jsonify({"error": "No records found"}), 404


        firstLetterData = {column.name: getattr(first_Letter, column.name) for column in first_Letter.__table__.columns}
        firstLetterData.update(format_dates(first_Letter))


        response = {
            "firstLetterData": firstLetterData,
    
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL+"/getNext_Letter", methods=["GET"])
def getNext_Letter():
    try:
        DOC_NO = request.args.get('DOC_NO')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([DOC_NO, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        DOC_NO = int(DOC_NO)
        Company_Code = int(Company_Code)
        Year_Code = int(Year_Code)

        next_Letter = Letter.query.filter(
            Letter.DOC_NO > DOC_NO,
            Letter.Company_Code == Company_Code,
            Letter.Year_Code == Year_Code
        ).order_by(Letter.DOC_NO.asc()).first()

        if next_Letter is None:
            return jsonify({"error": "No next record found"}), 404



        nextLetterData = {column.name: getattr(next_Letter, column.name) for column in next_Letter.__table__.columns}
        nextLetterData.update(format_dates(next_Letter))

        response = {
            "nextLetterData": nextLetterData
           
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL+"/getLast_Letter", methods=["GET"])
def getLast_Letter():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_Letter = Letter.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(Letter.DOC_NO.desc()).first()

        if last_Letter is None:
            return jsonify({"error": "No records found"}), 404


        lastLetterData = {column.name: getattr(last_Letter, column.name) for column in last_Letter.__table__.columns}
        lastLetterData.update(format_dates(last_Letter))


        response = {
            "lastLetterData": lastLetterData
           
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL+"/getPrevious_Letter", methods=["GET"])
def getPrevious_Letter():
    try:
        DOC_NO = request.args.get('DOC_NO')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([DOC_NO, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        DOC_NO = int(DOC_NO)
        Company_Code = int(Company_Code)
        Year_Code = int(Year_Code)

        previous_Letter = Letter.query.filter(
            Letter.DOC_NO < DOC_NO,
            Letter.Company_Code == Company_Code,
            Letter.Year_Code == Year_Code
        ).order_by(Letter.DOC_NO.desc()).first()

        if previous_Letter is None:
            return jsonify({"error": "No previous record found"}), 404


        previousLetterData = {column.name: getattr(previous_Letter, column.name) for column in previous_Letter.__table__.columns}
        previousLetterData.update(format_dates(previous_Letter))


        response = {
            "previousLetterData": previousLetterData,
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getByDocNo_Letter", methods=["GET"])
def getByDocNo_Letter():
    try:
        DOC_NO = request.args.get('DOC_NO')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([DOC_NO, Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        DOC_NO = int(DOC_NO)
        Company_Code = int(Company_Code)
        Year_Code = int(Year_Code)

        letter = Letter.query.filter_by(DOC_NO=DOC_NO, Company_Code=Company_Code, Year_Code=Year_Code).first()

        if letter is None:
            return jsonify({"error": "No record found"}), 404

        letterData = {column.name: getattr(letter, column.name) for column in letter.__table__.columns}
        letterData.update(format_dates(letter))


        response = {
            "letterData": letterData
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route(API_URL + "/getAll_Letter", methods=["GET"])
def getAll_Letter():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        letters = Letter.query.filter_by(Company_Code=Company_Code, Year_Code=Year_Code).order_by(Letter.DOC_NO.desc()).all()

        if not letters:
            return jsonify({"error": "No records found"}), 404

        all_records_data = []

        for letter in letters:
            letterData = {column.name: getattr(letter, column.name) for column in letter.__table__.columns}
            letterData.update(format_dates(letter))

            all_records_data.append(letterData)

        response = {
            "all_letters_data": all_records_data
        }
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route(API_URL + "/get-next-letter-no", methods=["GET"])
def get_next_letter_no():
    try:
        # Get the company_code and year_code from the request parameters
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        max_doc_no = db.session.query(func.max(Letter.DOC_NO)).filter_by(Company_Code=company_code, Year_Code=year_code).scalar()

        next_doc_no = max_doc_no + 1 if max_doc_no else 1

        response = {
            "next_doc_no": next_doc_no
        }

        # Return the next doc_no
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
