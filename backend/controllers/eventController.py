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
    return create_event(account_id)

# Create Event
@bp.route('/createEvent', methods=['POST'])
@is_logged_in
def create_event_for_self():
    return create_event(session.get('user'))


def create_event(id):
    try:
        data = request.json
        account_id = id
        frequency = data.get('frequency')
        repeat_until_str = data.get('repeat_until')
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%dT%H:%M')
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%dT%H:%M')
        repeat_until = datetime.strptime(repeat_until_str, '%Y-%m-%dT%H:%M') if repeat_until_str else None

        # Save the new event first to get its event_id
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

        # Set series_id to the event_id of the original event
        new_event.series_id = new_event.event_id
        new_event.update()

        if new_event.start_date.date() == datetime.now().date():
            new_event.create_or_update_notification(account_id)

        if frequency and repeat_until:
            current_start = start_date
            current_end = end_date

            while True:
                # Generate next occurrence based on frequency
                if frequency == 'Every Day':
                    current_start += timedelta(days=1)
                    current_end += timedelta(days=1)
                elif frequency == 'Once a Week':
                    current_start += timedelta(weeks=1)
                    current_end += timedelta(weeks=1)
                elif frequency == 'Twice a Week':
                    # Schedule events every 3 days
                    current_start += timedelta(days=3)
                    current_end += timedelta(days=3)
                else:
                    # Unsupported frequency
                    break

                if current_start > repeat_until:
                    break

                # Create new event occurrence
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
                    series_id=new_event.series_id  # Set series_id to original event's event_id
                )
                occurrence.save()

                if occurrence.start_date.date() == datetime.now().date():
                    occurrence.create_or_update_notification(account_id)

        return jsonify({'message': 'Event created successfully', 'event': new_event.to_dict()}), 201
    except Exception as e:
        logger.error(f"Error in create_event: {e}")
        return jsonify({'error': 'Failed to create event.'}), 500

# Delete Event
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
        # Deleting original event of a series, delete all occurrences
        occurrences = Event.get_occurrences_by_series_id(event.series_id)
        for occ in occurrences:
            occ.delete_notifications(account_id)
            occ.delete()
    else:
        # Deleting an individual occurrence
        event.delete_notifications(account_id)
        event.delete()
    return jsonify({'message': 'Event deleted successfully'}), 200

# Fetch Event by ID
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

# Fetch Events by Account ID
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
        # Include all events
        events = Event.get_events_by_account(account_id)
    else:
        # Only events from today onwards
        today = datetime.now().date() - timedelta(days=1)
        events = Event.get_future_events_by_account(account_id, today)

    events_list = [event.to_dict() for event in events]
    return jsonify({'events': events_list}), 200

# Category Endpoints

# Get all categories
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

# Create category
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

    # Check if category already exists
    existing_category = EventCategory.get_category(category_name)
    if existing_category:
        return jsonify({'message': 'Category already exists'}), 200

    category = EventCategory(category_name=category_name)
    category.save()
    return jsonify({'message': 'Category created successfully'}), 201

# Clean unused categories
@bp.route('/category/clean', methods=['DELETE'])
@is_logged_in
def clean_unused_categories():
    """
    Delete all unused event categories.
    :return: JSON response with success message
    """
    try:
        # Get all categories
        categories = EventCategory.all()
        # Get all categories used in events
        used_categories = set(event.category for event in Event.all() if event.category)
        # Find unused categories
        unused_categories = [category for category in categories if category.category_name not in used_categories]
        # Delete unused categories
        for category in unused_categories:
            category.delete()
        return jsonify({'message': 'Unused categories deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to clean categories', 'error': str(e)}), 500

# Update Event
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

        # Check if event is part of a series
        if event.series_id and event.event_id != event.series_id:
            # Not allowed to update individual occurrences except for deletion
            return jsonify({'message': 'Cannot update individual occurrences of a recurring event. Please update the original event.'}), 400

        # Update the original event
        # Update event fields
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

        # Save changes to the original event
        event.update()

        # Delete existing occurrences
        occurrences = Event.get_occurrences_by_series_id(event.series_id, exclude_event_id=event.event_id)
        for occ in occurrences:
            occ.delete_notifications(account_id)
            occ.delete()

        # Recreate occurrences based on updated frequency and repeat_until
        if event.frequency and event.repeat_until:
            current_start = event.start_date
            current_end = event.end_date

            while True:
                # Generate next occurrence based on frequency
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
                    # Unsupported frequency
                    break

                if current_start > event.repeat_until:
                    break

                # Create new event occurrence
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
        # If the updated event is happening today
        if event.start_date.date() == now:
            event.create_or_update_notification(account_id)
        else:
            # If the event is not happening today, delete any existing notifications for this event
            event.delete_notifications(account_id)

        return jsonify({'message': 'Event updated successfully', 'event': event.to_dict()}), 200
    except Exception as e:
        logger.error(f"Error in update_event: {e}")
        return jsonify({'error': 'Failed to update event.'}), 500
