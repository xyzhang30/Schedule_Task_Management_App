import React, { useState } from 'react';
import axios from 'axios';

const ChangeUsername = () => {
  const [newUsername, setNewUsername] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new URLSearchParams();
      formData.append('new_username', newUsername);

      const response = await axios.post('http://localhost:8080/auth/change_username', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true
      });

      if (response.status === 201) {
        setSuccess('Username successfully changed!');
      } else {
        setError('Failed to change username. Please try again.');
      }
    } catch (error) {
      setError('Failed to change username. Please try again.');
    }
  };

  return (
    <div>
      <h2>Change Username</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>New Username:</label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
          />
        </div>
        <button type="submit">Change Username</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default ChangeUsername;
