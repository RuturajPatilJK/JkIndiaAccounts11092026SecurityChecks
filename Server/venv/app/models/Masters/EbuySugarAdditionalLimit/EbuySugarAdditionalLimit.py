from app import db

class EBuySugarBalanceLimit(db.Model):
    __tablename__ = 'EBuySugarBalanceLimit'
    gledgereBuyId = db.Column(db.Integer, primary_key=True,autoincrement=True)
    Ac_Code = db.Column(db.Integer)
    accoid = db.Column(db.Integer)
    Doc_Date = db.Column(db.DateTime)
    Limit= db.Column(db.Integer)
    DRCR = db.Column(db.String(2))
    Narration = db.Column(db.String(500))
    Company_Code = db.Column(db.Integer)
    User_Id = db.Column(db.Integer)
    Tran_Type = db.Column(db.String(2))
