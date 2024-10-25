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
		return db_session.query(cls).all()
	
	@classmethod
	def get_all_by_reset_key(cls, rk):
		return db_session.query(cls).filter_by(reset_key = rk).first()
	
	def save(self):
		db_session.add(self)
		db_session.commit()

	def to_dict(self):
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
	
	#Todo: fix names
