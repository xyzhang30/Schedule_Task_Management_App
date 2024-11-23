// EventInbox.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EventInbox.css';

const baseUrl = process.env.REACT_APP_BASE_URL;

const EventInbox = () => {
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
      const response = await axios.get(`${baseUrl}/event_inbox/get_notifications`, { withCredentials: true });
      const notificationsData = response.data.notifications || [];

      // Convert created_at to Date objects
      notificationsData.forEach(notification => {
        notification.created_at = new Date(notification.created_at);
      });

      // Group notifications by date
      const grouped = notificationsData.reduce((acc, notification) => {
        const date = notification.created_at.toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(notification);
        return acc;
      }, {});

      setGroupedNotifications(grouped);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${baseUrl}/event_inbox/delete_notification/${notificationId}`, { withCredentials: true });
      // Refresh notifications after deletion
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="event-inbox">
      <h2>Inbox</h2>
      <div className="notifications-container">
        {Object.keys(groupedNotifications)
          .sort((a, b) => new Date(b) - new Date(a))
          .map((date) => (
            <div key={date} className="date-group">
              <h3>{date}</h3>
              {groupedNotifications[date]
                .sort((a, b) => b.created_at - a.created_at)
                .map((notification) => (
                  <div key={notification.notification_id} className="notification-item">
                    <div className="notification-content">
                      <p><strong>{notification.notification_type}</strong></p>
                      <p>{notification.message}</p>
                      <p>
                        From: <em>{notification.account_id_from === 0 ? 'System' : notification.account_id_from}</em>
                      </p>
                    </div>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteNotification(notification.notification_id)}
                    >
                      Mark as Read
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
