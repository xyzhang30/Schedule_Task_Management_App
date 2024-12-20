import os
from flask import Flask
from flask_cors import CORS
from flask_mail import Mail
from .db import init_db

mail = Mail() #create mail instance for importing
uploadParameters = {'UPLOAD_FOLDER': '/srv/app/avatars', 'ALLOWED_EXTENSIONS': {'png', 'jpg', 'jpeg', 'gif'}}
postImageParameters = {'UPLOAD_FOLDER': '/srv/app/post_images','ALLOWED_EXTENSIONS': {'png', 'jpg', 'jpeg', 'gif'}}

def create_app(test_config=None):
    '''
    create and configure the app
    '''
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'TEMPORARY_KEY'
    app.config['MAIL_SERVER']='live.smtp.mailtrap.io'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USERNAME'] = 'api'
    app.config['MAIL_PASSWORD'] = '8e672db61ef2da51084921860643e226'
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USE_SSL'] = False
    app.config['POST_IMAGE_PARAMETERS'] = postImageParameters

    mail.init_app(app)
    CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})

    
    @app.route('/')
    def hello():
        return 'backend server running'
    from app.controllers import accountController, availabilityController, friendController, groupController, taskController, postController, authController, friendRequestController, eventController, studyTimeController, spotifyController, groupRequestController, eventinboxController, taskinboxController

    app.register_blueprint(accountController.bp)
    app.register_blueprint(availabilityController.bp)
    app.register_blueprint(friendController.bp)
    app.register_blueprint(groupController.bp)
    app.register_blueprint(taskController.bp)
    app.register_blueprint(eventController.bp)
    app.register_blueprint(authController.bp)
    app.register_blueprint(friendRequestController.bp)
    app.register_blueprint(postController.bp)
    app.register_blueprint(studyTimeController.bp)
    app.register_blueprint(groupRequestController.bp)
    app.register_blueprint(eventinboxController.bp)
    app.register_blueprint(taskinboxController.bp)
    app.register_blueprint(spotifyController.bp)

    init_db()
    return app