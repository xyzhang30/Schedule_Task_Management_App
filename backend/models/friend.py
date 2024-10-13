from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class Friend(Base):
	__tablename__ = 'friend'
	account_id1 = Column(Integer, ForeignKey('accounts.account_id'), primary_key=True)
	account_id2 = Column(Integer, ForeignKey('accounts.account_id'), primary_key=True)

	def __repr__(self):
		return f"<Friend account_id1={self.account_id1} account_id2={self.account_id2}>"

	@classmethod
	def all(cls):
		return db_session.query(cls).all()

	@classmethod
	def get_by_ids(cls, account_id1, account_id2):
		'''
		gets friend account pair from database

		PARAMS: 
		- account_id1: id for first account in friend pair
		- account_id2: id for second account in friend pair

		RETURNS: 
		- the Friend object if found
		'''
		if account_id1 > account_id2:
			account_id1, account_id2 = account_id2, account_id1
		return db_session.query(cls).filter_by(account_id1=account_id1, account_id2=account_id2).first()


	def save(self):
		db_session.add(self)
		db_session.commit()

	def delete(self):
		db_session.delete(self)
		db_session.commit()

	def to_dict(self):
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
