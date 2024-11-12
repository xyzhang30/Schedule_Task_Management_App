from flask import Blueprint, jsonify, session
from flask import request
from ..models.friend import Friend
from ..decorators import is_logged_in

bp = Blueprint('friend', __name__, url_prefix='/friend')

@bp.route('/', methods = ['GET'])
@is_logged_in
def index():
    friends = Friend.query.all()
    friend_list = [f.to_dict() for f in friends]
    return jsonify(friend_list)


@bp.route('/get-friends', methods=['GET'])
@is_logged_in
def get_friends():
    '''
    Gets all the friends for a specific account by account_id
    '''
    account_id = session['user']
    friends = Friend.get_friends_by_id(account_id)
    if friends is None:
        return jsonify({"error": "No friends found."}), 404

    friend_list = [friend.to_dict() for friend in friends]
    return jsonify(friend_list), 200


@bp.route('/add-friend', methods = ['POST'])
@is_logged_in
def addFriend():
    '''
    add a friend account pair into database
    '''
    account_id1 = session['user']
    account_id2 = int(request.form.get("account_id2"))
    # always save the smaller id as id1 -- ensures there are no bugs caused by the order in the friend pair
    if account_id1 > account_id2:
        account_id1, account_id2 = account_id2, account_id1
    friend = Friend(
        account_id1=account_id1,
        account_id2=account_id2
        )
    friend.save()
    return index()


@bp.route('/remove-friend', methods = ['DELETE'])
@is_logged_in
def removeFriend():
    '''
    removes a friend account pair from database 
    '''
    account_id1 = session['user']
    account_id2 = int(request.form.get("account_id2"))
    if account_id1 > account_id2:
        account_id1, account_id2 = account_id2, account_id1
    friend = Friend.get_pair_by_ids(account_id1, account_id2)
    if friend:
        friend.delete()
        return jsonify({"message": "Friend removed successfully."}), 200
    else:
        return jsonify({"error": "Friend relationship not found."}), 404
