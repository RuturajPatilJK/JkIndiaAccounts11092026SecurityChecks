from app import db

class SaleTDS(db.Model):
    __tablename__ = 'Sale_Purchase_TDS'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    type = db.Column(db.String(1), nullable=False)
    nameOfAccount = db.Column(db.Integer, nullable=False)
    tdsAccount = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Numeric(18, 2), nullable=False)
    narration = db.Column(db.String(255), nullable=True) 
    section = db.Column(db.Integer, nullable=True)
    na = db.Column(db.Integer, nullable=False)
    ta = db.Column(db.Integer, nullable=False)
    Company_Code = db.Column(db.Integer, nullable=False)
    Year_Code = db.Column(db.Integer, nullable=False)

