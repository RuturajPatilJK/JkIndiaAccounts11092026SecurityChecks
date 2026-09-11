from app import db

class PostDate(db.Model):
    __tablename__ = 'post_date'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Post_Date = db.Column(db.Date, nullable=True)
    Inword_Date = db.Column(db.Date, nullable=True)
    Outword_Date = db.Column(db.Date, nullable=True)
    Company_Code = db.Column(db.Integer, nullable=False)
    Year_Code = db.Column(db.Integer, nullable=False)
    Created_By = db.Column(db.String(45), nullable=True)
    Created_Date = db.Column(db.Date, nullable=True)
