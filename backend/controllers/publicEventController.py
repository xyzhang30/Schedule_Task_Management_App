from flask import Blueprint, jsonify
from flask import request
import datetime
from ..models.publicEvent import PublicEvent
from ..models.group import Group

# TODO: write notify function using Notification model

bp = Blueprint('public-event', __name__, url_prefix='/public-event')


@bp.route('/', methods = ['GET'])
def index():
    event = Group.query.all()
    events_list = [evt.to_dict() for evt in event]
    return jsonify(events_list)

def groupAdminError(group_id):
    """
    Check if the group exists and if the current user is the group administrator.
    
    :param group_id: ID of the group to check
    :return: Tuple (group object, None) if success, or (None, response) if failure
    """

    group = Group.get_grp_by_id(group_id)
    if not group:
        return None, jsonify({'message': 'Group not found'}), 404
    
    # TODO: replace with the function that get account cookie
    current_user_id = get_current_user_id()
    if group.admin_id != current_user_id:
        return None, jsonify({'message': 'Access denied: You are not the group administrator'}), 403

    return group, None

def eventAdminError(event_id):
    """
    Check if the event exists and if the current user is the event's group administrator.
    
    :param event_id: ID of the event to check
    :return: Tuple (event object, None) if success, or (None, response) if failure
    """

    event = PublicEvent.get_evt_by_id(event_id)
    if not event:
        return None, jsonify({'message': 'Event not found'}), 404
    
    group = Group.get_grp_by_id(event.group_id)

    # TODO: replace with the function that get account cookie
    current_user_id = get_current_user_id()
    if group.admin_id != current_user_id:
        return None, jsonify({'message': 'Access denied: You are not the group administrator of this event'}), 403

    return event, None


def convertDateType(date_str):
    try:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        raise ValueError('Invalid date format. Use YYYY-MM-DD.')
    return date


def convertTimeType(time_str):
    try:
        time = datetime.strptime(time_str, '%H:%M').time()
    except ValueError:
        raise ValueError('Invalid time format. Use HH:MM.')
    return time


@bp.route('/create', methods = ['POST'])
def createEvent():

    group_id = request.form.get("group_id")
    event_name = request.form.get("event_name")
    start_date_str = request.form.get("start_date") # TODO: design front-end input placeholder
    end_date_str = request.form.get("end_date")
    start_time_str = request.form.get("start_time") # TODO: design front-end input placeholder
    end_time_str = request.form.get("end_time")
    is_all_day = request.form.get("is_all_day") == 'true' # TODO: design front-end input options

    group, error_message = groupAdminError(group_id)
    if error_message:
        return error_message
    
    try:
        start_date = convertDateType(start_date_str)
        end_date = convertDateType(end_date_str)
        start_time = convertTimeType(start_time_str)
        end_time = convertTimeType(end_time_str)
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

    event = PublicEvent(
        event_name=event_name,
        group_id=group_id,
        start_date=start_date,
        end_date=end_date,
        start_time=start_time,
        end_time=end_time,
        is_all_day=is_all_day
    )

    try:
        event.save()
        return index()
    except Exception as e:
        return jsonify({'message': 'Failed to create event', 'error': str(e)}), 500


@bp.route('/edit/<int:event_id>', methods = ['PUT'])
def editEvent(event_id):

    event, error_message = eventAdminError(event_id)
    if error_message:
        return error_message
    
    new_event_name = request.form.get("new_event_name")
    new_start_date_str = request.form.get("start_date")
    new_end_date_str = request.form.get("end_date")
    new_start_time_str = request.form.get("start_time")
    new_end_time_str = request.form.get("end_time")
    new_is_all_day = request.form.get("is_all_day")

    event.event_name = new_event_name if new_event_name else event.event_name
    event.is_all_day = (new_is_all_day  == 'true') if new_is_all_day else event.is_all_day

    try:
        if new_start_date_str:
            event.start_date = convertDateType(new_start_date_str)
        if new_end_date_str:
            event.end_date = convertDateType(new_end_date_str)
        if new_start_time_str:
            event.start_time = convertTimeType(new_start_time_str)
        if new_end_time_str:
            event.end_time = convertTimeType(new_end_time_str)

    except ValueError as e:
        return jsonify({'message': str(e)}), 400

    try:
        event.save()
        return jsonify({'message': 'Event updated successfully', 'event': event.to_dict()}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to update event', 'error': str(e)}), 500

@bp.route('/remove/<int:event_id>', methods=['DELETE'])
def removeEvent(event_id):

    event, error_message = eventAdminError(event_id)
    if error_message:
        return error_message

    try:
        event.delete()
        return jsonify({'message': 'Event removed successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to remove event', 'error': str(e)}), 500