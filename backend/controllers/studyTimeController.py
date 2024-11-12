from flask import Blueprint, jsonify, session
from flask import request
from datetime import date, timedelta
from ..models.studyTime import StudyTime
from ..decorators import is_logged_in

bp = Blueprint('studytime', __name__, url_prefix='/studytime')

#get daily study time for an account
@bp.route('/day', methods = ['GET'])
@is_logged_in
def get_daily_study_time():
    account_id = session['user']
    current_date = date.today()
    study_time = StudyTime.daily_study_time(account_id, current_date)
    if study_time:
        return jsonify(study_time=study_time.to_dict()), 200
    else:
        return jsonify(message="No study time recorded for today."), 404


#get weekly study time for an account
@bp.route('/week', methods=['GET'])
@is_logged_in
def get_weekly_study_time():
    account_id = session['user']
    current_date = date.today()
    total_study_time = StudyTime.weekly_study_time(account_id, current_date)
    return jsonify(weekly_study_time=str(total_study_time)), 200


#update study time; input time should have the format hours:minutes:seconds - NEED EDIT
@bp.route('/update/<string:time>', methods=['POST'])
#@is_logged_in
def update_study_time(time):
    account_id = session['user']
    current_date = date.today()
    try:
        hours, minutes, seconds = map(int, time.split(':'))
        time_interval = timedelta(hours=hours, minutes=minutes, seconds=seconds)
    except ValueError:
        return jsonify(message="Invalid time format. Use 'hours:minutes:seconds'."), 400
    StudyTime.update_study_time(account_id, current_date, time_interval)
    return jsonify(message="Study time updated successfully."), 200


# Get weekly study time for all accounts
@bp.route('/all_weekly', methods=['GET'])
@is_logged_in
def get_all_weekly_study_times():
    current_date = date.today()
    result = StudyTime.get_all_users_weekly_study_time(current_date)
    return jsonify(weekly_study_times=result), 200