import os
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

db_user = os.environ.get("POSTGRES_USER")
db_password = os.environ.get("POSTGRES_PASSWORD")
db_host = os.environ.get("POSTGRES_HOST")
db_name = os.environ.get("POSTGRES_DB")
engine = create_engine(f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}/{db_name}", pool_size=30)

db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))
Base = declarative_base()
Base.query = db_session.query_property()

def init_db():
    # import all modules here that might define models so that
    # they will be registered properly on the metadata.  Otherwise
    # you will have to import them first before calling init_db()
    from app.models.account import Account
    from app.models.friend import Friend
    from app.models.task import Task
    # from app.models.event import Event
    from app.models.post import Post
    from app.models.notifications import Notifications
    from app.models.task import Category
    from app.models.resetKeys import ResetKeys
    from app.models.studyTime import StudyTime
    from app.models.task import Category
    from app.models.group import Group
    from app.models.membership import Membership
    from app.models.publicEvent import PublicEvent
    from app.models.registration import Registration
    Base.metadata.create_all(bind=engine)
