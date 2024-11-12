from sqlalchemy import Column, Integer, ForeignKey, DATE, Interval, func
from collections import defaultdict
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship
from ..models.account import Account
from ..db import Base, db_session
from datetime import timedelta


class StudyTime(Base):
    __tablename__ = 'studytime'
    account_id = Column(Integer, ForeignKey('accounts.account_id'), primary_key = True)
    date = Column(DATE, primary_key = True)
    study_time = Column(Interval, unique=False)

    def __repr__(self):
        return f"<StudyTime account_id={self.account_id} date={self.date}>"

    @classmethod
    def all(cls):
        return db_session.query(cls).all()

    def save(self):
        db_session.add(self)
        db_session.commit()

    def to_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}
    
    def delete(self):
        db_session.delete(self)
        db_session.commit()
    
    @classmethod
    def get_by_account(cls, account_id):
        return db_session.query(cls).filter_by(account_id=account_id).all()
    
    @classmethod
    def update_study_time(cls, account_id, date, time):
        study_time_entry = db_session.query(cls).filter_by(account_id=account_id, date=date).first()
        if study_time_entry:
            study_time_entry.study_time += time
        else:
            study_time_entry = cls(account_id=account_id, date=date, study_time=time)
            db_session.add(study_time_entry)
        db_session.commit()


    @classmethod
    def daily_study_time(cls, account_id, current_date):
        result = db_session.query(cls).filter_by(account_id=account_id, date=current_date).first()
        study_time = result.study_time or timedelta(0)
        return study_time
    

    @classmethod
    def weekly_study_time(cls, account_id, current_date):
        start_of_week = current_date - timedelta(days=current_date.weekday())
        total_study_time = (
            db_session.query(func.sum(cls.study_time))
            .filter(
                cls.account_id == account_id,
                cls.date >= start_of_week,
                cls.date <= current_date
            )
            .scalar()
        )
        return total_study_time or timedelta(0)