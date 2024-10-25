CREATE TABLE Account (
    account_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    pass VARCHAR(255),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15) UNIQUE,
    avatar VARCHAR(255),
    year_created INTEGER
);
CREATE TABLE Friend (
    account_id1 INTEGER REFERENCES Account(account_id),
    account_id2 INTEGER REFERENCES Account(account_id),
    PRIMARY KEY (account_id1, account_id2)
);
CREATE TABLE Student (
    account_id INTEGER PRIMARY KEY REFERENCES Account(account_id),
    major VARCHAR(100),
    interest VARCHAR(100),
    student_id SERIAL UNIQUE,
    organization VARCHAR(100)
);
-- CREATE TABLE Task (
--     task_id SERIAL PRIMARY KEY,
--     account_id INTEGER REFERENCES Account(account_id),
--     category VARCHAR(100)
-- );
-- CREATE TABLE Assignment ( 
--     task_id INTEGER PRIMARY KEY REFERENCES Task(task_id),
--     class_id INTEGER,
--     assignment_name VARCHAR(20),
--     due_date VARCHAR(15),
--     comments VARCHAR(100)
-- );
-- CREATE TABLE PersonalTask ( 
--     task_id INTEGER PRIMARY KEY REFERENCES Task(task_id),
--     due_date VARCHAR(15),
--     task_name VARCHAR(20)
-- );
CREATE TABLE Task (
    task_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES Account(account_id),
    category VARCHAR(100),
    due_time TIMESTAMP NOT NULL,
    task_name VARCHAR(20) NOT NULL,
    complete BOOLEAN DEFAULT false
);
CREATE TABLE Assignment ( 
    task_id INTEGER PRIMARY KEY REFERENCES Task(task_id),
    class_id INTEGER,
);
CREATE TABLE Category {
    category_name VARCHAR(100) PRIMARY KEY
};
CREATE TABLE Availability (
    account_id INTEGER REFERENCES Account(account_id),
    unav_interval VARCHAR(20),
    full_date VARCHAR(15),
    PRIMARY KEY (account_id, interval, full_date)
);
CREATE TABLE Post ( 
    post_id SERIAL PRIMARY KEY,
    title VARCHAR(20),
    date_posted VARCHAR(15), 
    comment VARCHAR(150)
);
CREATE TABLE PostedInfo (
    post_id INTEGER PRIMARY KEY REFERENCES Post(post_id),
    account_id INTEGER REFERENCES UNIQUE Account(account_id),
    isPost INTEGER,
    isLike INTEGER,
    isSave INTEGER,
);
CREATE TABLE Event ( 
    event_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES Account(account_id),
    event_name VARCHAR(20),
    event_location VARCHAR(30),
    s_date VARCHAR(20),
    e_date VARCHAR(20),
    category VARCHAR(30)
);