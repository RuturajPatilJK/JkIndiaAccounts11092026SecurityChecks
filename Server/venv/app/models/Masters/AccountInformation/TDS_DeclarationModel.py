from sqlalchemy import Column, Integer, Boolean,CHAR
from sqlalchemy.types import NVARCHAR
from sqlalchemy.ext.declarative import declarative_base

from app import db

Base = declarative_base()


class TDS_Declaration(db.Model):
    __tablename__ = 'TDS_Declaration'

    TDS_declaration_id = Column(Integer, primary_key=True, autoincrement=True)

    Ac_code = Column(Integer, nullable=True)
    accoid = Column(Integer, nullable=True)
    Company_code = Column(Integer, nullable=True)
    Year_code = Column(Integer, nullable=True)
    TDS_file_path = Column(NVARCHAR(500), nullable=True)
    is_tds_uploaded = Column(Boolean, nullable=True)
    PANNO= Column(NVARCHAR(50), nullable=True)
    belowLimit=Column(CHAR(1),nullable=True)


    