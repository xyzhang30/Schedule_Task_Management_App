from datetime import datetime
from flask import Blueprint, jsonify, session
from flask import request
from ..models.account import Account
from ..models.group import Group
from ..models.membership import Membership
from ..models.notifications import Notifications
from ..decorators import is_logged_in

bp = Blueprint('group-request', __name__, url_prefix='/group-request')

@bp.route('/send-request/<int:group_id>', methods=['GET', 'POST'])
@is_logged_in
def sentRequest(group_id):
    """
    Handles the creation of a group join request. The current user can send a request to join a group.
    This request includes a message that will be sent to the group's administrator.

    :param group_id: ID of the group to send the join request to
    :return: JSON response with a success message and the group request details if successful, or an error message if the group is not found
    """
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
    """
    Accept a group join request and add the user (who sends the request) to the group.

    :param request_id: ID of the group join request to accept
    :return: JSON response with a success message and updated group request details if successful, or an error message if the request or group is not found
    """
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
    """
    Decline a group join request and delete the notification from database.

    :param request_id: ID of the group join request to decline
    :return: JSON response with a success message and deleted group request details if successful, or an error message if the request or group is not found
    """
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
    """
    Fetch and return a list of group join requests sent by the current user.

    :return: JSON response with a list of sent group requests or an empty list if no requests are found
    """
    user_id = session.get('user')

    out_requests = Notifications.get_notifications_by_acc_send(user_id, "group")
    out_requests_dict = [request.to_dict() for request in out_requests]

    return jsonify(out_requests_dict), 200


@bp.route('/show-in-request', methods=['GET'])
@is_logged_in
def showInRequests():
    """
    Fetch and return a list of group join requests received by the current user.

    :return: JSON response with a list of received group requests or an empty list if no requests are found
    """
    user_id = session.get('user')

    in_requests = Notifications.get_notifications_by_acc_recv(user_id, "group")
    in_requests_dict = [request.to_dict() for request in in_requests]

    return jsonify(in_requests_dict), 200


@bp.route('/get-grp-request/<int:group_id>', methods=['GET'])
@is_logged_in
def getGrpRequest(group_id):
    """
    Fetch and return the latest group join request sent by the current user to the specified group.
    If there are mutliple group join requests sent, only the LATEST one will be fetched and returned.

    :param group_id: ID of the group to fetch the request for
    :return: JSON response with the latest group request or a 204 status if no request was sent by the user
    """
    user_id = session.get('user')

    grp_request = Notifications.get_grp_notifications_by_acc_send_and_grp(user_id, group_id)

    if not grp_request:
        return jsonify({'message': 'No group request sent by this user to this group'}), 204

    return jsonify(grp_request.to_dict()), 200


def groupAdminError(group_id):
    """
    Checks if a group exists and if the current user is the group's administrator.

    :param group_id: The ID of the group to check.
    :return: 
        - If the group does not exist, returns None and a 404 error message.
        - If the current user is not the group's administrator, returns None and a 403 error message.
        - If the user is the administrator, returns the group object and None.

    This function is used to ensure that only the group administrator has the right to perform actions that modify the group.
    """
    group = Group.get_grp_by_id(group_id)
    if not group:
        return None, jsonify({'message': 'Group not found'}), 404
    
    user_id = session.get('user')
    # user_id = 5 # HARDCODE
    if group.admin_id != user_id:
        return None, jsonify({'message': 'Access denied: You are not the group administrator'}), 403

    return group, None
