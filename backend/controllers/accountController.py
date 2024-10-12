from flask import Blueprint, jsonify
from flask import request
from ..models.account import Account

bp = Blueprint('account', __name__, url_prefix='/account')

@bp.route('/', methods = ['GET'])
def index():
    account = Account.query.all()
    print(account)
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

    print("request!!!!!!: ", request.form)
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


  # return "hi"
    # print("Fetching all accounts")
    # try:
    #     return "All accounts!"
    # except Exception as e:
    #     print(f"Error: {e}")
    #     return "An error occurred", 500
#   return "all accounts!"

# @bp.route('/<id>', methods = ['GET'])
# def show(id):
#   account = Account.query.get(id)
#   if account:
#     return account.name
#   else:
#     return "Account doesn't exist"


