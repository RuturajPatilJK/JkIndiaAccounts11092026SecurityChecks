from app import db

class PartyUnitMaster(db.Model):
    __tablename__ = 'nt_1_partyunit'

    ucid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    unit_code = db.Column(db.Integer, nullable=True)
    Ac_Code = db.Column(db.Integer, nullable=True)
    Unit_name = db.Column(db.Integer, nullable=True)
    Remarks = db.Column(db.String(255), nullable=True)
    Company_Code = db.Column(db.Integer, nullable=True)
    Year_Code = db.Column(db.Integer, nullable=True)
    Created_By = db.Column(db.String(50), nullable=True)
    Modified_By = db.Column(db.String(50), nullable=True)
    ac = db.Column(db.Integer, nullable=True)
    uc = db.Column(db.Integer, nullable=True)
