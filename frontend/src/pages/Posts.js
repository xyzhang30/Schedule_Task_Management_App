import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Posts.css'; 
import './SplitScreen.css';
import '../App.css'
import SpeechToText from './SpeechToText';

const baseUrl = process.env.REACT_APP_BASE_URL;

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // tracks if editing or adding a post
  const [newPost, setNewPost] = useState({ title: '', content: '', image_url: '' });
  const [newComment, setNewComment] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  const fetchPosts = async () => {
    try {
      // Fetch friends' posts
      const friendsResponse = await axios.get(`${baseUrl}/post/get-friends-posts`, { withCredentials: true });
      const friendsPosts = friendsResponse.data;
  
      // Fetch own posts
      const ownResponse = await axios.get(`${baseUrl}/post/get-posts`, { withCredentials: true });
      const ownPosts = ownResponse.data;
  
      const allPosts = [...friendsPosts, ...ownPosts];
  
      const postsWithStatuses = await Promise.all(
        allPosts.map(async (post) => {
          try {
            // Fetch `isLiked` status
            const likeResponse = await axios.get(`${baseUrl}/post/${post.post_id}/is-liked`, { withCredentials: true });
            const isLiked = likeResponse.data.isLiked;
  
            // Fetch `isSaved` status
            const saveResponse = await axios.get(`${baseUrl}/post/${post.post_id}/is-saved`, { withCredentials: true });
            const isSaved = saveResponse.data.isSaved;
  
            return {
              ...post,
              isLiked,
              isSaved,
            };
          } catch (error) {
            console.error(`Error fetching statuses for post ${post.post_id}:`, error);
            return { ...post, isLiked: false, isSaved: false };
          }
        })
      );
  
      setPosts(postsWithStatuses);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError('Failed to fetch posts.');
      setLoading(false);
    }
  };  

  // Check if the logged-in user owns a comment
  const checkIfCommentOwner = async (comment_id) => {
    try {
      const response = await axios.get(`${baseUrl}/post/check-comment-owner/${comment_id}`, { withCredentials: true });
      return response.data.is_self; // Return ownership status
    } catch (error) {
      console.error("Error checking comment ownership:", error);
      return false; // Default to not owner
    }
  };

  // Fetch comments and check ownership for each comment
  const fetchCommentsForPost = async (postId) => {
    try {
      const response = await axios.get(`${baseUrl}/post/${postId}/comments`, { withCredentials: true });
      
      // Add ownership status for each comment
      const commentsWithOwnership = await Promise.all(
        response.data.map(async (comment) => {
          const isOwner = await checkIfCommentOwner(comment.comment_id);
          return { ...comment, isOwner };
        })
      );

      setSelectedPost((prev) => ({
        ...prev,
        comments: commentsWithOwnership,
      }));
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError('Failed to fetch comments.');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Post details
  const handlePostClick = async (post_id) => {
    try {
      // Fetch the specific post and its comments with ownership
      const response = await axios.get(`${baseUrl}/post/get-post/${post_id}`, { withCredentials: true });
      setSelectedPost(response.data);
      
      fetchCommentsForPost(post_id);
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
      if (newPost.image_url) {
        formData.append('image', newPost.image_url);
      }

      const response = await axios.post(`${baseUrl}/post/add-post`, formData, { withCredentials: true });
      console.log(response.data);
      
      // Fetch all posts again to update the list
      fetchPosts();
      
      setShowModal(false);
      setNewPost({ title: '', content: '', image_url: '' });  // Clear the form

    } catch (err) {
      console.error("Error adding new post:", err);
      setError('Failed to add post.');
    }
  };

  // Comments
  const handleCommentSubmit = async (e) => {
  e.preventDefault();
  if (!newComment) return;

  try {
      const formData = new FormData();
      formData.append('text', newComment);
      formData.append('post_id', selectedPost.post_id);

      const response = await axios.post(`${baseUrl}/post/comment`, formData, { withCredentials: true });
      console.log(response.data);

      fetchCommentsForPost(selectedPost.post_id); // Fetch updated comments
      
      setNewComment('');

  } catch (err) {
      console.error("Error adding comment:", err);
      setError('Failed to add comment.');
  }
  };

  const handleDeleteComment = async (comment) => {
    const comment_id = comment.comment_id ;

    try {
      await axios.delete(`${baseUrl}/post/delete-comment/${comment_id}`, { withCredentials: true });
      fetchCommentsForPost(selectedPost.post_id); // Fetch updated comments

    } catch (err) {
        console.error("Error deleting comment:", err);
        setError('Failed to delete comment.');
    }
  };

  // Likes and saves
  const handleLike = async (post_id) => {
    try {
      const formData = new FormData();
      formData.append("post_id", post_id);

      await axios.post(`${baseUrl}/post/like`, formData, { withCredentials: true });
      console.log("Post liked successfully");
    } 
    catch (err) {
      console.error("Error liking post:", err);
      setError('Failed to like post.');
    }
  };

  const handleUnlike = async (post_id) => {
    try {
      const formData = new FormData();
      formData.append("post_id", post_id);

      await axios.delete(`${baseUrl}/post/unlike`, { data: formData, withCredentials: true });
      console.log("Post unliked successfully");
    } 
    
    catch (err) {
      console.error("Error unliking post:", err);
      setError('Failed to unlike post.');
    }
  };

  const handleSave = async (post_id) => {
    try {
      const formData = new FormData();
      formData.append("post_id", post_id);

      await axios.post(`${baseUrl}/post/save`, formData, { withCredentials: true });
      console.log("Post saved successfully");
    } 

    catch (err) {
      console.error("Error saving post:", err);
      setError('Failed to save post.');
    }
  };

  const handleUnsave = async (post_id) => {
    try {
      const formData = new FormData();
      formData.append("post_id", post_id);

      await axios.delete(`${baseUrl}/post/unsave`, { data: formData, withCredentials: true });
      console.log("Post unsaved successfully");
    } 
    catch (err) {
      console.error("Error unsaving post:", err);
      setError('Failed to unsave post.');
    }
  };

  const handleToggleLike = async (post_id) => {
    try {
      const updatedPosts = posts.map(post => {
        if (post.post_id === post_id) {
          if (!post.isLiked) {
            handleLike(post_id);
          } else {
            handleUnlike(post_id);
          }
          return { ...post, isLiked: !post.isLiked };
        }
        return post;
      });
      setPosts(updatedPosts);
    } catch (err) {
      console.error("Error toggling like:", err);
      setError('Failed to toggle like.');
    }
  };

  const handleToggleSave = async (post_id) => {
    try {
      const updatedPosts = posts.map(post => {
        if (post.post_id === post_id) {
          if (!post.isSaved) {
            handleSave(post_id);
          } else {
            handleUnsave(post_id);
          }
          return { ...post, isSaved: !post.isSaved };
        }
        return post;
      });
      setPosts(updatedPosts);
    } catch (err) {
      console.error("Error toggling save:", err);
      setError('Failed to toggle save.');
    }
  };

  // Update post
  const handleUpdatePost = async () => {
    const formData = new FormData();
    if (newPost.title) {
      formData.append('title', newPost.title);
    }
    if (newPost.content) {
      formData.append('content', newPost.content);
    }
    if (newPost.image_url) {
      formData.append('image', newPost.image_url);
    }
    
    try {
      const response = await axios.put(`${baseUrl}/post/update-post/${selectedPost.post_id}`, formData, { withCredentials: true });
      console.log(response.data);
      
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.post_id === selectedPost.post_id ? { ...p, ...newPost } : p))
      );
      
      setShowModal(false);
      setIsEditing(false);
    } 
    
    catch (err) {
      console.error("Error updating post:", err);
      setError('Failed to update post.');
    }
  };

  const handleUpdatePostClick = (post) => {
    setNewPost({
      title: post.title,
      content: post.content,
      image_url: post.image_url,
    });
    setIsEditing(true); // Set modal to editing mode
    setShowModal(true);
  };

  const openAddPostModal = () => {
    setNewPost({ title: '', content: '', image_url: '' });
    setIsEditing(false); // Set modal to add mode
    setShowModal(true);
  };
  
  // Delete post
  const handleDeletePost = async (post_id) => {
    try {
      await axios.delete(`${baseUrl}/post/remove-post/${post_id}`, { withCredentials: true });
      setPosts((prevPosts) => prevPosts.filter((p) => p.post_id !== post_id));
      
      setSelectedPost(null);
    } 
    
    catch (err) {
      console.error("Error deleting post:", err);
      setError('Failed to delete post.');
    }
  }; 

  // Check ID
  const checkIfSelf = async (post_id) => {
    try {
      const response = await axios.get(`${baseUrl}/post/checkid/${post_id}`, { withCredentials: true });
      setIsOwner(response.data.is_self);
    } catch (error) {
      console.error("Error checking post ownership:", error);
      setIsOwner(false);
    }
  };
  
  useEffect(() => {
    if (selectedPost) {
      checkIfSelf(selectedPost.post_id);
    }
  }, [selectedPost]);

  const handleTranscriptChange = (transcript) => {
    console.log("Received transcript:", transcript); // Add this for debugging
    if (transcript && transcript.trim() !== '') {
      setNewComment(transcript);
    }
  };

  return (
    <div className="split-screen-container">
      <div className="split-screen-content">
      <div className="split-screen-filter-container">
          <h2>Posts</h2>
          <div className="button-group">
          <button className="button" onClick={openAddPostModal}>Add Post</button>
          </div>
      </div>

      <div className="split-screen-left">
        <div className="posts-list">
          {loading ? (
            <p>Loading posts...</p>
          ) : posts.length > 0 ? (
            [...posts]
              .sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted))
              .map((post, index) => (
                <div key={index} className="post-item">
                  <h3 onClick={() => handlePostClick(post.post_id)}>{post.title}</h3>
                  <p className="post-poster-name">By: {post.poster_name}</p>
                  <p>{post.content ? post.content.slice(0, 100) : "No content available"}...</p>

                  <button onClick={() => handleToggleLike(post.post_id)}>
                    {post.isLiked ? "Unlike" : "Like"}
                  </button>
                  <button onClick={() => handleToggleSave(post.post_id)}>
                    {post.isSaved ? "Unsave" : "Save"}
                  </button>
                </div>
              ))
          ) : (
            <p>No posts available.</p>
          )}
        </div>
      </div>

      <div className="split-screen-right">
        <div className="post-details">
          {selectedPost ? (
            <div>
              <div className="post-title-container">
                <h3>{selectedPost.title}</h3>
                <p>Time: {new Date(selectedPost.date_posted).toLocaleString()}</p>
                <p>By: {selectedPost.poster_name}</p>
                {isOwner && (
                  <div className="post-actions top-right">
                  <button className="button" id="smaller-button" onClick={() => handleUpdatePostClick(selectedPost)}>Update</button>
                  <button className="button" id="smaller-button" onClick={() => handleDeletePost(selectedPost.post_id)}>Delete</button>
                </div>
                )}
              </div>

              <p
                dangerouslySetInnerHTML={{
                  __html: selectedPost.content.replace(/\n/g, '<br />'),
                }}
              ></p>

              {selectedPost.image_url && (
                <div className="post-image-container">
                  <img
                    src={`${baseUrl}/post/get_image/${selectedPost.post_id}`}
                    alt="Post"
                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'cover' }}
                  />
                </div>
              )}
              
              <h4>Comments:</h4>
              {selectedPost.comments && selectedPost.comments.length > 0 ? (
                selectedPost.comments.map((comment) => (
                  <div key={comment.comment_id} className="comment-item">
                    <p>
                      <strong>{comment.commenter_name}:</strong> {comment.text}
                    </p>
                    {comment.isOwner && (
                      <button onClick={() => handleDeleteComment(comment)}>Delete</button>
                    )}
                  </div>
                ))
              ) : (
                <p>No comments yet.</p>
              )}
              <div className='comment-input'>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <SpeechToText onTranscriptChange={handleTranscriptChange}/>
              </div>
              <button className="button" id="smaller-button" onClick={handleCommentSubmit}>Submit Comment</button>
            </div>
          ) : (
            <p>Select a post to view details.</p>
          )}
        </div>
      </div>

      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditing ? "Edit Post" : "Add New Post"}</h2>
            <form onSubmit={isEditing ? handleUpdatePost : handlePostSubmit}>
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
                <textarea
                  name="content"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  ref={(textarea) => {
                    if (textarea) {
                      textarea.style.height = 'auto';
                      textarea.style.height = `${textarea.scrollHeight}px`;
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    minHeight: '30px',
                    resize: 'none',
                    overflow: 'hidden',
                  }}
                />
              </label>
              <label>
                Upload Image:
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setNewPost({ ...newPost, image_url: file });
                    }
                  }}
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