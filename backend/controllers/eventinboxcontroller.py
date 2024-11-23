# eventinboxcontroller.py

from flask import Blueprint, jsonify, session
from datetime import datetime
from ..models.notifications import Notifications
from ..decorators import is_logged_in

bp = Blueprint('event_inbox', __name__, url_prefix='/event_inbox')

@bp.route('/get_notifications', methods=['GET'])
@is_logged_in
def get_notifications():
    """Retrieve all pending notifications for the logged-in user."""
    account_id = session.get('user')
    now = datetime.now()

    # Fetch pending notifications where created_at <= now
    notifications = Notifications.get_messages_for_id(account_id)
    notifications_due = [n for n in notifications if n.created_at <= now]
    notifications_list = []
    for n in notifications_due:
        n_dict = n.to_dict()
        n_dict['created_at'] = n.created_at.strftime('%Y-%m-%dT%H:%M:%S') if n.created_at else None
        notifications_list.append(n_dict)

    # Sort notifications by created_at descending
    notifications_list.sort(key=lambda x: x['created_at'], reverse=True)

    return jsonify({'notifications': notifications_list}), 200

@bp.route('/delete_notification/<int:notification_id>', methods=['DELETE'])
@is_logged_in
def delete_notification(notification_id):
    """Mark a notification as read (not pending)."""
    account_id = session.get('user')
    notification = Notifications.get_notification_by_notification_id(notification_id)
    if not notification or notification.account_id_to != account_id:
        return jsonify({'error': 'Notification not found or unauthorized'}), 404
    notification.update_pending_status()
    return jsonify({'message': 'Notification marked as read'}), 200
