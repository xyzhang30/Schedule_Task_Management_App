import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    phone_number: '',
    year: ''  // Year field
  });
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const encodedData = new URLSearchParams(); // Creating form data
    for (const key in formData) {
      encodedData.append(key, formData[key]);
    }

    try {
      const response = await axios.post('http://localhost:8080/auth/register', encodedData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // Set content type to form data
        },
        withCredentials: true,
      });
      if (response.status === 200) {
        navigate('/login'); // Redirect to login after successful registration
      }
    } catch (error) {
      setErrorMessage('Registration failed. Please check the fields.');
    }
  };

  return (
    <div className="register-page">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <label>Phone Number:</label>
          <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
        </div>
        <div>
          <label>Year:</label>
          <input type="text" name="year" value={formData.year} onChange={handleChange} required />
        </div>
        <button type="submit">Register</button>
      </form>
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
};

export default Register;
