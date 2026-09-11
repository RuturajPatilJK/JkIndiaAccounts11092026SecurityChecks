from app import db

class PaymentNote(db.Model):
    __tablename__ = 'PaymentNote'

    pid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    doc_no = db.Column(db.Integer, nullable=True)
    doc_date = db.Column(db.Date, nullable=True)
    bank_ac = db.Column(db.Integer, nullable=True)
    payment_to = db.Column(db.Integer, nullable=True)
    amount = db.Column(db.Numeric(18, 2), nullable=True)
    narration = db.Column(db.Text, nullable=True)
    Company_Code = db.Column(db.Integer, nullable=True)
    Year_Code = db.Column(db.Integer, nullable=True)
    Created_By = db.Column(db.String, nullable=True)
    Modified_By = db.Column(db.String, nullable=True)
    ba = db.Column(db.Integer, nullable=True)
    pt = db.Column(db.Integer, nullable=True)