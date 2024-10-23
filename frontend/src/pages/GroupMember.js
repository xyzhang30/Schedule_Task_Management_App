import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom'; // To navigate to Group Information page

const GroupIndexPage = ({ currentUser }) => {
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const history = useHistory();

  useEffect(() => {
    // Fetch the list of groups and their events when the component loads
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/groups');
      const sortedGroups = sortGroups(response.data); // Sort by membership and alphabetically
      setGroups(sortedGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const sortGroups = (groupList) => {
    return groupList.sort((a, b) => {
      // Sort by user's membership first, then alphabetically by group_name
      if (a.is_member && !b.is_member) return -1;
      if (!a.is_member && b.is_member) return 1;
      return a.group_name.localeCompare(b.group_name);
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredGroups = groups.filter(
    group =>
      group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.group_id.toString().includes(searchTerm)
  );

  const navigateToGroupInfo = (groupId) => {
    history.push(`/groups/${groupId}`);
  };

  const navigateToEvent = (groupId, eventId) => {
    history.push(`/groups/${groupId}?eventId=${eventId}`);
  };

  return (
    <div>
      {/* Title and search bar */}
      <h1>Groups</h1>
      <input
        type="text"
        placeholder="Search by Group ID or Group Name"
        value={searchTerm}
        onChange={handleSearch}
      />

      <div style={{ display: 'flex' }}>
        {/* Left Side: List of group profiles */}
        <div style={{ width: '50%' }}>
          <h2>Groups</h2>
          {filteredGroups.map((group) => (
            <div key={group.group_id} className="group-block">
              <h3 onClick={() => navigateToGroupInfo(group.group_id)}>
                {group.group_name}
              </h3>
              <p>Group ID: {group.group_id}</p>
              <p>Administrator: {group.group_administrator}</p>
            </div>
          ))}
        </div>

        {/* Right Side: List of upcoming events for each group */}
        <div style={{ width: '50%' }}>
          <h2>Upcoming Events</h2>
          {filteredGroups.map((group) => (
            <div key={group.group_id} className="event-block">
              {group.events.length === 0 ? (
                <p>No upcoming events</p>
              ) : (
                group.events.map((event) => (
                  <div key={event.event_id}>
                    <h4 onClick={() => navigateToEvent(group.group_id, event.event_id)}>
                      {event.event_name}
                    </h4>
                    <p>{event.event_time}</p>
                    <p>{event.event_location}</p>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupIndexPage;
