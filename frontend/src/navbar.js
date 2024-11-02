// npm install --save @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core
import React from 'react';
import './navbar.css'; // Ensure this path is correct
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCalendar, faCog, faUsers, faInfoCircle, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

const NavBar = () => {
  const navigateTo = (link) => {
    window.location.href = link;
  };

  return (
    <div className="navbar">
      <div className="sidebar">
        <button onClick={() => navigateTo('/')}>
          <FontAwesomeIcon icon={faHome} />
          <span>Home</span>
        </button>
        <button onClick={() => navigateTo('/tasks')}>
          <FontAwesomeIcon icon={faCalendarAlt} />
          <span>Tasks</span>
        </button>
        <button onClick={() => navigateTo('/posts')}>
          <FontAwesomeIcon icon={faCog} />
          <span>Posts</span>
        </button>
        <button onClick={() => navigateTo('/friends')}>
          <FontAwesomeIcon icon={faUsers} />
          <span>Friends</span>
        </button>
        <button onClick={() => navigateTo('/event')}>
          <FontAwesomeIcon icon={faInfoCircle} />
          <span>Events</span>
        </button>
      </div>
    </div>
  );
};

export default NavBar;
