// navbar.js

// npm install --save @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core
import React from 'react';
import './navbar.css'; // Ensure this path is correct
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCalendar, faCog, faUsers, faInfoCircle, faCalendarAlt, faPeopleGroup, faCalendarCheck, faComments, faClock, faGifts,faInbox } from '@fortawesome/free-solid-svg-icons';

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
          <FontAwesomeIcon icon={faCalendarCheck} />
          <span>Tasks</span>
        </button>
        <button onClick={() => navigateTo('/calendar')}>
          <FontAwesomeIcon icon={faCalendar} />
          <span>Calendar</span>
        </button>
        <button onClick={() => navigateTo('/posts')}>
          <FontAwesomeIcon icon={faComments} />
          <span>Posts</span>
        </button>
        <button onClick={() => navigateTo('/friends')}>
          <FontAwesomeIcon icon={faUsers} />
          <span>Friends</span>
        </button>
        <button onClick={() => navigateTo('/event')}>
          <FontAwesomeIcon icon={faGifts} />
          <span>Events</span>
        </button>
        <button onClick={() => navigateTo('/groups')}>
          <FontAwesomeIcon icon={faPeopleGroup} />
          <span>Groups</span>
        </button>
        <button onClick={() => navigateTo('/studytime')}>
          <FontAwesomeIcon icon={faClock} />
          <span>Study Time</span>
        </button>
        <button onClick={() => navigateTo('/availability')}>
          <FontAwesomeIcon icon={faCalendarAlt} />
          <span>Availability</span>
        </button>
        <button onClick={() => navigateTo('/inbox')}>
          <FontAwesomeIcon icon={faInbox} />
          <span>Inbox</span>
        </button>
      </div>
    </div>
  );
};

export default NavBar;
