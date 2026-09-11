from app import db

class PendingDO(db.Model):
    __tablename__ = 'eBuySugar_Pending_DO'
    
    pending_doid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    doid = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    accoid = db.Column(db.Integer, nullable=False)
    do_qntl = db.Column(db.Numeric(18, 2), nullable=False)
    adjust_do_qntl = db.Column(db.Numeric(18, 2), nullable=False)
    truck_no = db.Column(db.String(50), nullable=False)
    payment_detail = db.Column(db.String(50), nullable=False)
    bill_to_gst_no = db.Column(db.String(50), nullable=False)
    ship_to_gst_no = db.Column(db.String(50), nullable=False)
    bill_to_ac_code = db.Column(db.Integer, nullable=False)
    bill_to_address = db.Column(db.String(100), nullable=False)
    bill_to_state = db.Column(db.String(100), nullable=False)
    bill_to_pincode = db.Column(db.Integer, nullable=False)
    ship_to_ac_code = db.Column(db.Integer, nullable=False)
    ship_to_address = db.Column(db.String(100), nullable=False)
    ship_to_state = db.Column(db.String(100), nullable=False)
    ship_to_pincode = db.Column(db.Integer, nullable=False)
    orderid = db.Column(db.Integer, nullable=False)
    new_party = db.Column(db.String(1), nullable=False)
    tenderdetailid = db.Column(db.Integer, nullable=False)
    bill_to_accoid = db.Column(db.Integer, nullable=False)
    ship_to_accoid = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}
