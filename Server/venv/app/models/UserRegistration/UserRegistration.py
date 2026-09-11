from app import db

class User(db.Model):
    __tablename__ = 'Users'

    ID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    firstName = db.Column(db.String(50), nullable=True)
    lastName = db.Column(db.String(50), nullable=True)
    companyName = db.Column(db.String(255), nullable=True)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(50), nullable=True)
    pinCode = db.Column(db.Integer, nullable=True)
    state = db.Column(db.String(50), nullable=True)
    country = db.Column(db.String(50), nullable=True)
    mobileNo = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    password = db.Column(db.String(255), nullable=True)
    GST_No = db.Column(db.String(50), nullable=True)
    PAN_No = db.Column(db.String(50), nullable=True)
    FSSAI_No = db.Column(db.String(50), nullable=True)
    tablePrefixName = db.Column(db.String(50), nullable=True)
    isApproved = db.Column(db.String(1), nullable=True)
    approvedBy = db.Column(db.String(255), nullable=True)
    Remark = db.Column(db.String(255), nullable=True)
