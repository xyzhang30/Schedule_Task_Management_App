from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship
from ..models.account import Account
from ..db import Base, db_session

class Task(Base):
    __tablename__ = 'task'
    task_id = Column(Integer, primary_key=True)  # serial?
    account_id = Column(Integer, ForeignKey('accounts.account_id'))
    #account_id = Column(Integer)
    category = Column(String, unique=False)
    due_date = Column(String, unique=False)
    due_time = Column(String, unique=False)
    task_name = Column(String, unique=False)  # cannot be null

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
