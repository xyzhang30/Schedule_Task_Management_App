import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const usernameRes = await axios.get('http://localhost:8080/account/get_username', { withCredentials: true });
        const phoneNumberRes = await axios.get('http://localhost:8080/account/get_phone_number', { withCredentials: true });
        const majorRes = await axios.get('http://localhost:8080/account/get_major')
        const yearCreatedRes = await axios.get('http://localhost:8080/account/get_year', { withCredentials: true });

        const avatarRes = await axios.get('http://localhost:8080/account/get_avatar', { 
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="profile">
      <h1>User Profile</h1>
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
      <div className="profile-attribute">
        <strong>Avatar:</strong>
        <img src={profile.avatar} alt="User Avatar" className="avatar-image" height = "230" width = "300" />
      </div>
    </div>
  );
}

export default Profile;
