from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship
from sqlalchemy.sql import func
from .account import Account
from .group import Group
# from .event import Event
from .task import Task
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
        '''
        returns all notifications in the database
        '''
        return db_session.query(cls).all()
    
    @classmethod
    def get_notifications_by_acc_recv(cls, id, type):
        '''
        gets all notifications of the specified type that's sent TO the specified account

        PARAMS:
        - id: the target account id
        - type: the message type (friend/group/event/task)
        '''
        return db_session.query(cls).filter_by(
            account_id_to=id, 
            is_pending=True,
            notification_type=type
        ).all()
    
    @classmethod
    def get_notifications_by_acc_send(cls, id, type):
        '''
        gets all notifications of the specified type that's sent BY the specified account

        PARAMS:
        - id: the target account id
        - type: the message type (friend/group/event/task)
        '''
        return db_session.query(cls).filter_by(
            account_id_from=id,
            is_pending=True,
            notification_type=type
        ).all()
    
    @classmethod
    def get_pending_friend_requests_from_id(cls, id):
        '''
        gets pending friend request sent from the specified account
        '''
        return db_session.query(cls).filter_by(
            account_id_from = id,
            is_pending = True,
            notification_type = "friend"
        ).all()

    @classmethod
    def get_grp_notifications_by_acc_send_and_grp(cls, acc_id, grp_id):
        '''
        get all group notifications send by the specified account id and to the specified group
        '''
        return db_session.query(cls).filter_by(
            account_id_from=acc_id, 
            group_id=grp_id,
            notification_type='group'
        ).order_by(cls.notification_id.desc()).first()

    @classmethod
    def get_notification_by_notification_id(cls, request_id):
        '''
        gets the notification object with the specified notification id
        '''
        return db_session.query(cls).filter_by(notification_id = request_id).first()

    def save_notification(self):
        '''
        saves a new notification in the database
        '''
        db_session.add(self)
        db_session.commit()

    def delete_notification(self):
        '''
        removes a notification from the database
        '''
        db_session.delete(self)
        db_session.commit()

    def to_dict(self):
        '''
        return a dictionary format of the account object 
        '''
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

    def update_pending_status(self):
        '''
        changes the pending status of a notification from true to false
        '''
        self.is_pending = False
        db_session.commit()

    @classmethod
    def get_notifications_by_task(cls, task_id):
        '''
        gets notifications for the specified task
        '''
        return db_session.query(Notifications).filter_by(task_id=task_id, notification_type='Task Due Today', is_pending=True).first()
    
    @classmethod
    def get_existing_messages(cls, account_id, event_id):
        '''
        get the notification of the specified event and for the specified account, if it exists
        '''
        return db_session.query(Notifications).filter_by(
                account_id_to=account_id,
                notification_type='Event Today',
                event_id=event_id
            ).first()
    
    @classmethod
    def get_existing_task_messages(cls, account_id, task_id):
        '''
        gets the noficiation of the specified task and for the speficied account, if it exists
        '''
        return db_session.query(Notifications).filter_by(
                account_id_to=account_id,
                notification_type='Task Due Today',
                task_id=task_id 
            ).first()
    
    @classmethod
    def get_notifications_for_events(cls, account_id, now):
        '''
        gets all event notifications for the speficied id, that's starting on the given date

        PARAM: 
        - account_id: the target account of the event notification
        - now: the date (gets all events that starts on the specified date)
        '''
        from .event import Event
        return db_session.query(Notifications).join(Event, Notifications.event_id == Event.event_id).filter(
            Notifications.account_id_to == account_id,
            Notifications.notification_type == 'Event Today',
            Notifications.is_pending == True,
            Event.start_date >= datetime.combine(now, datetime.min.time()),
            Event.start_date <= datetime.combine(now, datetime.max.time())
        ).order_by(Event.start_date.asc()).all()
    
    @classmethod
    def retrieve_event_notifications(cls, account_id):
        '''
        gets all notifications of events happening today
        '''
        return db_session.query(Notifications).filter_by(
            account_id_to=account_id,
            notification_type='Event Today',
            is_pending=True
        ).order_by(Notifications.created_at.desc()).all()
    
    @classmethod
    def retrieve_task_notifications(cls, account_id):
        '''
        gets all task notifications for the specified account
        '''
        return db_session.query(cls).join(Task, cls.task_id == Task.task_id).filter(
            cls.account_id_to == account_id,
            cls.notification_type == 'Task Due Today',
            cls.is_pending == True
        ).order_by(Task.due_time.asc()).all()
