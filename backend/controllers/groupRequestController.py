from datetime import datetime
from flask import Blueprint, jsonify, session
from flask import request
from ..models.account import Account
from ..models.group import Group
from ..models.groupRequest import GroupRequest

bp = Blueprint('group_request', __name__, url_prefix='/group-request')

"""
1. sentRequest
2. acceptRequest
3. showOutRequests
4. showInRequests
"""

@bp.route('/send-request/<int:group_id>', methods=['GET', 'POST'])
def sentRequest(group_id):

    group = Group.get_grp_by_id(group_id)
    if not group:
        return jsonify({'message': 'Group not found'}), 404

    user_id = session.get('user')

    message = request.form.get("message")
    
    # generated_id = str(uuid.uuid1())

    grp_request = GroupRequest(
        # request_id=generated_id,
        account_id=user_id,
        group_id=group_id,
        message=message,
        is_pending=True,
        created_at=datetime.now()
    )

    grp_request.save()

    return jsonify({'message': 'Group request created successfully', 'group_request': grp_request.to_dict()}), 200


@bp.route('/accept-request/<int:request_id>', methods=['GET', 'POST'])
def acceptRequest(request_id):

    grp_request = GroupRequest.get_rqst_by_id(request_id)
    if not grp_request:
        return jsonify({'message': 'Group request not found'}), 404
    
    grp_request.update_pending_status()

    return jsonify({'message': 'Group request no longer pending', 'group_request': grp_request.to_dict()}), 200


@bp.route('/show-out-request', methods=['GET'])
def showOutRequests():

    user_id = session.get('user')

    out_requests = GroupRequest.get_rqst_by_acc_send(user_id)

    return jsonify({'out_request': out_requests.to_dict()}), 200


@bp.route('/show-in-request', methods=['GET'])
def showInRequests():
    
    user_id = session.get('user')

    in_requests = GroupRequest.get_rqst_by_acc_recv(user_id)

    return jsonify({'in_request': in_requests.to_dict()}), 200
