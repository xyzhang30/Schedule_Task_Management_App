// navbar.js

// npm install --save @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core
import React from 'react';
import './navbar.css'; // Ensure this path is correct
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceSmile, faHandshake, faTicket, faHome, faCalendar, faCog, faUsers, faInfoCircle, faCalendarAlt, faPeopleGroup, faCalendarCheck, faComments, faClock, faGifts,faInbox, faListCheck, faMusic } from '@fortawesome/free-solid-svg-icons';

const NavBar = () => {
  const navigateTo = (link) => {
    window.location.href = link;
  };

  return (
    <div className="navbar">
      <div className="sidebar">
        <button onClick={() => navigateTo('/profile')}>
          <FontAwesomeIcon icon={faHome} />
          <span>Home</span>
        </button>
        <button onClick={() => navigateTo('/calendar')}>
          <FontAwesomeIcon icon={faCalendar} />
          <span>Calendar</span>
        </button>
        <button onClick={() => navigateTo('/tasks')}>
          <FontAwesomeIcon icon={faListCheck} />
          <span>Tasks</span>
        </button>
        <button onClick={() => navigateTo('/event')}>
          <FontAwesomeIcon icon={faTicket} />
          <span>Event</span>
        </button>
        <button onClick={() => navigateTo('/friends')}>
          <FontAwesomeIcon icon={faFaceSmile} />
          <span>Friends</span>
        </button>
        <button onClick={() => navigateTo('/posts')}>
          <FontAwesomeIcon icon={faComments} />
          <span>Posts</span>
        </button>
        <button onClick={() => navigateTo('/groups')}>
          <FontAwesomeIcon icon={faPeopleGroup} />
          <span>Groups</span>
        </button>
        <button onClick={() => navigateTo('/availability')}>
          <FontAwesomeIcon icon={faHandshake} />
          <span>Availability</span>
        </button>
        <button onClick={() => navigateTo('/studytime')}>
          <FontAwesomeIcon icon={faClock} />
          <span>Study Time</span>
        </button>
        <button onClick={() => navigateTo('/inbox')}>
          <FontAwesomeIcon icon={faInbox} />
          <span>Inbox</span>
        </button>
        <button onClick={() => navigateTo('/spotify-login')}>
          <FontAwesomeIcon icon={faMusic} />
          <span>Spotify</span>
        </button>
      </div>
    </div>
  );
};

export default NavBar;
