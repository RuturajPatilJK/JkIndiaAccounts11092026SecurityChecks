from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from app import db 

Base = declarative_base()

class ShetkariSaleBillHead(db.Model):
    __tablename__ = 'ShetkariSale_Head'
    
    # purchaseid = db.Column(db.Integer, nullable=False,primary_key=True)
    Sale_Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Cash_Credit = db.Column(db.String(2), nullable=True)
    Doc_No = db.Column(db.Integer, nullable=True)
    Doc_Date = db.Column(db.Date, nullable=True)
    Ac_Code = db.Column(db.Integer, nullable=True)
    Broker = db.Column(db.Integer, nullable=True)
    LR_No = db.Column(db.String(50), nullable=True)
    Truck_No = db.Column(db.String(50), nullable=True)
    Taxable_Amount = db.Column(Numeric(18, 2), nullable=True)
    CGST_Amount = db.Column(Numeric(18, 2), nullable=True)
    SGST_Amount = db.Column(Numeric(18, 2), nullable=True)
    IGST_Amount = db.Column(Numeric(18, 2), nullable=True)
    Hamali = db.Column(Numeric(18, 2), nullable=True)
    postage = db.Column(Numeric(18, 2), nullable=True)
    Amount = db.Column(Numeric(18, 2), nullable=True)
    TCS_Par = db.Column(Numeric(18, 2), nullable=True)
    TCS_Amount = db.Column(Numeric(18, 2), nullable=True)
    Company_Code = db.Column(db.Integer, nullable=True)
    Year_Code = db.Column(db.Integer, nullable=True)
    Created_By = db.Column(db.String(250), nullable=True)
    Modified_By = db.Column(db.String(250), nullable=True)
    Branch_Code = db.Column(db.Integer, nullable=True)
   
    ac = db.Column(db.Integer, nullable=True)
    bc = db.Column(db.Integer, nullable=True)
    TDS_Rate = db.Column(Numeric(18, 3), nullable=True)
    TDS_Amt = db.Column(Numeric(18, 2), nullable=True)
    oldcode = db.Column(db.Integer, nullable=True)
    
    
    EWay_Bill_No =db.Column(db.String(50), nullable=True)
    EWayBill_Chk =db.Column(db.String(1), nullable=True)
    EwayBillValidDate =db.Column(db.Date, nullable=True)
    Einvoice_No =db.Column(db.String(255), nullable=True)
    Ack_No =db.Column(db.String(255), nullable=True)
    QRCode =db.Column(db.String(255), nullable=True)
    
    Hamalichecking=db.Column(db.String(1), nullable=True)
    freightrate=db.Column(Numeric(18,2), nullable=True)
    paytype=db.Column(db.String(1), nullable=True)
    NakaDelivery=db.Column(db.String(1), nullable=True)

    details = db.relationship('ShetkariSaleBillDetail', backref='Saleid', lazy=True)

class ShetkariSaleBillDetail(db.Model):
    __tablename__ = 'ShetkariSale_Detail'
    
    # purchasedetailid = db.Column(db.Integer, primary_key=True, nullable=False)
    # Sale_Id = db.Column(db.Integer, ForeignKey('ShetkariSale_Head.Sale_Id'), nullable=False)
    SaleDetail_Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Cash_Credit = db.Column(String(2), nullable=True)
    Doc_No = db.Column(db.Integer, nullable=True)
    detail_id = db.Column(db.Integer, nullable=True)
    Sale_Id = db.Column(db.Integer, ForeignKey('ShetkariSale_Head.Sale_Id'), nullable=True)
    Item_Code = db.Column(db.Integer, nullable=True)
    Brand_Code = db.Column(db.Integer, nullable=True)
    Qty = db.Column(db.Integer, nullable=True)
    Wt_Per = db.Column(Numeric(18, 2), nullable=True)
    Wt_Qty = db.Column(Numeric(18, 2), nullable=True)
    Rate = db.Column(Numeric(18, 2), nullable=True)
    Value = db.Column(Numeric(18, 2), nullable=True)
    GST_Code = db.Column(db.Integer, nullable=True)
    SGST = db.Column(Numeric(18, 2), nullable=True)
    CGST = db.Column(Numeric(18, 2), nullable=True)
    IGST = db.Column(Numeric(18, 2), nullable=True)
    Hamali_Rate = db.Column(Numeric(18, 2), nullable=True)
    Hamali = db.Column(Numeric(18, 2), nullable=True)
    Company_Code = db.Column(db.Integer, nullable=True)
    Year_Code = db.Column(db.Integer, nullable=True)
    Created_By = db.Column(db.String(250), nullable=True)
    Modified_By = db.Column(db.String(250), nullable=True)
    Branch_Code = db.Column(db.Integer, nullable=True)
    ic = db.Column(db.Integer, nullable=True)
    saleac = db.Column(db.Integer, nullable=True)
    sac = db.Column(db.Integer, nullable=True)
    
    Net_wt = db.Column(Numeric(18, 2), nullable=True)
    purchaseyearcode = db.Column(db.Integer, nullable=True)