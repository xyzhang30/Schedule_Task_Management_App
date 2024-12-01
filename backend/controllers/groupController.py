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


# Functions included:

# Get all groups (index)
# Get groups by account id (showGroups)

# Group page access control (toGroup)
# Create group (createGroup)
# Edit group (editGroup)
# Delete group (deleteGroup)

# Member page access control (showMembers)
# Request join group (requestJoin)
# Leave group (leaveGroup)
# Add member by account_id (addMember)
# Delete member by account_id (deleteMember)

# Get events by group id (showEvents)

# Event popup access control (toEvent)
# Create event (createEvent)
# Edit event (editEvent)
# Cancel event (cancelEvent)
# Register for event (registerEvent)
# Drop event (dropEvent)
# Request register event (requestRegister)
# Add participant to event (addParticipant)


bp = Blueprint('group', __name__, url_prefix='/group')


@bp.route('/', methods = ['GET'])
@is_logged_in
def index():
    group = Group.all()
    groups_list = [grp.to_dict() for grp in group]
    return jsonify(groups_list)


@bp.route('/show-groups', methods=['GET'])
@is_logged_in
def showGroups():
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

    group = Group.get_grp_by_id(group_id)

    if group is None:
        return jsonify({"message": "No group found."}), 404

    return group.group_name, 200


@bp.route('/create-group', methods = ['POST'])
@is_logged_in
def createGroup():
    group_name = request.form.get("group_name")
    # group_avatar = request.form.get("group_avatar")
    year_created = datetime.now().year

    user_id = session.get('user')
    # user_id = 1 # HARDCODE

    exist_group = Group.query.filter_by(group_name=group_name).first()
    if exist_group:
        return jsonify({'message': 'Group name already exists. Please choose a different name.'}), 400
    
    # generated_id = str(uuid.uuid1())

    group = Group(
        # group_id=generated_id,
        group_name=group_name,
        # group_avatar=group_avatar,
        year_created=year_created,
        admin_id=user_id
    )
    group.save()
    addAdminAsMember(group.group_id, user_id)
    return jsonify({'message': 'Group created successfully', 'group': group.to_dict()}), 200


def addAdminAsMember(group_id, admin_id):
    membership = Membership(
        group_id=group_id,
        account_id=admin_id
    )
    membership.save()
    return jsonify({'message': 'Admin added as member successfully', 'membership': membership.to_dict()}), 200


@bp.route('/to-group/<int:group_id>', methods=['GET'])
@is_logged_in
def toGroup(group_id):

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

    group = Group.get_grp_by_id(group_id)
    if not group:
        return jsonify({'message': 'Group not found'}), 404
    
    user_id = session.get('user')

    # NOTE: below should not happen, bc non-member cannot see leave_group button on group page
    membership = Membership.query.filter_by(group_id=group_id, account_id=user_id).first()
    if not membership:
        return jsonify({'message': 'You are not a member of this group'}), 400

    # admin_id = group.admin_id
    # admin_email = Account.query.filter_by(account_id=admin_id).first().email

    # send_email(
    #     from_email=Account.query.filter_by(account_id=user_id).first().email,
    #     to_email=admin_email,
    #     subject="Member Left Group",
    #     message=f"User ID {user_id} has left the group {group.group_name}."
    # )

    membership.delete()

    return jsonify({'message': 'You have successfully left the group.'}), 200


# @bp.route('/request-join/<int:group_id>', methods=['GET'])
# def requestJoin(group_id):

#     group = Group.get_grp_by_id(group_id)
#     if not group:
#         return jsonify({'message': 'Group not found'}), 404

#     user_id = session.get('user')
#     account = Account.get_acc_by_id(user_id)
#     user_email = account.email
#     user_name = account.username

#     admin_id = group.admin_id
#     admin = Account.get_acc_by_id(admin_id)
#     admin_email = admin.email
#     admin_name = admin.username
    
#     # TODO: add link to this email to make replying to request more convenient
#     subject = f"Join Request for Group {group.group_name}"
#     message = f"""
#     Hi {admin_name},

#     {user_name} (Account ID: {user_id}, Email: {user_email}) has requested to join your group "{group.group_name}" (ID: {group_id}).
    
#     Please respond to the request at your convenience.

#     Best regards,
#     Schedule Task Management APP Team
#     """

#     try:
#         send_email(from_email=user_email, to_email=admin_email, subject=subject, message=message)
#         return jsonify({'message': 'Join request sent successfully'}), 200
#     except Exception as e:
#         return jsonify({'message': f'Failed to send join request: {str(e)}'}), 500


@bp.route('/get-group-id/<int:event_id>', methods=['GET'])
@is_logged_in
def getGroupID(event_id):
    event = PublicEvent.get_evt_by_id(event_id)
    return jsonify(event.group_id)


@bp.route('/show-events/<int:group_id>', methods=['GET'])
def showEvents(group_id):
    events = [event.to_dict() for event in PublicEvent.get_evts_by_grp_id(group_id)]
    return jsonify(events)


@bp.route('/show-reg-events', methods=['GET'])
@is_logged_in
def showRegEvents():
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
    
    # generated_id = str(uuid.uuid1())

    event = PublicEvent(
        # event_id=generated_id,
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


# @bp.route('/request-register/<int:event_id>', methods=['GET'])
# def requestRegister(event_id):
    
#     event = Group.get_evt_by_id(event_id)
#     if not event:
#         return jsonify({'message': 'Event not found'}), 404
    
#     group_id = event.group_id
#     group = Group.get_grp_by_id(group_id)

#     user_id = session.get('user')
#     account = Account.get_acc_by_id(user_id)
#     user_email = account.email
#     user_name = account.username

#     admin_id = group.admin_id
#     admin = Account.get_acc_by_id(admin_id)
#     admin_email = admin.email
#     admin_name = admin.username
    
#     # TODO: add link to this email to make replying to request more convenient
#     subject = f"Register Request for Event {event.event_name}"
#     message = f"""
#     Hi {admin_name},

#     {user_name} (Account ID: {user_id}, Email: {user_email}) has requested to attend the event "{event.event_name}" (ID: {event_id}) organized by your group "{group.group_name}" (ID: {group_id}).
    
#     Please respond to the request at your convenience.

#     Best regards,
#     Schedule Task Management APP Team
#     """

#     try:
#         send_email(from_email=user_email, to_email=admin_email, subject=subject, message=message)
#         return jsonify({'message': 'Register request sent successfully'}), 200
#     except Exception as e:
#         return jsonify({'message': f'Failed to send join request: {str(e)}'}), 500


@bp.route('/add-participant/<int:event_id>', methods=['POST'])
@is_logged_in
def addParticipant(event_id):
    
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


# def send_email(from_email, to_email, subject, message):
#     smtp_server = os.getenv('SMTP_SERVER')
#     smtp_port = int(os.getenv('SMTP_PORT', 587))  # default port is 587
#     smtp_user = os.getenv('SMTP_USER')
#     smtp_password = os.getenv('SMTP_PASSWORD')

#     if not smtp_server or not smtp_user or not smtp_password:
#         return False, "SMTP configuration missing."

#     msg = MIMET(message)
#     msg['Subject'] = subject
#     msg['From'] = from_email
#     msg['To'] = to_email

#     try:
#         with smtplib.SMTP(smtp_server, smtp_port) as server:
#             server.starttls()  # Encrypt the connection
#             server.login(smtp_user, smtp_password)  # Log in to the SMTP server
#             server.sendmail(from_email, [to_email], msg.as_string())  # Send the email
#         return True, "Email sent successfully."
#     except Exception as e:
#         return False, f"Failed to send email: {str(e)}"


# def convertDateType(date_str):
#     try:
#         date = datetime.strptime(date_str, '%Y-%m-%d').date()
#     except ValueError:
#         raise ValueError('Invalid date format. Use YYYY-MM-DD.')
#     return date


# def convertTimeType(time_str):
#     try:
#         time = datetime.strptime(time_str, '%H:%M').time()
#     except ValueError:
#         raise ValueError('Invalid time format. Use HH:MM.')
#     return time