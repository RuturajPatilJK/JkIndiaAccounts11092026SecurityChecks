from flask import jsonify, request, send_file
from werkzeug.utils import secure_filename
from app import app, db
from app.models.Masters.AccountInformation.nt_Employee_Manegment import (
    EmployeeManagement,
    EmployeeManagement_Detail,
)
from datetime import datetime
import mimetypes
import os

API_URL = os.getenv('API_URL')

# Anchored to the project root (one level above the `app` package) so the path
# resolves the same regardless of the process's current working directory.
UPLOAD_FOLDER = os.path.join(os.path.dirname(app.root_path), "Uploads", "EmployeeManagement")

EMPLOYEE_FORM_FIELDS = [
    'doc_date', 'Date_of_joining', 'Joining_Company_Name', 'Resign_date', 'Salutation', 'name', 'Gender', 'Nationality', 'Father_Name',
    'Father_Occupation', 'Father_Number', 'Mother_Name', 'Mother_Occupation',
    'Birth_date', 'height', 'weight', 'birth_place', 'Any_Disability', 'Blood_group',
    'Emergency_name', 'Emergency_Relation', 'Emergency_contact', 'Present_Address',
    'Permanent_Address', 'mobile_No', 'employee_code', 'Alternate_No', 'email_id',
    'Aadhar_no', 'Pan_no', 'bank_name', 'Account_no', 'ifsc_code', 'marital_status',
    'Department', 'Company_Location', 'Designation', 'WhatsApp_No', 'Insurance_Mediclaim',
    'Created_By', 'Modified_By', 'status',
]

DATE_FIELDS = {'doc_date', 'Date_of_joining', 'Birth_date', 'Resign_date'}


def parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError:
        return None


def serialize(record):
    return {column.key: getattr(record, column.key) for column in record.__table__.columns}


def save_photo(file, employee):
    folder_name = f"{employee.Employee_id}_{employee.name}" if employee.name else str(employee.Employee_id)
    folder = os.path.join(UPLOAD_FOLDER, secure_filename(folder_name))
    os.makedirs(folder, exist_ok=True)
    filename = secure_filename(file.filename)
    full_path = os.path.join(folder, filename)
    file.save(full_path)
    return full_path.replace("\\", "/")


def resolve_photo_path(path):
    """Older rows may hold a path relative to whatever cwd the server had when
    saved; anchor those to the project root so they resolve regardless of the
    current process's cwd. New saves are already absolute (see UPLOAD_FOLDER)."""
    if not path:
        return None
    return path if os.path.isabs(path) else os.path.join(os.path.dirname(app.root_path), path)


def delete_photo(path):
    resolved = resolve_photo_path(path)
    if resolved and os.path.exists(resolved):
        try:
            os.remove(resolved)
        except OSError:
            pass


def resolve_company_year(source):
    """Reads company_code/year_code from a request.args/request.form-like mapping.
    Returns (company_code, year_code) or None if missing/invalid."""
    try:
        company_code = int(source.get('company_code'))
        year_code = int(source.get('year_code'))
    except (TypeError, ValueError):
        return None
    return company_code, year_code


@app.route(API_URL + "/preview-employee-photo/<int:employee_id>", methods=["GET"])
def preview_employee_photo(employee_id):
    try:
        employee = EmployeeManagement.query.get(employee_id)
        if employee is None or not employee.upload_photo:
            return jsonify({'error': 'Photo not found'}), 404

        photo_path = resolve_photo_path(employee.upload_photo)
        if not os.path.exists(photo_path):
            return jsonify({'error': 'Photo file missing on disk'}), 404

        mime_type, _ = mimetypes.guess_type(photo_path)
        if mime_type is None and photo_path.lower().endswith('.webp'):
            mime_type = 'image/webp'
        return send_file(
            photo_path,
            mimetype=mime_type or 'application/octet-stream',
            as_attachment=False,
        )
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


# Get all employees
@app.route(API_URL + "/getall-employees", methods=["GET"])
def getAll_Employees():
    try:
        resolved = resolve_company_year(request.args)
        if resolved is None:
            return jsonify({'error': 'company_code and year_code are required'}), 400
        company_code, year_code = resolved

        employees = EmployeeManagement.query.filter_by(
            Company_Code=company_code, Year_Code=year_code
        ).order_by(EmployeeManagement.Employee_id.desc()).all()
        return jsonify({"employeeData": [serialize(e) for e in employees]})
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


# Get last created employee
@app.route(API_URL + "/getlast-employee", methods=["GET"])
def getLast_Employee():
    try:
        resolved = resolve_company_year(request.args)
        if resolved is None:
            return jsonify({'error': 'company_code and year_code are required'}), 400
        company_code, year_code = resolved

        employee = EmployeeManagement.query.filter_by(
            Company_Code=company_code, Year_Code=year_code
        ).order_by(EmployeeManagement.Employee_id.desc()).first()
        if employee is None:
            return jsonify({'error': 'No employee found'}), 404
        return jsonify(serialize(employee))
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


# Get one employee (with family details)
@app.route(API_URL + "/get-employee/<int:employee_id>", methods=["GET"])
def get_Employee(employee_id):
    try:
        resolved = resolve_company_year(request.args)
        if resolved is None:
            return jsonify({'error': 'company_code and year_code are required'}), 400
        company_code, year_code = resolved

        employee = EmployeeManagement.query.filter_by(
            Employee_id=employee_id, Company_Code=company_code, Year_Code=year_code
        ).first()
        if employee is None:
            return jsonify({'error': 'Employee not found'}), 404

        family_members = EmployeeManagement_Detail.query.filter_by(employee_id=employee_id).all()

        data = serialize(employee)
        data['family_members'] = [serialize(m) for m in family_members]
        return jsonify(data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


# Get employee by doc_no
@app.route(API_URL + "/get-employee-by-doc-no", methods=["GET"])
def get_EmployeeByDocNo():
    try:
        resolved = resolve_company_year(request.args)
        if resolved is None:
            return jsonify({'error': 'company_code and year_code are required'}), 400
        company_code, year_code = resolved

        doc_no = request.args.get('doc_no')
        if doc_no is None:
            return jsonify({'error': 'Missing doc_no parameter'}), 400

        try:
            doc_no = int(doc_no)
        except ValueError:
            return jsonify({'error': 'Invalid doc_no parameter'}), 400

        employee = EmployeeManagement.query.filter_by(
            doc_no=doc_no, Company_Code=company_code, Year_Code=year_code
        ).first()
        if employee is None:
            return jsonify({'error': 'Employee not found'}), 404

        return jsonify(serialize(employee))
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


# Create a new employee
@app.route(API_URL + "/create-employee", methods=["POST"])
def create_employee():
    try:
        resolved = resolve_company_year(request.form)
        if resolved is None:
            return jsonify({'error': 'company_code and year_code are required'}), 400
        company_code, year_code = resolved

        data = {}
        for field in EMPLOYEE_FORM_FIELDS:
            value = request.form.get(field)
            if field in DATE_FIELDS:
                data[field] = parse_date(value)
            else:
                data[field] = value

        data['Company_Code'] = company_code
        data['Year_Code'] = year_code

        max_doc_no = db.session.query(db.func.max(EmployeeManagement.doc_no)).filter_by(
            Company_Code=company_code, Year_Code=year_code
        ).scalar() or 0
        data['doc_no'] = max_doc_no + 1

        new_employee = EmployeeManagement(**data)
        db.session.add(new_employee)
        db.session.commit()
        db.session.refresh(new_employee)

        photo = request.files.get('photo')
        if photo:
            new_employee.upload_photo = save_photo(photo, new_employee)
            db.session.commit()

        return jsonify({
            'message': 'Employee created successfully',
            'employee': serialize(new_employee),
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Update an employee
@app.route(API_URL + "/update-employee/<int:employee_id>", methods=["PUT"])
def update_employee(employee_id):
    try:
        resolved = resolve_company_year(request.form)
        if resolved is None:
            return jsonify({'error': 'company_code and year_code are required'}), 400
        company_code, year_code = resolved

        employee = EmployeeManagement.query.filter_by(
            Employee_id=employee_id, Company_Code=company_code, Year_Code=year_code
        ).first()
        if employee is None:
            return jsonify({'error': 'Employee not found'}), 404

        for field in EMPLOYEE_FORM_FIELDS:
            if field in request.form:
                value = request.form.get(field)
                setattr(employee, field, parse_date(value) if field in DATE_FIELDS else value)

        photo = request.files.get('photo')
        if photo:
            delete_photo(employee.upload_photo)
            employee.upload_photo = save_photo(photo, employee)

        db.session.commit()

        return jsonify({
            'message': 'Employee updated successfully',
            'employee': serialize(employee),
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Delete an employee
@app.route(API_URL + "/delete-employee/<int:employee_id>", methods=["DELETE"])
def delete_employee(employee_id):
    try:
        resolved = resolve_company_year(request.args)
        if resolved is None:
            return jsonify({'error': 'company_code and year_code are required'}), 400
        company_code, year_code = resolved

        employee = EmployeeManagement.query.filter_by(
            Employee_id=employee_id, Company_Code=company_code, Year_Code=year_code
        ).first()
        if employee is None:
            return jsonify({'error': 'Employee not found'}), 404

        EmployeeManagement_Detail.query.filter_by(employee_id=employee_id).delete()
        delete_photo(employee.upload_photo)

        db.session.delete(employee)
        db.session.commit()

        return jsonify({'message': 'Employee deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Navigation API
@app.route(API_URL + "/get_First_Employee_Record", methods=["GET"])
def get_First_Employee_Record():
    try:
        resolved = resolve_company_year(request.args)
        if resolved is None:
            return jsonify({'error': 'company_code and year_code are required'}), 400
        company_code, year_code = resolved

        employee = EmployeeManagement.query.filter_by(
            Company_Code=company_code, Year_Code=year_code
        ).order_by(EmployeeManagement.Employee_id.asc()).first()
        if employee:
            return jsonify(serialize(employee))
        return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500


@app.route(API_URL + "/get_Last_Employee_Record", methods=["GET"])
def get_Last_Employee_Record():
    try:
        resolved = resolve_company_year(request.args)
        if resolved is None:
            return jsonify({'error': 'company_code and year_code are required'}), 400
        company_code, year_code = resolved

        employee = EmployeeManagement.query.filter_by(
            Company_Code=company_code, Year_Code=year_code
        ).order_by(EmployeeManagement.Employee_id.desc()).first()
        if employee:
            return jsonify(serialize(employee))
        return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500


@app.route(API_URL + "/get_Previous_Employee_Record", methods=["GET"])
def get_Previous_Employee_Record():
    try:
        resolved = resolve_company_year(request.args)
        if resolved is None:
            return jsonify({'error': 'company_code and year_code are required'}), 400
        company_code, year_code = resolved

        selected_id = request.args.get('employee_id')
        if selected_id is None:
            return jsonify({'error': 'employee_id parameter is required'}), 400

        employee = EmployeeManagement.query.filter(
            EmployeeManagement.Employee_id < int(selected_id),
            EmployeeManagement.Company_Code == company_code,
            EmployeeManagement.Year_Code == year_code,
        ).order_by(EmployeeManagement.Employee_id.desc()).first()
        if employee:
            return jsonify(serialize(employee))
        return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500


@app.route(API_URL + "/get_Next_Employee_Record", methods=["GET"])
def get_Next_Employee_Record():
    try:
        resolved = resolve_company_year(request.args)
        if resolved is None:
            return jsonify({'error': 'company_code and year_code are required'}), 400
        company_code, year_code = resolved

        selected_id = request.args.get('employee_id')
        if selected_id is None:
            return jsonify({'error': 'employee_id parameter is required'}), 400

        employee = EmployeeManagement.query.filter(
            EmployeeManagement.Employee_id > int(selected_id),
            EmployeeManagement.Company_Code == company_code,
            EmployeeManagement.Year_Code == year_code,
        ).order_by(EmployeeManagement.Employee_id.asc()).first()
        if employee:
            return jsonify(serialize(employee))
        return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500


# ---- Family member (EmployeeManagement_Detail) CRUD ----

FAMILY_FORM_FIELDS = ['Name_of_family_Members', 'Nature_of_relationship', 'Age', 'occupation', 'Contact_No']


@app.route(API_URL + "/get-employee-family-members/<int:employee_id>", methods=["GET"])
def get_employee_family_members(employee_id):
    try:
        members = EmployeeManagement_Detail.query.filter_by(employee_id=employee_id).all()
        return jsonify({"familyMembers": [serialize(m) for m in members]})
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL + "/add-employee-family-member/<int:employee_id>", methods=["POST"])
def add_employee_family_member(employee_id):
    try:
        employee = EmployeeManagement.query.get(employee_id)
        if employee is None:
            return jsonify({'error': 'Employee not found'}), 404

        body = request.json or {}
        new_member = EmployeeManagement_Detail(
            employee_id=employee_id,
            Name_of_family_Members=body.get('Name_of_family_Members'),
            Nature_of_relationship=body.get('Nature_of_relationship'),
            Age=body.get('Age'),
            occupation=body.get('occupation'),
            Contact_No=body.get('Contact_No'),
        )
        db.session.add(new_member)
        db.session.commit()

        return jsonify({
            'message': 'Family member added successfully',
            'familyMember': serialize(new_member),
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route(API_URL + "/update-employee-family-member/<int:employee_detail_id>", methods=["PUT"])
def update_employee_family_member(employee_detail_id):
    try:
        member = EmployeeManagement_Detail.query.get(employee_detail_id)
        if member is None:
            return jsonify({'error': 'Family member not found'}), 404

        body = request.json or {}
        for field in FAMILY_FORM_FIELDS:
            if field in body:
                setattr(member, field, body.get(field))

        db.session.commit()

        return jsonify({
            'message': 'Family member updated successfully',
            'familyMember': serialize(member),
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route(API_URL + "/delete-employee-family-member/<int:employee_detail_id>", methods=["DELETE"])
def delete_employee_family_member(employee_detail_id):
    try:
        member = EmployeeManagement_Detail.query.get(employee_detail_id)
        if member is None:
            return jsonify({'error': 'Family member not found'}), 404

        db.session.delete(member)
        db.session.commit()

        return jsonify({'message': 'Family member deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
