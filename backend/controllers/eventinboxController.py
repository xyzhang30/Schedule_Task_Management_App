from flask import Blueprint, jsonify, session, request
from datetime import datetime
from ..models.notifications import Notifications
from ..models.event import Event
from ..decorators import is_logged_in
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

        #get events happening today
        events_today = Event.get_events_happening_today(account_id, now)
        print("________events today: ", events_today)

        for event in events_today:
            # check if notification already exists for this event
            existing_notification = Notifications.get_existing_messages(account_id, event.event_id)

            message = f"Your event '{event.name}' is happening today at {event.start_date.strftime('%H:%M')}."
            if not existing_notification:
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
                # Update existing notification message if event has been updated
                existing_notification.message = message
                existing_notification.created_at = datetime.now()
                existing_notification.is_pending = True
                existing_notification.save_notification()

        # Retrieve event notifications and join with Event to get start_date
        notifications = Notifications.get_notifications_for_events(account_id, now)

        # Prepare notifications list including event start_date
        notifications_list = []
        for n in notifications:
            notification_dict = n.to_dict()
            notification_dict['event_start_date'] = n.event.start_date.strftime('%Y-%m-%dT%H:%M')
            notifications_list.append(notification_dict)

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
        notification = Notifications.get_notification_by_notification_id(notification_id)
        if notification and notification.account_id_to == session['user']:
            notification.update_pending_status()
            return jsonify({'message': 'Notification deleted successfully'}), 200
        else:
            return jsonify({'error': 'Notification not found or access denied'}), 404
    except Exception as e:
        logger.error(f"Error in delete_event_notification: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to delete event notification.'}), 500