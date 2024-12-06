import React, { useState } from 'react';
import { Link } from 'react-router-dom'
import axios from 'axios';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmedPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new URLSearchParams();
      formData.append('new_password', newPassword);
      formData.append('confirm_password', confirmNewPassword);

      const response = await axios.post('http://localhost:8080/auth/reset_password', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true
      });

      if (response.status === 201) {
        setSuccess('Password successfully reset! Login here: ');
        setError('');
      } else {
        setError('Failed to reset password. Please try again.');
        setSuccess('');
      }
    } catch (error) {
      setError('Failed to reset password. Please try again.');
    }
  };

  return (
    <div className='edit-profile-pages'>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Confirm New Password:</label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmedPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Reset Password</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && 
        <div>
            <p style={{ color: 'green' }}> {success}</p> 
            <Link to = "/login"> Login </Link>
        </div>}
    </div>
  );
};

export default ResetPassword;