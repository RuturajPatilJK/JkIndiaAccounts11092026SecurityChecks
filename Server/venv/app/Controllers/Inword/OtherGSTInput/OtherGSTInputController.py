from sqlalchemy.sql import text, func, desc
from flask import jsonify, request
from app import app, db
from app.models.Inword.OtherGSTInput.OtherGSTInputModel import OtherGSTInput  
import os

API_URL= os.getenv('API_URL')

sql_query = text('''
    SELECT        am.Ac_Name_E
FROM            dbo.nt_1_accountmaster AS am INNER JOIN
                         dbo.other_input_gst AS gst ON am.accoid = gst.ea
    WHERE gst.Doc_No = :doc_no
''')


def format_dates(Data):
    return {
        "Doc_Date": Data.Doc_Date.strftime('%Y-%m-%d') if Data.Doc_Date else None,
        "Modified_Date":Data.Modified_Date.strftime('%Y-%m-%d') if Data.Modified_Date else None,
        "Created_Date":Data.Created_Date.strftime('%Y-%m-%d') if Data.Created_Date else None
    }

@app.route(API_URL+"/getall-OtherGSTInput", methods=["GET"])
def get_all_OtherGSTInput():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not company_code or not year_code:
            return jsonify({'error': 'Missing Company_Code or Year_Code parameter'}), 400

        try:
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or Year_Code parameter'}), 400

        records = OtherGSTInput.query.filter_by(Year_Code=year_code, Company_Code=company_code).order_by(desc(OtherGSTInput.Doc_No)).all()
        record_data = [
            {**{column.key: getattr(record, column.key) for column in record.__table__.columns},
              **format_dates(record)}
            for record in records
        ]
        return jsonify({"all_data": record_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#GET Records by next doc number. 
@app.route( API_URL+"/getNextDocNo_OtherGSTInput", methods=["GET"])
def getNextDocNo_OtherGSTInput():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')

        if not all([Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        max_doc_no = db.session.query(func.max(OtherGSTInput.Doc_No)).filter_by(Company_Code=Company_Code, Year_Code=Year_Code).scalar()

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

@app.route(API_URL+"/get-OtherGSTInput-by-DocNo", methods=["GET"])
def get_OtherGSTInput_by_doc_no():
    """Retrieve a specific OtherGSTInput record by document number."""
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        doc_no = request.args.get('Doc_No')
        if not all([company_code, year_code, doc_no]):
            return jsonify({'error': 'Missing parameters'}), 400

        try:
            company_code = int(company_code)
            year_code = int(year_code)
            doc_no = int(doc_no)
        except ValueError:
            return jsonify({'error': 'Invalid parameter type'}), 400

        record = OtherGSTInput.query.filter_by(Company_Code=company_code, Year_Code=year_code, Doc_No=doc_no).first()
        if not record:
            return jsonify({'error': 'No record found'}), 404

        account_name_result = db.session.execute(sql_query, {'doc_no': record.Doc_No})
        account_name = account_name_result.scalar()
        record_data = {column.name: getattr(record, column.name) for column in record.__table__.columns}

        record_data.update(format_dates(record))
        record_data['Account_Name'] = account_name  
        return jsonify(record_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route(API_URL+"/create-OtherGSTInput", methods=["POST"])
def create_OtherGSTInput():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not company_code or not year_code:
            return jsonify({'error': 'Missing Company_Code or year code parameter'}), 400

        try:
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or year code parameter'}), 400

        max_doc_no = db.session.query(db.func.max(OtherGSTInput.Doc_No)).filter_by(Company_Code=company_code, Year_Code=year_code).scalar() or 0
        new_record_data = request.json
        new_record_data['Doc_No'] = max_doc_no + 1
        new_record_data['Company_Code'] = company_code
        new_record_data['Year_Code'] = year_code

        new_record = OtherGSTInput(**new_record_data)
        db.session.add(new_record)
        db.session.commit()

        return jsonify({'message': 'Record created successfully', 'record': new_record_data}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL+"/update-OtherGSTInput", methods=["PUT"])
def update_OtherGSTInput():
    try:
        doc_no = request.args.get('Doc_No')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not all([doc_no, company_code, year_code]):
            return jsonify({'error': 'Missing Doc_No, Company_Code, or Year_Code parameter'}), 400

        try:
            doc_no = int(doc_no)
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Doc_No, Company_Code, or Year_Code parameter'}), 400

        record = OtherGSTInput.query.filter_by(Doc_No=doc_no, Company_Code=company_code, Year_Code=year_code).first()
        if not record:
            return jsonify({'error': 'Record not found'}), 404

        update_data = request.json
        for key, value in update_data.items():
            setattr(record, key, value)
            

        db.session.commit()

        return jsonify({'message': 'Record updated successfully', 'record': update_data})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL+"/delete-OtherGSTInput", methods=["DELETE"])
def delete_OtherGSTInput():
    try:
        doc_no = request.args.get('Doc_No')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not all([doc_no, company_code, year_code]):
            return jsonify({'error': 'Missing Doc_No, Company_Code, or Year_Code parameter'}), 400

        try:
            doc_no = int(doc_no)
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Doc_No, Company_Code, or Year_Code parameter'}), 400

        record = OtherGSTInput.query.filter_by(Doc_No=doc_no, Company_Code=company_code, Year_Code=year_code).first()
        if not record:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(record)
        db.session.commit()

        return jsonify({'message': 'Record deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    
@app.route(API_URL+"/get-first-OtherGSTInput", methods=["GET"])
def get_first_OtherGSTInput():
    try:
        company_code = request.args.get('Company_Code')
        year_code=request.args.get('Year_Code')
        if company_code is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code or year_code parameter'}), 400

        try:
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or year_code parameter'}), 400
        first_user_creation = OtherGSTInput.query.filter_by(Company_Code=company_code,Year_Code = year_code).order_by(OtherGSTInput.Doc_No.asc()).first()
        if first_user_creation:
           
            account_name_result = db.session.execute(sql_query, {'doc_no': first_user_creation.Doc_No})
            account_name = account_name_result.scalar()
            serialized_last_user_creation = {column.name: getattr(first_user_creation, column.name) for column in first_user_creation.__table__.columns}

            serialized_last_user_creation.update(format_dates(first_user_creation))
            serialized_last_user_creation['Account_Name'] = account_name  
            return jsonify(serialized_last_user_creation)
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get_last_OtherGSTInput", methods=["GET"])
def get_last_OtherGSTInput():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not company_code or not year_code:
            return jsonify({'error': 'Missing Company_Code or Year_Code parameter'}), 400
        
        try:
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or Year_Code parameter'}), 400

        last_user_creation = OtherGSTInput.query.filter_by(Company_Code=company_code, Year_Code=year_code).order_by(OtherGSTInput.Doc_No.desc()).first()
        if last_user_creation:
            account_name_result = db.session.execute(sql_query, {'doc_no': last_user_creation.Doc_No})
            account_name = account_name_result.scalar()

            serialized_last_user_creation = {column.name: getattr(last_user_creation, column.name) for column in last_user_creation.__table__.columns}

            serialized_last_user_creation.update(format_dates(last_user_creation))
            serialized_last_user_creation['Account_Name'] = account_name  # Add account name to the response

            return jsonify(serialized_last_user_creation)
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route(API_URL+"/get_previous_OtherGSTInput", methods=["GET"])
def get_previous_OtherGSTInput():
    try:
        company_code = request.args.get('Company_Code')
        year_code=request.args.get('Year_Code')
        if company_code is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
            year_code = int (year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or year_code parameter'}), 400
        Selected_Record = request.args.get('Doc_No')
        if Selected_Record is None:
            return jsonify({'errOr': 'Selected_Record parameter is required'}), 400

        previous_selected_record = OtherGSTInput.query.filter(OtherGSTInput.Doc_No < Selected_Record,OtherGSTInput.Company_Code==company_code,OtherGSTInput.Year_Code==year_code)\
            .order_by(OtherGSTInput.Doc_No.desc()).first()
        if previous_selected_record:
            account_name_result = db.session.execute(sql_query, {'doc_no': previous_selected_record.Doc_No})
            account_name = account_name_result.scalar()
            serialized_last_user_creation = {column.name: getattr(previous_selected_record, column.name) for column in previous_selected_record.__table__.columns}

            serialized_last_user_creation.update(format_dates(previous_selected_record))
            serialized_last_user_creation['Account_Name'] = account_name  # Add account name to the response
            return jsonify(serialized_last_user_creation)
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error', 'message': str(e)}), 500

@app.route(API_URL+"/get_next_OtherGSTInput", methods=["GET"])
def get_next_OtherGSTInput():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if company_code is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code or year_code parameter'}), 400

        try:
            company_code = int(company_code)
            year_code = int (year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or year_code parameter'}), 400
        Selected_Record = request.args.get('Doc_No')
        if Selected_Record is None:
            return jsonify({'error': 'Selected_Record parameter is required'}), 400

        next_Selected_Record = OtherGSTInput.query.filter(OtherGSTInput.Doc_No > Selected_Record,OtherGSTInput.Company_Code==company_code,OtherGSTInput.Year_Code==year_code)\
            .order_by(OtherGSTInput.Doc_No.asc()).first()
        if next_Selected_Record:
            account_name_result = db.session.execute(sql_query, {'doc_no': next_Selected_Record.Doc_No})
            account_name = account_name_result.scalar()
            serialized_last_user_creation = {column.name: getattr(next_Selected_Record, column.name) for column in next_Selected_Record.__table__.columns}

            serialized_last_user_creation.update(format_dates(next_Selected_Record))
            serialized_last_user_creation['Account_Name'] = account_name  # Add account name to the response
            return jsonify(serialized_last_user_creation)
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500




