from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship
from .account import Account
from .group import Group
from .event import Event
from datetime import datetime

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
    created_at = Column(DateTime, unique=False)
    event_id = Column(Integer, ForeignKey('events.event_id'), nullable=True)
    task_id = Column(Integer, ForeignKey('task.task_id'), nullable=True)

    event = relationship("Event", backref="notifications", lazy='joined')
	
    def __repr__(self):
        return f"<Notification account_id_from={self.account_id_from} account_id_to={self.account_id_to} message={self.message}>"
    
    @classmethod
    def all(cls):
        return db_session.query(cls).all()
    
    @classmethod
    def get_notifications_by_acc_recv(cls, id, type):
        return db_session.query(cls).filter_by(
            account_id_to=id, 
            is_pending=True,
            notification_type=type
        ).all()
    
    @classmethod
    def get_notifications_by_acc_send(cls, id, type):
        return db_session.query(cls).filter_by(
            account_id_to=id,
            is_pending=True,
            notification_type=type
        ).all()
    
    @classmethod
    def get_pending_friend_requests_from_id(cls, id):
        return db_session.query(cls).filter_by(account_id_from=id, is_pending=True).all()

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

    @classmethod
    def get_notifications_by_task(cls, task_id):
        return db_session.query(Notifications).filter_by(task_id=task_id, notification_type='Task Due Today', is_pending=True).first()
    
    @classmethod
    def get_existing_messages(cls, account_id, event_id):
        return db_session.query(Notifications).filter_by(
                account_id_to=account_id,
                notification_type='Event Today',
                event_id=event_id
            ).first()
    
    @classmethod
    def get_notifications_for_events(cls, account_id, now):
        return db_session.query(Notifications).join(Event, Notifications.event_id == Event.event_id).filter(
            Notifications.account_id_to == account_id,
            Notifications.notification_type == 'Event Today',
            Notifications.is_pending == True,
            Event.start_date >= datetime.combine(now, datetime.min.time()),
            Event.start_date <= datetime.combine(now, datetime.max.time())
        ).order_by(Event.start_date.asc()).all()