import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Profile() {
  const [profile, setProfile] = useState({
    username: '',
    phoneNumber: '',
    yearCreated: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const usernameRes = await axios.get('http://localhost:8080/account/get_username', { withCredentials: true });
        const phoneNumberRes = await axios.get('http://localhost:8080/account/get_phone_number', { withCredentials: true });
        const yearCreatedRes = await axios.get('http://localhost:8080/account/get_year', { withCredentials: true });

        setProfile({
          username: usernameRes.data.username,
          phoneNumber: phoneNumberRes.data.phone_number,
          yearCreated: yearCreatedRes.data.year_created
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
        <strong>Year Created:</strong> {profile.yearCreated}
      </div>
    </div>
  );
}

export default Profile;
