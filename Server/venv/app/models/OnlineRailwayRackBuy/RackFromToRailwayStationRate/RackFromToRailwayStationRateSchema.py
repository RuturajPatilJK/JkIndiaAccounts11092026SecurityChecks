from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.OnlineRailwayRackBuy.RackFromToRailwayStationRate.RackFromToRailwayStationRateModel import RackFromToRailwayStationRate
class Rack_From_To_Railway_Station_Rate_Schema(SQLAlchemyAutoSchema):
    class Meta:
        model = RackFromToRailwayStationRate
        include_relationships = True
