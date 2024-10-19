from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import registry
from datetime import datetime
from ..db import Base, db_session
from ..models.account import Account

mapper_registry = registry()

class Post(Base):
    __tablename__ = 'post'
    
    post_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(Text)
    date_posted = Column(DateTime, nullable=False, default=datetime.utcnow)
    poster_id = Column(Integer, ForeignKey('accounts.account_id'), primary_key=True)

    def __repr__(self):
        return f"<Post id={self.post_id} title={self.title}>"

    @classmethod
    def all(cls):
        '''
        Get all posts
        '''
        return db_session.query(cls).all()

    @classmethod
    def get_post_by_id(cls, post_id):
        '''
        Gets a post by its id
        '''
        return db_session.query(cls).filter_by(post_id=post_id).first()

    def save(self):
        db_session.add(self)
        db_session.commit()

    def delete(self):
        db_session.delete(self)
        db_session.commit()

    def to_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}


class Like(Base):
    __tablename__ = 'likes'
    post_id = Column(Integer, ForeignKey('post.post_id'), primary_key=True)
    liker_id = Column(Integer, ForeignKey('accounts.account_id'), primary_key=True)

    def save(self):
        db_session.add(self)
        db_session.commit()

    def delete(self):
        db_session.delete(self)
        db_session.commit()


class Save(Base):
    __tablename__ = 'saves'
    post_id = Column(Integer, ForeignKey('post.post_id'), primary_key=True)
    saver_id = Column(Integer, ForeignKey('accounts.account_id'), primary_key=True)

    def save(self):
        db_session.add(self)
        db_session.commit()

    def delete(self):
        db_session.delete(self)
        db_session.commit()


class Comment(Base):
    __tablename__ = 'comments'
    commenter_id = Column(Integer, ForeignKey('accounts.account_id'), primary_key=True)
    post_id = Column(Integer, ForeignKey('post.post_id'), primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, primary_key=True)
    text = Column(String(200), nullable=False)

    def save(self):
        db_session.add(self)
        db_session.commit()

    def delete(self):
        db_session.delete(self)
        db_session.commit()
