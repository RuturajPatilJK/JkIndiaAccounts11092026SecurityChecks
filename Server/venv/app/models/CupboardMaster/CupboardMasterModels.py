from app import db


class CupboardMaster(db.Model):
    __tablename__ = 'Cupboard_Master'

    Cupboard_Code = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Cupboard_Name = db.Column(db.String(255))
    Created_by = db.Column(db.String(255))
    Modified_by = db.Column(db.String(255))
