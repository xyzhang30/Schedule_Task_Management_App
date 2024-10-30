from flask import Blueprint, jsonify, session
from flask import request
from ..models.account import Account
from ..decorators import is_logged_in

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

@bp.route('/get_username', methods = ['GET'])
@is_logged_in
def get_username():
    account = Account.get_acc_by_id(session['user'])
    username = account.username
    response_message = {'username': username}
    status_code = 200
    return jsonify(response_message), status_code
