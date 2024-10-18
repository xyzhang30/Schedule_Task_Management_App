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
    print("Registering...")

    #Get user info from frontend
    user_inputted_username = request.form['username']
    user_inputted_password = request.form['password']
    user_inputted_email = request.form['email']
    user_inputted_phone_number = request.form['phone_number']
    user_inputted_year_created = (int)(request.form['year'])

    generated_id = uuid.uuid1() #generate unique account id
    salted_hashed_password = salt_and_hash_password(user_inputted_password)

    new_account = Account(
        account_id = generated_id,
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
    session['user'] = None #logs user out
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
    
@bp.route('/change_username', methods = ['POST'])
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
    account.new_number = new_number
    account.save()
    response_message = {'msg': 'Succesfully changed phone number'}
    status_code = 201
    return jsonify(response_message), status_code
    
def salt_and_hash_password(password):
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password

def check_password(pass_to_be_checked, hashed_salted_password):
    pass_to_be_checked = pass_to_be_checked.encode('utf-8')
    return bcrypt.checkpw(pass_to_be_checked, hashed_salted_password)

#Todo: finalize session understanding and add forgot_password