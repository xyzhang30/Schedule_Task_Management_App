from sqlalchemy import Column, Integer, String, DateTime
from ..db import Base, db_session
from datetime import datetime
from ..models.notifications import Notifications

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
    label_color = Column(String(200), nullable=True)
    frequency = Column(String(50), nullable=True)
    repeat_until = Column(DateTime, nullable=True)
    # Added series_id to group events in a series
    series_id = Column(Integer, nullable=True)

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
        print("_____ TODAY: ", datetime.now().date())
        return db_session.query(cls).filter(
            cls.account_id == account_id,
            cls.start_date >= datetime.combine(now, datetime.min.time()),
            cls.start_date <= datetime.combine(now, datetime.max.time())
        ).all()
    
    @classmethod
    def get_future_events_by_account(cls, account_id, start_date):
        return db_session.query(cls).filter(
            cls.account_id == account_id,
            cls.start_date >= datetime.combine(start_date, datetime.min.time())
        ).order_by(cls.start_date).all()
    
    # Added method to get occurrences by series_id
    @classmethod
    def get_occurrences_by_series_id(cls, series_id, exclude_event_id=None):
        query = db_session.query(cls).filter(cls.series_id == series_id)
        if exclude_event_id:
            query = query.filter(cls.event_id != exclude_event_id)
        return query.all()
    
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
            'repeat_until': self.repeat_until.strftime('%Y-%m-%dT%H:%M') if self.repeat_until else None,
            'series_id': self.series_id  # Include series_id in the dictionary
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

    def get_notification(self, account_id):
        return db_session.query(Notifications).filter_by(
            account_id_to=account_id,
            notification_type='Event Today',
            event_id=self.event_id
        ).first()

    def delete_notifications(self, account_id):
        existing_notifications = db_session.query(Notifications).filter_by(
            account_id_to=account_id,
            notification_type='Event Today',
            event_id=self.event_id
        ).all()
        for notification in existing_notifications:
            db_session.delete(notification)
        db_session.commit()

    def create_or_update_notification(self, account_id):
        message = f"Your event '{self.name}' is happening today at {self.start_date.strftime('%H:%M')}."
        existing_notification = self.get_notification(account_id)
        if existing_notification:
            existing_notification.message = message
            existing_notification.created_at = datetime.now()
            existing_notification.is_pending = True
            existing_notification.save_notification()
        else:
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
