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

  useEffect(() => {
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
    fetchFriends();
  }, []); 

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

  const fetchFriendRequestNotifications = async () => {
    try {
      const requestsResponse = await axios.get(`${baseUrl}/friend_request/get-requests`, { withCredentials: true });
      console.log("REQUESTED: ", requestsResponse.data)
      setRequests(requestsResponse.data)
    } catch (err) {
      console.error("Error fetching friend request notifications:", err);
      setError('Failed to fetch friend request notifications.');
    }
  }

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

  const handleFriendClick = (friend) => {
    if (selectedFriend && selectedFriend.account_id === friend.account_id) {
      setSelectedFriend(null);
    } else {
      setSelectedFriend(friend); 
    }
  };

  const toggleAddFriendsPopup = () => {
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
      // setFriends(response.data);
      // setRequestedFriends((prevRequested) => [...prevRequested, account_id]);
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError('Failed to send friend request.');
    }
  };

  return (
    <div className="friends-page-container">
      <div className="friends-header">
        <h2>Friends</h2>
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
      </div>
      )}

      {showAddFriendsPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Friends</h3>
            <button className="close-popup" onClick={toggleAddFriendsPopup}>Close</button>
            <div className="user-list">
              {allUsers.length > 0 ? (
                allUsers.map((user) => {
                  const isFriend = friends.some(friend => friend.account_id === user.account_id);
                  const isRequested = pendingFriends.some(acc => acc.account_id === user.account_id);
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
                <p>Loading users...</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Friends;