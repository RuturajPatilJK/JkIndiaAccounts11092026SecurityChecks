from app import db
from datetime import datetime

class AxisbankAPiValidation(db.Model):
    __tablename__ = 'AxisbankValidation'
    id = db.Column(db.Integer, primary_key=True)
    UTR = db.Column(db.String(255), nullable=False)
    Bene_acc_no = db.Column(db.String(255), nullable=False)
    Req_type = db.Column(db.String(255), nullable=True)
    Req_dt_time = db.Column(db.DateTime, nullable=False)
    Txn_amnt = db.Column(db.Numeric(18, 2), nullable=True)
    Corp_code = db.Column(db.String(255), nullable=True)
    Pmode = db.Column(db.String(255), nullable=True)
    Sndr_acnt = db.Column(db.String(255), nullable=True)
    Sndr_nm = db.Column(db.String(255), nullable=True)
    Sndr_acnt1 = db.Column(db.String(255), nullable=True)
    Sndr_nm1 = db.Column(db.String(255), nullable=True)
    Sndr_ifsc = db.Column(db.String(255), nullable=True)
    Tran_id = db.Column(db.String(255), nullable=True)
    Stts_flg = db.Column(db.String(1), nullable=True)
    Err_cd = db.Column(db.String(255), nullable=True)
    Message = db.Column(db.String(555), nullable=True)