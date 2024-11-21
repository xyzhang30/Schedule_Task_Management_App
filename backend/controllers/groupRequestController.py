from datetime import datetime
from flask import Blueprint, jsonify, session
from flask import request
from ..models.account import Account
from ..models.group import Group
from ..models.membership import Membership
from ..models.groupRequest import GroupRequest
from ..decorators import is_logged_in

bp = Blueprint('group-request', __name__, url_prefix='/group-request')

"""
1. sentRequest
2. acceptRequest
3. showOutRequests
4. showInRequests
"""

@bp.route('/send-request/<int:group_id>', methods=['GET', 'POST'])
@is_logged_in
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
@is_logged_in
def acceptRequest(request_id):

    grp_request = GroupRequest.get_rqst_by_id(request_id)
    if not grp_request:
        return jsonify({'message': 'Group request not found'}), 404
    
    group, error_message = groupAdminError(grp_request.group_id)
    if error_message:
        return error_message
    
    new_membership = Membership(group_id=grp_request.group_id, account_id=grp_request.account_id)
    new_membership.save()
    
    grp_request.update_pending_status()

    return jsonify({'message': 'Group request no longer pending', 'group_request': grp_request.to_dict()}), 200


@bp.route('/show-out-request', methods=['GET'])
@is_logged_in
def showOutRequests():

    user_id = session.get('user')

    out_requests = GroupRequest.get_rqst_by_acc_send(user_id)
    out_requests_dict = [request.to_dict() for request in out_requests]

    return jsonify(out_requests_dict), 200


@bp.route('/show-in-request', methods=['GET'])
@is_logged_in
def showInRequests():
    
    user_id = session.get('user')

    in_requests = GroupRequest.get_rqst_by_acc_recv(user_id)
    in_requests_dict = [request.to_dict() for request in in_requests]

    return jsonify(in_requests_dict), 200


def groupAdminError(group_id):
    """
    Check if the group exists and if the current user is the group administrator.
    """

    group = Group.get_grp_by_id(group_id)
    if not group:
        return None, jsonify({'message': 'Group not found'}), 404
    
    user_id = session.get('user')
    # user_id = 1 # HARDCODE
    if group.admin_id != user_id:
        return None, jsonify({'message': 'Access denied: You are not the group administrator'}), 403

    return group, None
