from flask import Blueprint, jsonify
from flask import request
from ..models.availability import Availability

bp = Blueprint('availability', __name__, url_prefix='/availability')

@bp.route('/', methods = ['GET'])
def index():
    availability = Availability.query.all()
    availability_list = [a.to_dict() for a in availability]
    return jsonify(availability_list)


@bp.route('/addInterval', methods = ['POST'])
def addAvailability():
    account_id = request.form.get("account_id")
    unav_interval = request.form.get("unav_interval")
    full_date = request.form.get("full_date")

    availability = Availability(
        account_id=account_id,
        unav_interval=unav_interval,
        full_date=full_date,
        )
    availability.save()
    return index()

