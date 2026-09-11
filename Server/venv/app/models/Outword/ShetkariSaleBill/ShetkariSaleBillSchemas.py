from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Outword.ShetkariSaleBill.ShetkariSaleBillModel import ShetkariSaleBillHead,ShetkariSaleBillDetail  

class ShetkariSaleBillHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ShetkariSaleBillHead
        include_relationships = True

class ShetkariSaleBillDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ShetkariSaleBillDetail
        include_relationships = True
