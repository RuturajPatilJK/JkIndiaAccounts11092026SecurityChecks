from app import db
class OfflineTenderHead(db.Model):
    __tablename__ = 'OfflineTenderHead'
    Id = db.Column(db.Integer,nullable=False,primary_key=True)
    Doc_Date = db.Column(db.Date,nullable=True)
    

    details = db.relationship('OfflineTenderDetail', backref='OfflineHead', lazy=True)

class OfflineTenderDetail(db.Model):
    __tablename__ = 'OfflineTenders'


    TenderId = db.Column(db.Integer,nullable=False,primary_key=True)
    TenderDate = db.Column(db.Date,nullable=True)
    TenderNumber = db.Column(db.String(20),nullable=True)
    MillCode  = db.Column(db.String(20),nullable=True)
    MillName = db.Column(db.String(50),nullable=True)
    MillShortName  = db.Column(db.String(200),nullable=True)
    StateZone = db.Column(db.String(100),nullable=True)
    LastDateOfPayment= db.Column(db.Date,nullable=True)
    LiftingDate= db.Column(db.Date,nullable=True)
    Grade= db.Column(db.String(50),nullable=True)
    Season= db.Column(db.String(20),nullable=True)
    Rate = db.Column(db.Numeric(12,2),nullable=True)
    RateGST = db.Column(db.Integer,nullable=True)
    RateWithGST = db.Column(db.Numeric(12,2),nullable=True)
    tranid = db.Column(db.Integer, db.ForeignKey('OfflineTenderHead.Id'))
    detail_id = db.Column(db.Integer,nullable=True)
    Tender_Type = db.Column(db.String(1),nullable=True)


    