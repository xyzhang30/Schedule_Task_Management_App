from flask import Blueprint, session, request, jsonify
import bcrypt
import uuid

bp = Blueprint('auth', __name__, url_prefix = '/auth')

@bp.route('/login', methods = ['POST'])

def login():
    print("Logging in...")
    #gets user input
    user_inputted_username = request.form['username']

    user_inputted_email = request.form['email']
    user_inputted_password = request.form['password']

    db = True #temporary pseudo variable, will be replaced with actual db query using user_inputted_username and hashed_password

    response_message = {'msg': 'Successfully Logged In'}
    status_code = 200

    if not db: #Query was invalid i.e. bad credientials
        response_message = {'msg': 'Incorrect Username or Password'}
        status_code = 401
    else: 
        session['user'] = request.form['username'] #keep track of logged in status - this will change to a database query to get the user's unique id

    return jsonify(response_message), status_code

@bp.route('/register', methods = ['POST'])
def register():
    print("Registering...")

    #Get user info from frontend
    user_inputted_username = request.form['username']
    user_inputted_password = request.form['password']
    user_inputted_email = request.form['email']
    user_inputted_phone_number = request.form['phone_number']
    user_inputted_year = request.form['year']

    account_id = uuid.uuid1() #generate unique account id
    salt = bcrypt.gensalt() #generate salt
    hashed_password = bcrypt.hashpw(user_inputted_password.encode('utf-8'), salt) #Hash the password with the salt

    db = True #DB query to register, to be implemented soon

    response_message = {'msg': 'Successfully Registered'}
    status_code = 200

    if not db: #query went wrong: they maybe used a username/email that wasn't unique
        response_message = {'msg': "Invalid Email or Username"} #Need to make this more fine tuned: they should know what field was bad. i.e. username already taken
        status_code = 409 #proper code for this type of issue apparently
    else:
        session['user'] = account_id #this effectively logs them in and keeps state with a unique identifier

    return jsonify(response_message), status_code
