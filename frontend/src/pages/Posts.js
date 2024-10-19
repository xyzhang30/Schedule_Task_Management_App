import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Posts.css'; 

const baseUrl = process.env.REACT_APP_BASE_URL;

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', image_url: '' });

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${baseUrl}/post/`);
        setPosts(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError('Failed to fetch posts.');
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handlePostClick = async (postId) => {
    try {
      const response = await axios.get(`${baseUrl}/post/get-post/${postId}`);
      setSelectedPost(response.data);
    } catch (err) {
      console.error("Error fetching post details:", err);
      setError('Failed to fetch post details.');
    }
  };

  const handleAddPost = async () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handlePostSubmit = async () => {
    try {
      const response = await axios.post(`${baseUrl}/post/add-post`, newPost);
      setPosts([...posts, response.data]);
      setShowModal(false);
    } catch (err) {
      console.error("Error adding new post:", err);
      setError('Failed to add post.');
    }
  };

  return (
    <div className="posts-page-container">
      <div className="posts-header">
        <h2>Posts</h2>
        <button className="add-post-button" onClick={handleAddPost}>Add Post</button>
      </div>

      <div className="posts-list">
        <p>Available Posts: </p>
        {loading ? (
          <p>Loading posts...</p>
        ) : posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={index} className="post-item" onClick={() => handlePostClick(post.post_id)}>
              <h3>{post.title}</h3>
              <p>{post.content.slice(0, 100)}...</p>
            </div>
          ))
        ) : (
          <p>No posts available.</p>
        )}
      </div>

      <div className="post-details">
        {selectedPost ? (
          <div>
            <h3>{selectedPost.title}</h3>
            <p>{selectedPost.content}</p>
            <h4>Comments:</h4>
            {selectedPost.comments ? selectedPost.comments.map((comment, index) => (
              <p key={index}>{comment.text}</p>
            )) : <p>No comments yet.</p>}
          </div>
        ) : (
          <p>Select a post to view details</p>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Post</h3>
            <input
              type="text"
              placeholder="Title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            />
            <textarea
              placeholder="Content"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            />
            <input
              type="text"
              placeholder="Image URL"
              value={newPost.image_url}
              onChange={(e) => setNewPost({ ...newPost, image_url: e.target.value })}
            />
            <button onClick={handlePostSubmit}>Submit</button>
            <button onClick={handleModalClose}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Posts;