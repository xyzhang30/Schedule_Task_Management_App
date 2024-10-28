from flask import session, jsonify
import functools

def is_logged_in(func):
    @functools.wraps(func)
    def wrapper_is_logged_in(*args, **kwargs):
        if 'user' in session:
            return func(*args, **kwargs)
        else:
            response_message = {'msg': 'Please Log In'}
            status_code = 401
            return jsonify(response_message), status_code
    return wrapper_is_logged_in