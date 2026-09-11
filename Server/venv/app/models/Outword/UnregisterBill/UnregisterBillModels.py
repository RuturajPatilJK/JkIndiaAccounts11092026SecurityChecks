from app import db

class UnregisterBill(db.Model):
    __tablename__ = 'OtherInvoice'

    bill_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    doc_no = db.Column(db.Integer, nullable=True)
    doc_date = db.Column(db.Date, nullable=True)
    ac_code = db.Column(db.Numeric(18, 0), nullable=True)
    sale_code = db.Column(db.Numeric(18, 0), nullable=True)
    narration = db.Column(db.String(500), nullable=True)
    amount = db.Column(db.Numeric(18, 2), nullable=True)
    other_narration = db.Column(db.String(500), nullable=True)
    Company_Code = db.Column(db.Integer, nullable=True)
    Year_Code = db.Column(db.Integer, nullable=True)
    Created_By = db.Column(db.String(50), nullable=True)
    Modified_By = db.Column(db.String(50), nullable=True)
    ac = db.Column(db.Integer, nullable=True)
    sa = db.Column(db.Integer, nullable=True)
