from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship
from .account import Account
from .event import Event

from ..db import Base, db_session

class Notifications(Base):
    __tablename__ = 'notifications'
    notification_id = Column(Integer, primary_key=True)
    account_id_from = Column(Integer, ForeignKey('accounts.account_id'))
    account_id_to = Column(Integer, ForeignKey('accounts.account_id'))
    notification_type = Column(String, unique = False)
    message = Column(String, unique=False)
    is_pending = Column(Boolean, unique=False)
    created_at = Column(DateTime, unique=False)
    event_id = Column(Integer, ForeignKey('events.event_id'), nullable=True)
    task_id = Column(Integer, ForeignKey('task.task_id'), nullable=True)
	
    def __repr__(self):
        return f"<Notification account_id_from={self.account_id_from} account_id_to={self.account_id_to} message={self.message}>"
    
    @classmethod
    def all(cls):
        return db_session.query(cls).all()
    
    @classmethod
    def get_messages_for_id(cls, id, notification_type=None):
        query = db_session.query(cls).filter_by(account_id_to=id, is_pending=True)
        if notification_type:
            query = query.filter_by(notification_type=notification_type)
        return query.all()
    
    @classmethod
    def get_pending_notifications_from_id(cls, id):
        return db_session.query(cls).filter_by(account_id_from=id, is_pending=True).all()

    @classmethod
    def get_notification_by_notification_id(cls, request_id):
        return db_session.query(cls).filter_by(notification_id = request_id).first()

    def save_notification(self):
        db_session.add(self)
        db_session.commit()

    def to_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

    def update_pending_status(self):
        self.is_pending = False
        db_session.commit()

    @classmethod
    def get_notifications_by_task(cls, task_id):
        return db_session.query(Notifications).filter_by(task_id=task_id, notification_type='Task Due Today', is_pending=True).first()