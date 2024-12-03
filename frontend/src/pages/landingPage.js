import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './landingPage.css';

const LandingPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get('http://localhost:8080/auth/session_status', { withCredentials: true });
        setIsLoggedIn(response.data.loggedIn);
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };

    checkSession();
  }, []);

  // Animation for title display
  useEffect(() => {
    const text = "W elcome to Task Manager";
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length - 1) {
        setTitle((prev) => prev + text[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100); // Adjust speed (100ms per letter)

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  return (
    <div className="landing-page">
      <div className="hero-banner">
        <h1 className="animated-title">{title}</h1>
        <p>The perfect tool to organize your life.</p>
        <div className="cta-buttons">
          {!isLoggedIn ? (
            <>
              <button className="btn" onClick={() => navigate('/register')}>
                Sign Up
              </button>
              <button className="btn" onClick={() => navigate('/login')}>
                Log In
              </button>
              <button className="btn" onClick={() => navigate('/forgot-password')}>
                Forgot Password
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => navigate('/profile')}>
                View Profile
              </button>
              <button className="btn" onClick={() => navigate('/settings')}>
                Account Settings
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
