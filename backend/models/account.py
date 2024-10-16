from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class Account(Base):
	__tablename__ = 'accounts'
	account_id = Column(Integer, primary_key=True)
	username = Column(String(50), unique=True)
	password = Column(String(255), unique=False)
	email = Column(String(100), unique=True)
	phone = Column(String(15), unique=True)
	avatar = Column(String(255), unique=False)
	year_created = Column(Integer, unique=False)

	def __repr__(self):
		return f"<Account account_id={self.account_id} username={self.username}>"

	@classmethod
	def all(cls):
		return db_session.query(cls).all()
	
	@classmethod
	def get_acc_by_id(cls, id):
		return db_session.query(cls).filter_by(account_id = id).first()

	def save(self):
		db_session.add(self)
		db_session.commit()

	def to_dict(self):
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
