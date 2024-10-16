from flask import Blueprint, session, request, jsonify
import bcrypt
import uuid
from ..models.account import Account

bp = Blueprint('auth', __name__, url_prefix = '/auth')

@bp.route('/login', methods = ['POST'])

def login():
    print("Logging in...")
    #gets user input
    user_inputted_username = request.form['username']

    user_inputted_email = request.form['email']
    user_inputted_password = request.form['password']

    try:
        account = Account.get_acc_by_username(user_inputted_username) #Check if their username exists and get the account tuple associated with it
        salt = bcrypt.gensalt() #Generate salt for the user inputted password
        hashed_password = bcrypt.hashpw(user_inputted_password.encode('utf-8'), salt) #Hash the password they entered

        if hashed_password == account.password: #Compare their password with the password in the database
            response_message = {'msg': 'Successfully Logged In'}
            status_code = 200
            session['user'] = account.account_id   #keep track of logged in status with the account id

        else: #Case where password is incorrect
            response_message = {'msg': 'Incorrect Username or Password'}
            status_code = 401
    
        return jsonify(response_message), status_code
    
    except Exception as e: #Case where username does not exist
        response_message = {'msg': 'Incorrect Username or Password'}
        status_code = 401
        return jsonify(response_message), status_code
    
@bp.route('/register', methods = ['POST'])
def register():
    print("Registering...")

    #Get user info from frontend
    user_inputted_username = request.form['username']
    user_inputted_password = request.form['password']
    user_inputted_email = request.form['email']
    user_inputted_phone_number = request.form['phone_number']
    user_inputted_year_created = (int)(request.form['year'])

    generated_id = uuid.uuid1() #generate unique account id
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(user_inputted_password.encode('utf-8'), salt)

    new_account = Account(
        account_id = generated_id,
        username = user_inputted_username,
        password = user_inputted_password,
        email = user_inputted_email,
        phone = user_inputted_phone_number,
        avatar = "0",
        year_created = user_inputted_year_created
    )

    try:
        new_account.save()
        response_message = {'msg': 'Successfully Registered'}
        status_code = 200
        session['user'] = new_account.account_id 
        return jsonify(response_message), status_code
    
    except Exception as e:
        response_message = {'msg': "Invalid Email or Username"} #Need to make this more fine tuned: they should know what field was bad. i.e. username already taken
        status_code = 409 #proper code for this type of issue apparently
        return jsonify(response_message), status_code
        
