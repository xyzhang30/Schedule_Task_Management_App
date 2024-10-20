from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP, func
from collections import defaultdict
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship
from ..models.account import Account
from ..db import Base, db_session


class Task(Base):
    __tablename__ = 'task'
    task_id = Column(Integer, primary_key=True)  # serial?
    account_id = Column(Integer, ForeignKey('accounts.account_id'))
    category = Column(String, unique=False)
    due_time = Column(TIMESTAMP, unique=False)
    task_name = Column(String, unique=False)  # cannot be null
    complete = Column(Boolean, unique=False, default=False)

    def __repr__(self):
        return f"<Task account_id={self.account_id} task_id={self.task_id}>"

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

    def complete_task(self):
        self.complete = True
        db_session.commit()
          
    @classmethod
    def get_task(cls, task_id):
        return db_session.query(cls).get(task_id)
    
    @classmethod
    def get_to_do(cls):
        return db_session.query(cls).filter_by(complete = True)
    
    @classmethod
    def get_by_account(cls, account_id):
        return db_session.query(cls).filter_by(account_id=account_id).all()
    
    @classmethod
    def get_by_date(cls, account_id, due_date):
        return db_session.query(cls).filter(cls.account_id == account_id, func.date(cls.due_time) == due_date).all()
    
    @classmethod
    def get_by_category(cls, account_id, category):
        return db_session.query(cls).filter_by(account_id=account_id).filter_by(category=category).all()
    
    @classmethod
    def get_tasks_by_account_dic(cls, account_id):
        tasks = cls.get_by_account(account_id)
        map = defaultdict(list)
        
        for task in tasks:
            k_date = task.due_time.date()
            map[k_date].append(task)

        for k_date in map:
            map[k_date].sort(key=lambda x: x.due_time)

        return map