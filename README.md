# Schedule/Task Management System


### Running the app
Run Docker: 
- `docker compose build`
- `docker compose up`
- do the following when database is updated, or if you are running this for the first time.
    - go into the terminal in the backend container in docker
    - `python createTables.py` (creates all tables in the database)
    - `python seed.py` (creates test data in the database) DONT DO IT YET, IT'S NOT FINISHED

Database GUI (adminer): 
- Port: localhost:5001 
- System: PostgreSQL
- Server: db
- Username: test_user
- Password: notarealpassword
- Database: development

Backend: 
- Port: localhost:8080

Frontend:
- Port: localhost:3000


### dependencies used: 
Frontend: 
- react-router-dom
- axios 

Backend: 
- flask-cors
- sqlalchemy
- psycopg2


### dependencies used: 
Frontend: 
- react-router-dom
- axios 

Backend: 
- flask-cors
- sqlalchemy
- psycopg2