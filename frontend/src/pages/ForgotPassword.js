import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new URLSearchParams();
      formData.append('email', email);

      const response = await axios.post('http://localhost:8080/auth/forgot_password', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true
      });

      if (response.status === 200) {
        setSuccess(response.data.msg);
        setError('');
      } else {
        setError(response.data.msg);
        setSuccess('');
      }
    } catch (error) {
      setError('Failed to send an email with a reset link. Please try again');
    }
  };

  return (
    <div className='edit-profile-pages'>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Enter your email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Forgot Password</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default ForgotPassword;