from flask import Blueprint, session, request, jsonify

bp = Blueprint('auth', __name__, url_prefix = '/auth')

@bp.route('/login', methods = ['POST'])

def login():
    print("Logging in...")
    #gets user input
    user_inputted_username = request.form['username']
    user_inputted_password = request.form['password']
    db = True #temporary pseudo variable, will be replaced with actual db query
    response_message = {'msg': 'Successfully Logged In'}
    status_code = 200
    if not db: 
        response_message = {'msg': 'Incorrect Username or Password'}
        status_code = 401
    else: 
        session['username'] = request.form['username'] #keep track of logged in status
    return jsonify(response_message), status_code
