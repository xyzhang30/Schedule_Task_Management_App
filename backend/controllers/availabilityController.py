from flask import Blueprint, jsonify, session
from flask import request
from ..models.event import Event
from ..decorators import is_logged_in
from datetime import datetime

bp = Blueprint('availability', __name__, url_prefix='/availability')

@bp.route('/generate', methods = ['POST'])
@is_logged_in
def generate_availability():
    '''
    generate and returns the shared available timeslots of all participants
    on a specified time range, and always including the current user
    '''
    date_input = request.form.get("date")
    start_time_input = request.form.get("start_time")
    end_time_input = request.form.get("end_time")
    participant_ids = request.form.get("participant_ids")

    date = datetime.strptime(date_input, '%Y-%m-%d').date()
    start_time = datetime.strptime(start_time_input, '%H:%M').time()
    end_time = datetime.strptime(end_time_input, '%H:%M').time()
    participants = [int(id.strip()) for id in participant_ids.split(',')]
    
    participants.append(session['user'])

    start = datetime.combine(date, start_time)
    end = datetime.combine(date, end_time)

    unavailable_times = get_unavailable_times(start, end, participants)
    merged_unavailable_times = merge_unavailable_intervals(unavailable_times)
    curr_time = start
    shared_availability = get_shared_availability(curr_time, end, merged_unavailable_times)

    # result = [{"start_time": str(start), "end_time": str(end)} for start, end in shared_availability]
    result = [
        {
        "start_time": start.strftime('%Y-%m-%d %H:%M'),
        "end_time": end.strftime('%Y-%m-%d %H:%M')
        }
        for start, end in shared_availability
    ]

    return jsonify(result)



# private helper methods
def get_unavailable_times(start, end, participants):
    '''
    gets all users' unavailable timeslots according to their events between the given time range
    '''
    unavailable_times = [] 

    for id in participants:
        events = Event.get_events_by_account(id)
        for e in events:
            S = e.start_date
            E = e.end_date
            if S < start and start < E and E < end:
                unavailable_times.append((start, E)) #S before start, E in range, so take start to E as unavailable
            elif start < S and S < end and start < E and E < end:
                unavailable_times.append((S, E)) #S and E both in range, take S to E as unavailable
            elif start < S and S < end and end < E:
                unavailable_times.append((S, end)) #S in range, E after end, take S to end as unavailable
            elif S < start and end < E:
                unavailable_times.append((start, end)) #S to E covers entire range, just take start to end
            else :
                pass

    unavailable_times.sort() #sort by start time
    return unavailable_times




def merge_unavailable_intervals(unavailable_times):
    '''
    merges the unavailable timeslots generated from the previous method, getting rid of overlaps
    '''
    merged_unavailable_times = []

    for curr_start, curr_end in unavailable_times:
        if not merged_unavailable_times or merged_unavailable_times[-1][1] < curr_start:
            # if list is empty, or if end time of last merged interval is before curr start (meaning that there's no overlap between these two)
            merged_unavailable_times.append((curr_start, curr_end))
        else :
            # else: merge curr interval with last interval in the merged list
            merged_unavailable_times[-1] = (
                merged_unavailable_times[-1][0], 
                max(merged_unavailable_times[-1][1], curr_end)
            )

    return merged_unavailable_times




def get_shared_availability(curr_time, end_time, merged_unavailable_times):
    '''
    finds the share available timeslots according to the unavailable timeslots generated from the previous method
    '''
    shared_availability = []

    for unavailable_start, unavailable_end in merged_unavailable_times:
        if (curr_time < unavailable_start):
            shared_availability.append((curr_time, unavailable_start))
        curr_time = max(curr_time, unavailable_end)

    if curr_time < end_time:
        shared_availability.append((curr_time, end_time))

    return shared_availability
