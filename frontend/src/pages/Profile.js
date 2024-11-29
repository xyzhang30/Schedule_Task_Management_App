import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PostList from './PostList';

const baseUrl = process.env.REACT_APP_BASE_URL;

function Profile() {
  const [profile, setProfile] = useState({
    username: '',
    phoneNumber: '',
    major: '',
    yearCreated: '',
    avatar: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const usernameRes = await axios.get(`${baseUrl}/account/get_username`, { withCredentials: true });
        const phoneNumberRes = await axios.get(`${baseUrl}/account/get_phone_number`, { withCredentials: true });
        const majorRes = await axios.get(`${baseUrl}/account/get_major`, { withCredentials: true });
        const yearCreatedRes = await axios.get(`${baseUrl}/account/get_year`, { withCredentials: true });

        const avatarRes = await axios.get(`${baseUrl}/account/get_avatar`, { 
          withCredentials: true,
          responseType: 'blob' // Receive as Blob
        });
        const avatarUrl = URL.createObjectURL(avatarRes.data);
        setProfile({
          username: usernameRes.data.username,
          phoneNumber: phoneNumberRes.data.phone_number,
          yearCreated: yearCreatedRes.data.year_created,
          major: majorRes.data.major,
          avatar: avatarUrl
        });

        setLoading(false);
      } catch (err) {
        setError('Failed to load profile data');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch Posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsRes = await axios.get(`${baseUrl}/post/get-posts`, { withCredentials: true });
        setUserPosts(postsRes.data);

        const savesRes = await axios.get(`${baseUrl}/post/account/saves`, { withCredentials: true });
        const savedPostDetails = await Promise.all(
          savesRes.data.map(async (save) => {
            const postRes = await axios.get(`http://localhost:8080/post/get-post/${save.post_id}`, { withCredentials: true });
            return postRes.data;
          })
        );
        setSavedPosts(savedPostDetails);
      } catch (err) {
        console.error("Failed to fetch user posts or saved posts:", err);
        setError("Failed to fetch post data");
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="profile-container">
      <h1>Profile</h1>
      <div className="profile-card">
        <div className="profile-attribute">
          <strong>Username:</strong> {profile.username}
        </div>
        <div className="profile-attribute">
          <strong>Phone Number:</strong> {profile.phoneNumber}
        </div>
        <div className="profile-attribute">
          <strong>Major:</strong> {profile.major}
        </div>
        <div className="profile-attribute">
          <strong>Year Created:</strong> {profile.yearCreated}
        </div>
        <div className="profile-attribute avatar-section">
          <strong>Avatar:</strong>
          <img src={profile.avatar} alt="User Avatar" className="avatar-image" />
        </div>
      </div>

      {/* User's Posts */}
      <h2>Your Posts</h2>
      <PostList posts={userPosts} />

      {/* Saved Posts */}
      <h2>Saved Posts</h2>
      <PostList posts={savedPosts} />
    </div>  
  );
}

export default Profile;
