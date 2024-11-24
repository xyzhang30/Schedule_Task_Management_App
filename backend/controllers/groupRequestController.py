from datetime import datetime
from flask import Blueprint, jsonify, session
from flask import request
from ..models.account import Account
from ..models.group import Group
from ..models.membership import Membership
from ..models.notifications import Notifications
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
    
    grp_request = Notifications(
        account_id_from=user_id,
        account_id_to=group.admin_id,
        group_id = group_id,
        notification_type="group",
        message=message,
        created_at=datetime.now(),
        is_pending=True
    )

    grp_request.save_notification()

    return jsonify({'message': 'Group request created successfully', 'group_request': grp_request.to_dict()}), 200


@bp.route('/accept-request/<int:request_id>', methods=['GET', 'PUT'])
@is_logged_in
def acceptRequest(request_id):

    grp_request = Notifications.get_notification_by_notification_id(request_id)
    if not grp_request:
        return jsonify({'message': 'Group request not found'}), 404
    
    group, error_message = groupAdminError(grp_request.group_id)
    if error_message:
        return error_message
    
    new_membership = Membership(group_id=grp_request.group_id, account_id=grp_request.account_id_from)
    new_membership.save()
    
    grp_request.update_pending_status()

    return jsonify({'message': 'Group request no longer pending', 'group_request': grp_request.to_dict()}), 200


@bp.route('/decline-request/<int:request_id>', methods=['GET', 'DELETE'])
@is_logged_in
def declineRequest(request_id):

    grp_request = Notifications.get_notification_by_notification_id(request_id)
    if not grp_request:
        return jsonify({'message': 'Group request not found'}), 404
    
    group, error_message = groupAdminError(grp_request.group_id)
    if error_message:
        return error_message

    grp_request.delete_notification()

    return jsonify({'message': 'Group request deleted', 'group_request': grp_request.to_dict()}), 200


@bp.route('/show-out-request', methods=['GET'])
@is_logged_in
def showOutRequests():

    user_id = session.get('user')

    out_requests = Notifications.get_notifications_by_acc_send(user_id, "group")
    out_requests_dict = [request.to_dict() for request in out_requests]

    return jsonify(out_requests_dict), 200


@bp.route('/show-in-request', methods=['GET'])
@is_logged_in
def showInRequests():
    
    user_id = session.get('user')

    in_requests = Notifications.get_notifications_by_acc_recv(user_id, "group")
    in_requests_dict = [request.to_dict() for request in in_requests]

    return jsonify(in_requests_dict), 200


@bp.route('/get-grp-request/<int:group_id>', methods=['GET'])
@is_logged_in
def getGrpRequest(group_id):
    user_id = session.get('user')

    grp_request = Notifications.get_grp_notifications_by_acc_send_and_grp(user_id, group_id)

    if not grp_request:
        return jsonify({'message': 'No group request sent by this user to this group'}), 204

    return jsonify(grp_request.to_dict()), 200


def groupAdminError(group_id):
    """
    Check if the group exists and if the current user is the group administrator.
    """

    group = Group.get_grp_by_id(group_id)
    if not group:
        return None, jsonify({'message': 'Group not found'}), 404
    
    user_id = session.get('user')
    # user_id = 5 # HARDCODE
    if group.admin_id != user_id:
        return None, jsonify({'message': 'Access denied: You are not the group administrator'}), 403

    return group, None
