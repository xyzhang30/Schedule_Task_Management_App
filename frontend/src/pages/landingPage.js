import React from 'react';
import './landingPage.css'; 

const LandingPage = () => {
  return (
    <div className="landing-page">
      
      {/* Hero Banner */}
      <section className="hero-banner">
        <h1>Master Your College Life</h1>
        <p>Organize your academic and personal life with ease.</p>
        <div className="cta-buttons">
          <button className="btn sign-up">Sign Up</button>
          <button className="btn log-in">Log In</button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;