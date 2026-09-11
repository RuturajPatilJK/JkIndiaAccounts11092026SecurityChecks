from app import db


class FundManagement(db.Model):
    __tablename__ = 'FundManagements'

    Doc_no = db.Column(db.Integer)
    Doc_date = db.Column(db.Date)
    Riceipt_date = db.Column(db.Date)
    Riceipt_amount = db.Column(db.Numeric(18, 2))
    Funding_from = db.Column(db.Integer)
    ff = db.Column(db.Integer)
    Funding_rate = db.Column(db.Numeric(18, 2))
    Bill_to = db.Column(db.Integer)
    PurcBillTo=db.Column(db.Integer)
    pt = db.Column(db.Integer)
    bt = db.Column(db.Integer)
    Bill_rate = db.Column(db.Numeric(18, 2))
    Quintal = db.Column(db.Numeric(18, 2))
    Due_days = db.Column(db.Integer)
    fundId=db.Column(db.Integer ,primary_key=True )
    Interest_rate = db.Column(db.Numeric(18, 2))
    Interest_amount = db.Column(db.Numeric(18, 2))
    Purchase_rate = db.Column(db.Numeric(18, 2))
    Purchase_bill_amount = db.Column(db.Numeric(18, 2))
    Actual_payment_date = db.Column(db.Date)
    Interest_adjusted_rate = db.Column(db.Numeric(18, 2))
    Payment_adjustment_no = db.Column(db.Integer)
    Payment_adjustment_amount = db.Column(db.Numeric(18, 2))
    less_rate = db.Column(db.Numeric(10, 2))
    Actual_payment_amount = db.Column(db.Numeric(18, 2))
    Other_amount = db.Column(db.Numeric(18, 2))
    Company_code = db.Column(db.Integer)
    Created_By = db.Column(db.String(50))
    Modify_By = db.Column(db.String(50))
    Remark = db.Column(db.String(500))
    Is_completed = db.Column(db.Integer, default=0)


    TDS_rate=db.Column(db.Numeric(18, 3))
    gstid=db.Column(db.Integer)
    Ref_no=db.Column(db.Integer)
    GST_rate_code=db.Column(db.Integer)
    Total_amount=db.Column(db.Numeric(18, 2))
    GST_rate=db.Column(db.Numeric(18, 2))
    Advance_amount=db.Column(db.Numeric(18, 2))
    
    GST_amount=db.Column(db.Numeric(18, 2))
    TDS_amount=db.Column(db.Numeric(18, 2))

    Purchase_TDS_rate=db.Column(db.Numeric(18, 2))
    Purchase_TDS_amount=db.Column(db.Numeric(18, 2))
    Purchase_GST_rate =db.Column(db.Numeric(18, 2))
    Purchase_GST_amount =db.Column(db.Numeric(18, 2))

    Purchase_taxable_amount= db.Column(db.Numeric(18, 2))
    Net_payable_amount=db.Column(db.Numeric(18, 2))
    Bill_amount=db.Column(db.Numeric(18, 2))
    Funding_Adjust=db.Column(db.Numeric(18, 2))
    prevQty = db.Column(db.Numeric(18, 2))
                  