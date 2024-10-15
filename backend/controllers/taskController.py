from flask import Blueprint, jsonify
from flask import request
from ..models.task import Task

bp = Blueprint('task', __name__, url_prefix='/task')

#get all tasks
@bp.route('/', methods = ['GET'])
def index():
    tasks = Task.query.all()
    tasks_list = [a.to_dict() for a in tasks]
    return jsonify(tasks_list)

#get all tasks by due dates
#need to add - ascending order of due time
@bp.route('/date/<string:due_date>', methods = ['GET'])
def get_tasks_by_date(due_date):
    tasks = Task.query.filter_by(due_date=due_date).all()
    tasks_list = [task.to_dict() for task in tasks]
    return jsonify(tasks_list)

#get all tasks by category
@bp.route('/category/<string:category>', methods=['GET'])
def get_tasks_by_category(category):
    tasks = Task.query.filter_by(category=category).all()
    tasks_list = [task.to_dict() for task in tasks]
    return jsonify(tasks_list)

#get one task info by id
@bp.route('/id/<int:task_id>', methods = ['GET'])
def get_task(task_id):
    task = Task.query.get(task_id)
    return jsonify(task.to_dict())

#create a task
@bp.route('/create', methods = ['POST'])
def createTask():
    task_name = request.form.get("task_name")
    category = request.form.get("category")
    due_date = request.form.get("due_date")
    due_time = request.form.get("due_time")
    account_id = (int)(request.form.get("account_id"))

    if not task_name or not due_date or not account_id:
        return jsonify({'error': 'Missing required fields'}), 400

    task = Task(
        task_name=task_name,
        category=category,
        due_date=due_date,
        due_time=due_time,
        account_id=account_id
    )

    task.save()
    return index()