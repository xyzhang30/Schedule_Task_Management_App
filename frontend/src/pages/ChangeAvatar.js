import React, { useState } from 'react';
import axios from 'axios';
import './EditProfileButtonPages.css'

const baseUrl = process.env.REACT_APP_BASE_URL;

const ChangeAvatar = () => {
  const [newAvatar, setNewAvatar] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // saves the new avatar in the database
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newAvatar) {
      setError('Please select an avatar file to upload.');
      setSuccess('');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('new_avatar', newAvatar);

      const response = await axios.post(`${baseUrl}/account/change_avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      if (response.status === 201) {
        setSuccess(response.data.msg || 'Avatar changed successfully.');
        setError('');
      } else {
        setError(response.data.msg || 'Failed to change avatar.');
        setSuccess('');
      }
    } catch (error) {
      setError('Failed to change avatar. Please try again.');
      setSuccess('');
    }
  };

  const handleFileChange = (e) => {
    setNewAvatar(e.target.files[0]);
  };

  return (
    <div className='edit-profile-pages'>
      <h2>Change Avatar</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>New Avatar:</label>
          <input
            type="file"
            onChange={handleFileChange}
            required
          />
        </div>
        <button type="submit">Change Avatar</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default ChangeAvatar;
