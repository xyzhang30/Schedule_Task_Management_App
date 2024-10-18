# script for creating all tables in database

import psycopg2
import os

# get database connection information from env vars.
db_user = os.environ.get("POSTGRES_USER")
db_password = os.environ.get("POSTGRES_PASSWORD")
db_host = os.environ.get("POSTGRES_HOST")
db_name = os.environ.get("POSTGRES_DB")

# connect to database
conn_details = psycopg2.connect(
   host=db_host,
   database=db_name,
   user=db_user,
   password=db_password,
)

# create tables 
cursor = conn_details.cursor()
Table_creation = '''
    DROP TABLE IF EXISTS assignment, task, student, friend, availability, likes, shares, saves, comments, events, post, accounts CASCADE;    
    
    CREATE TABLE accounts (
        account_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(15) UNIQUE,
        avatar VARCHAR(255),
        year_created INTEGER NOT NULL
    );

    CREATE TABLE friend (
        account_id1 INTEGER REFERENCES accounts(account_id),
        account_id2 INTEGER REFERENCES accounts(account_id),
        PRIMARY KEY (account_id1, account_id2)
    );

    CREATE TABLE student (
        account_id INTEGER PRIMARY KEY REFERENCES accounts(account_id),
        major VARCHAR(100),
        interest VARCHAR(100),
        student_id SERIAL UNIQUE,
        organization VARCHAR(100)
    );

    CREATE TABLE events ( 
        event_id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(account_id),
        event_name VARCHAR(20) NOT NULL,
        event_location VARCHAR(30),
        s_date TIMESTAMP NOT NULL,
        e_date TIMESTAMP NOT NULL,
        category VARCHAR(30)
    );

    CREATE TABLE task (
        task_id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(account_id),
        due_time TIMESTAMP NOT NULL,
        task_name VARCHAR(20) NOT NULL,
        category VARCHAR(100),
        complete BOOLEAN DEFAULT false
    );

    CREATE TABLE assignment ( 
        task_id INTEGER PRIMARY KEY REFERENCES task(task_id),
        class_id INTEGER REFERENCES events(event_id)
    );

    CREATE TABLE availability (
        account_id INTEGER REFERENCES accounts(account_id),
        unav_interval VARCHAR(20),
        full_date VARCHAR(15),
        PRIMARY KEY (account_id, unav_interval, full_date)
    );

    CREATE TABLE post ( 
        post_id SERIAL PRIMARY KEY,
        title VARCHAR(20),
        date_posted VARCHAR(15) NOT NULL, 
        poster_id INTEGER REFERENCES accounts(account_id)
    );

    CREATE TABLE likes(
        post_id INTEGER REFERENCES post(post_id),
        liker_id INTEGER REFERENCES accounts(account_id),
        PRIMARY KEY (post_id, liker_id)
    );

    CREATE TABLE shares(
        post_id INTEGER REFERENCES post(post_id),
        sharer_id INTEGER REFERENCES accounts(account_id),
        PRIMARY KEY (post_id, sharer_id)
    );

    CREATE TABLE saves(
        post_id INTEGER REFERENCES post(post_id),
        saver_id INTEGER REFERENCES accounts(account_id),
        PRIMARY KEY (post_id, saver_id)
    );

    CREATE TABLE comments(
        commenter_id INTEGER REFERENCES accounts(account_id),
        timestamp NUMERIC NOT NULL,
        text VARCHAR(200) NOT NULL,
        PRIMARY KEY (commenter_id, timestamp)
    );
'''
cursor.execute(Table_creation)

conn_details.commit()
cursor.close()
conn_details.close()