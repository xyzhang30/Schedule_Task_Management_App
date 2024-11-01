from flask import Blueprint, request, jsonify, session
from ..models.event import Event, EventCategory
from datetime import datetime
import logging
from ..decorators import is_logged_in
logging.basicConfig(level=logging.DEBUG)

bp = Blueprint('event', __name__, url_prefix='/event')

# Create Event
@bp.route('/createEvent', methods=['POST'])
@is_logged_in
def create_event():
    data = request.json
    logging.debug(f"Incoming data: {data}")
    account_id = session.get('user')  
    new_event = Event(
        account_id=account_id,
        name=data['name'],
        location=data.get('location'),
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%dT%H:%M'),
        end_date=datetime.strptime(data['end_date'], '%Y-%m-%dT%H:%M'),
        category=data.get('category'),
        label_text=data.get('label_text'),
        label_color=data.get('label_color')
    )
    new_event.save()
    return jsonify({'message': 'Event created successfully', 'event': new_event.to_dict()}), 201

# Update Event
@bp.route('/updateEvent/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    account_id = session.get('user')  # Replace with actual account ID retrieval logic
    if not account_id:
        return jsonify({'message': 'User not logged in'}), 401
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
    event.update()

    return jsonify({'message': 'Event updated successfully', 'event': event.to_dict()}), 200

# Delete Event
@bp.route('/deleteEvent/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    account_id = session.get('user')  # Replace with actual account ID retrieval logic
    if not account_id:
        return jsonify({'message': 'User not logged in'}), 401
    event = Event.get_event(event_id)
    if not event or event.account_id != account_id:
        return jsonify({'message': 'Event not found'}), 404

    event.delete()
    return jsonify({'message': 'Event deleted successfully'}), 200

# Fetch Event by ID
@bp.route('/getEvent/<int:event_id>', methods=['GET'])
def get_event(event_id):
    event = Event.get_event(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    return jsonify({'event': event.to_dict()}), 200

# Fetch Events by Account ID
@bp.route('/getEventsByAccount', methods=['GET'])
def get_events_by_account():
    account_id = session.get('user')  # Replace with actual account ID retrieval logic
    if not account_id:
        return jsonify({'message': 'User not logged in'}), 401
    events = Event.get_events_by_account(account_id)
    events_list = [event.to_dict() for event in events]
    return jsonify({'events': events_list}), 200

# Get all categories
@bp.route('/category/all', methods=['GET'])
def getAllCategory():
    categories = EventCategory.all()
    categories_list = [a.to_dict() for a in categories]
    return jsonify(categories_list)

# Create category
@bp.route('/category/create', methods=['POST'])
def createCategory():
    data = request.json
    category_name = data.get("category_name")
    if not category_name:
        return jsonify({'message': 'Category name is required'}), 400

    category = EventCategory(category_name=category_name)
    category.save()
    return jsonify({'message': 'Category created successfully'}), 201