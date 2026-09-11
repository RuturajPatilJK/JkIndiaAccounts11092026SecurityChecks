from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
# from app.models.Outword.ServiceBill.ServiceBillModel import ServiceBillHead, ServiceBillDetail
from app.models.Outword.ProformaServiceBill.ProformaServiceBillModel import ProformaServiceBillHead, ProformaServiceBillDetail

class ProformaServiceBillHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ProformaServiceBillHead
        include_relationships = True

class ProformaServiceBillDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ProformaServiceBillDetail
        include_relationships = True
