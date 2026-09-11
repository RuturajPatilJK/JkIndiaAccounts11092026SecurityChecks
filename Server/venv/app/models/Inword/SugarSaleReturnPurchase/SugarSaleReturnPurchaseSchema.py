from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Inword.SugarSaleReturnPurchase.SugarSaleReturnPurchaseModels import SugarPurchaseReturnHead,SugarPurchaseReturnDetail

class SugarPurchaseReturnHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = SugarPurchaseReturnHead
        include_relationships = True

class SugarPurchaseReturnDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = SugarPurchaseReturnDetail
        include_relationships = True
