from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class Availability(Base):
	__tablename__ = 'availability'
	account_id = Column(Integer, ForeignKey('accounts.account_id'), primary_key=True)
	unav_interval = Column(String(20), primary_key=True)
	full_date = Column(String(15), primary_key=True)

    # relationship to the Account model
	# account = relationship('Account', back_populates='availability_records')

	def __repr__(self):
		return f"<Availability account_id={self.account_id} username={self.username}>"

	@classmethod
	def all(cls):
		return db_session.query(cls).all()

	def save(self):
		db_session.add(self)
		db_session.commit()

	def to_dict(self):
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
