import React, {useState, useEffect} from 'react';
import axios from 'axios';

const baseUrl = process.env.REACT_APP_BASE_URL;

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get(`${baseUrl}/friend/get-friends/1`);
        console.log("RESPONSE!!!: ", response.data)
        setFriends(response.data); 
        console.log("__FRIENDS__: ", friends)
        setLoading(false);
      } catch (err) {
        console.error("Error fetching friends:", err);
        setError('Failed to fetch friends.');
        setLoading(false);  // Set loading to false even if there's an error
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

  return (
    <div className="friends-page-container">
      <div className="friends-header">
        <h2>Friends</h2>
        <button className="add-friends-button">Add Friends</button>
      </div>
      <div className="search-bar">
        <input type="text" placeholder="Search friends" />
      </div>
      <div className="friends-list">
        <p>My Friends: </p>
        {loading ? (
          <p>Loading friends...</p>
        ) : friends.length > 0 ? (
          friends.map((friend, index) => (
            <div key={index} className="friend-item">
              <p>Name: {friend.username}</p>
            </div>
          ))
        ) : (
          <p>You haven't added any friends yet.</p>
        )}
      </div>
      <div className="friends-profile-section">
        <div className="profile-picture"></div>
        <div className="profile-info"></div>
      </div>
      <div className="friends-suggestions">
        <div className="suggestion-item"></div>
        <div className="suggestion-item"></div>
        <div className="suggestion-item"></div>
      </div>
    </div>
  );
};

export default Friends;