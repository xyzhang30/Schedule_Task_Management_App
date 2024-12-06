import React, { useState } from 'react';
import axios from 'axios';

const baseUrl = process.env.REACT_APP_BASE_URL;

const ChangeEmail = () => {
  const [newEmail, setNewEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // saves new email in the database
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new URLSearchParams();
      formData.append('new_email', newEmail);

      const response = await axios.post(`${baseUrl}/account/change_email`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true
      });

      if (response.status === 201) {
        setSuccess(response.data.msg);
        setError('')
      } else {
        setError(response.data.msg);
        setSuccess('')
      }
    } catch (error) {
      setError('Failed to change email. Please try again.');
      setSuccess('')
    }
  };

  return (
    <div className='edit-profile-pages'>
      <h2>Change Email</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>New Email:</label>
          <input
            type="text"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Change Email</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default ChangeEmail;
