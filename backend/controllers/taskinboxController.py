from flask import Blueprint, jsonify, session, request
from sqlalchemy.sql import func
from datetime import datetime
from ..models.notifications import Notifications
from ..models.task import Task
from ..decorators import is_logged_in
from ..db import db_session
import logging
import traceback

bp = Blueprint('task_inbox', __name__, url_prefix='/task_inbox')

logger = logging.getLogger(__name__)
handler = logging.FileHandler('task_inbox.log')
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

@bp.route('/get-task-notifications', methods=['GET'])
@is_logged_in
def get_task_notifications():
    '''
    Creates and gets task notifications for tasks that are due today
    '''
    try:
        account_id = session['user']
        today = datetime.now().date()

        #Gets all tasks due today
        tasks_due_today = Task.all_tasks_by_due_date(account_id, today)

        #Creates notifications for tasks if not already exist
        for task in tasks_due_today:
            existing_notification = Notifications.get_existing_task_messages(account_id, task.task_id)
            
            if not existing_notification:
                message = f"Your task '{task.task_name}' is due today at {task.due_time.strftime('%H:%M')}."
                notification = Notifications(
                    account_id_from=account_id,
                    account_id_to=account_id,
                    notification_type='Task Due Today',
                    message=message,
                    is_pending=True,
                    created_at=datetime.now(),
                    task_id=task.task_id
                )
                notification.save_notification()

        notifications = Notifications.retrieve_task_notifications(account_id)

        notifications_list = [n.to_dict() for n in notifications]
        return jsonify(notifications_list), 200
    except Exception as e:
        logger.error(f"Error in get_task_notifications: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to get task notifications.'}), 500


@bp.route('/delete-task-notification', methods=['POST'])
@is_logged_in
def delete_task_notification():
    '''
    Deletes a task notification
    '''
    try:
        data = request.get_json()
        notification_id = data.get('notification_id')
        notification = Notifications.get_notification_by_notification_id(notification_id)

        if notification and notification.account_id_to == session['user']:
            notification.update_pending_status()
            return jsonify({'message': 'Task notification deleted successfully'}), 200
        else:
            return jsonify({'error': 'Notification not found or access denied'}), 404
    except Exception as e:
        logger.error(f"Error in delete_task_notification: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to delete task notification.'}), 500