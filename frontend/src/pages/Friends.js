import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './Friends.css'; 
import '../App.css'
import './SplitScreen.css'

const baseUrl = process.env.REACT_APP_BASE_URL;

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [showAddFriendsPopup, setShowAddFriendsPopup] = useState(false); 
  const [requests, setRequests] = useState([]);
  const [pendingFriends, setPendingFriends] = useState([])
  const [showFriendRequestPopup, setShowFriendRequestPopup] = useState(false);
  const [addFriendSearchQuery, setAddFriendSearchQuery] = useState('')

  useEffect(() => {
    fetchFriends();
  }, []); 

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${baseUrl}/friend/get-friends`, {withCredentials: true});
      setFriends(response.data); 
      setLoading(false);
    } catch (err) {
      console.error("Error fetching friends:", err);
      setError('Failed to fetch friends.');
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading friends...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(`${baseUrl}/account`);
      setAllUsers(response.data); 
    } catch (err) {
      console.error("Error fetching all users:", err);
      setError('Failed to fetch all users.');
    }
  };

  const fetchUsernameById = async (id) => {
    try {
      const response = await axios.get(`${baseUrl}/account/name-by-id/${id}`, { withCredentials: true });
      return response.data; 
    } catch (err) {
      console.error(`Error fetching username for ID ${id}:`, err);
      return null;
    }
  };


  // const fetchFriendRequestNotifications = async () => {
  //   try {
  //     const requestsResponse = await axios.get(`${baseUrl}/friend_request/get-requests`, { withCredentials: true });
  //     setRequests(requestsResponse.data)
  //   } catch (err) {
  //     console.error("Error fetching friend request notifications:", err);
  //     setError('Failed to fetch friend request notifications.');
  //   }
  // };

  const fetchFriendRequestNotifications = async () => {
    try {
      const requestsResponse = await axios.get(`${baseUrl}/friend_request/get-requests`, { withCredentials: true });
      const requestsWithUsernames = await Promise.all(
        requestsResponse.data.map(async (request) => {
          const username = await fetchUsernameById(request.account_id_from);
          return { ...request, username };
        })
      );
      setRequests(requestsWithUsernames);
    } catch (err) {
      console.error("Error fetching friend request notifications:", err);
      setError('Failed to fetch friend request notifications.');
    }
  };


  const fetchPendingFriends = async () => {
    try {
      const response = await axios.get(`${baseUrl}/friend_request/get-pending-friends`, { withCredentials: true });
      setPendingFriends(response.data)
    }  catch (err) {
      console.error("Error fetching pending friends:", err);
      setError('Failed to fetch pending friends.');
    }
  }

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAccounts = allUsers.filter(user =>
    user.username.toLowerCase().includes(addFriendSearchQuery.toLowerCase())
  );

  const handleFriendClick = (friend) => {
    if (selectedFriend && selectedFriend.account_id === friend.account_id) {
      setSelectedFriend(null);
    } else {
      setSelectedFriend(friend); 
    }
  };

  const toggleAddFriendsPopup = () => {
    fetchPendingFriends();

    setShowAddFriendsPopup(!showAddFriendsPopup);
    if (!allUsers.length) {
      fetchAllUsers();
    }
  };

  const toggleFrendRequestPopup = () => {
    setShowFriendRequestPopup(!showFriendRequestPopup);
    fetchFriendRequestNotifications();
  }

  const handleAddFriendClick = async (account_id) => {
    try {
      const formData = new FormData();
      // formData.append("account_id_from", 8); 
      formData.append("account_id_to", account_id);
      formData.append("message", "requested to add you as a friend");

      const response = await axios.post(`${baseUrl}/friend_request/send-request`, formData, {withCredentials: true});
      fetchPendingFriends();
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError('Failed to send friend request.');
    }
  };

  const handleAcceptRequest = async (account_id, request_id) => {
    try {
      // adding the friend pair to friend table
      const formData = new FormData();
      formData.append("account_id2", account_id);
      const response = await axios.post(`${baseUrl}/friend/add-friend`, formData, {withCredentials: true});
      
      removePendingStatus(request_id);
      fetchFriendRequestNotifications();
      fetchFriends();
    } catch (err) {
      console.error('Error adding friends:', err);
      setError('Failed to add friends.');
    }
  };

  const handleDeclineRequest = async (request_id) => {
    try {
      removePendingStatus(request_id);
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
      const response = await axios.post(`${baseUrl}/friend_request/update-request`, formData, {withCredentials: true});
    } catch (err) {
      console.error('Error updating friend request pending status: ', err);
      setError('Failed to update friend request pending status.');
    }
  };

  const removeFriend = async (friendId) => {
    try {
      const response = await axios.delete(`${baseUrl}/friend/remove-friend?account_id2=${friendId}`, {
        withCredentials: true,
      });
      if (response.status === 200) {
        setFriends(friends.filter(friend => friend.account_id !== friendId));
        setSelectedFriend(null);
        alert(response.data.message);
      }
    } catch (err) {
      console.error('Error removing friend:', err);
      setError(err.response?.data?.error || 'Failed to remove friend.');
    }
  };


  return (
    <div className="split-screen-container">
      <div className="split-screen-content"> 
        <div className="split-screen-filter-container">
          <h2>Friends</h2>
          <div className="button-group">
          <button
            className='friend-request-button'
            onClick={toggleFrendRequestPopup}
            >
            Requests
          </button>
          <button 
            className="add-friends-button"
            onClick={toggleAddFriendsPopup}
            >
            Add Friends
          </button>
        </div>
      </div>

      <div className="split-screen-left">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search friends"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="friends-list">
          <p>My Friends: </p>
          {loading ? (
            <p>Loading friends...</p>
          ) : filteredFriends.length > 0 ? (
            filteredFriends.map((friend, index) => (
              <div 
                key={index} 
                className="friend-item"
                onClick={() => handleFriendClick(friend)}
              >
                <p>Name: {friend.username}</p>
              </div>
            ))
          ) : (
            <p>No friends found.</p>
          )}
        </div>
      </div>
      <div className="split-screen-right">
        {selectedFriend &&(
          <div className="friends-profile-section">
            <div className="profile-picture">
              <img src={selectedFriend.avatar} alt="Friend's Avatar" />
            </div>
            <div className="profile-info">
              <p>Name: {selectedFriend.username}</p>
              <p>Email: {selectedFriend.email}</p>
              <p>Phone: {selectedFriend.phone}</p>
            </div>
            <button 
              className="remove-friend-button" 
              onClick={() => removeFriend(selectedFriend.account_id)}
            >
              Remove Friend
            </button>
          </div>
        )}
      </div>

    </div>

      {showFriendRequestPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Friend Requests</h3>
            <button className="close-popup" onClick={toggleFrendRequestPopup}>Close</button>
            <div className="friend-requests-list">
              {requests.length > 0 ? (
                requests.map((request) => (
                  <div key={request.notification_id} className="request-item">
                    <p>{request.username} {request.message}.</p>
                    <p>{request.created_at}</p>
                    <div className="request-actions">
                      <button onClick={() => handleAcceptRequest(request.account_id_from, request.notification_id)}>Accept</button>
                      <button onClick={() => handleDeclineRequest(request.notification_id)}>Decline</button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No new friend requests.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddFriendsPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Friends</h3>
            <button className="close-popup" onClick={toggleAddFriendsPopup}>Close</button>
            
            <div>
              <input
                type='text'
                placeholder='Search users'
                value={addFriendSearchQuery}
                onChange={(e) => setAddFriendSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="user-list">
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((user) => {
                  const isFriend = friends.some(friend => friend.account_id === user.account_id);
                  const isRequested = pendingFriends.some(request => request.account_id_to === user.account_id);
                  return (
                    <div key={user.account_id} className="user-item">
                      <div className="user-info">
                        <p>{user.username}</p>
                      </div>
                      <div className="modal-actions">
                        {isFriend ? (
                          <span className="friend-status">Friend</span>
                        ) : isRequested ?(
                          <span className="friend-status">Requested</span> 
                        ) : (
                          <button 
                            className="add-friend-button" 
                            onClick={() => handleAddFriendClick(user.account_id)}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p>No users found.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Friends;