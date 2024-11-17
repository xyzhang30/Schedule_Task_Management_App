from flask import Blueprint, jsonify, session
from flask import request
from ..models.task import Task, Category
from ..models.event import Event
from ..decorators import is_logged_in

bp = Blueprint('task', __name__, url_prefix='/task')

#get all tasks 
@bp.route('/all', methods = ['GET'])
@is_logged_in
def index():
    tasks = Task.all()
    tasks_list = [a.to_dict() for a in tasks]
    return jsonify(tasks_list)

#get all tasks by account_id
@bp.route('/', methods = ['GET'])
@is_logged_in
def get_tasks():
    account_id = session['user']
    tasks = Task.get_by_account(account_id)
    tasks_list = [a.to_dict() for a in tasks]
    return jsonify(tasks_list)

#get all tasks by account_id in forms of a (date, tasks) map/dictionary, where tasks are sorted by complete and due_time
@bp.route('/sorted', methods=['GET'])
@is_logged_in
def get_tasks_grouped_by_date():
    print("called")
    account_id = session['user']
    map = Task.get_tasks_by_account_dic(account_id)
    
    tasks_dict = {}
    for date, tasks in map.items():
        uncompleted_tasks = [task for task in tasks if not task.complete]
        completed_tasks = [task for task in tasks if task.complete]
        uncompleted_tasks.sort(key=lambda task: task.due_time)
        completed_tasks.sort(key=lambda task: task.due_time)
        sorted_tasks = uncompleted_tasks + completed_tasks
        print("sorted_tasks")
        print(sorted_tasks)
        tasks_dict[str(date)] = [task.to_dict() for task in sorted_tasks]
    
    return jsonify(tasks_dict)

#get all tasks by due dates for a user
@bp.route('/date/<string:due_date>', methods = ['GET'])
@is_logged_in
def get_tasks_by_date(due_date):
    account_id = session['user']
    tasks = Task.get_by_date(account_id, due_date)
    tasks_list = [task.to_dict() for task in tasks]
    tasks_list.sort(key=lambda x: x['due_time'])
    return jsonify(tasks_list)

#get all tasks by category for a user
@bp.route('/category/<string:category>', methods=['GET'])
@is_logged_in
def get_tasks_by_category(category):
    account_id = session['user']
    tasks = Task.get_by_category(account_id, category)
    tasks_list = [task.to_dict() for task in tasks]
    return jsonify(tasks_list)

#get one task info by id
@bp.route('/id/<int:task_id>', methods = ['GET'])
@is_logged_in
def get_task_by_id(task_id):
    task = Task.get_task(task_id)
    if task:
        return jsonify(task.to_dict()) 
    else:
        return jsonify({'error': 'Task not found'}), 404

#create a task
@bp.route('/create', methods = ['POST'])
@is_logged_in
def createTask():
    task_name = request.form.get("task_name")
    category = request.form.get("category")
    due_time = request.form.get("due_time")
    account_id = session['user']
    event_id = request.form.get("event_id")

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

#update a task
@bp.route('/update/<int:task_id>', methods=['PUT'])
@is_logged_in
def update_task(task_id):
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
    return jsonify({"message": "Task updated", "task": task.to_dict()}), 200

#complete a task 
@bp.route('/complete/<int:task_id>', methods = ['POST'])
@is_logged_in
def completeTask(task_id):
    task = Task.get_task(task_id)
    if task:
        task.complete_task()
        return jsonify({"message": "Task marked as complete."}), 200
    else:
        return jsonify({"error": "Task not found."}), 404
    

#cancel complete for a task
@bp.route('/cancel_complete/<int:task_id>', methods = ['POST'])
@is_logged_in
def cancelCompleteTask(task_id):
    task = Task.get_task(task_id)
    if task:
        task.cancel_complete_task()
        return jsonify({"message": "Task not completed."}), 200
    else:
        return jsonify({"error": "Task not found."}), 404


#delete a task
@bp.route('/remove/<int:task_id>', methods = ['DELETE'])
@is_logged_in
def removeTask(task_id):
    task = Task.get_task(task_id)
    if task:
        task.delete()
        return jsonify({"message": "Task removed successfully."}), 200
    return jsonify({"error": "Task not found."}), 404


#get all categories
@bp.route('/category/all', methods = ['GET'])
@is_logged_in
def getAllCategory():
    account_id = session['user']
    categories = Category.all_per_user(account_id)
    categories_list = [a.to_dict() for a in categories]
    return jsonify(categories_list)


#create category
@bp.route('/category/create', methods = ['POST'])
@is_logged_in
def createCategory():
    account_id = session['user']
    category_name = request.form.get("category_name")

    category = Category(
        account_id = account_id,
        category_name = category_name
    )

    category.save()
    return jsonify({"message": "Category created successfully!"}), 201


#get event by event_id
@bp.route('/get_event/<int:event_id>', methods=['GET'])
@is_logged_in
def get_event(event_id):
    event = Event.get_event(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404
    return jsonify({'event': event.to_dict()}), 200


#get all events
@bp.route('/events', methods=['GET'])
@is_logged_in
def get_all_events():
    account_id = session['user']
    events = Event.get_events_by_account(account_id)
    if not events:
        return jsonify({'message': 'No available events'}), 404
    events_list = [event.to_dict() for event in events]
    return jsonify({'events': events_list}), 200