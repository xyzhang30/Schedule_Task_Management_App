# event.py
from sqlalchemy import Column, Integer, ForeignKey,String
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship
from datetime import datetime
from ..db import Base, db_session

class Event(Base):
    __tablename__ = 'event'  
    event_id = Column(Integer, primary_key=True)
    account_id = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    location = Column(String(200), nullable=True)
    start_date = Column(datetime, nullable=False)
    end_date = Column(datetime, nullable=False)
    category = Column(String(100), nullable=True)

    def __repr__(self):
        return f"<Event event_id={self.event_id} name={self.name}>"

    @classmethod
    def all(cls):
        return db_session.query(cls).all()
    
    def to_dict(self):
        return {
            'event_id': self.event_id,
            'account_id': self.account_id,
            'name': self.name,
            'location': self.location,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'category': self.category
        }

    # Optional: Add methods for saving and deleting
    def save(self):
        db_session.add(self)
        db_session.commit()

    def delete(self):
        db_session.delete(self)
        db_session.commit()

    def update(self):
        db_session.commit()
