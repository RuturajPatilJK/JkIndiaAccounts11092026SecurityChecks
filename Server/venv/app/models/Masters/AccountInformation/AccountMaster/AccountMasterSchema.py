from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Masters.AccountInformation.AccountMaster.AccountMasterModel import AccountMaster,AccountContact, AcGroups

class AccountMasterSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = AccountMaster
        include_relationships = True

class AccountContactSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = AccountContact
        include_relationships = True

class AcGroupsSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = AcGroups
        include_relationships = True
