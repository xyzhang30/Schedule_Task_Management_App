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
    event_id = Column(Integer, ForeignKey('events.event_id'), nullable=True)

    def __repr__(self):
        return f"<Task account_id={self.account_id} task_id={self.task_id}>"

    @classmethod
    def all(cls):
        '''
        returns all tasks in the database
        '''
        return db_session.query(cls).all()

    def save(self):
        '''
        saves a new task in the database
        '''
        db_session.add(self)
        db_session.commit()

    def to_dict(self):
        '''
        return a dictionary format of the account object 
        '''
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}
    
    def delete(self):
        '''
        removes a task from the database
        '''
        db_session.delete(self)
        db_session.commit()

    def complete_task(self):
        '''
        sets the complete status of the task to true in the database
        '''
        self.complete = True
        db_session.commit()

    def cancel_complete_task(self):
        '''
        sets the complete status of the task to false in the database
        '''
        self.complete = False
        db_session.commit()

    @classmethod
    def get_task(cls, task_id):
        '''
        gets the task object with the specified task id
        '''
        return db_session.query(cls).get(task_id)
    
    @classmethod
    def get_to_do(cls):
        '''
        get all tasks with complete status = true
        '''
        return db_session.query(cls).filter_by(complete = True)
    
    @classmethod
    def get_by_account(cls, account_id):
        '''
        gets all tasks created by the specified account
        '''
        return db_session.query(cls).filter_by(account_id=account_id).all()
    
    @classmethod
    def get_by_date(cls, account_id, due_date):
        '''
        gets all tasks created by the specified account that's due on the specified date
        '''
        return db_session.query(cls).filter(cls.account_id == account_id, func.date(cls.due_time) == due_date).all()
    
    @classmethod
    def get_by_category(cls, account_id, category):
        '''
        gets all tasks created by the specified account and of the specified category
        '''
        return db_session.query(cls).filter_by(account_id=account_id).filter_by(category=category).all()
    
    @classmethod
    def get_tasks_by_account_dic(cls, account_id):
        '''
        Retrieves and organizes tasks for a specific account by their due date.

        RETURNS: 
        - map: A dictionary where the keys are due dates, and the values are lists of tasks sorted by their due time. 
        '''
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
        '''
        returns all tasks created by the specified account id, and are due on the specified due date
        '''
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
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}
    
    def save(self):
        '''
        save a new category to the database
        '''
        db_session.add(self)
        db_session.commit()

    @classmethod
    def all(cls):
        '''
        returns all category objects from the database
        '''
        return db_session.query(cls).all()
    
    @classmethod
    def all_per_user(cls, account_id):
        '''
        returns all categories created by the specified account
        '''
        return db_session.query(cls).filter_by(account_id=account_id).all()
    