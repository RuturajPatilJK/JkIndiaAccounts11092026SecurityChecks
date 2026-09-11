from app import db

class WhatsAppURL(db.Model):
    __tablename__ = 'tblWhatsAppURL'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Instance_Id = db.Column(db.String(500), nullable=True)
    Access_token = db.Column(db.String(500), nullable=True)
    Company_Code = db.Column(db.Integer, nullable=False)
    Mobile_NoWa = db.Column(db.Numeric(18, 0), nullable=True)
    OtpEmail = db.Column(db.String(500), nullable=True)
    OtpPassword = db.Column(db.String(500), nullable=True)
    gitAuthToken = db.Column(db.String(500), nullable=True)
    gitRepo = db.Column(db.String(500), nullable=True)
    gitauthKey = db.Column(db.String(500), nullable=True)
    WaTitle = db.Column(db.String(500), nullable=True)
    Mobile_No = db.Column(db.String(500), nullable=True)