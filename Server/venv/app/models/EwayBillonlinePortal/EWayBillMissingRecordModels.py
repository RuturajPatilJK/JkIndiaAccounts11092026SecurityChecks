from app import db

class EWayMissingEWayBills(db.Model):
    __tablename__ = 'MissingEwayBillData'

    id = db.Column(db.Integer,primary_key=True,autoincrement=True,nullable=False)    
    doc_no = db.Column(db.Integer, nullable=False)  
    DO_No = db.Column(db.Integer, nullable=False) 
    Gst_No = db.Column(db.String(50), nullable=False) 
    EwayBillGSTN = db.Column(db.String(50), nullable=False)  
    NETQNTL = db.Column(db.Numeric(18, 2), nullable=False) 
    EwayBillQuantity = db.Column(db.Numeric(18, 2), nullable=False)  
    qtyDiff = db.Column(db.Numeric(18, 2), nullable=False) 
    vehno = db.Column(db.String(50), nullable=False)  
    millname = db.Column(db.String(255), nullable=False) 
    billtogst = db.Column(db.String(50), nullable=False)  
    billtoname = db.Column(db.String(255), nullable=False)  
    toGSTIN = db.Column(db.String(50), nullable=False)  
    purchaseid = db.Column(db.Integer, nullable=False) 
    purcname = db.Column(db.String(255), nullable=False) 
    shipToDiff = db.Column(db.String(1), nullable=False) 
    shiptopin = db.Column(db.Integer, nullable=False)  
    subTotal = db.Column(db.Numeric(18, 2), nullable=False)  
    taxableAmount = db.Column(db.Numeric(18, 2), nullable=False)  
    taxableAmtDiff = db.Column(db.Numeric(18, 2), nullable=False)  
    TotalInvval = db.Column(db.Numeric(18, 2), nullable=False)  
    saleid = db.Column(db.Integer, nullable=False)  
    salebillno = db.Column(db.Integer, nullable=False) 
    c = db.Column(db.Integer, nullable=False) 
    saleewaybillno = db.Column(db.Integer, nullable=False)  
    doc_date = db.Column(db.Date, nullable=False)  
    
