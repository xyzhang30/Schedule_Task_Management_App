from flask import Blueprint, jsonify, session
from flask import request
from ..models.task import Task, Category
from ..models.event import Event
from ..models.notifications import Notifications
from ..decorators import is_logged_in
from datetime import datetime, date

bp = Blueprint('task', __name__, url_prefix='/task')


@bp.route('/all', methods = ['GET'])
@is_logged_in
def index():
    '''
    Gets a list of all tasks of all users
    '''
    tasks = Task.all()
    tasks_list = [a.to_dict() for a in tasks]
    return jsonify(tasks_list)


@bp.route('/', methods = ['GET'])
@is_logged_in
def get_tasks():
    '''
    Gets a list of all tasks by account_id
    '''
    account_id = session['user']
    tasks = Task.get_by_account(account_id)
    tasks_list = [a.to_dict() for a in tasks]
    return jsonify(tasks_list)


@bp.route('/sorted', methods=['GET'])
@is_logged_in
def get_tasks_grouped_by_date():
    '''
    Gets a dictionary of all tasks by dates for a given account_id
    key: date
    value: a list of tasks, sorted first by completed and uncompleted, then by due_time
    '''
    account_id = session['user']
    map = Task.get_tasks_by_account_dic(account_id)
    today = datetime.today().date()
    
    tasks_dict = {}
    for date, tasks in map.items():
        filtered_tasks = [
            task for task in tasks if not (task.complete and task.due_time.date() < today)
        ]
        print(filtered_tasks)
        uncompleted_tasks = [task for task in filtered_tasks if not task.complete]
        completed_tasks = [task for task in filtered_tasks if task.complete]
        uncompleted_tasks.sort(key=lambda task: task.due_time)
        completed_tasks.sort(key=lambda task: task.due_time)
        sorted_tasks = uncompleted_tasks + completed_tasks
        tasks_dict[str(date)] = [task.to_dict() for task in sorted_tasks]
    
    return jsonify(tasks_dict)


@bp.route('/date/<string:due_date>', methods = ['GET'])
@is_logged_in
def get_tasks_by_date(due_date):
    '''
    Gets a list of all tasks by account_id and due_date, sorted by due_time
    '''
    account_id = session['user']
    tasks = Task.get_by_date(account_id, due_date)
    tasks_list = [task.to_dict() for task in tasks]
    tasks_list.sort(key=lambda x: x['due_time'])
    return jsonify(tasks_list)


@bp.route('/category/<string:category>', methods=['GET'])
@is_logged_in
def get_tasks_by_category(category):
    '''
    Gets a list of all tasks by account_id and category
    '''
    account_id = session['user']
    tasks = Task.get_by_category(account_id, category)
    tasks_list = [task.to_dict() for task in tasks]
    return jsonify(tasks_list)


@bp.route('/id/<int:task_id>', methods = ['GET'])
@is_logged_in
def get_task_by_id(task_id):
    '''
    Gets a list of all information (attributes) of one task by task_id
    '''
    task = Task.get_task(task_id)
    if task:
        return jsonify(task.to_dict()) 
    else:
        return jsonify({'error': 'Task not found'}), 404


@bp.route('/create', methods = ['POST'])
@is_logged_in
def createTask():
    '''
    Adds a task
    '''
    task_name = request.form.get("task_name")
    category = request.form.get("category")
    due_time = request.form.get("due_time")
    account_id = session['user']
    event_id = request.form.get("event_id")

    if event_id == 'undefined' or event_id == '':
        event_id = None

    if not task_name or not due_time or not account_id:
        return jsonify({'error': 'Missing required fields'}), 400

    task = Task(
        task_name=task_name,
        category=category,
        due_time=due_time,
        account_id=account_id,
        event_id=event_id
    )

    task.save()
    return index()


@bp.route('/update/<int:task_id>', methods=['PUT'])
@is_logged_in
def update_task(task_id):
    '''
    Updates information of the task with task_id == task_id
    '''
    task = Task.get_task(task_id)

    if not task:
        return jsonify({"error": "Task not found."}), 404
    
    task_name = request.form.get("task_name")
    category = request.form.get("category")
    due_time = request.form.get("due_time")
    event_id = request.form.get("event_id")

    if task_name:
        task.task_name = task_name
    if category:
        task.category = category
    if due_time:
        task.due_time = due_time
    if event_id:
        task.event_id = event_id

    task.save() 
    return index()


@bp.route('/complete/<int:task_id>', methods = ['POST'])
@is_logged_in
def completeTask(task_id):
    '''
    Marks the task with task_id == task_id as completed
    '''
    task = Task.get_task(task_id)
    if task:
        task.complete_task()
        return jsonify({"message": "Task marked as complete."}), 200
    else:
        return jsonify({"error": "Task not found."}), 404


@bp.route('/cancel_complete/<int:task_id>', methods = ['POST'])
@is_logged_in
def cancelCompleteTask(task_id):
    '''
    Marks the task with task_id == task_id as uncompleted
    '''
    task = Task.get_task(task_id)
    if task:
        task.cancel_complete_task()
        return jsonify({"message": "Task not completed."}), 200
    else:
        return jsonify({"error": "Task not found."}), 404


@bp.route('/remove/<int:task_id>', methods = ['DELETE'])
@is_logged_in
def removeTask(task_id):
    '''
    Removes the task with task_id == task_id
    '''
    task = Task.get_task(task_id)
    if task:
        task.delete()
        return jsonify({"message": "Task removed successfully."}), 200
    return jsonify({"error": "Task not found."}), 404


@bp.route('/category/all', methods = ['GET'])
@is_logged_in
def getAllCategory():
    '''
    Gets a list of all categories by account_id
    '''
    account_id = session['user']
    categories = Category.all_per_user(account_id)
    categories_list = [a.to_dict() for a in categories]
    return jsonify(categories_list)


@bp.route('/category/create', methods = ['POST'])
@is_logged_in
def createCategory():
    '''
    Adds a category
    '''
    account_id = session['user']
    category_name = request.form.get("category_name")

    category = Category(
        account_id = account_id,
        category_name = category_name
    )

    category.save()
    return jsonify({"message": "Category created successfully!"}), 201


@bp.route('/get_event/<int:event_id>', methods=['GET'])
@is_logged_in
def get_event(event_id):
    '''
    Gets a list of all information (attributes) of one event by event_id
    '''
    event = Event.get_event(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404
    return jsonify({'event': event.to_dict()}), 200


@bp.route('/events', methods=['GET'])
@is_logged_in
def get_all_events():
    '''
    Gets a list of all events by account_id
    '''
    account_id = session['user']
    events = Event.get_events_by_account(account_id)
    if not events:
        return [], 200
    events_list = [event.to_dict() for event in events]
    return jsonify({'events': events_list}), 200


@bp.route('/update-task-notification/<int:task_id>', methods=['PUT'])
@is_logged_in
def update_task_notification(task_id):
    '''
    Updates the notification message for the task with task_id == task_id that is due today
    '''
    try:
        task = Task.get_task(task_id)
        if not task:
            return jsonify({"error": "Task not found."}), 404
        notification = Notifications.get_notifications_by_task(task_id)
        current_date = date.today()
        if task.due_time.date() != current_date:
            if notification:
                notification.delete_notification()
                return jsonify({"message": "Task notification deleted as the due time is not within today."}), 200
        else:
            if notification:
                notification.message = f"Your task '{task.task_name}' is due today at {task.due_time.strftime('%H:%M')}."
                notification.save_notification()
                return jsonify({"message": "Task notification updated", "notification": notification.to_dict()}), 200
        return jsonify({"message": "No notification to update or delete."}), 200

        # if not notification:
        #     return jsonify({"error": "Notification not found."}), 404
        # notification.message = f"Your task '{task.task_name}' is due today at {task.due_time.strftime('%H:%M')}."
        # notification.save_notification()
        # return jsonify({"message": "Task notification updated", "notification": notification.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": "Failed to update task notification."}), 500