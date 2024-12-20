from flask import Blueprint, jsonify, session, request
from datetime import datetime,timedelta
from ..models.notifications import Notifications
from ..models.event import Event
from ..decorators import is_logged_in
import logging
import traceback
from ..db import db_session

bp = Blueprint('event_inbox', __name__, url_prefix='/event_inbox')


logger = logging.getLogger(__name__)
handler = logging.FileHandler('event_inbox.log')
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

@bp.route('/get-notifications', methods=['GET'])
@is_logged_in
def get_event_notifications():
    """
    Retrieve event notifications for the currently logged-in user. 
    This will check if any event is happening today, and if no notification exists,
    it will create one.
    
    :return: JSON response with a list of event notifications or an error message.
    :raises: HTTPError if the process fails.
    """
    try:
        account_id = session['user']
        now = datetime.now().date() - timedelta(days=1)

        events_today = Event.get_events_happening_today(account_id, now)

        for event in events_today:
            
            existing_notification = Notifications.get_existing_messages(account_id, event.event_id)

            if not existing_notification:
                message = f"Your event '{event.name}' is happening today at {event.start_date.strftime('%H:%M')}."
                
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

       
        notifications = Notifications.retrieve_event_notifications(account_id)

        notifications_list = [n.to_dict() for n in notifications]
        return jsonify(notifications_list), 200
    except Exception as e:
        logger.error(f"Error in get_event_notifications: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to get event notifications.'}), 500

@bp.route('/delete-notification', methods=['POST'])
@is_logged_in
def delete_event_notification():
    """
    Delete an event notification for the currently logged-in user. 
    The notification is identified by its notification ID.

    :return: JSON response with success or error message.
    :raises: HTTPError if the process fails or if access is denied.
    """
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