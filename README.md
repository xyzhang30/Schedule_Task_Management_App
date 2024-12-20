# Schedule/Task Management System
#### Alina Yin, Alisha Zhang, Carrie Hang, David Shenkerman, Olivia Fu, Weijia Han

### Running the app
Run Docker: 
- `docker compose build`
- `docker compose up`
- do the following when database is updated, or if you are running this for the first time.
    - go into the terminal in the backend container in docker OR run `docker compose exec backend bash` in terminal
    - `python seed.py` (creates tables and test data)

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
- font-awesome
- microsoft-cognitiveservices-speech-sdk

Backend: 
- flask-cors
- sqlalchemy
- psycopg2
- flask mail