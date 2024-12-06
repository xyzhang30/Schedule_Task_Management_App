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
        '''
        returns all clocked study time entries
        '''
        return db_session.query(cls).all()

    def save(self):
        '''
        saves a clocked study time entry to the database
        '''
        db_session.add(self)
        db_session.commit()

    def to_dict(self):
        '''
        returns a studytime entry in dictionary format
        '''
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}
    
    def delete(self):
        '''
        remove a clocked study time entry from the database
        '''
        db_session.delete(self)
        db_session.commit()
    
    @classmethod
    def get_by_account(cls, account_id):
        '''
        get all study time entries clocked by the given account
        '''
        return db_session.query(cls).filter_by(account_id=account_id).all()
    
    @classmethod
    def update_study_time(cls, account_id, date, time):
        '''
        updates the total study time for the given account on the given date after a new clocked entry

        PARAM: 
        - account_id: the target account id to update for
        - date: the date the new study time entry is clocked on
        - time: the amount of time of the newly clocked entry
        '''
        study_time_entry = db_session.query(cls).filter_by(account_id=account_id, date=date).first()
        if study_time_entry:
            study_time_entry.study_time += time
        else:
            study_time_entry = cls(account_id=account_id, date=date, study_time=time)
            db_session.add(study_time_entry)
        db_session.commit()


    @classmethod
    def daily_study_time(cls, account_id, current_date):
        '''
        gets the study time for the given id on the given date
        '''
        result = db_session.query(cls).filter_by(account_id=account_id, date=current_date).first()
        study_time = result.study_time or timedelta(0)
        return study_time
    

    @classmethod
    def weekly_study_time(cls, account_id, current_date):
        '''
        gets the total study time clocked by the given account within the week of the given date
        '''
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
    
    @classmethod
    def get_all_users_weekly_study_time(cls, current_date):
        '''
        gets the weekly study time for all users, on the week the given date belongs in
        '''
        start_of_week = current_date - timedelta(days=current_date.weekday())
        
        # Query to get the total weekly study time for all users
        weekly_study_times = (
            db_session.query(Account.username, func.sum(cls.study_time).label("total_study_time"))
            .join(Account, Account.account_id == cls.account_id)
            .filter(cls.date >= start_of_week, cls.date <= current_date)
            .group_by(Account.username)
            .order_by(func.sum(cls.study_time).desc())
            .all()
        )
        
        return [{"username": user[0], "total_study_time": str(user[1])} for user in weekly_study_times]
