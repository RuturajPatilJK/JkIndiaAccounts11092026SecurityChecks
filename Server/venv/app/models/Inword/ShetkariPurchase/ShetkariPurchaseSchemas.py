from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Inword.ShetkariPurchase.ShetkariPurchaseModel import ShetkariPurchase,ShetkariPurchaseDetail  

class ShetkariPurchaseHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ShetkariPurchase
        include_relationships = True

class ShetkariPurchaseDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ShetkariPurchaseDetail
        include_relationships = True
