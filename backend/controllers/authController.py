from flask import Blueprint, session, request, jsonify, redirect
from flask_mail import Message
from ..models.account import Account
from ..models.resetKeys import ResetKeys
from ..__init__ import mail
from ..decorators import is_logged_in
from ..__init__ import uploadParameters
from werkzeug.utils import secure_filename
import secrets, time, bcrypt, os
bp = Blueprint('auth', __name__, url_prefix = '/auth')

@bp.route('/session_status', methods=['GET'])
def session_status(): 
    '''
    Checks if a user is logged in based on session data - used for frontend rendering based on authentication.
    '''
    if 'user' in session:
        return jsonify({'loggedIn': True, 'user': session['user']})
    else:
        return jsonify({'loggedIn': False})

@bp.route('/login', methods = ['POST'])
def login():
    '''
    Logs a user in if they provide the correct credentials.
    '''
    user_inputted_username = request.form['username']
    user_inputted_password = request.form['password']

    try:
        #Attempt to get the account tuple associated with their username
        account = Account.get_acc_by_username(user_inputted_username) 
        
        if check_password(user_inputted_password, account.password): 
            response_message = {'msg': 'Successfully Logged In'}
            status_code = 200
            session['user'] = account.account_id 
        else: 
            response_message = {'msg': 'Incorrect Username or Password'}
            status_code = 401

    #Handle case where the username inputted does not exist
    except Exception as e: 
        response_message = {'msg': 'Incorrect Username or Password'}
        status_code = 401
            
    return jsonify(response_message), status_code

@bp.route('/register', methods = ['POST'])
def register():
    '''
    Registers a user if they provide proper credentials.
    '''
    user_inputted_username = request.form['username']
    user_inputted_password = request.form['password']
    user_inputted_confirm_password = request.form['confirm_password']
    user_inputted_email = request.form['email']
    user_inputted_phone_number = request.form['phone_number']
    user_inputted_avatar = request.files['profile_picture']
    user_inputted_year_created = (int)(request.form['year'])

    upload_file(user_inputted_avatar)

    if not compare_with_confirm(user_inputted_password, user_inputted_confirm_password): 
        response_message = {'msg': 'Passwords do not match'}
        status_code = 401
    else: 
        #Hash and salt the provided password to securely store it in the database
        password_to_be_stored = salt_and_hash_password(user_inputted_password)

        new_account = Account(
            username = user_inputted_username,
            password = password_to_be_stored,
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
        except Exception as e:
            response_message = {'msg': 'Invalid Email or Username - already taken'} 
            status_code = 409

    return jsonify(response_message), status_code

@bp.route('/logout', methods = ['POST'])
@is_logged_in
def logout():
    '''
    Logs the user out by modifying session data.
    '''
    session.pop('user', None) #Remove user key to log the user out
    response_message = {'msg': 'Successfully logged out'}
    status_code = 200
    return jsonify(response_message), status_code

@bp.route('/change_password', methods = ['POST'])
@is_logged_in
def change_password():
    '''
    Changes a user's password while they are logged in, if they correctly provide their old password.
    '''
    account = Account.get_acc_by_id(session['user'])
    original_password = request.form['original_password']

    #Check if they have provided the correct original password before updating it
    if check_password(original_password, account.password):
        password_to_be_stored = salt_and_hash_password(request.form['new_password'])  #Hash and salt the provided password to securely store it in the database
        account.password = password_to_be_stored
        account.save()
        response_message = {'msg': 'Successfully changed password'}
        status_code = 201
    else:
        response_message = {'msg': 'Incorrect password provided'}
        status_code = 401

    return jsonify(response_message), status_code
    
@bp.route('/forgot_password', methods = ['POST']) 
def forgot_password():
    '''
    Retrieves and verifies an email from the user and sends a password reset link to the email.
    '''
    user_inputted_email = request.form['email']
    account = Account.get_acc_by_email(user_inputted_email)
    
    if account is None:
        response_message = {'msg': 'The email you entered is not associated with any accounts'}
        status_code = 401
        return jsonify(response_message), status_code
    #Generate a reset key, unique url, and send the reset email
    else: 
        key = generate_reset_key(account)
        url = f"http://localhost:8080/auth/forgot_password/{key}"
        send_reset_email(url)
        response_message = {'msg': 'An email has been sent to the address with instructions for resetting the password'}
        status_code = 200
        return jsonify(response_message), status_code

@bp.route('/forgot_password/<url_key>', methods = ['GET'])
def check_reset_key(url_key):  
    '''
    Verifies the existence and validity of the reset key passed in through the url. 
    Redirects to the frontend reset-password route if valid.
    '''
    reset_key = ResetKeys.get_all_by_reset_key(url_key)
    
    if reset_key is None: 
        response_message = "This link no longer exists"
        status_code = 401
        return response_message, 401

    time_stamp = reset_key.time_stamp
    account_id = reset_key.account_id

    if ((time.time() - time_stamp)/60) > 15: #Reset key has expired, it has been longer than 15 minutes
        response_message = 'Password reset link expired'
        status_code = 401
        return response_message, 401
    else:
        session['reset_key'] = reset_key.reset_key #Put the valid reset key in the session data
        return redirect('http://localhost:3000/reset-password')

@bp.route('/reset_password', methods = ['POST'])
def reset_password():
    '''
    Resets the user's password if their session data contains a valid reset_key.
    '''
    if 'reset_key' in session:
        account_id = ResetKeys.get_all_by_reset_key(session['reset_key']).account_id #Gets the account_id associated with the reset key

        user_inputted_new_password = request.form['new_password']
        user_inputted_confirm = request.form['confirm_password'] 

        if not compare_with_confirm(user_inputted_new_password, user_inputted_confirm):
            response_message = {'msg': 'Passwords do not match'}
            status_code = 401
        else:
            new_password(account_id, user_inputted_new_password)
            response_message = {'msg': 'Password successfully changed'}
            status_code = 201
            session.pop('reset_key') #Removes reset key from the session data in accordance with successful password reset

            old_reset_keys = ResetKeys.get_all_by_account_id(account_id)
            remove_reset_keys(old_reset_keys) #Clears now-redundant tuples in the database to save space
    else: 
        response_message = {'msg': 'Not authorized'}
        status_code = 401

    return jsonify(response_message), status_code
    
#Helper functions
def upload_file(file):
    if allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(uploadParameters['UPLOAD_FOLDER'], filename))
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in uploadParameters['ALLOWED_EXTENSIONS']
def new_password(account_id, new_pass):
    account = Account.get_acc_by_id(account_id)
    account.password = salt_and_hash_password(new_pass)
    account.save()

def salt_and_hash_password(password):
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8') 
    return hashed_password

def check_password(pass_to_be_checked, hashed_salted_password):
    pass_to_be_checked = pass_to_be_checked.encode('utf-8')
    return bcrypt.checkpw(pass_to_be_checked, hashed_salted_password.encode('utf-8'))  

def compare_with_confirm(user_inputted_password, confirmation_of_password):
    return user_inputted_password == confirmation_of_password

def generate_reset_key(user_account):
    generated_key = secrets.token_urlsafe(32)
    current_time = time.time()
    user_id = user_account.account_id
    new_reset_key = ResetKeys(
        reset_key = generated_key,
        account_id = user_id,
        time_stamp = current_time
    )
    new_reset_key.save()
    return generated_key

def remove_reset_keys(old_reset_keys):
    for old_key in old_reset_keys:
        old_key.delete()

def send_reset_email(reset_url):
    email = Message(
        subject = 'Resetting Password',
        sender = 'hello@demomailtrap.com',
        recipients = ['Shenkermandavid@gmail.com']
    )
    email.body = f"Use this link to reset your password: {reset_url}. It will expire in 15 minutes"
    mail.send(email)

#Todo: finalize session understanding