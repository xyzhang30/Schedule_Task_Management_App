# script for creating all tables in database

import psycopg2
import os

db_user = os.environ.get("POSTGRES_USER")
db_password = os.environ.get("POSTGRES_PASSWORD")
db_host = os.environ.get("POSTGRES_HOST")
db_name = os.environ.get("POSTGRES_DB")

conn_details = psycopg2.connect(
   host=db_host,
   database=db_name,
   user=db_user,
   password=db_password,
)

cursor = conn_details.cursor()
Table_creation = '''
    DROP TABLE IF EXISTS Assignment, Task, Student, Friend, Availability, Likes, Shares, Saves, Comments, Events, Post, Accounts CASCADE;    
    
    CREATE TABLE Accounts (
        account_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        password VARCHAR(255),
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(15) UNIQUE,
        avatar VARCHAR(255),
        year_created INTEGER
    );

    CREATE TABLE Friend (
        account_id1 INTEGER REFERENCES Accounts(account_id),
        account_id2 INTEGER REFERENCES Accounts(account_id),
        PRIMARY KEY (account_id1, account_id2)
    );

    CREATE TABLE Student (
        account_id INTEGER PRIMARY KEY REFERENCES Accounts(account_id),
        major VARCHAR(100),
        interest VARCHAR(100),
        student_id SERIAL UNIQUE,
        organization VARCHAR(100)
    );

    CREATE TABLE Events ( 
        event_id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES Accounts(account_id),
        event_name VARCHAR(20),
        event_location VARCHAR(30),
        s_date VARCHAR(20),
        e_date VARCHAR(20),
        category VARCHAR(30)
    );

    CREATE TABLE Task (
        task_id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES Accounts(account_id),
        due_date VARCHAR(15),
        task_name VARCHAR(20),
        category VARCHAR(100)
    );

    CREATE TABLE Assignment ( 
        task_id INTEGER PRIMARY KEY REFERENCES Task(task_id),
        class_id INTEGER REFERENCES Events(event_id)
    );

    CREATE TABLE Availability (
        account_id INTEGER REFERENCES Accounts(account_id),
        unav_interval VARCHAR(20),
        full_date VARCHAR(15),
        PRIMARY KEY (account_id, unav_interval, full_date)
    );

    CREATE TABLE Post ( 
        post_id SERIAL PRIMARY KEY,
        title VARCHAR(20),
        date_posted VARCHAR(15), 
        poster_id INTEGER REFERENCES Accounts(account_id)
    );

    CREATE TABLE Likes(
        post_id INTEGER REFERENCES Post(post_id),
        liker_id INTEGER REFERENCES Accounts(account_id),
        PRIMARY KEY (post_id, liker_id)
    );

    CREATE TABLE Shares(
        post_id INTEGER REFERENCES Post(post_id),
        sharer_id INTEGER REFERENCES Accounts(account_id),
        PRIMARY KEY (post_id, sharer_id)
    );

    CREATE TABLE Saves(
        post_id INTEGER REFERENCES Post(post_id),
        saver_id INTEGER REFERENCES Accounts(account_id),
        PRIMARY KEY (post_id, saver_id)
    );

    CREATE TABLE Comments(
        commenter_id INTEGER REFERENCES Accounts(account_id),
        timestamp NUMERIC NOT NULL,
        text VARCHAR(200) NOT NULL,
        PRIMARY KEY (commenter_id, timestamp)
    );
'''
cursor.execute(Table_creation)

conn_details.commit()
cursor.close()
conn_details.close()