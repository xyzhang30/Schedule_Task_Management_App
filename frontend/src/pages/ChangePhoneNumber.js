import React, { useState } from 'react';
import axios from 'axios';

const ChangePhoneNumber = () => {
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new URLSearchParams();
      formData.append('new_number', newPhoneNumber);

      const response = await axios.post('http://localhost:8080/auth/change_number', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true
      });

      if (response.status === 201) {
        setSuccess('Phone number successfully changed!');
      } else {
        setError('Failed to change phone number. Please try again.');
      }
    } catch (error) {
      setError('Failed to change phone number. Please try again.');
    }
  };

  return (
    <div>
      <h2>Change Phone Number</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>New Phone Number:</label>
          <input
            type="text"
            value={newPhoneNumber}
            onChange={(e) => setNewPhoneNumber(e.target.value)}
            required
          />
        </div>
        <button type="submit">Change Phone Number</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default ChangePhoneNumber;