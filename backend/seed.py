# script for setting up tables and test data in db 

import psycopg2
import os
from faker import Faker
import random
from datetime import datetime, timedelta
import bcrypt 

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
    DROP TABLE IF EXISTS assignment, task, student, friend, availability, likes, shares, saves, comments, events, post, accounts, notifications, groups, public_events, memberships, registrations, group_requests, category, event_category, task_category, studytime CASCADE;    
    
    CREATE TABLE accounts (
        account_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(15) UNIQUE,
        avatar VARCHAR(255),
        year_created INTEGER NOT NULL,
        major VARCHAR(100)
    );

    CREATE TABLE friend (
        account_id1 INTEGER REFERENCES accounts(account_id),
        account_id2 INTEGER REFERENCES accounts(account_id),
        PRIMARY KEY (account_id1, account_id2)
    );

    CREATE TABLE events ( 
        event_id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(account_id),
        name VARCHAR(200) NOT NULL,
        location VARCHAR(300),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        category VARCHAR(300), 
        label_text VARCHAR(100),
        label_color VARCHAR(200),
        frequency VARCHAR(50),
        repeat_until TIMESTAMP,
        series_id INTEGER
    );

    CREATE TABLE event_category (
        category_name VARCHAR(100) PRIMARY KEY
    );
    
    CREATE TABLE task (
        task_id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(account_id),
        due_time TIMESTAMP NOT NULL,
        task_name VARCHAR(20) NOT NULL,
        category VARCHAR(100),
        complete BOOLEAN DEFAULT false,
        event_id INTEGER REFERENCES events(event_id)
    );

    CREATE TABLE assignment ( 
        task_id INTEGER PRIMARY KEY REFERENCES task(task_id),
        class_id INTEGER REFERENCES events(event_id)
    );

    CREATE TABLE task_category (
        account_id INTEGER REFERENCES accounts(account_id),
        category_name VARCHAR(100),
        PRIMARY KEY (account_id, category_name)
    );

    CREATE TABLE availability (
        account_id INTEGER REFERENCES accounts(account_id),
        unav_interval VARCHAR(20),
        full_date VARCHAR(15),
        PRIMARY KEY (account_id, unav_interval, full_date)
    );

    CREATE TABLE post ( 
        post_id SERIAL PRIMARY KEY,
        title VARCHAR(200),
        date_posted TIMESTAMP NOT NULL, 
        poster_id INTEGER REFERENCES accounts(account_id),
        content TEXT NOT NULL,
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
        comment_id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES post(post_id),
        commenter_id INTEGER REFERENCES accounts(account_id),
        timestamp TIMESTAMP NOT NULL,
        text TEXT NOT NULL
    );

    CREATE TABLE groups (
        group_id SERIAL PRIMARY KEY,
        group_name VARCHAR(50) UNIQUE NOT NULL,
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

    CREATE TABLE studytime (
        account_id INTEGER REFERENCES accounts(account_id),
        date DATE,
        study_time INTERVAL,
        PRIMARY KEY (account_id, date)
    );

    CREATE TABLE notifications (
        notification_id SERIAL PRIMARY KEY,
        account_id_to INTEGER REFERENCES accounts(account_id),
        account_id_from INTEGER REFERENCES accounts(account_id),
        group_id INTEGER REFERENCES groups(group_id) DEFAULT NULL,
        event_id INTEGER REFERENCES events(event_id) DEFAULT NULL,
        task_id INTEGER REFERENCES task(task_id) DEFAULT NULL,
        notification_type VARCHAR(255) NOT NULL,
        message VARCHAR(255),
        is_pending BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
'''
print("Start table creation")
cursor.execute(Table_creation)
print("Finish table creation")

# generating test data
faker = Faker()
Faker.seed(11)
random.seed(11) 

# accounts test data
usernames = ['alisha', 'david', 'alina', 'olivia', 'carrie', 'vivian']
accounts = [1, 2, 3, 4, 5, 6]
for n in range(6):
    username = usernames[n]
    password = username
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    email = faker.email()
    phone = faker.phone_number()[:12]
    avatar = '/srv/app/avatars/default.jpg'
    year_created = random.randint(2010, 2024)
    major = "computer science"
    
    cursor.execute('''
        INSERT INTO accounts (username, password, email, phone, avatar, year_created, major)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    ''', (username, hashed_password, email, phone, avatar, year_created, major))
print("Account test data generated")


# friends test data
for n in range (3):
    account_id1 = n + 1
    account_id2 = n + 4
    cursor.execute('''
        INSERT INTO friend (account_id1, account_id2)
        VALUES (%s, %s)
    ''', (account_id1, account_id2))
print("Friends test data generated")


# events test 
event_categories = ['club', 'personal', 'school', 'work', 'health', 'meetup', 'conference', 'webinar']
for category in event_categories:
    cursor.execute('''
        INSERT INTO event_category (category_name)
        VALUES (%s)
        ON CONFLICT (category_name) DO NOTHING
    ''', (category,))
print("Event categories test data generated")
num_events = 20  
for _ in range(num_events):
    event_name = faker.sentence(nb_words=3).rstrip('.')
    event_location = faker.city()
    start_date = faker.date_time_between(start_date='-1y', end_date='+1y')
    duration = timedelta(hours=random.randint(1, 5), minutes=random.randint(0, 59))
    end_date = start_date + duration
    category = random.choice(event_categories)
    account_id = random.randint(1, 6)
    label_text = random.choice(['Important', 'Optional', 'Urgent', 'Follow-up', 'Review'])
    label_color = random.choice(['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'grey', 'pink'])
    frequency_options = ['Every Day', 'Once a Week', 'Twice a Week', None]
    frequency = random.choice(frequency_options)
    repeat_until = None
    if frequency:
        repeat_until = start_date + timedelta(days=random.randint(30, 180))
    cursor.execute('''
        INSERT INTO events (
            name, location, start_date, end_date, category,
            account_id, label_text, label_color, frequency, repeat_until
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (
        event_name,
        event_location,
        start_date,
        end_date,
        category,
        account_id,
        label_text,
        label_color,
        frequency,
        repeat_until
    ))
print(f"{num_events} Events test data generated")


# for _ in range(10):
#     event_name = faker.word()
#     event_location = faker.city()
#     s_date = faker.date_this_year() 
#     start_time = faker.time_object() 
#     s_date = datetime.combine(s_date, start_time)
#     end_time = (datetime.combine(s_date.date(), start_time) + timedelta(hours=random.randint(1, 5), minutes=random.randint(0, 59))).time()
#     e_date = datetime.combine(s_date.date(), end_time) 
#     category = random.choice(['club', 'personal', 'school', 'work'])
#     account_id = random.randint(1, 6)
#     label_text = faker.word()  # Random word for label text
#     label_color = faker.color_name()  # Random color name for label color

#     cursor.execute('''
#         INSERT INTO events (name, location, start_date, end_date, category, account_id, label_text, label_color)
#         VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
#     ''', (event_name, event_location, s_date, e_date, category, account_id, label_text, label_color))
# print("Events test data generated")


# tasks test data
for _ in range (30):
    due_time = faker.date_time_this_year() 
    task_name = faker.word()
    category = random.choice(['club', 'personal', 'school', 'work'])
    complete = random.choice([True, False])
    account_id = random.randint(1, 5)
    event_id = random.randint(1, 3)

    cursor.execute('''
        INSERT INTO task (due_time, task_name, category, complete)
        VALUES (%s, %s, %s, %s)
    ''', (due_time, task_name, category, complete))
print("Tasks test data generated")


#studytime test data
for i in range (1, 6):
    account_id = i
    date = '2024-11-12'
    study_time = '02:25:43'

    cursor.execute('''
        INSERT INTO studytime (account_id, date, study_time)
        VALUES (%s, %s, %s)
    ''', (account_id, date, study_time))
print("Studytime test data generated")

# Post test data
titles = [
    "10 Tips for Better Study Habits",
    "Exploring the Future of Artificial Intelligence",
    "My Journey in Learning Python",
    "The Benefits of Daily Meditation",
    "A Guide to Budget-Friendly Travel",
    "Why I Love Hiking",
    "How I Improved My Sleep Schedule",
    "Top 5 Books That Changed My Life",
    "The Rise of Electric Vehicles",
    "The Importance of Mental Health Awareness",
    "5 Easy Recipes for Busy Weeknights",
    "My Experience with Remote Work",
    "How I Learned to Play Guitar",
    "The Best Apps for Staying Organized",
    "The Impact of Social Media on Society",
    "Why I Started a Bullet Journal",
    "The Art of Minimalist Living",
    "Top Travel Destinations for 2024",
    "How to Build a Morning Routine",
    "The Joy of Baking at Home"
]

contents = [
    "Effective study habits can make a huge difference in your academic performance. Start by setting clear goals and creating a study schedule. Taking regular breaks, staying organized, and practicing active recall are just some of the techniques that can help you retain more information.",
    "Artificial Intelligence is revolutionizing industries from healthcare to transportation. With advancements in machine learning and robotics, the potential for AI to transform our daily lives is enormous. However, ethical considerations remain at the forefront of the discussion.",
    "Python has become one of the most versatile programming languages. I started with the basics like loops and conditionals, and soon I was building small projects like a to-do list app. The journey has been both challenging and rewarding.",
    "Meditation is more than just sitting in silence. It's about connecting with your mind and body. Studies show that daily meditation can reduce stress, improve focus, and increase emotional resilience.",
    "Traveling doesn't have to break the bank. With careful planning, you can explore new destinations without overspending. Use budget airlines, stay in hostels, and eat like the locals to save money while experiencing the culture.",
    "Hiking offers a unique escape from the hustle of daily life. The fresh air, the sounds of nature, and the sense of accomplishment when you reach the summit make it a truly enriching experience.",
    "Fixing my sleep schedule transformed my energy levels and productivity. I started by setting a consistent bedtime, reducing screen time before bed, and creating a relaxing pre-sleep routine.",
    "Books have the power to shape our perspectives and inspire us. From self-help classics to thrilling novels, these are the five books that had the most profound impact on my outlook.",
    "Electric vehicles are no longer a thing of the future. With advancements in battery technology and an increasing focus on sustainability, EVs are set to become the norm in the coming decade.",
    "Mental health is just as important as physical health. Recognizing the signs of mental illness and seeking help when needed can make a significant difference in a person’s quality of life.",
    "Cooking on a tight schedule doesn't have to be stressful. These five quick and easy recipes are perfect for busy weeknights, allowing you to enjoy delicious meals without spending hours in the kitchen.",
    "Remote work has its perks and challenges. While it offers flexibility and comfort, staying productive requires discipline. Setting up a dedicated workspace and sticking to a routine were game-changers for me.",
    "Learning to play the guitar was a dream come true. It started with simple chords and grew into the ability to play my favorite songs. It’s a skill that has brought endless joy and creativity into my life.",
    "From task managers to calendar apps, technology can help you stay on top of your schedule. These are my top picks for apps that make organization easier and more efficient.",
    "Social media has revolutionized the way we connect and share information. While it has brought people closer, it also raises concerns about privacy, misinformation, and mental health.",
    "Bullet journaling is more than just a trend—it's a productivity system that works. By tracking tasks, goals, and habits in one place, I’ve found it easier to stay focused and organized.",
    "Minimalism isn't just about having fewer things; it's about focusing on what truly matters. Letting go of excess possessions and simplifying my life has brought me more peace and clarity.",
    "Looking for your next adventure? These destinations offer unique experiences, stunning landscapes, and vibrant cultures. Whether you’re a foodie, an adventurer, or a history buff, there’s something for everyone.",
    "A good morning routine sets the tone for the rest of the day. By incorporating habits like stretching, journaling, and planning, I’ve been able to start my days with more focus and energy.",
    "Baking has become my favorite pastime. There's something therapeutic about measuring ingredients, kneading dough, and smelling fresh bread right out of the oven."
]

# Generate post data
for i in range(20):
    title = titles[i]
    content = contents[i]
    date_posted = Faker().date_time_this_year()
    poster_id = random.randint(1, 6)

    cursor.execute('''
        INSERT INTO post (title, date_posted, poster_id, content)
        VALUES (%s, %s, %s, %s)
    ''', (title, date_posted, poster_id, content))

print("Post test data generated")

# Generate comment data
comments_texts = [
    "Great post! Thanks for sharing.",
    "I completely agree with your points.",
    "This was really insightful.",
    "Loved reading this. Keep it up!",
    "Can you share more details on this?",
    "This topic has been on my mind too!",
    "Amazing! Thanks for the recommendations.",
    "I have a different perspective, but this was helpful.",
    "So true, I've experienced this myself.",
    "What a brilliant idea!"
]

# Generate 50 comments across random posts
for _ in range(50):
    post_id = random.randint(1, 20)
    commenter_id = random.randint(1, 6)
    timestamp = faker.date_time_this_year()
    text = random.choice(comments_texts)

    cursor.execute('''
        INSERT INTO comments (post_id, commenter_id, timestamp, text)
        VALUES (%s, %s, %s, %s)
    ''', (post_id, commenter_id, timestamp, text))

print("Comments test data generated")


# commit changes to save
conn_details.commit()
cursor.close()
conn_details.close()
print("Seeding finished")