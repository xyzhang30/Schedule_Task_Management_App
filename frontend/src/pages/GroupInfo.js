import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// TODO: write admin EVENT POPUP BUTTONS
// TODO: handle onAttend button (need to create function attendEvent in groupController.py)
// TODO: add event location and description
// TODO: add group description

const baseUrl = process.env.REACT_APP_BASE_URL;

const GroupInformationPage = () => {
  const location = useLocation();
  const group = location.state?.groupData;
  const scrollToEvent = location.state?.scrollToEvent || null;
  const eventRefs = useRef([]);

  const [groupId, setGroupId] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [isEventPopupOpen, setEventPopupOpen] = useState(false);
  const [isEditPopupOpen, setEditPopupOpen] = useState(false);
  const [isCreatePopupOpen, setCreatePopupOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestGroupSuccess, setRequestGroupSuccess] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [deleteGroupSuccess, setDeleteGroupSuccess] = useState(false);
  const [leaveGroupSuccess, setLeaveGroupSuccess] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        // const response = await axios.get(`${baseUrl}/group/to-group/${groupId}`);
        setGroupId(group.group_id);
        setEvents(group.events);
        if (group.is_admin) {
          setUserRole('admin');
        } else if (group.is_member) {
          setUserRole('member');
        } else {
          setUserRole('guest');
        }
        console.log("__GROUP__: ", group);
        console.log("__EVENTS__: ", events);
        console.log("__ROLE__: ", userRole);
        setLoading(false);

        return group;

      } catch (err) {
        console.error("Error fetching group: ", err);
        setError('Failed to fetch group.');
        setLoading(false);
      }
    };
    fetchGroup();
  }, [group, events]);

  useEffect(() => {
    const filtered = events.filter(event => 
      event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      event.event_id === searchTerm
    );
    console.log("____FILTERING: ", filtered);
    setFilteredEvents(filtered);
    console.log("111 FILTERED 111: ", filteredEvents);
  }, [events, searchTerm]);

  useEffect(() => {
    if (scrollToEvent && eventRefs.current[scrollToEvent]) {
      eventRefs.current[scrollToEvent].scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scrollToEvent]);

  if (loading) {
    return <div>Loading group info...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleGroupEdit = () => {
    setEditPopupOpen(true);
  };

  // const handleMembersView = () => {
  //   // navigate to group member page
  //   navigate(`/group-member`, { state: { groupData } });
  // };

  const handleEventClick = async (eventId) => {
    const response = await axios.get(`${baseUrl}/group/to-event/${groupId}/${eventId}`);
    console.log("_____SELECT: ", response.data);
    setSelectedEvent(response.data);
    console.log("__SELECTEDEVENT__: ", selectedEvent);

    if (response.data.registered) {
      setUserStatus('registered');
    } else {
      setUserStatus('notRegistered');
    }
    console.log("__REGISTR__: ", userStatus);

    setEventPopupOpen(true);
  };

  const onRequestClose = () => {
    setEventPopupOpen(false);
  };

  const handleGroupRequest = async () => {
    try {
      const response = await axios.get(`${baseUrl}/group/request-join/${groupId}`);
      if (response.status === 200) {
        setRequestGroupSuccess(true);
      }
    } catch (error) {
      console.error('Error requesting to join group:', error);
      setRequestGroupSuccess(false);
    }
    setMessageVisible(true);
    setTimeout(() => {setMessageVisible(false);}, 3000)
  };

  const handleEventRegister = async (eventId) => {
    try {
      const response = await axios.get(`${baseUrl}/group/register-event/${groupId}/${eventId}`);
      if (response.status === 200) {
        setRegisterSuccess(true);
      }
    } catch (error) {
      console.error('Error registering event:', error);
      setRegisterSuccess(false);
    }
    setMessageVisible(true);
    setTimeout(() => {setMessageVisible(false);}, 3000)
  };

  const handleGroupDelete = async () => {
    try {
      const response = await axios.get(`${baseUrl}/group/delete-group/${groupId}`);
      if (response.status === 200) {
        setDeleteGroupSuccess(true);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      setDeleteGroupSuccess(false);
    }
    setMessageVisible(true);
    setTimeout(() => {setMessageVisible(false);}, 3000)
  };

  const handleGroupLeave = async () => {
    try {
      const response = await axios.get(`${baseUrl}/group/leave-group/${groupId}`);
      if (response.status === 200) {
        setLeaveGroupSuccess(true);
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      setLeaveGroupSuccess(false);
    }
    setMessageVisible(true);
    setTimeout(() => {setMessageVisible(false);}, 3000)
  };

  return (
    <div className="group-info-page">
        <h1>{group.group_name}</h1>
        <img src={group.group_avatar} alt={`${group.group_name} avatar`} />
        <p>Year Created: {group.year_created}</p>
        <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={handleSearch}
        />
        <div className="group-page-content">
            <div className="left-panel">
                {filteredEvents.map(event => (
                    <div 
                        key={event.event_id} 
                        ref={(el) => (eventRefs.current[event.event_id] = el)} 
                        className="event-block" onClick={() => handleEventClick(event.event_id)}
                    >
                        <h2>{event.event_name}</h2>
                        <p>{event.start_date_time} - {event.end_date_time}</p>
                    </div>
                ))}

                {isEventPopupOpen && selectedEvent && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>{selectedEvent.event_name}</h2>
                            <p><strong>Date and Time:</strong> {selectedEvent.start_date_time} - {selectedEvent.end_date_time}</p>
                            {userRole === 'guest' && userStatus === 'notRegistered' && (
                              <>
                                <button onClick={handleGroupRequest}>Request to Join Group</button>
                                {messageVisible && requestGroupSuccess && <p style={{ color: 'green' }}>You have successfully sent the join request!</p>}
                                {messageVisible && !requestGroupSuccess && <p style={{ color: 'red' }}>Error: Could not join the group. Please try again later.</p>}
                              </>
                            )}
                            {userRole === 'member' && userStatus === 'notRegistered' (
                              <>
                                <button onClick={handleEventRegister}>Register</button>
                                {messageVisible && registerSuccess && <p style={{ color: 'green' }}>You have successfully registered for the event!</p>}
                                {messageVisible && !registerSuccess && <p style={{ color: 'red' }}>Error: Could not register the event. Please try again later.</p>}
                              </>
                            )}
                            {/* {userRole === 'admin' && userStatus === 'notRegistered' (
                              <>
                                <button onClick={onEdit}>Edit Event</button>
                                <button onClick={onCancel}>Cancel Event</button>
                                <button onClick={onRegister}>Register</button>
                              </>
                            )}
                            {userRole === 'admin' && userStatus === 'registered' (
                              <>
                                <button onClick={onEdit}>Edit Event</button>
                                <button onClick={onCancel}>Cancel Event</button>
                              </>
                            )} */}
                            <button onClick={onRequestClose}>Close</button>
                        </div>
                    </div>
                )}
            </div>
            <div className="right-panel">
                <div className="group-profile">
                    <h2>Group Profile</h2>
                    <p>{group.group_description}</p>
                    <p>Group Administrator: {group.group_administrator}</p>
                    {userRole === 'admin' && (
                        <>
                            {/* <button onClick={() => handleEditGroupClick(groupId)}>Edit Group</button> */}
                            {/* {group && (
                                <EditGroupPopup 
                                    isOpen={isEditPopupOpen} 
                                    onRequestClose={() => setEditPopupOpen(false)} 
                                    group={group}
                                    onEdit={async (newGroupName, newGroupAvatar) => {
                                        const response = await fetch(`${baseUrl}/edit-group/${group.group_id}`, {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({ new_group_name: newGroupName, new_group_avatar: newGroupAvatar }),
                                        });
                                        const data = await response.json();
                                        alert(data.message);
                                        if (response.ok) {
                                            setEditPopupOpen(false);
                                        }
                                    }}
                                />
                            )} */}
                            <button onClick={handleGroupDelete}>Delete Group</button>
                            {messageVisible && deleteGroupSuccess && <p style={{ color: 'green' }}>You have successfully deleted the group!</p>}
                            {messageVisible && !deleteGroupSuccess && <p style={{ color: 'red' }}>Error: Could not delete the group. Please try again later.</p>}
                            {/* <button onClick={handleCreateEvent}>Create Event</button>
                            <button onClick={handleManageMembers}>Manage Members</button> */}
                        </>
                    )}
                    {userRole === 'member' && (
                        <>
                            <button onClick={handleGroupLeave}>Leave Group</button>
                            {messageVisible && leaveGroupSuccess && <p style={{ color: 'green' }}>You have successfully left the group!</p>}
                            {messageVisible && !leaveGroupSuccess && <p style={{ color: 'red' }}>Error: Could not leave the group. Please try again later.</p>}
                            {/* <button onClick={handleViewMembers}>View Members</button> */}
                        </>
                    )}
                    {userRole === 'guest' && (
                        <>
                          <button onClick={handleGroupRequest}>Request to Join Group</button>
                          {messageVisible && requestGroupSuccess && <p style={{ color: 'green' }}>You have successfully sent the join request!</p>}
                          {messageVisible && !requestGroupSuccess && <p style={{ color: 'red' }}>Error: Could not send the request. Please try again later.</p>}
                        </>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default GroupInformationPage;
