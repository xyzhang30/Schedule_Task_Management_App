from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..db import Base, db_session
from datetime import datetime
# from .notifications import Notifications  # Import Notifications model

class Event(Base):
    __tablename__ = 'events'
    event_id = Column(Integer, primary_key=True)
    account_id = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    location = Column(String(200), nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    category = Column(String(100), nullable=True)
    label_text = Column(String(100), nullable=True)
    label_color = Column(String(20), nullable=True)
    frequency = Column(String(50), nullable=True)
    repeat_until = Column(DateTime, nullable=True)

    # Relationship with Notifications
    notifications = relationship('Notifications', backref='event', lazy='dynamic')

    def __repr__(self):
        return f"<Event event_id={self.event_id} name={self.name}>"

    @classmethod
    def all(cls):
        return db_session.query(cls).all()
    
    @classmethod
    def get_event(cls, event_id):
        return db_session.query(cls).get(event_id)

    @classmethod
    def get_events_by_account(cls, account_id):
        return db_session.query(cls).filter_by(account_id=account_id).all()
    
    @classmethod
    def get_events_happening_today(cls, account_id, now):
        return db_session.query(cls).filter(
            cls.account_id == account_id,
            cls.start_date >= datetime.combine(now, datetime.min.time()),
            cls.start_date <= datetime.combine(now, datetime.max.time())
        ).all()
    
    @classmethod
    def get_upcoming_events(cls):
        now = datetime.now()
        return db_session.query(cls).filter(cls.start_date > now).all()
    
    def to_dict(self):
        return {
            'event_id': self.event_id,
            'account_id': self.account_id,
            'name': self.name,
            'location': self.location,
            'start_date': self.start_date.strftime('%Y-%m-%dT%H:%M'),
            'end_date': self.end_date.strftime('%Y-%m-%dT%H:%M'),
            'category': self.category,
            'label_text': self.label_text,
            'label_color': self.label_color,
            'frequency': self.frequency,
            'repeat_until': self.repeat_until.strftime('%Y-%m-%dT%H:%M') if self.repeat_until else None
        }

    def save(self):
        try:
            db_session.add(self)
            db_session.commit()
        except Exception as e:
            db_session.rollback()
            raise e  
    
    def delete(self):
        db_session.delete(self)
        db_session.commit()

    def update(self):
        db_session.commit()
    
    def get_existing_notification(self, account_id):
        from .notifications import Notifications  
        return db_session.query(Notifications).filter_by(
            account_id_to=account_id,
            notification_type='Event Today',
            event_id=self.event_id
        ).first()

    def delete_notifications(self, account_id):
        from .notifications import Notifications  
        existing_notifications = db_session.query(Notifications).filter_by(
            account_id_to=account_id,
            notification_type='Event Today',
            event_id=self.event_id
        ).all()
        for notification in existing_notifications:
            db_session.delete(notification)
        db_session.commit()

    def create_or_update_notification(self, account_id):
        from .notifications import Notifications  
        now = datetime.now().date()
        if self.start_date.date() == now:
            existing_notification = self.get_existing_notification(account_id)
            message = f"Your event '{self.name}' is happening today at {self.start_date.strftime('%H:%M')}."
            if existing_notification:
                # Update the notification message
                existing_notification.message = message
                existing_notification.created_at = datetime.now()
                existing_notification.is_pending = True
                existing_notification.save_notification()
            else:
                # Create a new notification
                notification = Notifications(
                    account_id_from=account_id,
                    account_id_to=account_id,
                    notification_type='Event Today',
                    message=message,
                    is_pending=True,
                    created_at=datetime.now(),
                    event_id=self.event_id
                )
                notification.save_notification()
        else:
            # If the event is not happening today, delete any existing notifications for this event
            self.delete_notifications(account_id)
    
    def create_notification_if_today(self, account_id):
        from .notifications import Notifications  
        if self.start_date.date() == datetime.now().date():
            message = f"Your event '{self.name}' is happening today at {self.start_date.strftime('%H:%M')}."
            notification = Notifications(
                account_id_from=account_id,
                account_id_to=account_id,
                notification_type='Event Today',
                message=message,
                is_pending=True,
                created_at=datetime.now(),
                event_id=self.event_id
            )
            notification.save_notification()

    def create_notification_if_starting_soon(self):
        from .notifications import Notifications  
        now = datetime.now()
        time_diff = self.start_date - now
        if timedelta(minutes=0) <= time_diff <= timedelta(minutes=15):
            # Check if notification already exists
            existing_notification = db_session.query(Notifications).filter_by(
                account_id_to=self.account_id,
                notification_type='Event Soon',
                event_id=self.event_id,
                is_pending=True
            ).first()
            if not existing_notification:
                message = f"Event '{self.name}' is starting soon."
                notification = Notifications(
                    account_id_from=self.account_id,
                    account_id_to=self.account_id,
                    notification_type='Event Soon',
                    message=message,
                    is_pending=True,
                    created_at=now,
                    event_id=self.event_id
                )
                notification.save_notification()

# Category model
class EventCategory(Base):
    __tablename__ = 'event_category'
    category_name = Column(String, primary_key=True)

    def __repr__(self):
        return f"<Category category_name={self.category_name}>"
    
    def to_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}
    
    def save(self):
        db_session.add(self)
        db_session.commit()

    def delete(self):
        db_session.delete(self)
        db_session.commit()

    @classmethod
    def all(cls):
        return db_session.query(cls).all()

    @classmethod
    def get_category(cls, category_name):
        return db_session.query(cls).filter_by(category_name=category_name).first()
    
    @classmethod
    def clean_unused(cls):
        """Delete all unused event categories."""
        try:
            # Get all categories
            categories = cls.all()
            # Get all categories used in events
            used_categories = set(event.category for event in Event.all() if event.category)
            # Find unused categories
            unused_categories = [category for category in categories if category.category_name not in used_categories]
            # Delete unused categories
            for category in unused_categories:
                category.delete()
        except Exception as e:
            raise e
