import os
from flask import Flask
from flask_cors import CORS
from app.controllers import accountController, availabilityController, friendController
from .db import init_db

def create_app(test_config=None):
    # create and configure the app
    # app = Flask(__name__, instance_relative_config=True)
    app = Flask(__name__)
    cors = CORS(app)
    # app.config.from_mapping(
    #     SECRET_KEY='not-really-that-secret-huh',
    #     DATABASE=os.path.join(app.instance_path, 'mvc.sqlite'),
    #     TEMPLATES_AUTO_RELOAD = True 
    # )

    # if test_config is None:
    #     # load the instance config, if it exists, when not testing
    #     app.config.from_pyfile('config.py', silent=True)
    # else:
    #     # load the test config if passed in
    #     app.config.from_mapping(test_config)

    # # ensure the instance folder exists
    # try:
    #     os.makedirs(app.instance_path)
    # except OSError:
    #     pass

    # a simple page that says hello
    @app.route('/')
    def hello():
        return 'backend server running'

    app.register_blueprint(accountController.bp)
    app.register_blueprint(availabilityController.bp)
    app.register_blueprint(friendController.bp)

    init_db()
    return app
