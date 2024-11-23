from flask import Blueprint, jsonify, session
from ..models.event import Event
from datetime import datetime, timedelta
from ..decorators import is_logged_in

bp = Blueprint('event_inbox', __name__, url_prefix='/event_inbox')

@bp.route('/get_notifications', methods=['GET'])
@is_logged_in
def get_event_notifications():
    """Get event notifications for the logged-in user.
    :return: JSON response with list of notifications
    """
    account_id = session.get('user')
    now = datetime.now()
    upcoming_events = Event.get_events_by_account(account_id)

    notifications = []
    for event in upcoming_events:
        event_start = datetime.strptime(event.start_date, '%Y-%m-%dT%H:%M')
        time_diff = event_start - now
        if timedelta(minutes=0) <= time_diff <= timedelta(minutes=15):
            notification = {
                'event_id': event.event_id,
                'title': event.name,
                'start_date': event.start_date,
                'location': event.location,
                'created_at': now.strftime('%Y-%m-%dT%H:%M'),
            }
            notifications.append(notification)

    # Sort notifications by date
    notifications.sort(key=lambda x: x['start_date'])

    return jsonify({'notifications': notifications}), 200

@bp.route('/delete_notification/<int:event_id>', methods=['DELETE'])
@is_logged_in
def delete_notification(event_id):
    """Delete a notification for an event.
    :param event_id: ID of the event notification to delete
    :return: JSON response with success message
    """
    # Since notifications are generated on the fly, implement logic if stored
    return jsonify({'message': 'Notification deleted successfully'}), 200
