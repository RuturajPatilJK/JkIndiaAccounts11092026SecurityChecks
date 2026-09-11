from app import db

class CompanyPrintingInfo(db.Model):
    __tablename__ = 'tblvoucherheadaddress'

    ID = db.Column(db.Integer, primary_key=True, index=True)
    AL1 = db.Column(db.String, nullable=True)
    AL2 = db.Column(db.String, nullable=True)
    AL3 = db.Column(db.String, nullable=True)
    AL4 = db.Column(db.String, nullable=True)
    Other = db.Column(db.String, nullable=True)
    Company_Code = db.Column(db.Integer, nullable=False)
    BillFooter = db.Column(db.String, nullable=True)
    bankdetail = db.Column(db.String, nullable=True)
    dbbackup = db.Column(db.String(50), nullable=True)
    Googlepayac = db.Column(db.Integer, nullable=True)
    Phonepayac = db.Column(db.Integer, nullable=True)
    ga = db.Column(db.Integer, nullable=True)  
    pa = db.Column(db.Integer, nullable=True)  
