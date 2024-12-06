from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, UUID
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class ResetKeys(Base):
	__tablename__ = 'resetkeys'
	reset_key = Column(String(100), primary_key=True)
	account_id = Column(Integer, ForeignKey('accounts.account_id'))
	time_stamp = Column(Float)

	def __repr__(self):
		return f"<ResetKeys reset_key={self.reset_key} account_id={self.account_id}>"

	@classmethod
	def all(cls):
		'''
		returns all resetkey requests
		'''
		return db_session.query(cls).all()
	
	@classmethod
	def get_all_by_reset_key(cls, rk):
		'''
		gets the request with the given reset key
		'''
		return db_session.query(cls).filter_by(reset_key = rk).first()
	
	@classmethod
	def get_all_by_account_id(cls, id):
		'''
		get all reset key request by the given account
		'''
		return db_session.query(cls).filter_by(account_id = id)
	
	def save(self):
		'''
		save a reset key request to the database
		'''
		db_session.add(self)
		db_session.commit()

	def delete(self):
		'''
		removes a resetkey request from the database
		'''
		db_session.delete(self)
		db_session.commit()

	def to_dict(self):
		'''
		returns a reset keys entry in dictionary format
		'''
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
	