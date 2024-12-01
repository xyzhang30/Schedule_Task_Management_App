import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PostList from './PostList';
import './Profile.css';

const baseUrl = process.env.REACT_APP_BASE_URL;

function Profile({ self = true, accountId = null}) {
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
        const profileBaseUrl = self
          ? `${baseUrl}/account`
          : `${baseUrl}/account/${accountId}`;
        let usernameRes = await axios.get(`${baseUrl}/account/get_username`, { withCredentials: true });
        if (self == false){
          usernameRes = await axios.get(`${baseUrl}/account/name-by-id/${accountId}`, { withCredentials: true });
        }
        const phoneNumberRes = await axios.get(`${baseUrl}/account/get_phone_number`, { withCredentials: true });
        const majorRes = await axios.get(`${baseUrl}/account/get_major`, { withCredentials: true });
        const yearCreatedRes = await axios.get(`${baseUrl}/account/get_year`, { withCredentials: true });

        const avatarRes = await axios.get(`${profileBaseUrl}/get_avatar`, { 
          withCredentials: true,
          responseType: 'blob' // Receive as Blob
        });

        const avatarUrl = URL.createObjectURL(avatarRes.data);
        
        let profile_username;
        if (self) {
          profile_username = usernameRes.data.username;
        } else {
          profile_username = usernameRes.data;
        }
        setProfile({
          username: profile_username,
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
  }, [self, accountId]);

  // Fetch Posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsBaseUrl = self
          ? `${baseUrl}/post/get-posts`
          : `${baseUrl}/post/${accountId}/get-posts`;
        
        const postsRes = await axios.get(postsBaseUrl, { withCredentials: true });
        setUserPosts(postsRes.data);
        console.log("___ profile, ", profile)

        if (self) {
          const savesRes = await axios.get(`${baseUrl}/post/account/saves`, { withCredentials: true });
          const savedPostDetails = await Promise.all(
            savesRes.data.map(async (save) => {
              const postRes = await axios.get(`http://localhost:8080/post/get-post/${save.post_id}`, { withCredentials: true });
              return postRes.data;
            })
          );
          setSavedPosts(savedPostDetails);
        }
      } catch (err) {
        console.error("Failed to fetch user posts or saved posts:", err);
        setError("Failed to fetch post data");
      }
    };

    fetchPosts();
  }, [self, accountId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

 
  return (
    <div className="profile-container">
      {self && <h2>My Profile</h2>}
      <div className="profile-header">
        <img src={profile.avatar} alt="User Avatar" className="profile-avatar" />
        <div className="profile-details">
          <h1>{profile.username}</h1>
          {self && <p><strong>Phone Number:</strong> {profile.phoneNumber}</p>}
          <p><strong>Major:</strong> {profile.major}</p>
          {self && <p><strong>Year Created:</strong> {profile.yearCreated}</p> }
        </div>
      </div>

      <div className="profile-posts">
        <h2>{self ? "My Posts" : "Their Posts"}</h2>
        <PostList posts={userPosts} />

        {self && (
          <>
            <h2>Saved Posts</h2>
            <PostList posts={savedPosts} />
          </>
        )}
      </div>
    </div>
  );
}


export default Profile;
