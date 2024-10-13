from flask import Blueprint, jsonify
from flask import request
from ..models.friend import Friend

bp = Blueprint('friend', __name__, url_prefix='/friend')

@bp.route('/', methods = ['GET'])
def index():
    friends = Friend.query.all()
    friend_list = [f.to_dict() for f in friends]
    return jsonify(friend_list)


@bp.route('/add-friend', methods = ['POST'])
def addFriend():
    account_id1 =  int(request.form.get("account_id1"))
    account_id2 = int(request.form.get("account_id2"))
    # always save the smaller id as id1 -- ensures there are no bugs caused by the order of the two friends saved.
    if account_id1 > account_id2:
        account_id1, account_id2 = account_id2, account_id1
    friend = Friend(
        account_id1=account_id1,
        account_id2=account_id2
        )
    friend.save()
    return index()


@bp.route('/remove-friend', methods = ['DELETE'])
def removeFriend():
    account_id1 = int(request.form.get("account_id1"))
    account_id2 = int(request.form.get("account_id2"))
    friend = Friend.get_by_ids(account_id1, account_id2)
    if friend:
        friend.delete()
        return jsonify({"message": "Friend removed successfully."}), 200
    else:
        return jsonify({"error": "Friend relationship not found."}), 404
