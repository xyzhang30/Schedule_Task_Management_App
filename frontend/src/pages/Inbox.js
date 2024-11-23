import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Inbox.css';

const baseUrl = process.env.REACT_APP_BASE_URL;

const Inbox = () => {
  const [requests, setRequests] = useState([]);
  const [eventNotifications, setEventNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFriendRequestNotifications();
    fetchEventNotifications();

    
    const interval = setInterval(() => {
      fetchEventNotifications();
    }, 300000); 

    return () => clearInterval(interval);
  }, []);

  const fetchFriendRequestNotifications = async () => {
    try {
      const response = await axios.get(`${baseUrl}/friend_request/get-requests`, { withCredentials: true });
      setRequests(response.data);
    } catch (err) {
      console.error("Error fetching friend request notifications:", err);
      setError('Failed to fetch friend request notifications.');
    }
  };

  const fetchEventNotifications = async () => {
    try {
      const response = await axios.get(`${baseUrl}/event_inbox/get-notifications`, { withCredentials: true });
      setEventNotifications(response.data);
    } catch (err) {
      console.error("Error fetching event notifications:", err);
      setError('Failed to fetch event notifications.');
    }
  };

  const handleAcceptRequest = async (account_id, request_id) => {
    try {
      const formData = new FormData();
      formData.append("account_id2", account_id);
      await axios.post(`${baseUrl}/friend/add-friend`, formData, { withCredentials: true });

      await removePendingStatus(request_id);
      fetchFriendRequestNotifications();
    } catch (err) {
      console.error('Error adding friend:', err);
      setError('Failed to add friend.');
    }
  };

  const handleDeclineRequest = async (request_id) => {
    try {
      await removePendingStatus(request_id);
      fetchFriendRequestNotifications();
    } catch (err) {
      console.error('Error declining request:', err);
      setError('Failed to decline request.');
    }
  };

  const removePendingStatus = async (request_id) => {
    try {
      const formData = new FormData();
      formData.append("request_id", request_id);
      await axios.post(`${baseUrl}/friend_request/update-request`, formData, { withCredentials: true });
    } catch (err) {
      console.error('Error updating friend request status:', err);
      setError('Failed to update friend request status.');
    }
  };

  const handleDeleteEventNotification = async (notification_id) => {
    try {
      const data = { notification_id };
      await axios.post(`${baseUrl}/event_inbox/delete-notification`, data, { withCredentials: true });
      fetchEventNotifications();
    } catch (err) {
      console.error('Error deleting event notification:', err);
      setError('Failed to delete event notification.');
    }
  };


  const groupedNotifications = eventNotifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedNotifications).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  return (
    <div className="inbox-container">
      <h2>Inbox</h2>
      {error && <p className="error-message">{error}</p>}


      <div className="friend-requests-list">
        <h3>Friend Requests</h3>
        {requests.length > 0 ? (
          requests.map((request) => (
            <div key={request.notification_id} className="request-item">
              <p>
                User {request.account_id_from} {request.message}
              </p>
              <p>Received at: {new Date(request.created_at).toLocaleString()}</p>
              <div className="request-actions">
                <button
                  className="accept-button"
                  onClick={() => handleAcceptRequest(request.account_id_from, request.notification_id)}
                >
                  Accept
                </button>
                <button
                  className="decline-button"
                  onClick={() => handleDeclineRequest(request.notification_id)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No new friend requests.</p>
        )}
      </div>


      <div className="event-notifications">
        <h3>Event Notifications</h3>
        {eventNotifications.length > 0 ? (
          <div className="event-notifications-list">
            {sortedDates.map((date) => (
              <div key={date} className="notification-date-group">
                <h4>{date}</h4>
                {groupedNotifications[date].map((notification) => (
                  <div key={notification.notification_id} className="notification-item">
                    <p>{notification.message}</p>
                    <p>Time: {new Date(notification.created_at).toLocaleTimeString()}</p>
                    <div className="notification-actions">
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteEventNotification(notification.notification_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p>No new event notifications.</p>
        )}
      </div>
    </div>
  );
};

export default Inbox;
