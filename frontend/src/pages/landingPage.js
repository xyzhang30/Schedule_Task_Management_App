import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './landingPage.css';

const LandingPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Check if the user is logged in by calling the session_status endpoint
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get('http://localhost:8080/auth/session_status', { withCredentials: true });
        if (response.data.loggedIn) {
          setIsLoggedIn(true);  // Set the state to true if the user is logged in
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };

    checkSession();
  }, []);

  return (
    <div className="landing-page">
      <section className="hero-banner">
        <h1>Master Your College Life</h1>
        <p>Organize your academic and personal life with ease.</p>
        {!isLoggedIn ? (
          <div className="cta-buttons">
            <button className="btn sign-up" onClick={() => navigate('/register')}>Sign Up</button>
            <button className="btn log-in" onClick={() => navigate('/login')}>Log In</button>
            <button className="btn forgot-password" onClick={() => navigate('/forgot-password')}>Forgot Password</button>
          </div>
        ) : (
          <div className="cta-buttons">
            <button className="btn log-out" onClick={() => navigate('/logout')}>Log Out</button>
            <button className="btn change-username" onClick={() => navigate('/change-username')}>Change Username</button>
            <button className="btn change-email" onClick={() => navigate('/change-email')}>Change Email</button>
            <button className="btn change-password" onClick={() => navigate('/change-password')}>Change Password</button>
            <button className="btn change-phone" onClick={() => navigate('/change-phone-number')}>Change Phone Number</button>
            <button className="btn forgot-password" onClick={() => navigate('/forgot-password')}>Forgot Password</button>
            <button className="btn profile" onClick={() => navigate('/profile')}>View Your Profile</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default LandingPage;
