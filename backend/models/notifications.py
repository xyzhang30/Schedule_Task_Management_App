from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship
from .account import Account
from .group import Group

from ..db import Base, db_session

class Notifications(Base):
    __tablename__ = 'notifications'
    notification_id = Column(Integer, primary_key=True)
    account_id_from = Column(Integer, ForeignKey('accounts.account_id'))
    account_id_to = Column(Integer, ForeignKey('accounts.account_id'))
    group_id = Column(Integer, ForeignKey('groups.group_id'), default=None)
    notification_type = Column(String, unique = False)
    message = Column(String, unique=False)
    is_pending = Column(Boolean, unique=False)
    created_at = Column(TIMESTAMP, unique=False)
	
    def __repr__(self):
        return f"<Notification account_id_from={self.account_id_from} account_id_to={self.account_id_to} message={self.message}>"
    
    @classmethod
    def all(cls):
        return db_session.query(cls).all()
    
    @classmethod
    def get_frd_notifications_by_acc_recv(cls, id):
        return db_session.query(cls).filter_by(
            account_id_to=id, 
            is_pending=True,
            notification_type='friend'
        ).all()

    @classmethod
    def get_frd_notifications_by_acc_send(cls, id):
        return db_session.query(cls).filter_by(
            account_id_from=id, 
            is_pending=True,
            notification_type='friend'
        ).all()

    @classmethod
    def get_grp_notifications_by_acc_recv(cls, id):
        return db_session.query(cls).filter_by(
            account_id_to=id, 
            is_pending=True,
            notification_type='group'
        ).all()

    @classmethod
    def get_grp_notifications_by_acc_send(cls, id):
        return db_session.query(cls).filter_by(
            account_id_from=id, 
            is_pending=True,
            notification_type='group'
        ).all()
    
    @classmethod
    def get_grp_notifications_by_acc_send_and_grp(cls, acc_id, grp_id):
        return db_session.query(cls).filter_by(
            account_id_from=acc_id, 
            group_id=grp_id,
            notification_type='group'
        ).order_by(cls.notification_id.desc()).first()

    @classmethod
    def get_notification_by_notification_id(cls, request_id):
        return db_session.query(cls).filter_by(notification_id = request_id).first()

    def save_notification(self):
        db_session.add(self)
        db_session.commit()

    def delete_notification(self):
        db_session.delete(self)
        db_session.commit()

    def to_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

    def update_pending_status(self):
        self.is_pending = False
        db_session.commit()