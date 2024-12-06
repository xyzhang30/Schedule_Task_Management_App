from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class Membership(Base):
	__tablename__ = 'memberships'
	group_id = Column(Integer, ForeignKey('groups.group_id'), primary_key=True)
	account_id = Column(Integer, ForeignKey('accounts.account_id'), primary_key=True)


	def __repr__(self):
		return f"<Membership group_id={self.group_id} account_id={self.account_id}>"

	@classmethod
	def all(cls):
		'''
		returns all group membership pairs (group_id, account_id)
		'''
		return db_session.query(cls).all()

	@classmethod
	def get_membership(cls, acc_id, grp_id):
		'''
		gets the membership object according to the specified group id and account id
		'''
		return db_session.query(cls).filter_by(account_id = acc_id, group_id = grp_id).first()

	@classmethod
	def get_accs_by_grp_id(cls, id):
		'''
		gets all accounts that are members of a specified group
		
		PARAM: 
		- id: the id of the target group
		'''
		return db_session.query(cls).filter_by(group_id = id).all()
	
	@classmethod
	def get_grps_by_acc_id(cls, id):
		'''
		gets all groups the specified user is member of

		PARAM: 
		- id: the target account id
		'''
		return db_session.query(cls).filter_by(account_id = id).all()
	
	def save(self):
		'''
		saves a new membership pair in the database
		'''
		db_session.add(self)
		db_session.commit()

	def delete(self):
		'''
		removes a membership pair from the database
		'''
		db_session.delete(self)
		db_session.commit()

	def to_dict(self):
		'''
		return a dictionary format of the membership object 
		'''
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
