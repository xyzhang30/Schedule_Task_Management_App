import React, { useState } from 'react';
import axios from 'axios';

const ChangeMajor = () => {
  const [newMajor, setNewMajor] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new URLSearchParams();
      formData.append('new_major', newMajor);

      const response = await axios.post('http://localhost:8080/account/change_major', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true
      });

      if (response.status === 201) {
        setSuccess('Major successfully changed!');
      } else {
        setError('Failed to change major. Please try again.');
      }
    } catch (error) {
      setError('Failed to change major. Please try again.');
    }
  };

  return (
    <div className='edit-profile-pages'>
      <h2>Change Major</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>New Major:</label>
          <input
            type="text"
            value={newMajor}
            onChange={(e) => setNewMajor(e.target.value)}
            required
          />
        </div>
        <button type="submit">Change Major</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default ChangeMajor;
