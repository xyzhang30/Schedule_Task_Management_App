from flask import Blueprint, session, jsonify
from flask import request
import uuid
import smtplib
import os
from email.mime.text import MIMEText
from datetime import datetime

from ..models.group import Group
from ..models.membership import Membership
from ..models.account import Account
from ..models.publicEvent import PublicEvent
from ..models.registration import Registration
from ..decorators import is_logged_in


bp = Blueprint('group', __name__, url_prefix='/group')


@bp.route('/', methods = ['GET'])
@is_logged_in
def index():
    """
    Fetch and return a list of all groups in the database.
    
    :return: JSON response containing a list of all groups, where each group is 
             represented as a dictionary of its attributes.
    """
    group = Group.all()
    groups_list = [grp.to_dict() for grp in group]
    return jsonify(groups_list)


@bp.route('/show-groups', methods=['GET'])
@is_logged_in
def showGroups():
    """
    Fetch and return a list of groups of which the current user is a member.

    :return: JSON response containing a list of groups the current user belongs to, 
             where each group is represented as a dictionary of its attributes. 
             Returns a 404 error with a message if no groups are found.
    """
    user_id = session.get('user')
    # user_id = 1 # HARDCODE
    
    memberships = Membership.get_grps_by_acc_id(user_id)
    groups = [Group.get_grp_by_id(mbs.group_id) for mbs in memberships]

    if groups is None:
        return jsonify({"message": "No groups found."}), 404

    group_list = [group.to_dict() for group in groups]
    return jsonify(group_list), 200


@bp.route('/show-admin-groups', methods=['GET'])
@is_logged_in
def showAdminGroups():
    """
    Fetch and return a list of groups of which the current user is an administrator.

    :return: JSON response containing a list of groups the current user administers, 
             where each group is represented as a dictionary of its attributes. 
             Returns a 404 error with a message if no groups are found.
    """
    user_id = session.get('user')
    # user_id = 1 # HARDCODE

    groups = Group.get_grp_by_admin(user_id)

    if groups is None:
        return jsonify({"message": "No groups found."}), 404

    group_list = [group.to_dict() for group in groups]
    return jsonify(group_list), 200


@bp.route('/get-group-name-by-id/<int:group_id>', methods=['GET'])
@is_logged_in
def getGroupNameByID(group_id):
    """
    Fetch and return the name of the group with the specified group_id.

    :param group_id: ID of the group to fetch the name for.
    :return: Plain text response containing the group name if the group is found. 
             Returns a 404 error with a message if no group is found with the given ID.
    """
    group = Group.get_grp_by_id(group_id)

    if group is None:
        return jsonify({"message": "No group found."}), 404

    return group.group_name, 200


@bp.route('/create-group', methods = ['POST'])
@is_logged_in
def createGroup():
    """
    Create a new group with the specified group name and set the current user as its administrator.

    :request_param group_name: The name of the group to be created (retrieved from form data).
    :return: JSON response with a success message and the created group's details if successful. 
             Returns a 400 error with a message if the group name already exists.
    """
    group_name = request.form.get("group_name")
    # group_avatar = request.form.get("group_avatar")
    year_created = datetime.now().year

    user_id = session.get('user')
    # user_id = 1 # HARDCODE

    exist_group = Group.query.filter_by(group_name=group_name).first()
    if exist_group:
        return jsonify({'message': 'Group name already exists. Please choose a different name.'}), 400
    
    group = Group(
        group_name=group_name,
        # group_avatar=group_avatar,
        year_created=year_created,
        admin_id=user_id
    )
    group.save()
    addAdminAsMember(group.group_id, user_id)
    return jsonify({'message': 'Group created successfully', 'group': group.to_dict()}), 200


def addAdminAsMember(group_id, admin_id):
    """
    Add the administrator as a member of the specified group.

    :param group_id: ID of the group to which the administrator will be added as a member.
    :param admin_id: ID of the administrator to be added as a member.
    :return: JSON response with a success message and the membership details if successful.
    """
    membership = Membership(
        group_id=group_id,
        account_id=admin_id
    )
    membership.save()
    return jsonify({'message': 'Admin added as member successfully', 'membership': membership.to_dict()}), 200


@bp.route('/to-group/<int:group_id>', methods=['GET'])
@is_logged_in
def toGroup(group_id):
    """
    Fetch and return detailed information about a specified group, including user-specific permissions.

    :param group_id: ID of the group to fetch information for.
    :return: JSON response containing the group's details, including:
             - Group attributes (ID, name, year created, administrator ID, etc.).
             - List of events associated with the group.
             - User-specific permissions and status (admin, member, or guest).
             Returns a 404 error with a message if the group is not found.
    """
    user_id = session.get('user')
    # user_id = 1 # HARDCODE

    group = Group.get_grp_by_id(group_id)
    if not group:
        return jsonify({'message': 'Group not found'}), 404
    
    group_data = {
        'group_id': group.group_id,
        'group_name': group.group_name,
        # 'group_avatar': group.group_avatar, 
        'year_created': group.year_created,
        'admin_id': group.admin_id,
        'events': [event.to_dict() for event in PublicEvent.get_evts_by_grp_id(group_id)]
    }

    membership = Membership.get_membership(user_id, group_id)

    if membership:
        if user_id == group.admin_id:
            group_data['is_admin'] = True
            group_data['permissions'] = ['edit_group', 'create_event', 'manage_members']
        else:
            group_data['is_member'] = True
            group_data['permissions'] = ['view_members']
    else:
        group_data['is_guest'] = True
        group_data['permissions'] = ['request_join']

    return jsonify(group_data)


@bp.route('/edit-group/<int:group_id>', methods = ['PUT'])
@is_logged_in
def editGroup(group_id):
    """
    Update the details of a specified group if the current user is the group administrator.

    :param group_id: ID of the group to be updated.
    :request_param new_group_name: The new name for the group (optional).
    :return: JSON response with a success message and the updated group's details if successful.
             Returns an error response if the user is not the group administrator or if 
             there is an issue with the request.
    """
    group, error = groupAdminError(group_id)
    if error:
        return error
    
    new_group_name = request.form.get("new_group_name")
    # new_group_avatar = request.form.get("new_group_avatar")

    if new_group_name:
        group.group_name = new_group_name
    # if new_group_avatar:
    #     group.group_avatar = new_group_avatar
    
    group.save()
    return jsonify({'message': 'Group updated successfully', 'group': group.to_dict()}), 200


@bp.route('/delete-group/<int:group_id>', methods = ['GET', 'DELETE'])
@is_logged_in
def deleteGroup(group_id):
    """
    Delete the specified group and all associated memberships, if the current user is the group administrator.

    :param group_id: ID of the group to be deleted.
    :return: JSON response with a success message if the group is deleted successfully.
             Returns an error response if the user is not the group administrator or if 
             there is an issue with the deletion process.
    """
    group, error = groupAdminError(group_id)
    if error:
        return error

    for membership in Membership.get_accs_by_grp_id(group_id):
        membership.delete()
    
    group.delete()
    return jsonify({'message': 'Group deleted successfully', 'group': group.to_dict()}), 200


@bp.route('/show-members/<int:group_id>', methods=['GET'])
@is_logged_in
def showMembers(group_id):
    """
    Fetch and return a list of members in the specified group, along with their user information and permissions.

    :param group_id: ID of the group to fetch member information for.
    :return: JSON response containing the group's details, including:
             - Group attributes (ID, name, admin ID).
             - List of members with their associated user data (username, membership details).
             - User-specific permissions (admin, member).
             Returns a 404 error if the group is not found, and a 403 error if the user is not a member of the group.
    """
    group = Group.get_grp_by_id(group_id)
    if not group:
        return jsonify({'message': 'Group not found'}), 404

    user_id = session.get('user')

    memberships = Membership.get_accs_by_grp_id(group_id)

    members = []
    for membership in memberships:
        account = Account.get_acc_by_id(membership.account_id)
        member_data = membership.to_dict()
        if account:
            member_data['username'] = account.username
        members.append(member_data)

    group_data = {
        'group_id': group.group_id,
        'group_name': group.group_name,
        'admin_id': group.admin_id,
        'members': members,
    }

    membership = Membership.get_membership(user_id, group_id)

    if membership:
        if user_id == group.admin_id:
            group_data['is_admin'] = True
            group_data['permissions'] = ['edit_group', 'add_friend', 'add_members', 'remove_members']
        else:
            group_data['is_member'] = True
            group_data['permissions'] = ['add_friend']
    else:
        # NOTE: below should not happen, bc non-member cannot see to_member_page button on group page
        return jsonify({'message': 'Access denied: You are not a group member'}), 403

    return jsonify(group_data)


@bp.route('/add-member/<int:group_id>', methods=['POST'])
@is_logged_in
def addMember(group_id):
    """
    Add a new member to the specified group, if the current user is the group administrator.

    :param group_id: ID of the group to add the new member to.
    :request_param member_name: The username of the member to be added.
    :return: JSON response with a success message and the new membership details if successful.
             Returns a 400 error if the member name is missing, invalid, or the member is already in the group.
    """
    group, error = groupAdminError(group_id)
    if error:
        return error
    
    member_name = request.form.get('member_name')
    if not member_name:
        return jsonify({'message': 'Member Name is required'}), 400
    
    member = Account.get_acc_by_username(member_name)
    if not member:
        return jsonify({'message': 'The Member Name is not a valid username'}), 400
    
    membership = Membership.query.filter_by(group_id=group_id, account_id=member.account_id).first()
    if membership:
        return jsonify({'message': 'Member is already part of the group'}), 400

    new_membership = Membership(group_id=group_id, account_id=member.account_id)

    new_membership.save()

    return jsonify({'message': 'Member added to the group successfully', 'member': new_membership.to_dict()}), 200


@bp.route('/remove-member/<int:group_id>/<int:member_id>', methods=['DELETE'])
@is_logged_in
def removeMember(group_id, member_id):
    """
    Remove a member from the specified group, if the current user is the group administrator.

    :param group_id: ID of the group from which the member will be removed.
    :param member_id: ID of the member to be removed.
    :return: JSON response with a success message if the member is removed successfully.
             Returns a 404 error if the membership is not found.
    """
    group, error = groupAdminError(group_id)
    if error:
        return error
    
    membership = Membership.query.filter_by(group_id=group_id, account_id=member_id).first()
    if not membership:
        return jsonify({'message': 'Membership not found'}), 404
    
    membership.delete()

    return jsonify({'message': 'Member removed successfully', 'member': membership.to_dict()}), 200


@bp.route('/leave-group/<int:group_id>', methods=['DELETE'])
@is_logged_in
def leaveGroup(group_id):
    """
    Allow a user to leave a specified group.

    :param group_id: ID of the group the user wants to leave.
    :return: JSON response with a success message if the user successfully leaves the group.
             Returns a 404 error if the group is not found, and a 400 error if the user is not a member of the group.
    """
    group = Group.get_grp_by_id(group_id)
    if not group:
        return jsonify({'message': 'Group not found'}), 404
    
    user_id = session.get('user')

    # NOTE: below should not happen, bc non-member cannot see leave_group button on group page
    membership = Membership.query.filter_by(group_id=group_id, account_id=user_id).first()
    if not membership:
        return jsonify({'message': 'You are not a member of this group'}), 400

    membership.delete()

    return jsonify({'message': 'You have successfully left the group.'}), 200


@bp.route('/get-group-id/<int:event_id>', methods=['GET'])
@is_logged_in
def getGroupID(event_id):
    """
    Fetch the group ID of the group that the specified public event belongs to.

    :param event_id: ID of the public event to fetch the associated group ID for.
    :return: JSON response containing the group ID associated with the specified event.
             Returns a 404 error if the event is not found.
    """
    event = PublicEvent.get_evt_by_id(event_id)
    return jsonify(event.group_id)


@bp.route('/show-events/<int:group_id>', methods=['GET'])
def showEvents(group_id):
    """
    Fetch and return a list of events associated with a specified group.

    :param group_id: ID of the group to fetch events for.
    :return: JSON response containing a list of events for the specified group, 
             where each event is represented as a dictionary of its attributes.
    """
    events = [event.to_dict() for event in PublicEvent.get_evts_by_grp_id(group_id)]
    return jsonify(events)


@bp.route('/show-reg-events', methods=['GET'])
@is_logged_in
def showRegEvents():
    """
    Fetch and return a list of public events that the current user has registered for.

    :return: JSON response containing a list of events that the current user is registered for,
             where each event is represented as a dictionary of its attributes. 
             Returns a 204 status if no registrations are found and a 404 error if a registered event is not found.
    """
    user_id = session.get('user')
    # user_id = 1 # HARDCODE

    registrations = Registration.get_evts_by_acc_id(user_id)

    if not registrations:
        return jsonify({"message": "No registrations found."}), 204

    events = []
    for registr in registrations:
        event = PublicEvent.get_evt_by_id(registr.event_id)
        if event:
            events.append(event)
        else:
            return jsonify({"message": "Registered event not found."}), 404

    event_list = [event.to_dict() for event in events]
    return jsonify(event_list), 200


@bp.route('/to-event/<int:event_id>', methods=['GET'])
@is_logged_in
def toEvent(event_id):
    """
    Fetch and return detailed information about a specified public event, including user-specific permissions.

    :param event_id: ID of the event to fetch information for.
    :return: JSON response containing the event's details, including:
             - Event attributes (ID, name, start/end time, all-day status).
             - Group ID and user-specific event registration status.
             - User-specific permissions (admin, member, guest) and registration status.
             Returns a 404 error if the event is not found.
    """
    event = PublicEvent.get_evt_by_id(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404
        
    event_data = {
        'event_id': event.event_id,
        'event_name': event.event_name,
        'group_id': event.group_id,
        'start_date_time': event.start_date_time,
        'end_date_time': event.end_date_time,
        'is_all_day': event.is_all_day
    }

    group_id = event.group_id
    user_id = session.get('user')
    # user_id = 1 # HARDCODE
    
    group = Group.get_grp_by_id(group_id)
    membership = Membership.get_membership(user_id, group_id)
    registr = Registration.get_registr(user_id, event_id)

    if membership:
        if user_id == group.admin_id:
            event_data['is_admin'] = True
            if registr:
                event_data['registered'] = True
                event_data['permissions'] = ['attend_event', 'edit_event', 'cancel_event']
            else:
                event_data['registered'] = False
                event_data['permissions'] = ['register_event', 'edit_event', 'cancel_event']
        else:
            event_data['is_member'] = True
            if registr:
                event_data['registered'] = True
                event_data['permissions'] = ['attend_event']
            else:
                event_data['registered'] = False
                event_data['permissions'] = ['register_event']
    else:
        event_data['is_guest'] = True
        if registr:
            event_data['registered'] = True
            event_data['permissions'] = ['attend_event']
        else:
            event_data['registered'] = False
            event_data['permissions'] = ['request_register']

    return jsonify(event_data)


@bp.route('/create-event/<int:group_id>', methods = ['POST'])
@is_logged_in
def createEvent(group_id):
    """
    Create a new public event within a specified group, if the current user is the group administrator.

    :param group_id: ID of the group to create the event for.
    :request_param event_name: Name of the event to be created.
    :request_param start_date_time: Start date and time of the event in ISO 8601 format.
    :request_param end_date_time: End date and time of the event in ISO 8601 format.
    :request_param is_all_day: Boolean indicating whether the event lasts all day.
    :return: JSON response with a success message and the details of the newly created event if successful.
             Returns a 400 error if an event with the same name already exists.
    """
    group, error_message = groupAdminError(group_id)
    if error_message:
        return error_message
    
    print("______EVENTNAME: ", request.form.get("event_name"))
    print("______START: ", request.form.get("start_date_time"))
    print("______END: ", request.form.get("end_date_time"))
    
    event_name = request.form.get("event_name")
    start_date_time = datetime.strptime(request.form.get("start_date_time"), '%Y-%m-%dT%H:%M')
    end_date_time = datetime.strptime(request.form.get("end_date_time"), '%Y-%m-%dT%H:%M')
    is_all_day = request.form.get("is_all_day") == 'true'

    exist_event = PublicEvent.query.filter_by(event_name=event_name).first()
    if exist_event:
        return jsonify({'message': 'Event name already exists. Please choose a different name.'}), 400
    
    event = PublicEvent(
        event_name=event_name,
        group_id=group_id,
        start_date_time=start_date_time,
        end_date_time=end_date_time,
        is_all_day=is_all_day
    )

    event.save()

    return jsonify({'message': 'Event created successfully', 'event': event.to_dict()}), 200


@bp.route('/edit-event/<int:event_id>', methods = ['PUT'])
@is_logged_in
def editEvent(event_id):
    """
    Edit the details of an existing public event within a specified group, if the current user is the group administrator.

    :param event_id: ID of the event to be edited.
    :request_param new_event_name: New name for the event (optional).
    :request_param start_date_time: New start date and time for the event (optional) in ISO 8601 format.
    :request_param end_date_time: New end date and time for the event (optional) in ISO 8601 format.
    :request_param is_all_day: Boolean indicating whether the event is all day (optional).
    :return: JSON response with a success message and the updated event details if successful.
             Returns a 404 error if the event is not found and a 400 error if the new event name already exists.
    """
    event = PublicEvent.get_evt_by_id(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404
    
    group_id = event.group_id
    group, error_message = groupAdminError(group_id)
    if error_message:
        return error_message
    
    new_event_name = request.form.get("new_event_name")
    new_start_date_time_input = request.form.get("start_date_time")
    new_end_date_time_input = request.form.get("end_date_time")
    new_is_all_day = request.form.get("is_all_day")

    exist_event = PublicEvent.query.filter_by(event_name=new_event_name).first()
    if exist_event:
        return jsonify({'message': 'Event name already exists. Please choose a different name.'}), 400
    
    event.event_name = new_event_name if new_event_name else event.event_name
    event.start_date_time = datetime.strptime(new_start_date_time_input, '%Y-%m-%dT%H:%M') if new_start_date_time_input else event.start_data_time
    event.end_date_time = datetime.strptime(new_end_date_time_input, '%Y-%m-%dT%H:%M') if new_end_date_time_input else event.end_data_time
    event.is_all_day = (new_is_all_day  == 'true') if new_is_all_day else event.is_all_day

    event.save()

    return jsonify({'message': 'Event updated successfully', 'event': event.to_dict()}), 200


@bp.route('/cancel-event/<int:event_id>', methods=['DELETE'])
@is_logged_in
def cancelEvent(event_id):
    """
    Cancel a public event and remove all associated registrations, if the current user is the group administrator.

    :param event_id: ID of the event to be canceled.
    :return: JSON response with a success message if the event is successfully canceled and removed.
             Returns a 404 error if the event is not found and a 403 error if the user is not the group administrator.
    """
    event = PublicEvent.get_evt_by_id(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404
    
    group_id = event.group_id
    group, error_message = groupAdminError(group_id)
    if error_message:
        return error_message
    
    for registration in Registration.get_accs_by_evt_id(event_id):
        registration.delete()

    event.delete()

    return jsonify({'message': 'Event removed successfully'}), 200


@bp.route('/register-event/<int:event_id>', methods=['GET', 'POST'])
@is_logged_in
def registerEvent(event_id):
    """
    Register the current user for a public event, ensuring they are a member of the event's associated group.

    :param event_id: ID of the event to register for.
    :return: JSON response with success or error message:
             - Success message if the user is registered for the event.
             - 404 error if the event is not found.
             - 403 error if the user is not a member of the group associated with the event.
             - 400 error if the user is already registered for the event.
    """
    event = PublicEvent.get_evt_by_id(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404
    
    group_id = event.group_id
    
    user_id = session.get('user')
    # user_id = 1 # HARDCODE
    
    membership = Membership.query.filter_by(group_id=group_id, account_id=user_id).first()
    if not membership:
        return jsonify({'message': 'User is not a member of the group'}), 403
    
    registration = Registration.query.filter_by(event_id=event_id, account_id=user_id).first()
    if registration:
        return jsonify({'message': 'User is already registered for the event'}), 400

    new_registration = Registration(event_id=event_id, account_id=user_id)
    new_registration.save()

    return jsonify({'message': 'Successfully registered for the event'}), 200


@bp.route('/drop-event/<int:event_id>', methods=['GET', 'DELETE'])
@is_logged_in
def dropEvent(event_id):
    """
    Unregister the current user from a public event, ensuring they are already registered.

    :param event_id: ID of the event to unregister from.
    :return: JSON response with success or error message:
             - Success message if the user is successfully unregistered from the event.
             - 404 error if the event is not found.
             - 400 error if the user is not registered for the event.
    """
    event = PublicEvent.get_evt_by_id(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404
    
    group_id = event.group_id
    
    user_id = session.get('user')
    # user_id = 1 # HARDCODE
    
    registration = Registration.query.filter_by(event_id=event_id, account_id=user_id).first()
    if not registration:
        return jsonify({'message': 'User is not registered for the event'}), 400

    registration.delete()

    return jsonify({'message': 'Successfully dropped the event'}), 200


@bp.route('/add-participant/<int:event_id>', methods=['POST'])
@is_logged_in
def addParticipant(event_id):
    """
    Add a participant to a public event, ensuring the participant is not already registered.

    :param event_id: ID of the event to which the participant is being added.
    :return: JSON response with success or error message:
             - Success message if the participant is successfully added to the event.
             - 404 error if the event is not found.
             - 400 error if the participant ID is missing or if the participant is already registered.
    """
    event = Group.get_evt_by_id(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404
    
    group_id = event.group_id
    group, error_message = groupAdminError(group_id)
    if error_message:
        return error_message
    
    participant_id = request.form.get('participant_id')
    if not participant_id:
        return jsonify({'message': 'Participant ID is required'}), 400
    
    registr = Registration.query.filter_by(event_id=event_id, account_id=participant_id).first()
    if registr:
        return jsonify({'message': 'Participant has already registered for the event'}), 400

    new_registration = Registration(event_id=event_id, account_id=participant_id)

    new_registration.save()

    return jsonify({'message': 'Participant added to the event successfully'}), 200


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
    # user_id = 1 # HARDCODE
    if group.admin_id != user_id:
        return None, jsonify({'message': 'Access denied: You are not the group administrator'}), 403

    return group, None