# script for setting up tables and test data in db 

import psycopg2
import os
from faker import Faker
import random
from datetime import datetime, timedelta

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
    DROP TABLE IF EXISTS assignment, task, student, friend, availability, likes, shares, saves, comments, events, post, accounts, friendrequests, groups, public_events, memberships, registrations CASCADE;    
    
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
        name VARCHAR(20) NOT NULL,
        location VARCHAR(30),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
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
        date_posted TIMESTAMP NOT NULL, 
        poster_id INTEGER REFERENCES accounts(account_id),
        content VARCHAR(300) NOT NULL,
        image_url VARCHAR(300)
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
        post_id INTEGER REFERENCES post(post_id),
        commenter_id INTEGER REFERENCES accounts(account_id),
        timestamp TIMESTAMP NOT NULL,
        text VARCHAR(200) NOT NULL,
        PRIMARY KEY (post_id, commenter_id, timestamp)
    );
    
    CREATE TABLE friendrequests (
        notification_id SERIAL PRIMARY KEY,
        account_id_to INTEGER REFERENCES accounts(account_id),
        account_id_from INTEGER REFERENCES accounts(account_id),
        message VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE groups (
        group_id SERIAL PRIMARY KEY,
        group_name VARCHAR(50) UNIQUE NOT NULL,
        group_avatar VARCHAR(255),
        year_created INTEGER NOT NULL,
        admin_id INTEGER REFERENCES accounts(account_id)
    );

    CREATE TABLE public_events (
        event_id SERIAL PRIMARY KEY,
        event_name VARCHAR(50) UNIQUE NOT NULL,
        group_id INTEGER REFERENCES groups(group_id) NOT NULL,
        start_date_time TIMESTAMP NOT NULL,
        end_date_time TIMESTAMP NOT NULL,
        is_all_day BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE memberships (
        group_id INTEGER REFERENCES groups(group_id),
        account_id INTEGER REFERENCES accounts(account_id),
        PRIMARY KEY (group_id, account_id)
    );

    CREATE TABLE registrations (
        event_id INTEGER REFERENCES public_events(event_id),
        account_id INTEGER REFERENCES accounts(account_id),
        PRIMARY KEY (event_id, account_id)
    );
'''
cursor.execute(Table_creation)


# generating test data
faker = Faker()
Faker.seed(11)
random.seed(11) 

# accounts test data
usernames = ['alisha', 'david', 'alina', 'olivia', 'carrie', 'vivian']
accounts = [1, 2, 3, 4, 5, 6]
for n in range(6):
    username = usernames[n]
    password = 'my_password'
    email = faker.email()
    phone = faker.phone_number()[:12]
    avatar = None
    year_created = random.randint(2010, 2024)
    
    cursor.execute('''
        INSERT INTO accounts (username, password, email, phone, avatar, year_created)
        VALUES (%s, %s, %s, %s, %s, %s)
    ''', (username, password, email, phone, avatar, year_created))

# events test data
for _ in range(7):
    event_name = faker.word()
    event_location = faker.city()
    s_date = faker.date_this_year() 
    start_time = faker.time_object() 
    s_date = datetime.combine(s_date, start_time)
    end_time = (datetime.combine(s_date.date(), start_time) + timedelta(hours=random.randint(1, 5), minutes=random.randint(0, 59))).time()
    e_date = datetime.combine(s_date.date(), end_time) 
    category = random.choice(['club', 'personal', 'school', 'work'])
    
    cursor.execute('''
        INSERT INTO events (name, location, start_date, end_date, category)
        VALUES (%s, %s, %s, %s, %s)
    ''', (event_name, event_location, s_date, e_date, category))


# tasks test data
for _ in range (8):
    due_time = faker.date_time_this_year() 
    task_name = faker.word()
    category = random.choice(['club', 'personal', 'school', 'work'])
    complete = random.choice([True, False])

    cursor.execute('''
        INSERT INTO task (due_time, task_name, category, complete)
        VALUES (%s, %s, %s, %s)
    ''', (due_time, task_name, category, complete))


# commit changes to save
conn_details.commit()
cursor.close()
conn_details.close()


# CREATE TABLE commenters(
#         post_id INTEGER REFERENCES post(post_id),
#         commenter_id INTEGER REFERENCES accounts(account_id)
#         PRIMARY KEY (commenter_id, post_id)
#     );

#     CREATE TABLE comments(
#         commenter_id INTEGER REFERENCES accounts(account_id),
#         timestamp NUMERIC NOT NULL,
#         text VARCHAR(200) NOT NULL,
#         PRIMARY KEY (commenter_id, timestamp)
#     );