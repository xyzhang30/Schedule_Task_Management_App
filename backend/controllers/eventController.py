from flask import Blueprint, request, jsonify, session
from ..models.event import Event, EventCategory
from ..models.notifications import Notifications
from datetime import datetime, timedelta
import logging
from ..decorators import is_logged_in

logger = logging.getLogger(__name__)
handler = logging.FileHandler('event_controller.log')
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

logging.basicConfig(level=logging.DEBUG)

bp = Blueprint('event', __name__, url_prefix='/event')

@bp.route('/createEventNotSelf/<int:account_id>', methods=['POST'])
@is_logged_in 
def create_event_for_other(account_id):
    """
    Create an event for another user.
    :param account_id: ID of the account for which the event is created
    :return: JSON response with success message or error
    """
    return create_event(account_id)


@bp.route('/createEvent', methods=['POST'])
@is_logged_in
def create_event_for_self():
    """
    Create an event for the logged-in user.
    :return: JSON response with success message or error
    """
    return create_event(session.get('user'))


def create_event(id):
    """
    Create an event with the provided account ID and event details.
    :param id: Account ID for which the event is created
    :return: JSON response with event details or error message
    """
    try:
        data = request.json
        account_id = id
        frequency = data.get('frequency')
        repeat_until_str = data.get('repeat_until')
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%dT%H:%M')
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%dT%H:%M')
        repeat_until = datetime.strptime(repeat_until_str, '%Y-%m-%dT%H:%M') if repeat_until_str else None

        new_event = Event(
            account_id=account_id,
            name=data['name'],
            location=data.get('location'),
            start_date=start_date,
            end_date=end_date,
            category=data.get('category'),
            label_text=data.get('label_text'),
            label_color=data.get('label_color'),
            frequency=frequency,
            repeat_until=repeat_until
        )
        new_event.save()

        
        new_event.series_id = new_event.event_id
        new_event.update()

        if new_event.start_date.date() == datetime.now().date():
            new_event.create_or_update_notification(account_id)

        if frequency and repeat_until:
            current_start = start_date
            current_end = end_date

            while True:
                
                if frequency == 'Every Day':
                    current_start += timedelta(days=1)
                    current_end += timedelta(days=1)
                elif frequency == 'Once a Week':
                    current_start += timedelta(weeks=1)
                    current_end += timedelta(weeks=1)
                elif frequency == 'Twice a Week':
                    
                    current_start += timedelta(days=3)
                    current_end += timedelta(days=3)
                else:
                    
                    break

                if current_start > repeat_until:
                    break

                occurrence = Event(
                    account_id=account_id,
                    name=data['name'],
                    location=data.get('location'),
                    start_date=current_start,
                    end_date=current_end,
                    category=data.get('category'),
                    label_text=data.get('label_text'),
                    label_color=data.get('label_color'),
                    frequency=frequency,
                    repeat_until=repeat_until,
                    series_id=new_event.series_id  
                )
                occurrence.save()

                if occurrence.start_date.date() == datetime.now().date():
                    occurrence.create_or_update_notification(account_id)

        return jsonify({'message': 'Event created successfully', 'event': new_event.to_dict()}), 201
    except Exception as e:
        logger.error(f"Error in create_event: {e}")
        return jsonify({'error': 'Failed to create event.'}), 500


@bp.route('/deleteEvent/<int:event_id>', methods=['DELETE'])
@is_logged_in
def delete_event(event_id):
    '''
    Delete an event by event ID.
    '''
    account_id = session.get('user')
    if not account_id:
        return jsonify({'message': 'User not logged in'}), 401
    event = Event.get_event(event_id)
    if not event or event.account_id != account_id:
        return jsonify({'message': 'Event not found'}), 404
    
    if event.series_id and event.event_id == event.series_id:
        occurrences = Event.get_occurrences_by_series_id(event.series_id)
        for occ in occurrences:
            occ.delete_notifications(account_id)
            occ.delete()
    else:
        event.delete_notifications(account_id)
        event.delete()
    return jsonify({'message': 'Event deleted successfully'}), 200


@bp.route('/getEvent/<int:event_id>', methods=['GET'])
@is_logged_in
def get_event(event_id):
    """
    Retrieve an event by its ID.
    :param event_id: ID of the event to retrieve
    :return: JSON response with event data
    """
    event = Event.get_event(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    return jsonify({'event': event.to_dict()}), 200


@bp.route('/getEventsByAccount', methods=['GET'])
@is_logged_in
def get_events_by_account():
    """
    Retrieve all events for the logged-in user.
    :return: JSON response with list of events
    """
    account_id = session.get('user')

    if not account_id:
        return jsonify({'message': 'User not logged in'}), 401
    include_past = request.args.get('include_past', 'false').lower() == 'true'

    if include_past:
        events = Event.get_events_by_account(account_id)
    else:
        today = datetime.now().date() - timedelta(days=1)

        events = Event.get_future_events_by_account(account_id, today)

    events_list = [event.to_dict() for event in events]
    return jsonify({'events': events_list}), 200


@bp.route('/category/all', methods=['GET'])
@is_logged_in
def getAllCategory():
    """
    Retrieve all event categories.
    :return: JSON response with list of categories
    """
    categories = EventCategory.all()
    categories_list = [a.to_dict() for a in categories]
    return jsonify(categories_list)

@bp.route('/category/create', methods=['POST'])
@is_logged_in
def createCategory():
    """
    Create a new event category.
    :return: JSON response with success message
    """
    data = request.json
    category_name = data.get("category_name")
    if not category_name:
        return jsonify({'message': 'Category name is required'}), 400

    existing_category = EventCategory.get_category(category_name)
    if existing_category:
        return jsonify({'message': 'Category already exists'}), 200

    category = EventCategory(category_name=category_name)
    category.save()
    return jsonify({'message': 'Category created successfully'}), 201

@bp.route('/category/clean', methods=['DELETE'])
@is_logged_in
def clean_unused_categories():
    """
    Delete all unused event categories.
    :return: JSON response with success message
    """
    try:
        
        categories = EventCategory.all()
        
        used_categories = set(event.category for event in Event.all() if event.category)
        
        unused_categories = [category for category in categories if category.category_name not in used_categories]
        
        for category in unused_categories:
            category.delete()
        return jsonify({'message': 'Unused categories deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to clean categories', 'error': str(e)}), 500

@bp.route('/updateEvent/<int:event_id>', methods=['PUT'])
@is_logged_in
def update_event(event_id):
    '''
    update the event with the given event id 
    param: event_id
    '''
    try:
        account_id = session.get('user')
        event = Event.get_event(event_id)
        if not event:
            return jsonify({'message': 'Event not found'}), 404
        if event.account_id != account_id:
            return jsonify({'message': 'Unauthorized'}), 403

        data = request.json

        
        if event.series_id and event.event_id != event.series_id:
            return jsonify({'message': 'Cannot update individual occurrences of a recurring event. Please update the original event.'}), 400
        event.name = data.get('name', event.name)
        event.location = data.get('location', event.location)
        if 'start_date' in data:
            event.start_date = datetime.strptime(data['start_date'], '%Y-%m-%dT%H:%M')
        if 'end_date' in data:
            event.end_date = datetime.strptime(data['end_date'], '%Y-%m-%dT%H:%M')
        event.category = data.get('category', event.category)
        event.label_text = data.get('label_text', event.label_text)
        event.label_color = data.get('label_color', event.label_color)
        event.frequency = data.get('frequency', event.frequency)
        if 'repeat_until' in data:
            event.repeat_until = datetime.strptime(
                data['repeat_until'], '%Y-%m-%dT%H:%M') if data.get('repeat_until') else None

        event.update()

        occurrences = Event.get_occurrences_by_series_id(event.series_id, exclude_event_id=event.event_id)
        for occ in occurrences:
            occ.delete_notifications(account_id)
            occ.delete()

        if event.frequency and event.repeat_until:
            current_start = event.start_date
            current_end = event.end_date

            while True:
                
                if event.frequency == 'Every Day':
                    current_start += timedelta(days=1)
                    current_end += timedelta(days=1)
                elif event.frequency == 'Once a Week':
                    current_start += timedelta(weeks=1)
                    current_end += timedelta(weeks=1)
                elif event.frequency == 'Twice a Week':
                    current_start += timedelta(days=3)
                    current_end += timedelta(days=3)
                else:
                    
                    break

                if current_start > event.repeat_until:
                    break

                occurrence = Event(
                    account_id=account_id,
                    name=event.name,
                    location=event.location,
                    start_date=current_start,
                    end_date=current_end,
                    category=event.category,
                    label_text=event.label_text,
                    label_color=event.label_color,
                    frequency=event.frequency,
                    repeat_until=event.repeat_until,
                    series_id=event.series_id
                )
                occurrence.save()

        now = datetime.now().date()
        
        if event.start_date.date() == now:
            event.create_or_update_notification(account_id)
        else:
          
            event.delete_notifications(account_id)

        return jsonify({'message': 'Event updated successfully', 'event': event.to_dict()}), 200
    except Exception as e:
        logger.error(f"Error in update_event: {e}")
        return jsonify({'error': 'Failed to update event.'}), 500
