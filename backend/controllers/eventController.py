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

bp = Blueprint('event', __name__, url_prefix='/event')

# Create Event
@bp.route('/createEvent', methods=['POST'])
@is_logged_in
def create_event():
    try:
        data = request.json
        account_id = session.get('user')
        new_event = Event(
            account_id=account_id,
            name=data['name'],
            location=data.get('location'),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%dT%H:%M'),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%dT%H:%M'),
            category=data.get('category'),
            label_text=data.get('label_text'),
            label_color=data.get('label_color'),
            frequency=data.get('frequency'),
            repeat_until=datetime.strptime(data['repeat_until'], '%Y-%m-%dT%H:%M') if data.get('repeat_until') else None
        )
        new_event.save()

        # Create notification if the event is happening today
        new_event.create_notification_if_today(account_id)

        return jsonify({'message': 'Event created successfully', 'event': new_event.to_dict()}), 201
    except Exception as e:
        logger.error(f"Error in create_event: {e}")
        return jsonify({'error': 'Failed to create event.'}), 500

# Delete Event
@bp.route('/deleteEvent/<int:event_id>', methods=['DELETE'])
@is_logged_in
def delete_event(event_id):
    account_id = session.get('user')
    if not account_id:
        return jsonify({'message': 'User not logged in'}), 401
    event = Event.get_event(event_id)
    if not event or event.account_id != account_id:
        return jsonify({'message': 'Event not found'}), 404

    # Delete any notifications for this event
    event.delete_notifications(account_id)

    event.delete()
    return jsonify({'message': 'Event deleted successfully'}), 200

# Fetch Event by ID
@bp.route('/getEvent/<int:event_id>', methods=['GET'])
@is_logged_in
def get_event(event_id):
    event = Event.get_event(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    return jsonify({'event': event.to_dict()}), 200

# Fetch Events by Account ID
@bp.route('/getEventsByAccount', methods=['GET'])
@is_logged_in
def get_events_by_account():
    account_id = session.get('user')
    if not account_id:
        return jsonify({'message': 'User not logged in'}), 401
    events = Event.get_events_by_account(account_id)
    events_list = [event.to_dict() for event in events]
    return jsonify({'events': events_list}), 200

# Get all categories
@bp.route('/category/all', methods=['GET'])
@is_logged_in
def getAllCategory():
    categories = EventCategory.all()
    categories_list = [a.to_dict() for a in categories]
    return jsonify(categories_list)

# Create category
@bp.route('/category/create', methods=['POST'])
@is_logged_in
def createCategory():
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
    try:
        EventCategory.clean_unused()
        return jsonify({'message': 'Unused categories deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to clean categories', 'error': str(e)}), 500

def create_event_notifications():
    """Create notifications for events starting soon."""
    upcoming_events = Event.get_upcoming_events()
    for event in upcoming_events:
        event.create_notification_if_starting_soon()

# Update Event
@bp.route('/updateEvent/<int:event_id>', methods=['PUT'])
@is_logged_in
def update_event(event_id):
    try:
        account_id = session.get('user')
        event = Event.get_event(event_id)
        if not event:
            return jsonify({'message': 'Event not found'}), 404

        data = request.json
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

        # Handle notifications
        event.create_or_update_notification(account_id)

        return jsonify({'message': 'Event updated successfully', 'event': event.to_dict()}), 200
    except Exception as e:
        logger.error(f"Error in update_event: {e}")
        return jsonify({'error': 'Failed to update event.'}), 500
