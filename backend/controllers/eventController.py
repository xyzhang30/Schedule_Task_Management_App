from flask import Blueprint, request, jsonify, session
from ..models.event import Event, EventCategory
from ..models.notifications import Notifications
from datetime import datetime
import logging
from ..decorators import is_logged_in
from..db import db_session

logger = logging.getLogger(__name__)
handler = logging.FileHandler('event_controller.log')
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

logging.basicConfig(level=logging.DEBUG)

bp = Blueprint('event', __name__, url_prefix='/event')

# def schedule_event_notification(event):
#     """Schedule a notification for an event 15 minutes before it starts."""
#     def notify():
#         time_until_notification = (event.start_date - timedelta(minutes=15)) - datetime.now()
#         if time_until_notification.total_seconds() > 0:
#             sleep(time_until_notification.total_seconds())
#         notification = Notifications(
#             account_id_from=0,  # System notification
#             account_id_to=event.account_id,
#             notification_type='Event Reminder',
#             message=f"Your event '{event.name}' is starting in 15 minutes.",
#             is_pending=True,
#             created_at=datetime.now()
#         )
#         notification.save_notification()
#     Thread(target=notify).start()

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

        # If the event is happening today, create a notification
        if new_event.start_date.date() == datetime.now().date():
            notification = Notifications(
                account_id_from=session.get('user'),  
                account_id_to=account_id,
                notification_type='Event Today',
                message=f"Your event '{new_event.name}' is happening today at {new_event.start_date.strftime('%H:%M')}.",
                is_pending=True,
                created_at=datetime.now()
            )
            notification.save_notification()

        return jsonify({'message': 'Event created successfully', 'event': new_event.to_dict()}), 201
    except Exception as e:
        logger.error(f"Error in create_event: {e}")
        return jsonify({'error': 'Failed to create event.'}), 500

# # In update_event function
# @bp.route('/updateEvent/<int:event_id>', methods=['PUT'])
# @is_logged_in
# def update_event(event_id):
#     try:
#         account_id = session.get('user')
#         event = Event.get_event(event_id)
#         if not event:
#             return jsonify({'message': 'Event not found'}), 404

#         data = request.json
#         event.name = data.get('name', event.name)
#         event.location = data.get('location', event.location)
#         if 'start_date' in data:
#             event.start_date = datetime.strptime(data['start_date'], '%Y-%m-%dT%H:%M')
#         if 'end_date' in data:
#             event.end_date = datetime.strptime(data['end_date'], '%Y-%m-%dT%H:%M')
#         event.category = data.get('category', event.category)
#         event.label_text = data.get('label_text', event.label_text)
#         event.label_color = data.get('label_color', event.label_color)
#         event.frequency = data.get('frequency', event.frequency)
#         if 'repeat_until' in data:
#             event.repeat_until = datetime.strptime(data['repeat_until'], '%Y-%m-%dT%H:%M') if data.get('repeat_until') else None
#         event.update()

#         # Delete existing notifications for this event
#         existing_notifications = db_session.query(Notifications).filter_by(
#             account_id_to=account_id,
#             notification_type='Event Today',
#             event_id=event.event_id
#         ).all()

#         for notification in existing_notifications:
#             db_session.delete(notification)
#         db_session.commit()

#         return jsonify({'message': 'Event updated successfully', 'event': event.to_dict()}), 200
#     except Exception as e:
#         logger.error(f"Error in update_event: {e}")
#         return jsonify({'error': 'Failed to update event.'}), 500

@bp.route('/deleteEvent/<int:event_id>', methods=['DELETE'])
@is_logged_in
def delete_event(event_id):
    """Delete an event by event ID."""
    account_id = session.get('user')
    if not account_id:
        return jsonify({'message': 'User not logged in'}), 401
    event = Event.get_event(event_id)
    if not event or event.account_id != account_id:
        return jsonify({'message': 'Event not found'}), 404

    # Delete any notifications for this event
    existing_notifications = db_session.query(Notifications).filter_by(
        account_id_to=account_id,
        notification_type='Event Today',
        event_id=event_id
    ).all()

    for notification in existing_notifications:
        db_session.delete(notification)
    db_session.commit()

    event.delete()
    return jsonify({'message': 'Event deleted successfully'}), 200

# Fetch Event by ID
@bp.route('/getEvent/<int:event_id>', methods=['GET'])
@is_logged_in
def get_event(event_id):
    """Retrieve an event by its ID.
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
    """Retrieve all events for the logged-in user.
    :return: JSON response with list of events
    """
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
    """Retrieve all event categories.
    :return: JSON response with list of categories
    """
    categories = EventCategory.all()
    categories_list = [a.to_dict() for a in categories]
    return jsonify(categories_list)

# Create category
@bp.route('/category/create', methods=['POST'])
@is_logged_in
def createCategory():
    """Create a new event category.
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
    """Delete all unused event categories.
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
    
def create_event_notifications():
    """Create notifications for events starting soon."""
    now = datetime.now()
    upcoming_events = Event.get_upcoming_events()
    for event in upcoming_events:
        event_start = event.start_date
        time_diff = event_start - now
        if timedelta(minutes=0) <= time_diff <= timedelta(minutes=15):
            # Check if notification already exists
            existing_notification = Notifications.query.filter_by(
                account_id_to=event.account_id,
                notification_type='event',
                message=f"Event '{event.name}' is starting soon.",
                is_pending=True
            ).first()
            if not existing_notification:
                notification = Notifications(
                    account_id_from=session.get('user'),  
                    account_id_to=event.account_id,
                    notification_type='event',
                    message=f"Event '{event.name}' is starting soon.",
                    is_pending=True,
                    created_at=now
                )
                notification.save_notification()

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

        now = datetime.now().date()
        # If the updated event is happening today
        if event.start_date.date() == now:
            # Check if notification exists for this event
            existing_notification = db_session.query(Notifications).filter_by(
                account_id_to=account_id,
                notification_type='Event Today',
                event_id=event.event_id
            ).first()
            message = f"Your event '{event.name}' is happening today at {event.start_date.strftime('%H:%M')}."
            if existing_notification:
                # Update the notification message
                existing_notification.message = message
                existing_notification.created_at = datetime.now()
                existing_notification.is_pending = True
                existing_notification.save_notification()
            else:
                # Create a new notification
                notification = Notifications(
                    account_id_from=account_id,
                    account_id_to=account_id,
                    notification_type='Event Today',
                    message=message,
                    is_pending=True,
                    created_at=datetime.now(),
                    event_id=event.event_id
                )
                notification.save_notification()
        else:
            # If the event is not happening today, delete any existing notifications for this event
            existing_notifications = db_session.query(Notifications).filter_by(
                account_id_to=account_id,
                notification_type='Event Today',
                event_id=event.event_id
            ).all()
            for notif in existing_notifications:
                db_session.delete(notif)
            db_session.commit()

        return jsonify({'message': 'Event updated successfully', 'event': event.to_dict()}), 200
    except Exception as e:
        logger.error(f"Error in update_event: {e}")
        return jsonify({'error': 'Failed to update event.'}), 500
