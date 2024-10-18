from sqlalchemy import Column, Integer, String, Boolean, Date, Time, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship

from ..db import Base, db_session

class PublicEvent(Base):
    __tablename__ = 'public_events'
    event_id = Column(Integer, primary_key=True)
    event_name = Column(String(50), unique=True)
    group_id = Column(Integer, ForeignKey('groups.group_id'), unique=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    is_all_day = Column(Boolean, default=False)

    
    def __repr__(self):
        return f"<PublicEvent event_id={self.event_id} event_name={self.event_name} group_id={self.group_id}>"

    @classmethod
    def all(cls):
        return db_session.query(cls).all()

    @classmethod
    def get_evt_by_id(cls, id):
        return db_session.query(cls).filter_by(event_id = id).first()
    
    @classmethod
    def get_evts_by_grp_id(cls, id):
        return db_session.query(cls).filter_by(group_id = id).all()

    def save(self):
        db_session.add(self)
        db_session.commit()

    def delete(self):
        db_session.delete(self)
        db_session.commit()

    def to_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}