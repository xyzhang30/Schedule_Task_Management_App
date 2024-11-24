from flask import Blueprint, jsonify, session, request
from datetime import datetime
from ..models.notifications import Notifications
from ..models.event import Event
from ..decorators import is_logged_in
from ..db import db_session
import logging
import traceback

bp = Blueprint('event_inbox', __name__, url_prefix='/event_inbox')

# Set up logging
logger = logging.getLogger(__name__)
handler = logging.FileHandler('event_inbox.log')
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

@bp.route('/get-notifications', methods=['GET'])
@is_logged_in
def get_event_notifications():
    try:
        account_id = session['user']
        now = datetime.now().date()

        events_today = db_session.query(Event).filter(
            Event.account_id == account_id,
            Event.start_date >= datetime.combine(now, datetime.min.time()),
            Event.start_date <= datetime.combine(now, datetime.max.time())
        ).all()

        for event in events_today:
            # Check if notification already exists for this event (regardless of is_pending status)
            existing_notification = db_session.query(Notifications).filter_by(
                account_id_to=account_id,
                notification_type='Event Today',
                event_id=event.event_id
            ).first()

            if not existing_notification:
                message = f"Your event '{event.name}' is happening today at {event.start_date.strftime('%H:%M')}."
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

        # Retrieve event notifications
        notifications = db_session.query(Notifications).filter_by(
            account_id_to=account_id,
            notification_type='Event Today',
            is_pending=True
        ).order_by(Notifications.created_at.desc()).all()

        notifications_list = [n.to_dict() for n in notifications]
        return jsonify(notifications_list), 200
    except Exception as e:
        logger.error(f"Error in get_event_notifications: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to get event notifications.'}), 500

@bp.route('/delete-notification', methods=['POST'])
@is_logged_in
def delete_event_notification():
    try:
        data = request.get_json()
        notification_id = data.get('notification_id')
        notification = db_session.query(Notifications).filter_by(notification_id=notification_id).first()
        if notification and notification.account_id_to == session['user']:
            notification.update_pending_status()
            return jsonify({'message': 'Notification deleted successfully'}), 200
        else:
            return jsonify({'error': 'Notification not found or access denied'}), 404
    except Exception as e:
        logger.error(f"Error in delete_event_notification: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to delete event notification.'}), 500
