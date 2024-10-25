# eventController.py
from flask import Blueprint, request, jsonify
from ..models.event import Event
from datetime import datetime
import logging
logging.basicConfig(level=logging.DEBUG)

bp = Blueprint('event', __name__, url_prefix='/event')

# Create Event
@bp.route('/createEvent', methods=['POST'])
def create_event():
    data = request.json
    logging.debug(f"Incoming data: {data}")
    new_event = Event(
        account_id=int(data['account_id']),
        name=data['name'],
        location=data.get('location'),
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%dT%H:%M'),
        end_date=datetime.strptime(data['end_date'], '%Y-%m-%dT%H:%M'),
        category=data.get('category')
        # label_text=data.get('label_text'),
        # label_color=data.get('label_color'),
    )
    new_event.save()
    return jsonify({'message': 'Event created successfully', 'event': new_event.to_dict()}), 201

# Update Event
@bp.route('/updateEvent/<int:event_id>', methods=['PUT'])
def update_event(event_id):
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
    # event.label_text = data.get('label_text', event.label_text)
    # event.label_color = data.get('label_color', event.label_color)
    event.update()

    return jsonify({'message': 'Event updated successfully', 'event': event.to_dict()}), 200

# Delete Event
@bp.route('/deleteEvent/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    event = Event.get_event(event_id)
    if not event:
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
@bp.route('/getEventsByAccount/<int:account_id>', methods=['GET'])
def get_events_by_account(account_id):
    events = Event.get_events_by_account(account_id)
    events_list = [event.to_dict() for event in events]
    return jsonify({'events': events_list}), 200