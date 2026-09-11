from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.BusinessReleted.DeliveryOrder.DeliveryOrderModels import DeliveryOrderHead,DeliveryOrderDetail

class DeliveryOrderHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = DeliveryOrderHead
        include_relationships = True

class DeliveryOrderDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = DeliveryOrderDetail
        include_relationships = True