from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.CupboardMaster.CupboardMasterModels import CupboardMaster


class CupboardMasterSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = CupboardMaster
