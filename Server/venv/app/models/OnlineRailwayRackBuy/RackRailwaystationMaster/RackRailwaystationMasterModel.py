from app import db

class RackRailwaystationMaster(db.Model):
    __tablename__ = "Rack_Railway_station_Master"

    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Station_code = db.Column(db.String(15), nullable=True)
    Station_name = db.Column(db.String(100), nullable=False)
    City_name = db.Column(db.String(50), nullable=True)
    Remark = db.Column(db.String(255), nullable=True)
    Created_By = db.Column(db.String(50), nullable=True)
    Modified_By = db.Column(db.String(50), nullable=True)
    # Created_Date = db.Column(db.Date, nullable=True)
    # Modified_Date = db.Column(db.Date, nullable=True)
    State_code = db.Column(db.Integer, nullable=False)
    Station_type = db.Column(db.String(100), nullable=False)

    @property
    def as_dict(self):
        return {c.key: getattr(self, c.key) for c in self.__table__.columns}
