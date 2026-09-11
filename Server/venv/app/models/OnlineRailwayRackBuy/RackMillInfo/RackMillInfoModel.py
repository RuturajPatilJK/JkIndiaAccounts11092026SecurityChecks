from app import db


class RackMillInfo(db.Model):
    __tablename__ = "Rack_Mill_Info"
    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Mill_name = db.Column(db.String(100), nullable=False)
    Mill_code = db.Column(db.String(50), nullable=True)
    City_name = db.Column(db.String(50), nullable=True)
    Remark = db.Column(db.String(255), nullable=True)
    Created_By = db.Column(db.String(50), nullable=True)
    Modified_By = db.Column(db.String(50), nullable=True)
    # Created_Date = db.Column(db.Date, nullable=True)
    # Modified_Date = db.Column(db.Date, nullable=True)
    State_Code = db.Column(db.Integer, nullable=False)




    @property
    def as_dict(self):
        return {c.key: getattr(self, c.key) for c in self.__table__.columns}












# from app import db

# class GstStateMaster(db.Model):
#     __tablename__ = "gststatemaster"

#     State_Code = db.Column(db.Integer, primary_key=True, autoincrement=True)
#     State_Name = db.Column(db.String(200), nullable=True)

#     # Relationships
#     mills = db.relationship('RackMillInfo', backref='state', lazy=True)
    

# class RackMillInfo(db.Model):
#     __tablename__ = "Rack_Mill_Info"

#     Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
#     Mill_name = db.Column(db.String(100), nullable=False)
#     Mill_code = db.Column(db.String(50), nullable=True)
#     City_name = db.Column(db.String(50), nullable=True)
#     Remark = db.Column(db.String(255), nullable=True)
#     Created_By = db.Column(db.String(50), nullable=True)
#     Modified_By = db.Column(db.String(50), nullable=True)
#     Created_Date = db.Column(db.Date, nullable=True)
#     Modified_Date = db.Column(db.Date, nullable=True)
#     State_Code = db.Column(db.Integer, db.ForeignKey('gststatemaster.State_Code'), nullable=False)

#     @property
#     def as_dict(self):
#         return {c.key: getattr(self, c.key) for c in self.__table__.columns}
