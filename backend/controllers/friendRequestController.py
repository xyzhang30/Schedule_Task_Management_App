from datetime import datetime
from flask import Blueprint, jsonify
from flask import request
from ..models.friendRequests import FriendRequest

bp = Blueprint('friend_request', __name__, url_prefix='/friend_request')

@bp.route('/', methods=['GET'])
def index():
    requests = FriendRequest.query.all()
    request_list = [r.to_dict() for r in requests]
    return jsonify(request_list)


@bp.route('/get-requests/<int:account_id>', methods=['GET'])
def get_requests_for(account_id):
    pass


@bp.route('/send-request', methods=['POST'])
def send_request():
    account_id_from = int(request.form.get("account_id_from"))
    account_id_to = int(request.form.get("account_id_to"))
    message = request.form.get("message")

    friendRequest = FriendRequest(
        account_id_from=account_id_from,
        account_id_to=account_id_to,
        message=message,
        is_read=False,
        created_at=datetime.now()
    )
    
    friendRequest.save_request()
    return index()