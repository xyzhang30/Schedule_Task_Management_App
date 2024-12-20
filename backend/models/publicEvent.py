from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class PublicEvent(Base):
    __tablename__ = 'public_events'
    event_id = Column(Integer, primary_key=True)
    event_name = Column(String(50), unique=True, nullable=False)
    group_id = Column(Integer, ForeignKey('groups.group_id'), unique=False, nullable=False)
    start_date_time = Column(DateTime, nullable=False)
    end_date_time = Column(DateTime, nullable=False)
    is_all_day = Column(Boolean, default=False)

    
    def __repr__(self):
        return f"<PublicEvent event_id={self.event_id} event_name={self.event_name} group_id={self.group_id}>"

    @classmethod
    def all(cls):
        '''
        returns all public events
        '''
        return db_session.query(cls).all()

    @classmethod
    def get_evt_by_id(cls, id):
        '''
        gets the public event with the specified id
        '''
        return db_session.query(cls).filter_by(event_id = id).first()
    
    @classmethod
    def get_evts_by_grp_id(cls, grp_id):
        '''
        gets all public events of the specified group
        '''
        return db_session.query(cls).filter_by(group_id = grp_id).all()

    def save(self):
        '''
        save a new public event to the database
        '''
        db_session.add(self)
        db_session.commit()

    def delete(self):
        '''
        remove a public event from the database
        '''
        db_session.delete(self)
        db_session.commit()

    def to_dict(self):
        '''
        returns a public event in dictionary format
        '''
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}