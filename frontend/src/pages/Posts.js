import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Posts.css'; 

const baseUrl = process.env.REACT_APP_BASE_URL;

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null); // hold the currently selected post's data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', image_url: '' });
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
          const response = await axios.get(`${baseUrl}/post/`, { withCredentials: true }); // GET request to fetch all posts
          setPosts(response.data);
          setLoading(false);
      } catch (err) {
          console.error("Error fetching posts:", err);
          setError('Failed to fetch posts.');
          setLoading(false);
      }
    };
  fetchPosts(); // close the function
  }, []);

  const handlePostClick = async (post_id) => {
    try {
      // Fetch the specific post
      const response = await axios.get(`${baseUrl}/post/get-post/${post_id}`, { withCredentials: true });
      const commentsResponse = await axios.get(`${baseUrl}/post/${post_id}/comments`, { withCredentials: true });
      console.log("Comments Response:", commentsResponse.data); // Log comments response

      const comments = Array.isArray(commentsResponse.data) ? commentsResponse.data : [];
      setSelectedPost({
          ...response.data,
          comments,
      });
    } catch (err) {
        console.error("Error fetching post details:", err);
        setError('Failed to fetch post details.');
    }
    };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newPost.title);
      formData.append('content', newPost.content);
      formData.append('image_url', newPost.image_url); 
      // formData.append('poster_id', '1');  // change the poster ID!!!

      const response = await axios.post(`${baseUrl}/post/add-post`, formData, { withCredentials: true });
      console.log(response.data);
      
      // Add the newly created post to the list of posts
      setPosts([...posts, response.data]);
      setShowModal(false);
      setNewPost({ title: '', content: '', image_url: '' });  // clear the form

    } catch (err) {
      console.error("Error adding new post:", err);
      setError('Failed to add post.');
    }
};

const handleCommentSubmit = async (e) => {
  e.preventDefault();
  if (!newComment) return;

  try {
      const formData = new FormData();
      formData.append('text', newComment);
      formData.append('post_id', selectedPost.post_id);
      // formData.append('commenter_id', '1');  // change the commenter ID!!

      const response = await axios.post(`${baseUrl}/post/comment`, formData, { withCredentials: true });
      console.log(response.data);

      // Add the new comment to the selected post's comments
      setSelectedPost((prev) => ({
          ...prev,
          comments: [...prev.comments, response.data],
      }));
      
      setNewComment('');

  } catch (err) {
      console.error("Error adding comment:", err);
      setError('Failed to add comment.');
  }
  };

  const handleDeleteComment = async (comment) => {
    const comment_id = selectedPost.comment_id ;
    try {
      await axios.delete(`${baseUrl}/post/delete-comment`, comment_id, { withCredentials: true });

    } catch (err) {
        console.error("Error deleting comment:", err);
        setError('Failed to delete comment.');
    }
  };

  return (
    <div className="posts-page-container">
      <div className="posts-header">
        <h2>Posts</h2>
        <button className="add-post-button" onClick={() => setShowModal(true)}>Add Post</button>
      </div>

      <div className="posts-list">
        <p>Available Posts: </p>
        {loading ? (
          <p>Loading posts...</p>
        ) : posts.length > 0 ? (
            posts.map((post, index) => (
              <div key={index} className="post-item" onClick={() => handlePostClick(post.post_id)}>
                <h3>{post.title}</h3>
                <p>{post.content ? post.content.slice(0, 100) : "No content available"}...</p>
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
            {selectedPost.comments.length > 0 ? (
              selectedPost.comments.map((comment, index) => (
                <div key={index}>
                  <p>{comment.text}</p>
                  <button onClick={() => handleDeleteComment(comment)}>Delete</button>
                </div>
              ))
            ) : (
              <p>No comments yet.</p>
            )}
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button onClick={handleCommentSubmit}>Submit Comment</button>
          </div>
        ) : (
          <p>Select a post to view details.</p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Post</h2>
            <form onSubmit={handlePostSubmit}>
              <label>
                Title:
                <input 
                  type="text" 
                  name="title" 
                  value={newPost.title} 
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} 
                  required 
                />
              </label>
              <label>
                Content:
                <input 
                  type="text" 
                  name="content" 
                  value={newPost.content} 
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} 
                  required 
                />
              </label>
              <label>
                  Image_URL: 
                  <input 
                      type="text" 
                      name="image_url" 
                      value={newPost.image_url} 
                      onChange={(e) => setNewPost({ ...newPost, image_url: e.target.value })} 
                  />
              </label>

              <div className="modal-actions">
                <button type="submit">Post</button>
                <button type="button" onClick={() => setShowModal(false)}>
                    Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Posts;