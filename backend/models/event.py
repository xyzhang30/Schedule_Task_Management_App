# event.py
from sqlalchemy import Column, Integer, String, DateTime
from ..db import Base, db_session

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
            'label_color': self.label_color
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
