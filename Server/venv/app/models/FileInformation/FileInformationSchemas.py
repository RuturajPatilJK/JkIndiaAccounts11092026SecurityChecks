from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.FileInformation.FileInformationModels import FileInfo


class FileInfoSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = FileInfo
