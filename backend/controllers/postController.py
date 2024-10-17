from flask import Blueprint, jsonify, request
from ..models.post import Post
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
    friends = Friend.get_friends_by_id(poster_id)
    
    if not friends:
        return jsonify({"error": "No friends found or no posts by friends."}), 404
    
    posts = Post.query.filter(Post.poster_id.in_(friends)).all()

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

    if not title or not content:
        return jsonify({"error": "Title and content are required."}), 400

    new_post = Post(
        title=title,
        content=content,
        image_url=image_url
    )
    new_post.save()
    return jsonify(new_post.to_dict()), 200


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
