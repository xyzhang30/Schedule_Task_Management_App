import React, { useState } from 'react';
import axios from 'axios';

const ChangePassword = () => {
  const [originalPassword, setOriginalPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new URLSearchParams();
      formData.append('original_password', originalPassword);
      formData.append('new_password', newPassword);

      const response = await axios.post('http://localhost:8080/auth/change_password', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true
      });

      if (response.status === 201) {
        setSuccess('Password successfully changed!');
      } else {
        setError('Failed to change password. Please try again.');
      }
    } catch (error) {
      setError('Failed to change password. Please try again.');
    }
  };

  return (
    <div>
      <h2>Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Original Password:</label>
          <input
            type="password"
            value={originalPassword}
            onChange={(e) => setOriginalPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Change Password</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default ChangePassword;