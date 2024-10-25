import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseUrl = process.env.REACT_APP_BASE_URL;

const GroupIndexPage = () => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [groupEvents, setGroupEvents] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateGroupPopupOpen, setCreateGroupPopupOpen] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(`${baseUrl}/group/show-groups`);
        console.log("____RESPONSE: ", response.data);
        setGroups(response.data);
        console.log("__GROUPS__: ", groups);
        setLoading(false);
        return response.data;
      } catch (err) {
        console.error("Error fetching groups: ", err);
        setError('Failed to fetch groups.');
        setLoading(false);
      }
    };
  
    fetchGroups();
  }, []);

  useEffect(() => {
    // console.log("__GROUPS__: ", groups);
    const filtered = groups.filter(group => 
      group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      group.group_id === searchTerm
    );
    console.log("____FILTERING: ", filtered);
    setFilteredGroups(filtered);
    console.log("111 FILTERED 111: ", filteredGroups);
  }, [groups, searchTerm]);

  // useEffect(() => {
  //   console.log("222 FILTERED 222: ", filteredGroups);
  // }, [groups]);

  useEffect(() => {

    const loadEventsForGroup = async (group_id) => {
      try {
        const response = await axios.get(`${baseUrl}/group/show-events/${group_id}`);
        setGroupEvents((prevState) => ({
          ...prevState,
          [group_id]: response.data,
        }));
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    filteredGroups.forEach(group => {
      if (groupEvents[group.group_id] === undefined) {
        loadEventsForGroup(group.group_id);
      }
    });
  }, [filteredGroups, groupEvents]);

  if (loading) {
    return <div>Loading groups...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleGroupClick = async (group_id) => {
    try {
      const response = await axios.get(`${baseUrl}/group/to-group/${group_id}`);
      const groupData = await response.data;

      navigate(`/group-info`, { state: { groupData } });
    } catch (error) {
      console.error('Failed to fetch group data:', error);
    }
  };

  const handleEventClick = async (group_id, event_id) => {
    try {
      const response = await axios.get(`${baseUrl}/group/to-group/${group_id}`);
      const groupData = await response.data;

      navigate(`/group-info`, { state: { groupData, scrollToEvent: event_id } });
    } catch (error) {
      console.error('Failed to fetch group data:', error);
    }
  };

  const handleGroupCreate = async () => {
    try {
      const response = await axios.get(`${baseUrl}/group/create-group`);
      const groupData = await response.data;

      setCreateGroupPopupOpen(true);
    } catch (error) {
      console.error('Failed to fetch group data:', error);
    }
  };

  return (
    <div className="group-index-page-container">
        <div className="group-index-header">
            <h2>Groups</h2>
            <button className="create-group-button" onClick={handleGroupCreate}>Create Group </button>
        </div>
        <div>
            <input 
                type="text" 
                placeholder="Search by group ID or name..." 
                value={searchTerm} 
                onChange={handleSearch} 
            />
            <div className="group-list">
                <div className="group-info">
                    {filteredGroups.map(group => (
                        <div key={group.group_id} className="group-card">
                            <h2 onClick={() => handleGroupClick(group.group_id)}>{group.group_name}</h2>
                            <p>Group ID: {group.group_id}</p>
                            <p>Administrator: {group.group_administrator}</p>
                        </div>
                    ))}
                </div>
                <div className="group-events">
                    {filteredGroups.map(group => (
                        <div key={group.group_id} className="event-card">
                            <h2>Upcoming Events for {group.group_name}</h2>
                            {groupEvents[group.group_id] ? (
                                groupEvents[group.group_id].map(event => (
                                    <div key={event.event_id}>
                                        <h3 onClick={() => handleEventClick(group.group_id)}>{event.event_name}</h3>
                                        <p>{event.start_date} - {event.end_date}</p>
                                        <p>{event.start_time} - {event.end_time}</p>
                                    </div>
                                ))
                            ) : (
                                <p>Loading events...</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default GroupIndexPage;
