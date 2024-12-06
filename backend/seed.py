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
    DROP TABLE IF EXISTS assignment, task, student, friend, availability, likes, shares, saves, comments, events, event, post, accounts, notifications, groups, public_events, memberships, registrations, group_requests, category, event_category, task_category, studytime CASCADE;    
    
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
        task_name VARCHAR(1000) NOT NULL,
        category VARCHAR(100),
        complete BOOLEAN DEFAULT false,
        event_id INTEGER REFERENCES events(event_id)
    );

    CREATE TABLE task_category (
        account_id INTEGER REFERENCES accounts(account_id),
        category_name VARCHAR(100),
        PRIMARY KEY (account_id, category_name)
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


# events test data
event_categories = ['Academic', 'Social', 'Career', 'Recreational']
start = datetime(2024, 10, 28)
end = datetime(2025, 1, 1)
events_data = {
    'Academic': [
        ('Math Lecture', 'Important lecture for your course', 'blue'),
        ('History Lecture', 'History of World War II', 'green'),
        ('Physics Lab', 'Lab session on optics', 'red'),
        ('Chemistry Lecture', 'Organic Chemistry lecture', 'yellow'),
        ('Computer Science Workshop', 'Programming Workshop', 'purple'),
        ('Language Class', 'Spanish language class', 'orange'),
        ('Engineering Seminar', 'Seminar on civil engineering', 'pink'),
        ('Psychology Lecture', 'Introduction to Psychology', 'brown'),
        ('Philosophy Class', 'Philosophy 101', 'cyan'),
        ('Literature Reading', 'Literature discussion session', 'grey')
    ],
    'Social': [
        ('Club Meeting', 'Weekly club gathering', 'blue'),
        ('Game Night', 'Enjoy some board games with friends', 'green'),
        ('Dinner Party', 'A social dinner with friends', 'red'),
        ('Movie Night', 'Watch a movie with friends', 'yellow'),
        ('Music Concert', 'Live music event', 'purple'),
        ('Study Group', 'Meet with peers to study', 'orange'),
        ('Social Event', 'Catch up with old friends', 'pink'),
        ('Trivia Night', 'Compete in a trivia contest', 'brown'),
        ('Outdoor BBQ', 'Grill and chill with friends', 'cyan'),
        ('Potluck Dinner', 'Bring a dish and share', 'grey')
    ],
    'Career': [
        ('Career Fair', 'Network with potential employers', 'blue'),
        ('Internship Interview', 'Prepare for your interview', 'green'),
        ('Resume Workshop', 'Improve your resume with experts', 'red'),
        ('Networking Event', 'Meet professionals in your field', 'yellow'),
        ('Career Development Workshop', 'Workshops to help your career', 'purple'),
        ('Job Search Session', 'Strategies for job hunting', 'orange'),
        ('Mentorship Program', 'Connect with a mentor in your field', 'pink'),
        ('Professional Seminar', 'Gain insights into your industry', 'brown'),
        ('Mock Interview', 'Practice for your interview', 'cyan'),
        ('Industry Event', 'Attend an industry-related event', 'grey')
    ],
    'Recreational': [
        ('Hackathon', 'Programming competition', 'blue'),
        ('Outdoor Adventure', 'Go hiking with friends', 'green'),
        ('Beach Day', 'Spend the day at the beach', 'red'),
        ('Sporting Event', 'Attend a local game', 'yellow'),
        ('Camping Trip', 'Camp in the wilderness for the weekend', 'purple'),
        ('Dance Class', 'Learn a new dance style', 'orange'),
        ('Photography Walk', 'Capture the beauty of nature', 'pink'),
        ('Art Exhibition', 'Visit a local art show', 'brown'),
        ('Cooking Class', 'Learn new recipes', 'cyan'),
        ('Fitness Class', 'Join a fitness challenge', 'grey')
    ]
}
locations = [
    "Student Union Building",
    "Main Hall",
    "Engineering Auditorium",
    "Science and Technology Center",
    "Campus Green",
    "University Conference Center",
    "Student Commons",
    "Library Lounge",
    "Sports Complex Track",
    "Campus Amphitheater",
    "University Ballroom",
    "Lecture Hall 2A",
    "Campus Stadium",
    "Art Gallery",
    "Debate Hall",
    "Engineering Plaza",
    "Environmental Science Building",
    "Health Sciences Auditorium",
    "Dining Hall",
    "Computer Science Lab"
]

# create event category test data
for category in event_categories:
    cursor.execute('''
        INSERT INTO event_category (category_name)
        VALUES (%s)
        ON CONFLICT (category_name) DO NOTHING
    ''', (category,))

for account in range(1, 7):
    for _ in range(20):
        account_id = account
        category = random.choice(event_categories)
        event_name, label_text, label_color = random.choice(events_data[category])

        random_start_date = faker.date_between(start_date=start, end_date=end)
        random_start_hour = random.randint(9, 23) 
        random_start_minute = random.choice([0, 15, 30, 45])
        start_date = datetime(
            year=random_start_date.year,
            month=random_start_date.month,
            day=random_start_date.day,
            hour=random_start_hour,
            minute=random_start_minute
        )
        start_date = faker.date_time_between(start_date=start, end_date=end)

        duration_hours = random.randint(1, 5)
        end_date = start_date + timedelta(hours=duration_hours)

        location = random.choice(locations)
        frequency = random.choice(["Once a Week", "None", "Everyday", "Twice a Week"])
        
        if frequency == "Everyday":
            repeat_until = start_date + timedelta(days=random.randint(1, 10))
        elif frequency == "Once a Week":
            repeat_until = start_date + timedelta(days=random.choice([7, 14, 21, 28]))
        elif frequency == "Twice a Week":
            repeat_until = start_date + timedelta(days=random.choice([14, 28, 42, 56]))

        cursor.execute('''
            INSERT INTO events (account_id, name, location, start_date, end_date, category, label_text, label_color, frequency, repeat_until)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (account, event_name, location, start_date, end_date, category, label_text, label_color, frequency, repeat_until,))

print("Event test data generated")


# tasks test data
task_categories = ['club', 'personal', 'assignment', 'housework']
start_date = datetime(2024, 10, 28)
end_date = datetime(2025, 1, 1)
tasks = {
    'club': [
        'Organize Club Meeting', 'Plan Club Event', 'Recruit New Members', 
        'Design Club Flyers', 'Host Club Social', 'Book Club Venue', 
        'Coordinate Club Fundraiser', 'Arrange Club Trip', 'Prepare Club Newsletter', 
        'Organize Club Elections'
    ],
    'personal': [
        'Go for a Run', 'Backup Phone Data', 'Learn a New Skill', 
        'Book a Spa Day', 'Write a Daily Journal Entry', 'Plan a Vacation', 
        'Write a Letter to a Friend', 'Try a New Recipe', 'Do a Puzzle', 
        'Take a Photography Walk'
    ],
    'assignment': [
        'Complete Math Homework', 'Write History Essay', 'Study for Final', 
        'Prepare Presentation', 'Research for Project', 'Complete Lab Report', 
        'Review Notes', 'Practice Coding', 'Finish Reading Assignment', 'Complete Group Work'
    ],
    'housework': [
        'Clean Kitchen', 'Wash Dishes', 'Vacuum Living Room', 'Mop Floors', 
        'Do Laundry', 'Take Out Trash', 'Clean Bathroom', 'Organize Closet', 
        'Water Plants', 'Clean Windows'
    ]
}

# task categories
event_idx = 1
for account in range(1, 7):
    #categories
    for category in task_categories:
        cursor.execute('''
            INSERT INTO task_category (account_id, category_name)
            VALUES (%s, %s)
            ON CONFLICT (account_id, category_name) DO NOTHING
        ''', (account, category))
    #tasks
    for _ in range (20):
        random_date = faker.date_between(start_date=start_date, end_date=end_date)
        random_hour = random.randint(9, 23) 
        random_minute = random.choice([0, 30, 59])
        due_time = datetime(
            year=random_date.year,
            month=random_date.month,
            day=random_date.day,
            hour=random_hour,
            minute=random_minute
        )
        due_time = faker.date_time_between(start_date=start_date, end_date=end_date)
        category = random.choice(task_categories)
        task_name = random.choice(tasks[category])
        complete = random.choice([True, False])
        account_id = account

        event_id = random.randint(event_idx, event_idx + 20)

        cursor.execute('''
            INSERT INTO task (due_time, task_name, category, complete, account_id, event_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (due_time, task_name, category, complete, account_id, event_id))

    event_idx += 20

print("Tasks test data generated")


#studytime test data
today = datetime.today()
start_of_week = today - timedelta(days=today.weekday())
this_week = [start_of_week + timedelta(days=i) for i in range(7)]

for account in range(1, 6):
    account_id = account
    print(f"Account {account_id}:")
    for date in this_week:
        hours = random.randint(0, 14)
        minutes = random.randint(0, 59)
        seconds = random.randint(0, 59) 
        date_str = date.strftime('%Y-%m-%d')
        study_time = f"{hours:02}:{minutes:02}:{seconds:02}"
        print(f"  Date: {date_str}, Study Time: {study_time}")

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


# Generate group and public event data
group_events = {
    "Photography Club": ["Photo Walk in City", "Mastering Portrait Photography", "Outdoor Photography Tips", "Night Photography Workshop", "Landscape Capturing Day"],
    "Robotics Club": ["Building Advanced Drones", "Coding AI for Robots", "Intro to Machine Learning", "Robotics Expo", "Robot Battle Challenge"],
    "Drama Society": ["Shakespeare Night", "Modern Play Rehearsal", "Drama Workshop for Beginners", "Improv Comedy Night", "Acting Masterclass"],
    "Coding Club": ["Hackathon for Beginners", "Intro to Web Development", "Coding Bootcamp", "Data Structures Workshop", "AI Programming Tips"],
    "Chess Club": ["Beginner Chess Class", "Advanced Chess Tactics", "Simultaneous Chess Match", "Speed Chess Tournament", "Chess Strategy Workshop"],
    "Book Club": ["Fiction Book Review", "Author Spotlight Night", "Classic Literature Discussion", "Weekly Reading Meetup", "Poetry Slam Night"],
    "Dance Team": ["Hip Hop Workshop", "Classical Dance Rehearsal", "Salsa Night", "Contemporary Dance Show", "Group Choreography Practice"],
    "Music Ensemble": ["Orchestra Practice", "Jazz Night", "Solo Recital Showcase", "Band Jam Session", "Classical Music Masterclass"],
    "Sports Club": ["Friendly Soccer Match", "Basketball Pickup Game", "Tennis Tournament", "Swimming Relay Practice", "Track and Field Sprinting"],
    "Entrepreneurship Society": ["Startup Pitch Night", "Business Plan Workshop", "Venture Capital Talk", "Entrepreneur Q&A Session", "Product Launch Simulation"],
    "Volunteering Club": ["Community Clean-Up Drive", "Charity Bake Sale", "Clothes Donation Drive", "Neighborhood Fundraiser", "Animal Shelter Visit"],
    "Film Society": ["Weekly Movie Screening", "Film Discussion Panel", "Short Film Competition", "Director Guest Lecture", "Silent Film Night"],
    "Environment Club": ["Tree Planting Event", "Beach Clean-Up Day", "Recycling Workshop", "Energy Conservation Talk", "Sustainable Living Seminar"],
    "Astronomy Club": ["Star Gazing Night", "Planetarium Visit", "Astrophotography Workshop", "Telescope Building Session", "Space Documentary Screening"],
    "AI Society": ["Neural Networks Workshop", "Ethics in AI Debate", "Introduction to Natural Language Processing", "AI Coding Contest", "AI Startup Networking"],
    "Toastmasters": ["Public Speaking 101", "Speech Contest", "Leadership Development Workshop", "Impromptu Speaking Night", "Storytelling Techniques"],
    "Hackers United": ["Cybersecurity Basics", "Capture the Flag Challenge", "Reverse Engineering Workshop", "Penetration Testing Demo", "Ethical Hacking Seminar"],
    "Gardening Club": ["Indoor Plant Care Workshop", "Community Garden Day", "Composting Techniques", "Garden Design Basics", "Seed Exchange Meetup"],
    "Board Games Club": ["Board Game Night", "New Strategy Game Workshop", "Chess and Checkers Evening", "Collaborative Puzzle Solving", "Dungeons & Dragons Session"],
    "Yoga Enthusiasts": ["Morning Yoga Session", "Yoga for Stress Relief", "Power Yoga Workshop", "Breathwork and Meditation", "Yoga Flow Challenge"],
    "Running Club": ["Sunrise Marathon Training", "Park Run Meetup", "Sprint Drills Workshop", "Trail Running Adventure", "Post-Run Nutrition Talk"],
    "Baking Circle": ["Cupcake Decorating Class", "Sourdough Bread Baking", "Cookie Swap Event", "Baking Science Basics", "Cake Frosting Workshop"],
    "Cultural Association": ["International Food Festival", "Cultural Dance Performances", "World Music Night", "Language Learning Exchange", "Art and Craft Fair"],
    "Gaming Guild": ["LAN Party Night", "New Game Launch Meetup", "Retro Gaming Competition", "Game Development Workshop", "Esports Viewing Party"],
    "MUN Team": ["Model UN Training Session", "Debate and Negotiation Workshop", "Resolution Drafting Practice", "Mock Committee Session", "International Policy Talk"],
    "Literature Lovers": ["Poetry Reading Night", "Book Signing Event", "Creative Writing Workshop", "Literary Trivia Contest", "Author Spotlight Series"],
    "Podcast Club": ["Podcast Recording Basics", "Interview Techniques Workshop", "Podcast Editing Tips", "Storytelling in Podcasts", "Podcast Launch Party"],
    "Art Collective": ["Art Exhibit Opening", "Sketching Workshop", "Modern Art Discussion", "Painting for Beginners", "Art Supply Swap"],
    "Startups Hub": ["Elevator Pitch Practice", "Startup Legal Basics", "Funding Strategy Session", "Startup Success Stories", "Networking Night"],
    "Chess Enthusiasts": ["Chess Opening Tactics", "Endgame Strategies", "Simultaneous Chess Challenge", "Speed Chess Workshop", "Chess AI Analysis"]
}

group_events_list = [(group_name, events) for group_name, events in group_events.items()]

for account in range(1, 7):
    for i in range(5):
        group_name = group_events_list[i + (account - 1) * 5][0]
        events_list = group_events_list[i + (account - 1) * 5][1]

        # Insert group and retrieve its ID
        year_created = random.randint(2021, 2025)
        cursor.execute('''
            INSERT INTO groups (group_name, admin_id, year_created)
            VALUES (%s, %s, %s)
            ON CONFLICT (group_name) DO NOTHING
            RETURNING group_id
        ''', (group_name, account, year_created))

        # Add membership for this account to the group
        cursor.execute('''
            INSERT INTO memberships (account_id, group_id)
            VALUES (%s, (SELECT group_id FROM groups WHERE group_name = %s))
            ON CONFLICT (account_id, group_id) DO NOTHING
        ''', (account, group_name,))

        # Add public events for the group
        for event_name in events_list:
            is_all_day = random.choice([True, False])

            if is_all_day:
                random_start_date = faker.date_between(start_date=start, end_date=end)
                start_date = datetime(
                    year=random_start_date.year,
                    month=random_start_date.month,
                    day=random_start_date.day,
                    hour=0,
                    minute=0
                )
                duration_hours = random.choice([23, 47, 71, 95])
                duration_minutes = 59
                end_date = start_date + timedelta(hours=duration_hours, minutes=duration_minutes)
            else:
                random_start_date = faker.date_between(start_date=start, end_date=end)
                random_start_hour = random.randint(9, 23)
                random_start_minute = random.choice([0, 15, 30, 45])
                start_date = datetime(
                    year=random_start_date.year,
                    month=random_start_date.month,
                    day=random_start_date.day,
                    hour=random_start_hour,
                    minute=random_start_minute
                )
                duration_hours = random.randint(1, 5)
                end_date = start_date + timedelta(hours=duration_hours)

            cursor.execute('''
                INSERT INTO public_events (event_name, group_id, start_date_time, end_date_time, is_all_day)
                VALUES (%s, (SELECT group_id FROM groups WHERE group_name = %s), %s, %s, %s)
                ON CONFLICT (event_name) DO NOTHING
            ''', (event_name, group_name, start_date, end_date, is_all_day))

print("Group and public event test data generated")


# commit changes
conn_details.commit()
cursor.close()
conn_details.close()
print("Seeding finished")