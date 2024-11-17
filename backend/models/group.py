from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class Group(Base):
	__tablename__ = 'groups'
	group_id = Column(Integer, primary_key=True)
	group_name = Column(String(50), unique=True, nullable=False)
	group_avatar = Column(String(255), unique=False)
	year_created = Column(Integer, unique=False)
	admin_id = Column(Integer, ForeignKey('accounts.account_id'), unique=False, nullable=False)
	# description = Column(String(2000), nullable=False)


	def __repr__(self):
		return f"<Group group_id={self.group_id} group_name={self.group_name} admin_id={self.admin_id}>"

	@classmethod
	def all(cls):
		return db_session.query(cls).all()

	@classmethod
	def get_grp_by_id(cls, grp_id):
		return db_session.query(cls).filter_by(group_id = grp_id).first()
	
	@classmethod
	def get_grp_by_admin(cls, admin_id):
		return db_session.query(cls).filter_by(admin_id = admin_id).all()
	
	def save(self):
		db_session.add(self)
		db_session.commit()

	def delete(self):
		db_session.delete(self)
		db_session.commit()

	def to_dict(self):
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
