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
    try:
        account_id = session['user']
        today = datetime.now().date()
        print("start")

        #Get all tasks due today
        tasks_due_today = db_session.query(Task).filter(
            Task.account_id == account_id,
            func.date(Task.due_time) == today,
            Task.complete == False
        ).all()

        #Create notifications for tasks if they don't exist now
        for task in tasks_due_today:
            existing_notification = db_session.query(Notifications).filter_by(
                account_id_to=account_id,
                notification_type='Task Due Today',
                task_id=task.task_id 
            ).first()

            if not existing_notification:
                print("not exist")
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
                print("created")
                notification.save_notification()
                print("saved")

        notifications = db_session.query(Notifications).filter_by(
            account_id_to=account_id,
            notification_type='Task Due Today',
            is_pending=True
        ).order_by(Notifications.created_at.desc()).all()

        notifications_list = [n.to_dict() for n in notifications]
        print("returned")
        return jsonify(notifications_list), 200
    except Exception as e:
        logger.error(f"Error in get_task_notifications: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to get task notifications.'}), 500


@bp.route('/delete-task-notification', methods=['POST'])
@is_logged_in
def delete_task_notification():
    try:
        data = request.get_json()
        notification_id = data.get('notification_id')
        notification = db_session.query(Notifications).filter_by(notification_id=notification_id).first()

        if notification and notification.account_id_to == session['user']:
            notification.update_pending_status()
            return jsonify({'message': 'Task notification deleted successfully'}), 200
        else:
            return jsonify({'error': 'Notification not found or access denied'}), 404
    except Exception as e:
        logger.error(f"Error in delete_task_notification: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to delete task notification.'}), 500
    