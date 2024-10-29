from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship
from .account import Account

from ..db import Base, db_session

class FriendRequest(Base):
    __tablename__ = 'friendrequests'
    notification_id = Column(Integer, primary_key=True)
    account_id_from = Column(Integer, ForeignKey('accounts.account_id'))
    account_id_to = Column(Integer, ForeignKey('accounts.account_id'))
    message = Column(String, unique=False)
    is_pending = Column(Boolean, unique=False)
    created_at = Column(TIMESTAMP, unique=False)
	
    def __repr__(self):
        return f"<friendRequest account_id_from={self.account_id_from} account_id_to={self.account_id_to} message={self.message}>"
    
    @classmethod
    def all(cls):
        return db_session.query(cls).all()
    
    @classmethod
    def get_messages_for_id(cls, id):
        return db_session.query(cls).filter_by(account_id_to=id).all()
    
    @classmethod
    def get_pending_requests_from_id(cls, id):
        return db_session.query(cls).filter_by(account_id_from=id, is_pending=True).all()

    def save_request(self):
        db_session.add(self)
        db_session.commit()

    def to_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}
