from flask import Blueprint, jsonify, request, session
from ..models.post import Post, Like, Save, Comment
from ..models.friend import Friend
from ..decorators import is_logged_in

bp = Blueprint('post', __name__, url_prefix='/post')

@bp.route('/', methods=['GET'])
@is_logged_in
def index():
    '''
    Gets a list of all posts
    '''
    posts = Post.all()
    post_list = [p.to_dict() for p in posts]
    return jsonify(post_list)


@bp.route('/get-post/<int:post_id>', methods=['GET'])
@is_logged_in
def get_post(post_id):
    '''
    Gets a specific post by its post_id
    '''
    post = Post.get_post_by_id(post_id)
    if post is None:
        return jsonify({"error": "Post not found."}), 404
    return jsonify(post.to_dict()), 200


@bp.route('/get-posts', methods=['GET'])
@is_logged_in
def get_posts_by_poster():
    '''
    Gets all posts by a specific poster ID
    '''
    poster_id = session['user']
    posts = Post.get_posts_by_poster_id(poster_id)
    if not posts:
        return jsonify([]), 200
        # return jsonify({"error": "No posts found for this poster."}), 404

    post_list = [post.to_dict() for post in posts]
    return jsonify(post_list), 200


@bp.route('/get-friends-posts', methods=['GET'])
@is_logged_in
def get_friends_posts_by_poster():
    '''
    Gets all posts from the friends of a specific poster ID
    '''
    poster_id = session['user']
    friends_accounts = Friend.get_friends_by_id(poster_id)

    if not friends_accounts:
        return jsonify([]), 200
        # return jsonify({"error": "No friends found or no posts by friends."}), 404

    friend_ids = [friend.account_id for friend in friends_accounts]
    
    posts = Post.get_posts_by_poster_ids(friend_ids)

    if not posts:
        return jsonify([]), 200
        # return jsonify({"error": "No posts found for friends."}), 404

    post_list = [post.to_dict() for post in posts]
    return jsonify(post_list), 200


@bp.route('/add-post', methods=['POST'])
@is_logged_in
def add_post():
    '''
    Adds a new post
    '''
    title = request.form.get('title')
    content = request.form.get('content')
    image_url = request.form.get('image_url')
    poster_id = session['user']

    if not title or not content:
        return jsonify({"error": "Title and content are required."}), 400

    new_post = Post(
        title=title,
        content=content,
        image_url=image_url,
        poster_id=poster_id
    )

    new_post.save()
    return index()


@bp.route('/update-post/<int:post_id>', methods=['PUT'])
@is_logged_in
def update_post(post_id):
    '''
    Updates a specific post by post_id
    '''
    account_id = session['user']  # Get the account ID from the session
    post = Post.get_post_by_id(post_id)
    
    if not post:
        return jsonify({"error": "Post not found."}), 404

    # Check if the logged-in user owns the post
    if post.poster_id != account_id:
        return jsonify({"error": "You are not authorized to update this post."}), 403

    # Update the post with new values, if provided
    title = request.form.get('title', post.title)
    content = request.form.get('content', post.content)
    image_url = request.form.get('image_url', post.image_url)

    post.title = title
    post.content = content
    post.image_url = image_url

    post.save()
    return jsonify(post.to_dict()), 200


def remove_all(post_id):
    '''
    Removes all likes, saves, and comments of a post by post_id
    '''
    likes = Like.get_likes_by_post_id(post_id)
    for like in likes:
        like.delete()

    saves = Save.get_saves_by_post_id(post_id)
    for save in saves:
        save.delete()

    comments = Comment.get_comments_by_post_id(post_id)
    for comment in comments:
        comment.delete()


@bp.route('/remove-post/<int:post_id>', methods=['DELETE'])
@is_logged_in
def remove_post(post_id):
    '''
    Removes a post by post_id
    '''
    account_id = session['user']  # Get the account ID from the session
    post = Post.get_post_by_id(post_id)
    
    if not post:
        return jsonify({"error": "Post not found."}), 404

    # Check if the logged-in user owns the post
    if post.poster_id != account_id:
        return jsonify({"error": "You are not authorized to delete this post."}), 403

    # Remove all related data and delete the post
    remove_all(post_id)
    post.delete()
    return jsonify({"message": "Post and all related data removed successfully."}), 200


# Like
@bp.route('/like', methods=['POST'])
@is_logged_in
def like_post():
    post_id = request.form.get('post_id')
    liker_id = session['user']
    
    like = Like(post_id=post_id, 
                liker_id=liker_id)
    like.save()
    
    return jsonify({"message": "Post liked successfully"}), 201


@bp.route('/unlike', methods=['DELETE'])
@is_logged_in
def unlike_post():
    post_id = request.form.get('post_id')
    liker_id = session['user']

    like = Like.get_like_by_post_and_liker_id(post_id, liker_id)
    if like:
        like.delete()
        return jsonify({"message": "Post unliked successfully"}), 200
    return jsonify({"error": "Like not found"}), 404


@bp.route('/<int:post_id>/likes', methods=['GET'])
@is_logged_in
def get_likes(post_id):
    '''
    Retrieves all likes for a specific post.
    '''
    likes = Like.get_likes_by_post_id(post_id)
    if not likes:
        return jsonify({"message": "No likes found for this post"}), 404
    
    liker_list = [{"liker_id": like.liker_id} for like in likes]
    return jsonify(liker_list), 200


# Save
@bp.route('/save', methods=['POST'])
@is_logged_in
def save_post():
    post_id = request.form.get('post_id')
    saver_id = session['user']
    
    save = Save(post_id=post_id, 
                saver_id=saver_id)
    save.save()
    
    return jsonify({"message": "Post saved successfully"}), 201


@bp.route('/unsave', methods=['DELETE'])
@is_logged_in
def unsave_post():
    post_id = request.form.get('post_id')
    saver_id = session['user']

    save = Save.get_save_by_post_and_saver_id(post_id, saver_id)
    if save:
        save.delete()
        return jsonify({"message": "Post unsaved successfully"}), 200
    return jsonify({"error": "Save not found"}), 404


@bp.route('/<int:post_id>/saves', methods=['GET'])
@is_logged_in
def get_saves(post_id):
    '''
    Retrieves all saves for a specific post.
    '''
    saves = Save.get_saves_by_post_id(post_id)
    if not saves:
        return jsonify({"message": "No saves found for this post"}), 404
    
    saver_list = [{"saver_id": save.saver_id} for save in saves]
    return jsonify(saver_list), 200


@bp.route('/account/saves', methods=['GET'])
@is_logged_in
def get_account_saves():
    '''
    Retrieves all posts saved by a specific account.
    '''
    account_id = session['user']
    saves = Save.get_saves_by_saver_id(account_id)
    if not saves:
        return jsonify({"message": "No saves found for this account"}), 404
    
    post_list = [{"post_id": save.post_id} for save in saves]
    return jsonify(post_list), 200


# Comment
@bp.route('/comment', methods=['POST'])
@is_logged_in
def add_comment():
    commenter_id = session['user']
    post_id = request.form.get('post_id')
    text = request.form.get('text')
    
    comment = Comment(commenter_id=commenter_id, 
                      post_id=post_id, 
                      text=text)
    comment.save()
    
    return jsonify({"message": "Comment added successfully"}), 201


@bp.route('/delete-comment/<int:comment_id>', methods=['DELETE'])
@is_logged_in
def delete_comment(comment_id):
    '''
    Deletes a specific comment by comment_id
    '''
    account_id = session['user']  # Get the account ID from the session
    comment = Comment.get_comment_by_comment_id(comment_id)

    if not comment:
        return jsonify({"error": "Comment not found."}), 404

    # Check if the logged-in user owns the comment
    if comment.commenter_id != account_id:
        return jsonify({"error": "You are not authorized to delete this comment."}), 403

    comment.delete()
    return jsonify({"message": "Comment removed successfully."}), 200


@bp.route('/<int:post_id>/comments', methods=['GET'])
@is_logged_in
def get_comments(post_id):
    '''
    Retrieves all comments for a specific post.
    '''
    comments = Comment.get_comments_by_post_id(post_id)
    if not comments:
        return jsonify([]), 200
    
    comment_list = [{"commenter_id": comment.commenter_id, 
                     "timestamp": comment.timestamp,
                     "text": comment.text,
                     "comment_id": comment.comment_id} for comment in comments]
    return jsonify(comment_list), 200

# check id
@bp.route('/checkid/<int:post_id>', methods=['GET'])
@is_logged_in
def is_self(post_id):
    post = Post.get_post_by_id(post_id)

    if not post:
        return jsonify({"error": "Post not found."}), 404

    if post:
        is_self = post.poster_id == session['user']
        return jsonify({'is_self': is_self}), 200

# check comment id
@bp.route('/check-comment-owner/<int:comment_id>', methods=['GET'])
@is_logged_in
def is_comment_owner(comment_id):
    '''
    Check if the logged-in user is the owner of the comment.
    '''
    comment = Comment.get_comment_by_comment_id(comment_id)

    if not comment:
        return jsonify({"error": "Comment not found."}), 404

    is_self = comment.commenter_id == session['user']
    return jsonify({'is_self': is_self}), 200