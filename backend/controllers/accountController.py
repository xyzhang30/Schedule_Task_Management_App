from flask import Blueprint
from flask import request
from ..models.account import Account

bp = Blueprint('account', __name__, url_prefix='/account')

@bp.route('/', methods = ['GET'])
def index():
    print("Fetching all accounts")
    try:
        return "All accounts!"
    except Exception as e:
        print(f"Error: {e}")
        return "An error occurred", 500
#   return "all accounts!"

@bp.route('/<id>', methods = ['GET'])
def show(id):
  account = Account.query.get(id)
  if account:
    return account.name
  else:
    return "Account doesn't exist"
