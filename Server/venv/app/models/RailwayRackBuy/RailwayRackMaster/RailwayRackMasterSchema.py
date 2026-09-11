from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.RailwayRackBuy.RailwayRackMaster.RailwayRackMasterModel import RailHead, RailDetail


class RailHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = RailHead
        include_relationships = True

class RailDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = RailDetail
        include_relationships = True
