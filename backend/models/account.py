from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class Account(Base):
	__tablename__ = 'accounts'
	account_id = Column(Integer, primary_key=True)
	username = Column(String, unique=True)
	password = Column(String, unique=False)
	email = Column(String, unique=True)
	phone = Column(String, unique=True)
	avatar = Column(String, unique=False)
	year_created = Column(Integer, unique=False)

	# def __repr__(self):
		# return f"<Account id={self.id} name={self.name}>"

	@classmethod
	def all(cls):
		return db_session.query(cls).all()

	def save(self):
		db_session.add(self)
		db_session.commit()

	def to_dict(self):
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
