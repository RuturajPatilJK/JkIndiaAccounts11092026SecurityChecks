from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.orm import relationship
from app import db

class TblUser(db.Model):
    __tablename__ = 'tbluser'
    __table_args__ = {'extend_existing': True}

    User_Id = db.Column(db.Integer, nullable=False)
    User_Name = db.Column(db.String(50), nullable=True)
    User_Type = db.Column(db.String(1), nullable=True)
    Password = db.Column(db.String(50), nullable=True)
    EmailId = db.Column(db.String(50), nullable=True)
    EmailPassword = db.Column(db.String(500), nullable=True)
    smtpServerPort = db.Column(db.String(50), nullable=True)
    AuthoGroupID = db.Column(db.Integer, nullable=True)
    Ac_Code = db.Column(db.Integer, nullable=True)
    Company_Code = db.Column(db.Integer, nullable=True)
    Mobile = db.Column(db.String(100), nullable=True)
    LastActivityDate = db.Column(db.Date, nullable=True)
    RetryAttempts = db.Column(db.Integer, nullable=True)
    IsLocked = db.Column(db.Boolean, nullable=True, default=True)
    LockedDateTime = db.Column(db.Date, nullable=True)
    Branch_Code = db.Column(db.Integer, nullable=True)
    uid = db.Column(db.Integer, primary_key=True)  
    userfullname = db.Column(db.String(50), nullable=True)
    User_Security = db.Column(db.String(1), nullable=True)
    Bank_Security = db.Column(db.String(1), nullable=True)
    PaymentsPassword = db.Column(db.String(500), nullable=True)
    User_Password = db.Column(db.String(50), nullable=True)
    
    details = relationship('TblUserDetail', backref='user', lazy=True)

class TblUserDetail(db.Model):
    __tablename__ = 'tbluserdetail'
    __table_args__ = {'extend_existing': True}

    Detail_Id = db.Column(db.Integer, nullable=True)
    User_Id = db.Column(db.Integer, nullable=True) 
    Program_Name = db.Column(db.String(255), nullable=True)
    Tran_Type = db.Column(db.String(2), nullable=True)
    Permission = db.Column(db.String(255), nullable=True)
    Company_Code = db.Column(db.Integer, nullable=True)
    Created_By = db.Column(db.String(45), nullable=True)
    Modified_By = db.Column(db.String(45), nullable=True)
    Created_Date = db.Column(db.Date, nullable=True)
    Modified_Date = db.Column(db.Date, nullable=True)
    Year_Code = db.Column(db.Integer, nullable=True)
    udid = db.Column(db.Integer, primary_key=True, autoincrement=True)  
    uid = db.Column(db.Integer, db.ForeignKey('tbluser.uid'),nullable=False)
    canView = db.Column(db.String(45), nullable=True)
    canEdit = db.Column(db.String(45), nullable=True)
    canSave = db.Column(db.String(45), nullable=True)
    canDelete = db.Column(db.String(45), nullable=True)
    DND = db.Column(db.String(45), nullable=True)
    menuNames = db.Column(db.String(255), nullable=True)

    
    

