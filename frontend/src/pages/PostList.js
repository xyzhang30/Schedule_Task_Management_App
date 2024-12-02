import React from 'react';
import './Posts.css';

const PostList = ({ posts }) => {
  return (
    <div className="posts-container">
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post.post_id} className="post-card">
            {/* Post Image */}
            {post.image_url && (
              <div className="post-image-container">
                <img
                  src={`http://localhost:8080/post/get_image/${post.post_id}`}
                  alt="Post"
                  className="post-image"
                />
              </div>
            )}

            {/* Post Content */}
            <div className="post-content">
              <h3 className="post-title">{post.title}</h3>
              <p className="post-text">{post.content}</p>

              {/* Additional Post Details */}
              <p className="post-meta">
                <strong>Posted By:</strong> {post.poster_name} | <strong>Time:</strong>{' '}
                {new Date(post.date_posted).toLocaleString()}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p>No posts available.</p>
      )}
    </div>
  );
};

export default PostList;