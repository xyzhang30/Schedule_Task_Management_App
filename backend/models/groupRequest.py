from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship
from .account import Account
from .group import Group

from ..db import Base, db_session

class GroupRequest(Base):
    __tablename__ = 'group_requests'
    request_id = Column(Integer, primary_key=True)
    account_id = Column(Integer, ForeignKey('accounts.account_id'))
    group_id = Column(Integer, ForeignKey('groups.group_id'))
    message = Column(String, unique=False)
    is_pending = Column(Boolean, unique=False)
    created_at = Column(TIMESTAMP, unique=False)

    def __repr__(self):
        return f"<GroupRequest account_id={self.account_id} group_id={self.group_id} message={self.message}>"

    @classmethod
    def all(cls):
        return db_session.query(cls).all()
    
    @classmethod
    def get_rqst_by_id(cls, rqst_id):
        return db_session.query(cls).filter_by(request_id = rqst_id).first()
    
    @classmethod
    def get_rqst_by_acc_send(cls, acc_id):
        return db_session.query(cls).filter_by(account_id = acc_id, is_pending = True).all()

    @classmethod
    def get_rqst_by_acc_recv(cls, acc_id):
        groups = Group.get_grp_by_admin(acc_id)
        in_requests = []
        for grp in groups:
            rqsts = db_session.query(cls).filter_by(group_id = grp.group_id, is_pending = True).all()
            in_requests.extend(rqsts)
        return in_requests

    def update_pending_status(self):
        self.is_pending = False
        db_session.commit()

    def save(self):
        db_session.add(self)
        db_session.commit()

    def to_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}