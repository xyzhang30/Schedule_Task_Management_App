from flask import Blueprint, session, request, jsonify
from flask_mail import Message
import secrets
import time
import uuid
import bcrypt
from ..models.account import Account
from ..models.resetKeys import ResetKeys
from ..__init__ import mail

bp = Blueprint('auth', __name__, url_prefix = '/auth')

@bp.route('/session_status', methods=['GET'])
def session_status():
    if 'user' in session:
        return jsonify({'loggedIn': True, 'user': session['user']})
    else:
        return jsonify({'loggedIn': False})

@bp.route('/login', methods = ['POST'])

def login():
    print("Logging in...")
    #gets user input
    user_inputted_username = request.form['username']
    user_inputted_email = request.form['email']
    user_inputted_password = request.form['password']

    try:
        account = Account.get_acc_by_username(user_inputted_username) #Check if their username exists and get the account tuple associated with it
        print(account.password)
        print(user_inputted_password)
        if check_password(user_inputted_password, account.password): #Compare their password with the password in the database
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
    #Get user info from frontend
    user_inputted_username = request.form['username']
    user_inputted_password = request.form['password']
    user_inputted_email = request.form['email']
    user_inputted_phone_number = request.form['phone_number']
    user_inputted_year_created = (int)(request.form['year'])

    salted_hashed_password = salt_and_hash_password(user_inputted_password)

    new_account = Account(
        username = user_inputted_username,
        password = salted_hashed_password,
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
        response_message = {'msg': 'Invalid Email or Username'} #Need to make this more fine tuned: they should know what field was bad. i.e. username already taken
        status_code = 409 #proper code for this type of issue apparently
        return jsonify(response_message), status_code

@bp.route('/logout', methods = ['POST'])
def logout():
    session.pop('user', None) #logs user out
    response_message = {'msg': 'Successfully logged out'}
    status_code = 200
    return jsonify(response_message), status_code

@bp.route('/change_password', methods = ['POST'])
def change_password():
    try:
        account = Account.get_acc_by_id(session['user'])
        original_password = request.form['original_password']
        if check_password(original_password, account.password):
            account.password = salt_and_hash_password(request.form['new_password'])
            account.save()
            response_message = {'msg': 'Successfully changed password'}
            status_code = 201
            return jsonify(response_message), status_code
        else:
            response_message = {'msg': 'Incorrect password provided'}
            status_code = 401
            return jsonify(response_message), status_code
        
    except Exception as e:
        response_message = {'msg': 'Please log in'}
        status_code = 401
        return jsonify(response_message), status_code

@bp.route('/change_username', methods = ['POST'])
def change_username():
    account = Account.get_acc_by_id(session['user'])
    new_username = request.form['new_username']
    try: 
        account.username = new_username
        account.save()
        response_message = {'msg': 'Succesfully changed username'}
        status_code = 201
        return jsonify(response_message), status_code
    except Exception as e:
        response_message = {'msg': 'Username already taken'}
        status_code = 409
        return jsonify(response_message), status_code
    
@bp.route('/change_email', methods = ['POST'])
def change_email():
    account = Account.get_acc_by_id(session['user'])
    new_email = request.form['new_email']
    try: 
        account.email = new_email
        account.save()
        response_message = {'msg': 'Succesfully changed email'}
        status_code = 201
        return jsonify(response_message), status_code
    except Exception as e:
        response_message = {'msg': 'Email already taken'}
        status_code = 409
        return jsonify(response_message), status_code

@bp.route('/change_number', methods = ['POST'])
def change_number():
    account = Account.get_acc_by_id(session['user'])
    new_number = request.form['new_number']
    try: 
        account.phone = new_number
        account.save()
        response_message = {'msg': 'Succesfully changed number'}
        status_code = 201
        return jsonify(response_message), status_code
    except Exception as e:
        response_message = {'msg': 'Phone number already taken'}
        status_code = 409
        return jsonify(response_message), status_code

@bp.route('/forgot_password', methods = ['POST']) #This function checks a user email for a password reset and sends the link if it is correct 
def forgot_password():
    user_inputted_email = request.form['email'] #Get email that the user wants to send reset link to
    account = Account.get_acc_by_email(user_inputted_email)
    if account is None:
        response_message = {'msg': 'The email you entered is not associated with any accounts'}
        status_code = 401
        return jsonify(response_message), status_code
    else: 
        key = generate_reset_key(account)
        url = f"http://localhost:8080/auth/forgot_password/{key}"
        send_reset_email(url)

@bp.route('/forgot_password/<url_key>', methods = ['POST'])
def reset_password(url_key):
    reset_key = ResetKeys.get_all_by_reset_key(url_key)
    if reset_key is None: #If there is no entry for this reset key 
        return 404
    
    time_stamp = reset_key.time_stamp
    account_id = reset_key.account_id

    if ((time.time() - time_stamp)/60) > 15: #Reset key has expired, it has been longer than 15 minutes
        response_message = {'msg': 'Password reset link expired'}
        status_code = 401
        return jsonify(response_message), 401
    else:
        user_inputted_new_password = request.form['new_password']
        user_inputted_confirm = request.form['confirm_password'] #'Confirm your new password', should be identical
        if user_inputted_confirm != user_inputted_new_password:
            response_message = {'msg': 'Passwords do not match'}
            status_code = 401
            return jsonify(response_message), status_code
        else:
            new_password(account_id, user_inputted_new_password)

def new_password(account_id, new_pass):
    account = Account.get_acc_by_id(account_id)
    account.password = salt_and_hash_password(new_pass)
    account.save()

def salt_and_hash_password(password):
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')  # Decode to string
    return hashed_password

def check_password(pass_to_be_checked, hashed_salted_password):
    pass_to_be_checked = pass_to_be_checked.encode('utf-8')  # Encode pass_to_be_checked for comparison
    return bcrypt.checkpw(pass_to_be_checked, hashed_salted_password.encode('utf-8'))  # Encode hashed password for comparison

def generate_reset_key(user_account):
    generated_key = secrets.urlsafe(32)
    current_time = time.time()
    user_id = user_account.id
    new_reset_key = ResetKeys(
        reset_key = generated_key,
        account_id = user_id,
        time_stamp = current_time
    )
    new_reset_key.save()
    return generated_key

def send_reset_email(reset_url):
    email = Message(
        subject = 'Resetting Password',
        sender = 'Shenkermandavid@gmail.com',
        recipients = ['Shenkermandavid@gmail.com']
    )
    email.body = f"Use this link to reset your password: {reset_url}. It will expire in 15 minutes"
    mail.send(email)
#Todo: finalize session understanding, clean functions, add decorators, error handling for emails, add delete functionality for reset entries