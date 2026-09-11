from flask import jsonify, request
from app import app, db
from sqlalchemy import text
from app.models.Utilities.CompanyPrintingInfo.CompanyPrintingInfoModels import CompanyPrintingInfo
import os

API_URL = os.getenv('API_URL')

CompanyInfo_QUERY = '''
SELECT GooglePayAc.Ac_Name_E AS googlePayAcName, PhonePayAc.Ac_Name_E AS phonePayAcName
FROM     dbo.tblvoucherheadaddress INNER JOIN
                  dbo.nt_1_accountmaster AS GooglePayAc ON dbo.tblvoucherheadaddress.Company_Code = GooglePayAc.company_code AND dbo.tblvoucherheadaddress.Googlepayac = GooglePayAc.Ac_Code AND 
                  dbo.tblvoucherheadaddress.ga = GooglePayAc.accoid INNER JOIN
                  dbo.nt_1_accountmaster AS PhonePayAc ON GooglePayAc.accoid = PhonePayAc.accoid AND dbo.tblvoucherheadaddress.Company_Code = PhonePayAc.company_code AND dbo.tblvoucherheadaddress.pa = PhonePayAc.accoid AND 
                  dbo.tblvoucherheadaddress.Phonepayac = PhonePayAc.Ac_Code
WHERE dbo.tblvoucherheadaddress.ID =:id
'''

def ensure_directory_exists(path):
    # Ensure the directory exists. If it doesn't, create it.
    os.makedirs(path, exist_ok=True)


@app.route(API_URL + "/create-or-update-company-printing-info", methods=["POST"])
def create_or_update_company_printing_info():
    try:
        company_code = request.json.get('Company_Code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        company_code = int(company_code)
        existing_record = CompanyPrintingInfo.query.filter_by(Company_Code=company_code).first()

        # Handle dbbackup directory creation
        backup_path = request.json.get('dbbackup')
        if backup_path:
            ensure_directory_exists(backup_path)  # Directly use the provided path

        if existing_record:
            for key, value in request.json.items():
                setattr(existing_record, key, value)

            db.session.commit()
            return jsonify({'message': 'Record updated successfully', 'record': request.json}), 200
        else:
            new_record = CompanyPrintingInfo(**request.json)
            db.session.add(new_record)
            db.session.commit()
            return jsonify({'message': 'Record created successfully', 'record': request.json}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL + "/get-company-printing-info", methods=["GET"])
def get_company_printing_info():
    try:
        company_code = request.args.get('Company_Code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        company_code = int(company_code)
        record = CompanyPrintingInfo.query.filter_by(Company_Code=company_code).first()
        if record is None:
            return jsonify({'error': 'No record found'}), 404
        
        record_Id = record.ID

        additional_data = db.session.execute(text(CompanyInfo_QUERY), {'id': record_Id})
        additional_data_rows = additional_data.fetchall()

        record_data = {column.name: getattr(record, column.name) for column in record.__table__.columns}

        acLabels = [dict(row._mapping) for row in additional_data_rows]
        return jsonify({'CompanyPrintingInfo_data': record_data,'acLabels':acLabels}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
