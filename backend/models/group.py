from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class Group(Base):
	__tablename__ = 'groups'
	group_id = Column(Integer, primary_key=True)
	group_name = Column(String(50), unique=True, nullable=False)
	# group_avatar = Column(String(255), unique=False)
	year_created = Column(Integer, unique=False)
	admin_id = Column(Integer, ForeignKey('accounts.account_id'), unique=False, nullable=False)


	def __repr__(self):
		return f"<Group group_id={self.group_id} group_name={self.group_name} admin_id={self.admin_id}>"

	@classmethod
	def all(cls):
		'''
		returns all groups in the database
		'''
		return db_session.query(cls).all()

	@classmethod
	def get_grp_by_id(cls, grp_id):
		'''
		gets the group object with the specified group id
		
		PARAMS: 
		- grp_id: the id of the target group

		RETURNS: 
		- the target group object from the database
		'''
		return db_session.query(cls).filter_by(group_id = grp_id).first()
	
	@classmethod
	def get_grp_by_admin(cls, admin_id):
		'''
		gets all groups who's administrator is the account with the specified id

		PARAMS: 
		- admin_id: the id of the admin account
		'''
		return db_session.query(cls).filter_by(admin_id = admin_id).all()
	
	def save(self):
		'''
		saves a group to the database
		'''
		db_session.add(self)
		db_session.commit()

	def delete(self):
		'''
		deletes a group from the database
		'''
		db_session.delete(self)
		db_session.commit()

	def to_dict(self):
		'''
		return a dictionary format of the account object 
		'''
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
