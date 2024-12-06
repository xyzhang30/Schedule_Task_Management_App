from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class Registration(Base):
	__tablename__ = 'registrations'
	event_id = Column(Integer, ForeignKey('public_events.event_id'), primary_key=True)
	account_id = Column(Integer, ForeignKey('accounts.account_id'), primary_key=True)


	def __repr__(self):
		return f"<Registration event_id={self.event_id} account_id={self.account_id}>"

	@classmethod
	def all(cls):
		'''
		return all public event registrations
		'''
		return db_session.query(cls).all()

	@classmethod
	def get_registr(cls, acc_id, evt_id):
		'''
		get the registration info for the specified account with the specified event, if it exists
		'''
		return db_session.query(cls).filter_by(account_id = acc_id, event_id = evt_id).first()

	@classmethod
	def get_accs_by_evt_id(cls, evt_id):
		'''
		get all accounts that are registered for the specified event
		'''
		return db_session.query(cls).filter_by(event_id = evt_id).all()
	
	@classmethod
	def get_evts_by_acc_id(cls, acc_id):
		'''
		gets all events the specified account is registered for
		'''
		return db_session.query(cls).filter_by(account_id = acc_id).all()
	
	def save(self):
		'''
		saves a registration to the database
		'''
		db_session.add(self)
		db_session.commit()

	def delete(self):
		'''
		removes a registration from the database
		'''
		db_session.delete(self)
		db_session.commit()

	def to_dict(self):
		'''
		returns a registration entry in dictionary format
		'''
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}