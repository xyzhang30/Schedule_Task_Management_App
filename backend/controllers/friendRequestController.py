from datetime import datetime
from flask import Blueprint, jsonify, session
from flask import request
from ..models.friendRequests import FriendRequest

bp = Blueprint('friend_request', __name__, url_prefix='/friend_request')

@bp.route('/', methods=['GET'])
def index():
    requests = FriendRequest.query.all()
    request_list = [r.to_dict() for r in requests]
    return jsonify(request_list), 200


@bp.route('/get-requests/', methods=['GET'])
def get_requests_for():
    account_id = session['user']
    allrequests = FriendRequest.get_messages_for_id(account_id)
    allrequestsList = [r.to_dict() for r in allrequests]
    return jsonify(allrequestsList), 200


@bp.route('/send-request', methods=['POST'])
def send_request():
    account_id_from = session['user']
    account_id_to = int(request.form.get("account_id_to"))
    message = request.form.get("message")

    friendRequest = FriendRequest(
        account_id_from=account_id_from,
        account_id_to=account_id_to,
        message=message,
        created_at=datetime.now()
    )
    
    friendRequest.save_request()
    return index()


@bp.route('/get-pending-friends', methods=['GET'])
def get_pending_friends():
    account_id = session['user']
    pendingFriends = FriendRequest.get_pending_requests_from_id(account_id)
    pendingList = [p.to_dict() for p in pendingFriends]
    return jsonify(pendingList), 200