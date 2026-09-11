from app import db

class RackFromToRailwayStationRate(db.Model):
    __tablename__ = "Rack_From_To_Railway_Station_Rate"

    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Rail_Id = db.Column(db.Integer, nullable=True)
    From_id = db.Column(db.Integer)
    Local_Expenses = db.Column(db.Numeric(18,2), nullable = True)
    To_id = db.Column(db.Integer)
    Min_rate = db.Column(db.Integer)
    Full_rate = db.Column(db.Integer)
    Distance = db.Column(db.Integer)
    Remark = db.Column(db.String(255), nullable=True)
    Created_By = db.Column(db.String(50), nullable=True)
    Modified_By = db.Column(db.String(50), nullable=True)
    Created_Date = db.Column(db.Date, nullable=True)
    Modified_Date = db.Column(db.Date, nullable=True)
    
   

    @property
    def as_dict(self):
        return {c.key: getattr(self, c.key) for c in self.__table__.columns}