import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EventInbox.css';

const baseUrl = process.env.REACT_APP_BASE_URL;

const EventInbox = () => {
  const [notifications, setNotifications] = useState([]);
  const [groupedNotifications, setGroupedNotifications] = useState({});

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${baseUrl}/event_inbox/get_notifications`);
      const notificationsData = response.data.notifications || [];

      // Group notifications by date
      const grouped = notificationsData.reduce((acc, notification) => {
        const date = new Date(notification.start_date).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(notification);
        return acc;
      }, {});

      setGroupedNotifications(grouped);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleDeleteNotification = (eventId) => {
    // Implement delete logic if notifications are stored
    setNotifications((prev) => prev.filter((n) => n.event_id !== eventId));
  };

  return (
    <div className="event-inbox">
      <h2>Event Inbox</h2>
      <div className="notifications-container">
        {Object.keys(groupedNotifications)
          .sort((a, b) => new Date(a) - new Date(b))
          .map((date) => (
            <div key={date} className="date-group">
              <h3>{date}</h3>
              {groupedNotifications[date]
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                .map((notification) => (
                  <div key={notification.event_id} className="notification-item">
                    <div className="notification-content">
                      <p><strong>{notification.title}</strong></p>
                      <p>Time: {new Date(notification.start_date).toLocaleTimeString()}</p>
                      <p>Location: {notification.location}</p>
                    </div>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteNotification(notification.event_id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
            </div>
          ))}
      </div>
    </div>
  );
};

export default EventInbox;
