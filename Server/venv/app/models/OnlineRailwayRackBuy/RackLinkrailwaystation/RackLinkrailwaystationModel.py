from app import db

class RackLinkrailwaystation(db.Model):
    __tablename__ = "Rack_Link_railway_station"

    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Local_enpenses = db.Column(db.Integer, nullable=True)
    Remark = db.Column(db.String(255), nullable=True)
    Created_By = db.Column(db.String(50), nullable=True)
    Modified_By = db.Column(db.String(50), nullable=True)
    # Created_Date = db.Column(db.Date, nullable=True)
    # Modified_Date = db.Column(db.Date, nullable=True)
    Mill_id = db.Column(db.Integer,nullable=False)
    Railway_station_id = db.Column(db.Integer,nullable=False)

    
    @property
    def as_dict(self):
        return {c.key: getattr(self, c.key) for c in self.__table__.columns}
