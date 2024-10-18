from flask import Blueprint, jsonify
from flask import request
from ..models.group import Group
from ..models.membership import Membership
from ..models.account import Account

# TODO: write joinRequest function using Notification model

bp = Blueprint('group', __name__, url_prefix='/group')


@bp.route('/', methods = ['GET'])
def index():
    group = Group.query.all()
    groups_list = [grp.to_dict() for grp in group]
    return jsonify(groups_list)


@bp.route('/create', methods = ['POST'])
def createGroup():
    group_name = request.form.get("group_name")
    group_avatar = request.form.get("group_avatar")
    year_created = (int)(request.form.get("year_created"))

    # TODO: replace with the function that get account cookie
    admin_id = get_current_acc_id()

    group = Group(
        group_name=group_name,
        group_avatar=group_avatar,
        year_created=year_created,
        admin_id=admin_id
    )
    group.save()
    return index()


def groupAdminError(group_id):
    """
    Check if the group exists and if the current user is the group administrator.
    
    :param group_id: ID of the group to check
    :return: Tuple (group object, None) if success, or (None, response) if failure
    """

    group = Group.get_grp_by_id(group_id)
    if not group:
        return None, jsonify({'message': 'Group not found'}), 404
    
    # TODO: replace with the function that get account cookie
    current_user_id = get_current_user_id()
    if group.admin_id != current_user_id:
        return None, jsonify({'message': 'Access denied: You are not the group administrator'}), 403

    return group, None


@bp.route('/edit/<int:group_id>', methods = ['PUT'])
def editGroup(group_id):

    group, error_message = groupAdminError(group_id)
    if error_message:
        return error_message
    
    new_group_name = request.form.get("new_group_name")
    new_group_avatar = request.form.get("new_group_avatar")

    if new_group_name:
        group.group_name = new_group_name
    if new_group_avatar:
        group.group_avatar = new_group_avatar
    
    group.save()
    return jsonify({'message': 'Group updated successfully', 'group': group.to_dict()}), 200


@bp.route('/get-members/<int:group_id>', methods = ['GET'])
def getMembers(group_id):
    
    memberships = Membership.get_accs_by_grp_id(group_id)
    if not memberships:
        return jsonify({'message': 'No members found for this group'}), 404
    
    members = []
    for membership in memberships:
        account = Account.query.filter_by(account_id=membership.account_id).first()
        if account:
            members.append({
                'member_id': account.account_id,
                'member_name': account.name,
                'email': account.email
            })

    return jsonify({'group_id': group_id, 'members': members}), 200


@bp.route('/add-member/<int:group_id>', methods = ['POST'])
def addMember(group_id):
    
    group, error_message = groupAdminError(group_id)
    if error_message:
        return error_message
    
    member_id = request.form.get('member_id')
    if not member_id:
        return jsonify({'message': 'Member ID is required'}), 404
    
    membership = Membership.query.filter_by(group_id=group_id, member_id=member_id).first()
    if membership:
        return jsonify({'message': 'Member is already part of the group'}), 400

    new_membership = Membership(group_id=group_id, member_id=member_id)

    db_session.add(new_membership)
    db_session.commit()

    return jsonify({'message': 'Member added to the group successfully'}), 200


@bp.route('/remove-member/<int:group_id>', methods = ['DELETE'])
def removeMember(group_id):

    group, error_message = groupAdminError(group_id)
    if error_message:
        return error_message
    
    member_id = request.form.get('member_id')
    if not member_id:
        return jsonify({'message': 'Member ID is required'}), 404
    
    membership = Membership.query.filter_by(group_id=group_id, member_id=member_id).first()
    if not membership:
        return jsonify({'message': 'Membership not found'}), 404
    
    db_session.delete(membership)
    db_session.commit()

    return jsonify({'message': 'Member deleted successfully'}), 200
