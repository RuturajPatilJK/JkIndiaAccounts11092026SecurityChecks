from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Utilities.UserCreationWithPermission.UserCreationWithPermissionModel import TblUser, TblUserDetail

class TblUserSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TblUser
        include_relationships = True

class TblUserDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TblUserDetail
        include_relationships = True

