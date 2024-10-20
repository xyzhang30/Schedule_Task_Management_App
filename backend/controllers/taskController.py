from flask import Blueprint, jsonify
from flask import request
from ..models.task import Task

bp = Blueprint('task', __name__, url_prefix='/task')

#get all tasks 
@bp.route('/', methods = ['GET'])
def index():
    tasks = Task.all()
    tasks_list = [a.to_dict() for a in tasks]
    return jsonify(tasks_list)

#get all tasks by account_id
@bp.route('/<int:account_id>', methods = ['GET'])
def get_tasks(account_id):
    tasks = Task.get_by_account(account_id)
    tasks_list = [a.to_dict() for a in tasks]
    return jsonify(tasks_list)

#get all tasks by account_id in forms of a (date, tasks) map/dictionary
@bp.route('/<int:account_id>/sorted', methods=['GET'])
def get_tasks_grouped_by_date(account_id):
    map = Task.get_tasks_by_account_dic(account_id)
    tasks_dict = {str(date): [task.to_dict() for task in tasks] for date, tasks in map.items()}
    return jsonify(tasks_dict)

#get all tasks by due dates for a user
@bp.route('/date/<int:account_id>/<string:due_date>', methods = ['GET'])
def get_tasks_by_date(account_id, due_date):
    tasks = Task.get_by_date(account_id, due_date)
    tasks_list = [task.to_dict() for task in tasks]
    tasks_list.sort(key=lambda x: x['due_time'])
    return jsonify(tasks_list)

#get all tasks by category for a user
@bp.route('/category/<int:account_id>/<string:category>', methods=['GET'])
def get_tasks_by_category(account_id, category):
    tasks = Task.get_by_category(account_id, category)
    tasks_list = [task.to_dict() for task in tasks]
    return jsonify(tasks_list)

#get one task info by id
@bp.route('/id/<int:task_id>', methods = ['GET'])
def get_task_by_id(task_id):
    task = Task.get_task(task_id)
    if task:
        return jsonify(task.to_dict()) 
    else:
        return jsonify({'error': 'Task not found'}), 404

#create a task
@bp.route('/create', methods = ['POST'])
def createTask():
    task_name = request.form.get("task_name")
    category = request.form.get("category")
    due_time = request.form.get("due_time")
    account_id = (int)(request.form.get("account_id"))

    if not task_name or not due_time or not account_id:
        print("missing info")
        return jsonify({'error': 'Missing required fields'}), 400

    task = Task(
        task_name=task_name,
        category=category,
        due_time=due_time,
        account_id=account_id
    )

    task.save()
    print("create succeeded")
    return index()

#update a task
@bp.route('/update/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.get_task(task_id)

    if not task:
        return jsonify({"error": "Task not found."}), 404
    
    task_name = request.form.get("task_name")
    category = request.form.get("category")
    due_time = request.form.get("due_time")

    if task_name:
        task.task_name = task_name
    if category:
        task.category = category
    if due_time:
        task.due_time = due_time

    task.save() 
    return jsonify({"message": "Task updated", "task": task.to_dict()}), 200

#complete a task 
@bp.route('/complete/<int:task_id>', methods = ['POST'])
def completeTask(task_id):
    task = Task.get_task(task_id)
    if task:
        task.complete_task()
        return jsonify({"message": "Task marked as complete."}), 200
    else:
        return jsonify({"error": "Task not found."}), 404
    
#delete a task
@bp.route('/remove/<int:task_id>', methods = ['DELETE'])
def removeTask(task_id):
    task = Task.get_task(task_id)
    if task:
        task.delete()
        return jsonify({"message": "Task removed successfully."}), 200
    return jsonify({"error": "Task not found."}), 404


#To-do:
# - completed tasks at the end, marked