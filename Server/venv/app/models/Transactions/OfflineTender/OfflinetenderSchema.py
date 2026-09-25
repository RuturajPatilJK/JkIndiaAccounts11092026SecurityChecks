from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Transactions.OfflineTender.OfflinetenderModel import OfflineTenderHead, OfflineTenderDetail

class OfflineTenderHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = OfflineTenderHead
        include_relationships = True

class OfflineTenderDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = OfflineTenderDetail
        include_relationships = True
