import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Inbox.css';

const baseUrl = process.env.REACT_APP_BASE_URL;

const Inbox = () => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [groupRequests, setGroupRequests] = useState([]);
  const [eventNotifications, setEventNotifications] = useState([]);
  const [taskNotifications, setTaskNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFriendRequestNotifications();
    fetchGroupRequestNotifications();
    fetchEventNotifications();
    fetchTaskNotifications();
    
    const interval = setInterval(() => {
      fetchEventNotifications();
      fetchTaskNotifications();
    }, 300000); 

    return () => clearInterval(interval);
  }, []);

  const fetchFriendRequestNotifications = async () => {
    try {
      const requestsResponse = await axios.get(`${baseUrl}/friend_request/get-requests`, { withCredentials: true });
      console.log("Friend Requests: ", requestsResponse.data);
      setFriendRequests(requestsResponse.data);
    } catch (err) {
      console.error("Error fetching friend request notifications:", err);
      setError('Failed to fetch friend request notifications.');
    }
  };

  const handleFriendAcceptRequest = async (account_id, request_id) => {
    try {
      const formData = new FormData();
      formData.append("account_id2", account_id);
      await axios.post(`${baseUrl}/friend/add-friend`, formData, { withCredentials: true });

      await removeFriendPendingStatus(request_id);
      fetchFriendRequestNotifications();
    } catch (err) {
      console.error('Error adding friend:', err);
      setError('Failed to add friend.');
    }
  };

  const handleFriendDeclineRequest = async (request_id) => {
    try {
      await removeFriendPendingStatus(request_id);
      fetchFriendRequestNotifications();
    } catch (err) {
      console.error('Error declining request:', err);
      setError('Failed to decline request.');
    }
  };

  const removeFriendPendingStatus = async (request_id) => {
    try {
      const formData = new FormData();
      formData.append("request_id", request_id);
      await axios.post(`${baseUrl}/friend_request/update-request`, formData, { withCredentials: true });
    } catch (err) {
      console.error('Error updating friend request status:', err);
      setError('Failed to update friend request status.');
    }
  };

  const fetchGroupRequestNotifications = async () => {
    try {
      const requestsResponse = await axios.get(`${baseUrl}/group-request/show-in-request`, { withCredentials: true });
      console.log("Group Requests: ", requestsResponse.data);
      setGroupRequests(requestsResponse.data);
    } catch (err) {
      console.error("Error fetching group request notifications:", err);
      setError('Failed to fetch group request notifications.');
    }
  };

  const handleGroupAcceptRequest = async (request_id) => {
    try {
      const response = await axios.put(`${baseUrl}/group-request/accept-request/${request_id}`);
      console.log('Group request accepted:', response.data);

      fetchGroupRequestNotifications();
    } catch (err) {
      console.error('Error accept group request:', err);
      setError('Failed to accept group request.');
    }
  };

  const handleGroupDeclineRequest = async (request_id) => {
    try {
      const response = await axios.delete(`${baseUrl}/group-request/decline-request/${request_id}`);
      console.log('Group request declined:', response.data);

      fetchGroupRequestNotifications();
    } catch (err) {
      console.error('Error declining group request:', err);
      setError('Failed to decline group request.');
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
  // Sort event notifications by event_start_date
    const sortedEventNotifications = [...eventNotifications].sort((a, b) => {
    const dateA = new Date(a.event_start_date);
    const dateB = new Date(b.event_start_date);
    return dateA - dateB;
  });

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

  const groupedEventNotifications = eventNotifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {});

  const sortedEventDates = Object.keys(groupedEventNotifications).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const fetchTaskNotifications = async () => {
    try {
      const response = await axios.get(`${baseUrl}/task_inbox/get-task-notifications`, { withCredentials: true });
      setTaskNotifications(response.data);
    } catch (err) {
      console.error("Error fetching task notifications:", err);
      setError('Failed to fetch task notifications.');
    }
  };

  const handleDeleteTaskNotification = async (notification_id) => {
    try {
      const data = { notification_id };
      await axios.post(`${baseUrl}/task_inbox/delete-task-notification`, data, { withCredentials: true });
      fetchTaskNotifications();
    } catch (err) {
      console.error('Error deleting task notification:', err);
      setError('Failed to delete task notification.');
    }
  };

  const groupedTaskNotifications = taskNotifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {});

  const sortedTaskDates = Object.keys(groupedTaskNotifications).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  return (
    <div className="inbox-container">
      <h2>Inbox</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="friend-requests-list">
        {friendRequests.length > 0 ? (
          friendRequests.map((request) => (
            <div key={request.notification_id} className="request-item">
              <p>
                User {request.account_id_from} {request.message}
              </p>
              <p>Received at: {new Date(request.created_at).toLocaleString()}</p>
              <div className="request-actions">
                <button
                  className="accept-button"
                  onClick={() => handleFriendAcceptRequest(request.account_id_from, request.notification_id)}
                >
                  Accept
                </button>
                <button
                  className="decline-button"
                  onClick={() => handleFriendDeclineRequest(request.notification_id)}
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

      <div className="group-requests-list">
        {groupRequests.length > 0 ? (
          groupRequests.map((request) => (
            <div key={groupRequests.notification_id} className="request-item">
              <p>
                User {groupRequests.account_id_from} {request.message}
              </p>
              <p>Received at: {new Date(request.created_at).toLocaleString()}</p>
              <p>For Group ID: {request.group_id}</p>
              <div className="request-actions">
                <button
                  className="accept-button"
                  onClick={() => handleGroupAcceptRequest(request.notification_id)}
                >
                  Accept
                </button>
                <button
                  className="decline-button"
                  onClick={() => handleGroupDeclineRequest(request.notification_id)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No new group requests.</p>
        )}
      </div>


      <div className="event-notifications">
        <h3>Event Notifications</h3>
        {eventNotifications.length > 0 ? (
          <div className="event-notifications-list">
            {sortedEventDates.map((date) => (
              <div key={date} className="notification-date-group">
                <h4>{date}</h4>
                {groupedEventNotifications[date].map((notification) => (
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


      <div className="task-notifications">
        <h3>Task Notifications</h3>
        {taskNotifications.length > 0 ? (
          <div className="task-notifications-list">
            {sortedTaskDates.map((date) => (
              <div key={date} className="notification-date-group">
                <h4>{date}</h4>
                {groupedTaskNotifications[date].map((notification) => (
                  <div key={notification.notification_id} className="notification-item">
                    <p>{notification.message}</p>
                    <p>Time: {new Date(notification.created_at).toLocaleTimeString()}</p>
                    <div className="notification-actions">
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteTaskNotification(notification.notification_id)}
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
          <p>No new task notifications.</p>
        )}
      </div>
    </div>
  );
};

export default Inbox;
