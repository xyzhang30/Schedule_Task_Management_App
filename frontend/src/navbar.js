import React, { useState } from 'react';
import './navbar.css'; // You can create this file for styling

const NavBar = () => {
  // const [navExpanded, setNavExpanded] = useState(false); // State for nav bar expansion

  // const toggleNav = () => {
  //   setNavExpanded(!navExpanded);
  // };
  const navigateTo = (link) => {
    const fullLink = `http://localhost:3000${link}`;
    console.log(`Navigating to ${fullLink}`);
    window.location.href = fullLink;

  };
  
  return (
    <div className="navbar">
      <div className="sidebar">
        <button onClick={() => navigateTo(``)}><i className="fas fa-home"></i> <span>Home</span></button>
        <button onClick={() => navigateTo('/tasks')}><i className="fas fa-calendar"></i> <span>Tasks</span></button>
        <button onClick={() => navigateTo('/posts')}><i className="fas fa-cog"></i> <span>Posts</span></button>
        <button onClick={() => navigateTo('/friends')}><i className="fas fa-info-circle"></i> <span>Friends</span></button>
        <button onClick={() => navigateTo('/event')}><i className="fas fa-info-circle"></i> <span>Events</span></button>
        <button onClick={() => navigateTo('/availability')}><i className="fas fa-info-circle"></i> <span>Availability</span></button>
      </div>
      </div>  
      
   
  );
  


    
      
};





export default NavBar;
