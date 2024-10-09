from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session
# from .artist import Artist

class Account(Base):
      __tablename__ = 'Account'
      