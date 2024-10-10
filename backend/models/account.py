from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class Account(Base):
	__tablename__ = 'Accounts'
	id = Column(Integer, primary_key=True)
	name = Column(String, unique=False)

	def __repr__(self):
		return f"<Account id={self.id} name={self.name}>"

	@classmethod
	def all(cls):
		return db_session.query(cls).all()

	def save(self):
		db_session.add(self)
		db_session.commit()

	def to_dict(self):
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
