from app import db
from datetime import datetime


class EmployeeManagement(db.Model):
    __tablename__ = 'nt_Employee_Management'

    Employee_id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    Company_Code = db.Column(db.Integer)
    Year_Code = db.Column(db.Integer)
    doc_no = db.Column(db.Integer)
    doc_date = db.Column(db.Date)
    Date_of_joining = db.Column(db.Date)
    Joining_Company_Name = db.Column(db.String(150))
    Resign_date = db.Column(db.Date)
    Salutation = db.Column(db.String(10))
    name = db.Column(db.String(100))
    Gender = db.Column(db.String(1))
    Nationality = db.Column(db.String(50))
    Father_Name = db.Column(db.String(100))
    Father_Occupation = db.Column(db.String(100))
    Father_Number = db.Column(db.String(15))
    Mother_Name = db.Column(db.String(100))
    Mother_Occupation = db.Column(db.String(100))
    Birth_date = db.Column(db.Date)
    height = db.Column(db.String(20))
    weight = db.Column(db.String(20))
    birth_place = db.Column(db.String(100))
    Any_Disability = db.Column(db.String(255))
    Blood_group = db.Column(db.String(10))
    Emergency_name = db.Column(db.String(100))
    Emergency_Relation = db.Column(db.String(50))
    Emergency_contact = db.Column(db.String(20))
    Present_Address = db.Column(db.String(255))
    Permanent_Address = db.Column(db.String(255))
    mobile_No = db.Column(db.String(15))
    employee_code = db.Column(db.String(50))
    Alternate_No = db.Column(db.String(15))
    email_id = db.Column(db.String(100))
    Aadhar_no = db.Column(db.String(20))
    Pan_no = db.Column(db.String(20))
    bank_name = db.Column(db.String(100))
    Account_no = db.Column(db.String(50))
    ifsc_code = db.Column(db.String(20))
    marital_status = db.Column(db.String(20))
    upload_photo = db.Column(db.String(255))
    Department = db.Column(db.String(255))
    Company_Location = db.Column(db.String(100))
    Designation = db.Column(db.String(150))
    WhatsApp_No = db.Column(db.String(15))
    Insurance_Mediclaim = db.Column(db.String(100))

    Created_By = db.Column(db.String(255))
    Modified_By = db.Column(db.String(255))
    status = db.Column(db.String(1))



class EmployeeManagement_Detail(db.Model):
    __tablename__ = 'nt_Employee_Detail'

    employee_detail_id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('nt_Employee_Management.Employee_id'))
    Name_of_family_Members = db.Column(db.String(100))
    Nature_of_relationship = db.Column(db.String(50))
    Age = db.Column(db.Integer)
    occupation = db.Column(db.String(100))
    Contact_No = db.Column(db.String(15))