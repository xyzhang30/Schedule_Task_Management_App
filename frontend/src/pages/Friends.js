import React, {useState, useEffect} from 'react';
import axios from 'axios';
<<<<<<< HEAD
import './Friends.css'; 
=======
>>>>>>> 2c34212427baa19cbed54c8dabdc4e9e1bf4f8f5

const baseUrl = process.env.REACT_APP_BASE_URL;

const Friends = () => {
  const [friends, setFriends] = useState([]);
<<<<<<< HEAD
  const [allUsers, setAllUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [showAddFriendsPopup, setShowAddFriendsPopup] = useState(false); 
=======
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
>>>>>>> 2c34212427baa19cbed54c8dabdc4e9e1bf4f8f5

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get(`${baseUrl}/friend/get-friends/1`);
<<<<<<< HEAD
        setFriends(response.data); 
=======
        console.log("RESPONSE!!!: ", response.data)
        setFriends(response.data); 
        console.log("__FRIENDS__: ", friends)
>>>>>>> 2c34212427baa19cbed54c8dabdc4e9e1bf4f8f5
        setLoading(false);
      } catch (err) {
        console.error("Error fetching friends:", err);
        setError('Failed to fetch friends.');
<<<<<<< HEAD
        setLoading(false);
=======
        setLoading(false);  // Set loading to false even if there's an error
>>>>>>> 2c34212427baa19cbed54c8dabdc4e9e1bf4f8f5
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
                            // onClick={() => handleAddFriendClick(user.account_id)}
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