import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './Friends.css'; 

const baseUrl = process.env.REACT_APP_BASE_URL;

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [showAddFriendsPopup, setShowAddFriendsPopup] = useState(false); 
  const [requestedFriends, setRequestedFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get(`${baseUrl}/friend/get-friends/1`);
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

  const handleAddFriendClick = async (account_id) => {
    try {
      console.log("____ACCOUNTID: ", account_id)
      // const response = await axios.post(`${baseUrl}/friend_request/send-request`, {
      //   account_id_to: account_id, //default to 1 as dummy user now
      //   account_id_from: 1,
      //   message: "requested to add you as a friend"
      // });
      const formData = new FormData();
      formData.append("account_id_from", 1);  // Replace this with the actual user ID in production
      formData.append("account_id_to", account_id);
      formData.append("message", "requested to add you as a friend");

      const response = await axios.post(`${baseUrl}/friend_request/send-request`, formData, {
          // headers: {
          //     'Content-Type': 'multipart/form-data', // Specify the content type for FormData
          // }
      });
      // setFriends(response.data);
      setRequestedFriends((prevRequested) => [...prevRequested, account_id]);
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
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Add Friends</h3>
            <button className="close-popup" onClick={toggleAddFriendsPopup}>Close</button>
            <div className="user-list">
              {allUsers.length > 0 ? (
                allUsers.map((user) => {
                  const isFriend = friends.some(friend => friend.account_id === user.account_id);
                  return (
                    <div key={user.account_id} className="user-item">
                      <div className="user-info">
                        <p>{user.username}</p>
                      </div>
                      <div className="user-action">
                        {isFriend ? (
                          <span className="friend-status">Friend</span>
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