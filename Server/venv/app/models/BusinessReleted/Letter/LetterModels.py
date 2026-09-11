from app import db

class Letter(db.Model):
    __tablename__ = 'NT_1_Letter'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    DOC_NO = db.Column(db.Numeric(18, 0), nullable=False)
    DOC_DATE = db.Column(db.Date, nullable=True)
    AC_CODE = db.Column(db.Numeric(18, 0), nullable=True)
    AC_NAME = db.Column(db.String(300), nullable=True)
    ADDRESS = db.Column(db.Text, nullable=True)
    CITY = db.Column(db.String(50), nullable=True)
    PINCODE = db.Column(db.String(20), nullable=True)
    KIND_ATT = db.Column(db.String(50), nullable=True)
    SUBJECT = db.Column(db.String(50), nullable=True)
    REF_NO = db.Column(db.String(50), nullable=True)
    REF_DT = db.Column(db.Date, nullable=True)
    MATTER = db.Column(db.Text, nullable=True)
    AUTHORISED_PERSON = db.Column(db.String(50), nullable=True)
    DESIGNATION = db.Column(db.String(50), nullable=True)
    Company_Code = db.Column(db.Numeric(18, 0), nullable=False)
    Year_Code = db.Column(db.Numeric(18, 0), nullable=False)
    Branch_Code = db.Column(db.Numeric(18, 0), nullable=True)
    Created_By = db.Column(db.String(50), nullable=True)
    Modified_By = db.Column(db.String(50), nullable=True)
