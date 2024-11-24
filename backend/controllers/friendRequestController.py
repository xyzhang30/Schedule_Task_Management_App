from datetime import datetime
from flask import Blueprint, jsonify, session
from flask import request
from ..models.notifications import Notifications

bp = Blueprint('friend_request', __name__, url_prefix='/friend_request')

@bp.route('/', methods=['GET'])
def index():
    requests = Notifications.query.all()
    request_list = [r.to_dict() for r in requests]
    return jsonify(request_list), 200


@bp.route('/get-requests/', methods=['GET'])
def get_requests_for():
    account_id = session['user']
    allrequests = Notifications.get_notifications_by_acc_recv(account_id, "friend")
    allrequestsList = [r.to_dict() for r in allrequests]
    return jsonify(allrequestsList), 200


@bp.route('/send-request', methods=['POST'])
def send_request():
    account_id_from = session['user']
    account_id_to = int(request.form.get("account_id_to"))
    message = request.form.get("message")

    friendRequest = Notifications(
        account_id_from=account_id_from,
        account_id_to=account_id_to,
        notification_type="friend",
        message=message,
        created_at=datetime.now(),
        is_pending=True
    )
    
    friendRequest.save_notification()
    return index()


@bp.route('/get-pending-friends', methods=['GET'])
def get_pending_friends():
    account_id = session['user']
    pendingFriends = Notifications.get_notifications_by_acc_send(account_id, "friend")
    pendingList = [p.to_dict() for p in pendingFriends]
    return jsonify(pendingList), 200


@bp.route('/update-request', methods=['POST'])
def update_request():
    """
    Update pending status of a friend request.
    """
    request_id = int(request.form.get("request_id"))
    friend_request = Notifications.get_notification_by_notification_id(request_id)
    if not friend_request:
        return jsonify({'error': 'Friend request not found'}), 404
    
    friend_request.update_pending_status()
    return jsonify({'message': 'Request no longer pending'}), 200
 