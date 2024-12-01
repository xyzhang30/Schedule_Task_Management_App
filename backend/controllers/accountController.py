import os
from flask import Blueprint, jsonify, session, request, send_file
from ..models.account import Account
from app import uploadParameters
from ..decorators import is_logged_in
from ..utils.fileuploads import create_file_name, upload_file, delete_file

bp = Blueprint('account', __name__, url_prefix='/account')

@bp.route('/change_username', methods = ['POST'])
@is_logged_in
def change_username():
    '''
    Changes a user's username
    '''
    account = Account.get_acc_by_id(session['user'])
    new_username = request.form['new_username']

    try: 
        account.username = new_username
        account.save()
        response_message = {'msg': 'Succesfully changed username'}
        status_code = 201
    except Exception as e:
        #Handle case where they did not enter a unique username
        response_message = {'msg': 'Username already taken'}
        status_code = 409
        
    return jsonify(response_message), status_code
    
@bp.route('/change_email', methods = ['POST'])
@is_logged_in
def change_email():
    '''
    Changes a user's email
    '''
    account = Account.get_acc_by_id(session['user'])
    new_email = request.form['new_email']

    try: 
        account.email = new_email
        account.save()
        response_message = {'msg': 'Succesfully changed email'}
        status_code = 201
    except Exception as e:
        #Handle case where they did not enter a unique email
        response_message = {'msg': 'Email already taken'}
        status_code = 409

    return jsonify(response_message), status_code

@bp.route('/change_number', methods = ['POST'])
@is_logged_in
def change_number():
    '''
    Changes a user's phone number
    '''
    account = Account.get_acc_by_id(session['user'])
    new_number = request.form['new_number']

    try: 
        account.phone = new_number
        account.save()
        response_message = {'msg': 'Succesfully changed number'}
        status_code = 201
    except Exception as e:
        #Handle case where they did not enter a unique phone number
        response_message = {'msg': 'Phone number already taken'}
        status_code = 409
    
    return jsonify(response_message), status_code

@bp.route('/change_major', methods = ['POST'])
@is_logged_in
def change_major():
    '''
    Changes a user's phone number
    '''
    account = Account.get_acc_by_id(session['user'])
    new_major = request.form['new_major']

    account.major = new_major
    account.save()
    response_message = {'msg': 'Succesfully changed major'}
    status_code = 201

    return jsonify(response_message), status_code

@bp.route('change_avatar', methods = ['POST'])
@is_logged_in
def change_avatar():
    file = request.files.get('new_avatar')
    account = Account.get_acc_by_id(session['user'])
    username = account.username
    prev_avatar = os.path.basename(account.avatar)
    filename = create_file_name(username, file)
    if not filename:
        response_message = {'msg': f'Please upload a file with one of the following extensions: {uploadParameters["ALLOWED_EXTENSIONS"]}'}
        status_code = 401
    # elif prev_avatar != 'default.jpg':
    #     delete_file(prev_avatar)
    #     upload_file(file, filename)
    #     account.avatar = "/srv/app/avatars/" + filename
    #     account.save()
    #     response_message = {'msg': 'Avatar successfuly changed'}
    #     status_code = 201
    else: 
        upload_file(file, filename)
        account.avatar = "/srv/app/avatars/" + filename
        account.save()
        response_message = {'msg': 'Avatar successfuly changed'}
        status_code = 201
    return jsonify(response_message), status_code
    

@bp.route('/get_username', methods = ['GET'])
@is_logged_in
def get_username():
    account = Account.get_acc_by_id(session['user'])
    username = account.username
    response_message = {'username': username}
    status_code = 200
    return jsonify(response_message), status_code

@bp.route('/get_phone_number', methods = ['GET'])
@is_logged_in
def get_phone_number():
    account = Account.get_acc_by_id(session['user'])
    phone_number = account.phone
    response_message = {'phone_number': phone_number}
    status_code = 200
    return jsonify(response_message), status_code

@bp.route('/get_year', methods = ['GET'])
@is_logged_in
def get_year_created():
    account = Account.get_acc_by_id(session['user'])
    year_created = account.year_created
    response_message = {'year_created': year_created}
    status_code = 200
    return jsonify(response_message), status_code

@bp.route('/', methods = ['GET'])
def index():
    logged_in_user = session['user']
    account = Account.all_except_self(logged_in_user)
    accounts_list = [a.to_dict() for a in account]
    return jsonify(accounts_list)


@bp.route('/create', methods = ['POST'])
def createAccount():
    username = request.form.get("username")
    password = request.form.get("password")
    email = request.form.get("email")
    phone = request.form.get("phone")
    avatar = request.form.get("avatar")
    year_created = (int)(request.form.get("year_created"))

    account = Account(
        username=username,
        password=password,
        email=email,
        phone=phone,
        avatar=avatar,
        year_created=year_created
        )
    account.save()
    return index()

@bp.route('/current-user', methods=['GET'])
@is_logged_in
def get_current_user():
    return session['user']

@bp.route('/name-by-id/<id>', methods=['GET'])
def get_username_by_id(id):
    acc = Account.get_acc_by_id(id)
    username = acc.username
    return username

@bp.route('<int:id>/get_avatar', methods = ['GET'])
@is_logged_in
def get_avatar_by_id(id):
    account = Account.get_acc_by_id(id)
    file_path = account.avatar
    file_name = get_file_name(file_path)
    return send_file(file_path, file_name)

@bp.route('/get_avatar', methods = ['GET'])
@is_logged_in
def get_avatar():
    account = Account.get_acc_by_id(session['user'])
    file_path = account.avatar
    file_name = get_file_name(file_path)
    return send_file(file_path, file_name)

@bp.route('/get_major', methods = ['GET'])
@is_logged_in
def get_major():
    account = Account.get_acc_by_id(session['user'])
    major = account.major
    response_message = {'major': major}
    status_code = 200
    return jsonify(response_message), status_code

#Helper Functions
def get_file_name(file_path):
    file_name = os.path.basename(file_path)
    return file_name
