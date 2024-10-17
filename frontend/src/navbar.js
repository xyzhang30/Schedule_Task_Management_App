import React, { useState } from 'react';
import './navbar.css'; // You can create this file for styling

const NavBar = () => {
  const [navExpanded, setNavExpanded] = useState(false); // State for nav bar expansion

  const toggleNav = () => {
    setNavExpanded(!navExpanded);
  };

  return (
    <div className={`navbar ${navExpanded ? 'expanded' : ''}`}>
      <div className="navbar-header" onClick={toggleNav}>
        <h2>Menu</h2>
      </div>
      <div className="navbar-items">
        <a href="/">Landing Page</a>
        <a href="/friends">Friends</a>
        {/* Add more links as needed */}
      </div>
    </div>
  );
};

export default NavBar;
