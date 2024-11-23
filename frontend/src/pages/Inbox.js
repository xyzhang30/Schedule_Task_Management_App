import React, { useState, useEffect } from 'react';
import axios from 'axios';

const baseUrl = process.env.REACT_APP_BASE_URL;

const Inbox = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFriendRequestNotifications();
  }, []);

  const fetchFriendRequestNotifications = async () => {
    try {
      const requestsResponse = await axios.get(`${baseUrl}/friend_request/get-requests`, { withCredentials: true });
      console.log("Friend Requests: ", requestsResponse.data);
      setRequests(requestsResponse.data);
    } catch (err) {
      console.error("Error fetching friend request notifications:", err);
      setError('Failed to fetch friend request notifications.');
    }
  };

  const handleAcceptRequest = async (account_id, request_id) => {
    try {
      // Adding the friend pair to the friend table
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

  return (
    <div className="inbox-container">
      <h2>Inbox</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="friend-requests-list">
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
    </div>
  );
};

export default Inbox;
