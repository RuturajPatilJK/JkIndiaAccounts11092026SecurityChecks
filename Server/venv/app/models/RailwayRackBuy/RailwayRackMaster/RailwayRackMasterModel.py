from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from app import db 

Base = declarative_base()

class RailHead(db.Model):
    __tablename__ = 'RailShedHead'
    
    RailId = db.Column(db.Integer, nullable=False,primary_key=True)
    Doc_No = db.Column(db.Integer, nullable=True)
    RailwayStation_Name = db.Column(db.String(50), nullable=True)
    Address = db.Column(db.String(100), nullable=True)
    City = db.Column(db.String(255), nullable=True)
    Pincode = db.Column(db.String(50), nullable=True)
    Created_By = db.Column(db.String(50), nullable=True)
    Modified_By = db.Column(db.String(50), nullable=True)

    
    details = db.relationship('RailDetail', backref='Rail', lazy=True)

class RailDetail(db.Model):
    __tablename__ = 'RailShedDetail'
    
    Raildetailid = db.Column(db.Integer, primary_key=True, nullable=False)
    RailId = db.Column(db.Integer, ForeignKey('RailShedHead.RailId'), nullable=False)
    Doc_No = db.Column(db.Integer, nullable=True)
    Ac_Code = db.Column(db.Integer, nullable=True)
    ac = db.Column(db.Integer, nullable=True)
    Local_Exp = db.Column(db.Numeric(18, 2), nullable=True)
    detail_id = db.Column(db.Integer, nullable=True)
    Created_By = db.Column(db.String(50), nullable=True)
    Modified_By = db.Column(db.String(50), nullable=True)
