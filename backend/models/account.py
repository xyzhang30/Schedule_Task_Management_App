from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UUID
import uuid
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class Account(Base):
	'''
	model for account
	'''
	__tablename__ = 'accounts'
	account_id = Column(Integer, primary_key=True, autoincrement=True)
	username = Column(String(50), unique=True)
	password = Column(String(255), unique=False)
	email = Column(String(100), unique=True)
	phone = Column(String(15), unique=True)
	avatar = Column(String(255), unique=False, nullable = True)
	year_created = Column(Integer, unique=False)
	major = Column(String(100))

	def __repr__(self):
		return f"<Account account_id={self.account_id} username={self.username}>"

	@classmethod
	def all(cls):
		'''
		gets all account data from the database
		'''
		return db_session.query(cls).all()
	
	@classmethod 
	def all_except_self(cls, self_id):
		'''
		get all accounts except for the account with the specified account_id
		'''
		return db_session.query(cls).filter(cls.account_id != self_id).all()
	
	@classmethod
	def get_acc_by_id(cls, id):
		'''
		gets the account object according to the specified account id
		'''
		return db_session.query(cls).filter_by(account_id = id).first()
	
	@classmethod
	def get_acc_by_username(cls, un):
		'''
		gets the account object of the user with specified username 
		 
		:param:
		- un: the username of the target account
		'''
		return db_session.query(cls).filter_by(username = un).first()

	@classmethod
	def get_acc_by_email(cls, email_address):
		'''
		gets the account object of the user with specified email 
		 
		:param:
		- email_address: the email of the target account
		'''
		return db_session.query(cls).filter_by(email = email_address).first()
	
	def save(self):
		'''
		saves the account object into the database and commit the change
		'''
		db_session.add(self)
		db_session.commit()

	def to_dict(self):
		'''
		return a dictionary format of the account object 
		'''
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
