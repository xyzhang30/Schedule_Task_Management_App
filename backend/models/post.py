from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, TIMESTAMP
from datetime import datetime
from ..db import Base, db_session

class Post(Base):
    __tablename__ = 'post'
    
    post_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(Text)
    date_posted = Column(TIMESTAMP, nullable=False, default=datetime.now())
    poster_id = Column(Integer, ForeignKey('accounts.account_id'), nullable=False)

    def __repr__(self):
        return f"<Post id={self.post_id} title={self.title}>"

    @classmethod
    def all(cls):
        ''' 
        Retrieves all posts from the database
        '''
        return db_session.query(cls).all()

    @classmethod
    def get_post_by_id(cls, post_id):
        '''
        Retrieves a single post by its ID
        '''
        return db_session.query(cls).filter_by(post_id=post_id).first()
    
    @classmethod
    def get_posts_by_poster_id(cls, poster_id):
        '''
        Retrieves all posts made by a specific user
        '''
        return db_session.query(cls).filter_by(poster_id=poster_id).all()

    @classmethod
    def get_posts_by_poster_ids(cls, poster_ids):
        '''
        Retrieves posts made by a list of users
        '''
        return db_session.query(cls).filter(cls.poster_id.in_(poster_ids)).all()

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

    @classmethod
    def get_likes_by_post_id(cls, post_id):
        '''
        Retrieves all likes for a specific post
        '''
        return db_session.query(cls).filter_by(post_id=post_id).all()
    
    @classmethod
    def get_like_by_post_and_liker_id(cls, post_id, liker_id):
        '''
        Retrieves a like by the post ID and liker ID
        '''
        return db_session.query(cls).filter_by(post_id=post_id, liker_id=liker_id).first()

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

    @classmethod
    def get_saves_by_post_id(cls, post_id):
        '''
        Retrieves all saves for a specific post
        '''
        return db_session.query(cls).filter_by(post_id=post_id).all()

    @classmethod
    def get_saves_by_saver_id(cls, saver_id):
        '''
        Retrieves all posts saved by a specific user
        '''
        return db_session.query(cls).filter_by(saver_id=saver_id).all()
    
    @classmethod
    def get_save_by_post_and_saver_id(cls, post_id, saver_id):
        '''
        Retrieves a save by the post ID and saver ID
        '''
        return db_session.query(cls).filter_by(post_id=post_id, saver_id=saver_id).first()

    def save(self):
        db_session.add(self)
        db_session.commit()

    def delete(self):
        db_session.delete(self)
        db_session.commit()


class Comment(Base):
    __tablename__ = 'comments'
    comment_id = Column(Integer, primary_key=True, autoincrement=True)
    commenter_id = Column(Integer, ForeignKey('accounts.account_id'))
    post_id = Column(Integer, ForeignKey('post.post_id'))
    timestamp = Column(TIMESTAMP, default=datetime.now())
    text = Column(String(200), nullable=False)

    @classmethod
    def get_comments_by_post_id(cls, post_id):
        '''
        Retrieves all comments for a specific post
        '''
        return db_session.query(cls).filter_by(post_id=post_id).all()
    
    @classmethod
    def get_comment_by_comment_id(cls, comment_id):
        '''
        Retrieves a single comment by its ID
        '''
        return db_session.query(cls).get(comment_id)

    def save(self):
        '''
        saves a new comment in the database
        '''
        db_session.add(self)
        db_session.commit()

    def delete(self):
        '''
        removes a comment from the database
        '''
        db_session.delete(self)
        db_session.commit()
