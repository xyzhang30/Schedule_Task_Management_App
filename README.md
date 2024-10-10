# Schedule/Task Management System


### Running the app (without docker)
backend: (inside /backend directory, without docker) `flask --app __init__.py run`
with docker: 
- docker compose build
- docker compose up
use localhost:5001 for database GUI
- see `docker-compose.yml` for db username and password
use localhost:8080 for backend/app