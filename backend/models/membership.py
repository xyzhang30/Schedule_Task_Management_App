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
		return db_session.query(cls).all()

	# TODO: think about how to avoid overflow attack
	@classmethod
	def get_accs_by_grp_id(cls, id):
		return db_session.query(cls).filter_by(group_id = id).all()
	
	@classmethod
	def get_grps_by_acc_id(cls, id):
		return db_session.query(cls).filter_by(account_id = id).all()
	
	def save(self):
		db_session.add(self)
		db_session.commit()

	def delete(self):
		db_session.delete(self)
		db_session.commit()

	def to_dict(self):
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
