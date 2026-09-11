from app import db

class TDS_Sections(db.Model):
    __tablename__ = 'TDS_Sections'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    Nature_of_Payment = db.Column(db.NVARCHAR(None), nullable=True)
    Section = db.Column(db.NVARCHAR(50), nullable=True)
    TDS_Section_Code = db.Column(db.NVARCHAR(50), nullable=True)