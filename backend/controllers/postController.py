from flask import Blueprint, jsonify, request
from ..models.post import Post, Like, Save, Comment
from ..models.friend import Friend

bp = Blueprint('post', __name__, url_prefix='/post')

@bp.route('/', methods=['GET'])
def index():
    '''
    Gets a list of all posts
    '''
    posts = Post.query.all()
    post_list = [p.to_dict() for p in posts]
    return jsonify(post_list)


@bp.route('/get-post/<int:post_id>', methods=['GET'])
def get_post(post_id):
    '''
    Gets a specific post by its post_id
    '''
    post = Post.query.get(post_id)
    if post is None:
        return jsonify({"error": "Post not found."}), 404
    return jsonify(post.to_dict()), 200


@bp.route('/get-posts/<int:poster_id>', methods=['GET'])
def get_posts_by_poster(poster_id):
    '''
    Gets all posts by a specific poster ID
    '''
    posts = Post.query.filter_by(poster_id=poster_id).all()
    if not posts:
        return jsonify({"error": "No posts found for this poster."}), 404

    post_list = [post.to_dict() for post in posts]
    return jsonify(post_list), 200


@bp.route('/get-friends-posts/<int:poster_id>', methods=['GET'])
def get_friends_posts_by_poster(poster_id):
    '''
    Gets all posts from the friends of a specific poster ID
    '''
    friends_accounts = Friend.get_friends_by_id(poster_id)
    friend_ids = [friend.account_id for friend in friends_accounts]
    
    if not friend_ids:
        return jsonify({"error": "No friends found or no posts by friends."}), 404
    
    posts = Post.query.filter(Post.poster_id.in_(friend_ids)).all()

    if not posts:
        return jsonify({"error": "No posts found for friends."}), 404

    post_list = [post.to_dict() for post in posts]
    return jsonify(post_list), 200


@bp.route('/add-post', methods=['POST'])
def add_post():
    '''
    Adds a new post
    '''
    title = request.form.get('title')
    content = request.form.get('content')
    image_url = request.form.get('image_url')
    poster_id = request.form.get('poster_id')

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
def update_post(post_id):
    '''
    Updates a specific post by post_id
    '''
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post not found."}), 404

    title = request.form.get('title', post.title)
    content = request.form.get('content', post.content)
    image_url = request.form.get('image_url', post.image_url)

    post.title = title
    post.content = content
    post.image_url = image_url

    post.save()
    return jsonify(post.to_dict()), 200


@bp.route('/remove-post/<int:post_id>', methods=['DELETE'])
def remove_post(post_id):
    '''
    Removes a post by post_id
    '''
    post = Post.query.get(post_id)
    if post:
        post.delete()
        return jsonify({"message": "Post removed successfully."}), 200
    else:
        return jsonify({"error": "Post not found."}), 404


# Like
@bp.route('/like', methods=['POST'])
def like_post():
    post_id = request.form.get('post_id')
    liker_id = request.form.get('liker_id')
    
    like = Like(post_id=post_id, 
                liker_id=liker_id)
    like.save()
    
    return jsonify({"message": "Post liked successfully"}), 201


@bp.route('/unlike', methods=['DELETE'])
def unlike_post():
    post_id = request.form.get('post_id')
    liker_id = request.form.get('liker_id')

    like = Like.query.filter_by(post_id=post_id, liker_id=liker_id).first()
    if like:
        like.delete()
        return jsonify({"message": "Post unliked successfully"}), 200
    return jsonify({"error": "Like not found"}), 404


@bp.route('/<int:post_id>/likes', methods=['GET'])
def get_likes(post_id):
    '''
    Retrieves all likes for a specific post.
    '''
    likes = Like.query.filter_by(post_id=post_id).all()
    if not likes:
        return jsonify({"message": "No likes found for this post"}), 404
    
    liker_list = [{"liker_id": like.liker_id} for like in likes]
    return jsonify(liker_list), 200


# Save
@bp.route('/save', methods=['POST'])
def save_post():
    post_id = request.form.get('post_id')
    saver_id = request.form.get('saver_id')
    
    save = Save(post_id=post_id, 
                saver_id=saver_id)
    save.save()
    
    return jsonify({"message": "Post saved successfully"}), 201


@bp.route('/unsave', methods=['DELETE'])
def unsave_post():
    post_id = request.form.get('post_id')
    saver_id = request.form.get('saver_id')

    save = Save.query.filter_by(post_id=post_id, saver_id=saver_id).first()
    if save:
        save.delete()
        return jsonify({"message": "Post unsaved successfully"}), 200
    return jsonify({"error": "Save not found"}), 404


@bp.route('/<int:post_id>/saves', methods=['GET'])
def get_saves(post_id):
    '''
    Retrieves all saves for a specific post.
    '''
    saves = Save.query.filter_by(post_id=post_id).all()
    if not saves:
        return jsonify({"message": "No saves found for this post"}), 404
    
    saver_list = [{"saver_id": save.saver_id} for save in saves]
    return jsonify(saver_list), 200


@bp.route('/account/<int:account_id>/saves', methods=['GET'])
def get_account_saves(account_id):
    '''
    Retrieves all posts saved by a specific account.
    '''
    saves = Save.query.filter_by(saver_id=account_id).all()
    if not saves:
        return jsonify({"message": "No saves found for this account"}), 404
    
    post_list = [{"post_id": save.post_id} for save in saves]
    return jsonify(post_list), 200


# Comment
@bp.route('/comment', methods=['POST'])
def add_comment():
    commenter_id = request.form.get('commenter_id')
    post_id = request.form.get('post_id')
    text = request.form.get('text')
    
    comment = Comment(commenter_id=commenter_id, 
                      post_id=post_id, 
                      text=text)
    comment.save()
    
    return jsonify({"message": "Comment added successfully"}), 201

# Not sure how to input timestamp and test this
@bp.route('/delete-comment', methods=['DELETE'])
def delete_comment():
    commenter_id = request.form.get('commenter_id')
    post_id = request.form.get('post_id')
    timestamp = request.form.get('timestamp')

    comment = Comment.query.filter_by(commenter_id=commenter_id, 
                      post_id=post_id, 
                      timestamp=timestamp).first()
        
    if comment:
        comment.delete()
        return jsonify({"message": "Comment deleted successfully"}), 200
    return jsonify({"error": "Comment not found"}), 404


@bp.route('/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    '''
    Retrieves all comments for a specific post.
    '''
    comments = Comment.query.filter_by(post_id=post_id).all()
    if not comments:
        return jsonify([]), 200
    
    comment_list = [{"commenter_id": comment.commenter_id, 
                     "timestamp": comment.timestamp,
                     "text": comment.text} for comment in comments]
    return jsonify(comment_list), 200