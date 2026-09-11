from app import db


class FileInfo(db.Model):
    __tablename__ = 'File_Info'

    Doc_No = db.Column(db.Integer, primary_key=True)
    Doc_Date = db.Column(db.Date)
    File_Name = db.Column(db.String(255))
    File_Discription = db.Column(db.String(255))
    Cupboard_Code = db.Column(db.Integer)
    File_No = db.Column(db.Integer)
    CupBoardCode_Name = db.Column(db.String(255))
    Created_by = db.Column(db.String(255))
    Modified_by = db.Column(db.String(255))
    Remark = db.Column(db.String(255))
