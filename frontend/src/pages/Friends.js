import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './Friends.css'; 

const baseUrl = process.env.REACT_APP_BASE_URL;

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null); 
  const [searchQuery, setSearchQuery] = useState(''); 

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

  return (
    <div className="friends-page-container">
      <div className="friends-header">
        <h2>Friends</h2>
        <button className="add-friends-button">Add Friends</button>
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
    </div>
  );
};

export default Friends;