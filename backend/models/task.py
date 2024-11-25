from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP, func
from collections import defaultdict
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship
from ..models.account import Account
from ..db import Base, db_session


class Task(Base):
    __tablename__ = 'task'
    task_id = Column(Integer, primary_key=True)
    account_id = Column(Integer, ForeignKey('accounts.account_id'))
    category = Column(String, unique=False)
    due_time = Column(TIMESTAMP, unique=False)
    task_name = Column(String, unique=False)
    complete = Column(Boolean, unique=False, default=False)
    event_id = Column(String, ForeignKey('events.event_id'), nullable=True)

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

    def cancel_complete_task(self):
        self.complete = False
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
    
    @classmethod
    def all_tasks_by_due_date(cls, account_id, due_date):
        print("test")
        print(func.date(cls.due_time))
        tasks = db_session.query(cls).filter(
            cls.account_id == account_id,
            func.date(cls.due_time) == due_date
        ).order_by(cls.due_time.asc()).all()
        for task in tasks:
            print(f"Task: {task.task_name}, Due Time: {task.due_time}")
        return tasks


class Category(Base):
    __tablename__ = 'task_category'
    account_id = Column(Integer, ForeignKey('accounts.account_id'))
    category_name = Column(String, primary_key=True)

    def __repr__(self):
        return f"<Category category_name={self.category_name}>"
    
    def to_dict(self):
        print("called to_dict")
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}
    
    def save(self):
        db_session.add(self)
        db_session.commit()

    @classmethod
    def all(cls):
        return db_session.query(cls).all()
    
    @classmethod
    def all_per_user(cls, account_id):
        return db_session.query(cls).filter_by(account_id=account_id).all()
    