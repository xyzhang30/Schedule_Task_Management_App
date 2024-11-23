import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import './SplitScreen.css'
// import './Groups.css';

// TODO: add redirect to login page if not
// TODO: add login page constraint decorator in groupController

// TODO: give administrator right to add and delete members
// TODO: change backend group request
// TODO: add button accept request for group and request for event for admin

// TODO: filter group by alpha, event by date
// TODO: add group description
// TODO: consider group & event info to show in main page / modal
// TODO: how to upload an avatar when creating group / editing group


const baseUrl = process.env.REACT_APP_BASE_URL;

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [groupEvents, setGroupEvents] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);
    
    const [createGroupModal, setCreateGroupModal] = useState(false);
    const [newGroup, setNewGroup] = useState({ group_name: '', group_avatar: '' });

    const [selectedGroup, setSelectedGroup] = useState(null);

    const [editedGroup, setEditedGroup] = useState({ group_name: '', group_avatar: '' });
    const [editGroupModal, setEditGroupModal] = useState(false);

    const [createEventModal, setCreateEventModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ event_name: '', start_date_time: '', end_date_time: '', start_date: '', end_date: '', is_all_day: null });

    const [selectedEvent, setSelectedEvent] = useState(null);

    const [editEventModal, setEditEventModal] = useState(false);
    const [editedEvent, setEditedEvent] = useState({ event_name: '', start_date_time: '', end_date_time: '', start_date: '', end_date: '', is_all_day: null })


    
    // Fetch Groups - Runs once when the component mounts
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get(`${baseUrl}/group/show-groups`);
                console.log("____RESPONSE: ", response.data);
                setGroups(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching groups: ", err);
                setError('Failed to fetch groups.');
                setLoading(false);
            }
        };
        fetchGroups();
    }, []);

    // Filter Groups based on SearchTerm - Runs whenever 'groups' or 'searchTerm' changes
    useEffect(() => {
        if (groups.length) { // Check to ensure groups is not empty
            const filtered = groups.filter(group =>
                group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                group.group_id === searchTerm
            );
            console.log("____FILTER____: ", filtered);
            setFilteredGroups(filtered);
        }
    }, [groups, searchTerm]);

    // Fetch Events for each Group - Runs when 'filteredGroups' or 'groupEvents' changes
    useEffect(() => {
        const loadEventsForGroup = async (group_id) => {
            try {
                const response = await axios.get(`${baseUrl}/group/show-events/${group_id}`);
                setGroupEvents((prevState) => ({
                    ...prevState,
                    [group_id]: response.data,
                }));
                console.log("___EVENTS____: ", response.data);
            } catch (error) {
                console.error('Error fetching events:', error);
            }
        };

        if (filteredGroups.length) { // Ensure filteredGroups is not empty
            filteredGroups.forEach(group => {
                if (!groupEvents[group.group_id]) {
                    loadEventsForGroup(group.group_id);
                }
            });
        };
    }, [filteredGroups, groupEvents]);

    // Handler for search input
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    if (loading) {
        return <div>Loading groups...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    // Handle New Group Input
    const handleGroupInputChange = (e) => {
        setNewGroup({
            ...newGroup,
            [e.target.name]: e.target.value
        });
    };

    // Create New Group
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('group_name', newGroup.group_name);
            formData.append('group_avatar', newGroup.group_avatar);
    
            const response = await axios.post(`${baseUrl}/group/create-group`, formData);
            console.log('Group created:', response.data);

            const updatedGroups = await axios.get(`${baseUrl}/group/show-groups`);
            setGroups(updatedGroups.data);

            setCreateGroupModal(false);
            setNewGroup({ group_name: '', group_avatar: '' });
        } catch (err) {
            console.error('Failed to create group:', err);
        }
    };

    // Show Group Detail Info & Buttons for edit, delete, leave, request_join
    const handleGroupClick = async (e, group_id) => {
        console.log("_________E", e);
        console.log("_________GROUPID", group_id);
        try {
            const response = await axios.get(`${baseUrl}/group/to-group/${group_id}`);
            const groupData = await response.data;
            console.log('Group clicked:', groupData);
            setSelectedGroup(groupData);
        } catch (err) {
            console.error('Failed to fetch group data:', err);
        }
    };

    // Deselect Group
    const handleCloseGroup = async () => {
        if (!selectedGroup) return;
        setSelectedGroup(null);
    };

    // Show Edit Group Modal & Prepare Edit
    const handleEditGroupClick = async () => {
        setEditedGroup({
            group_name: selectedGroup.group_name,
            group_avatar: selectedGroup.group_avatar
        });
        setEditGroupModal(true);
    };

    // Edit Group
    const handleEditGroup = async (e) => {
        console.log('Edit group called')
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('group_name', editedGroup.group_name);
            formData.append('group_avatar', editedGroup.group_avatar);
    
            const response = await axios.put(`${baseUrl}/group/edit-group/${selectedGroup.group_id}`, formData);
            console.log('Group updated:', response.data);
    
            const updatedGroups = await axios.get(`${baseUrl}/group/show-groups`);
            setGroups(updatedGroups.data);
            
            setEditGroupModal(false);
            setEditedGroup({ group_name: '', group_avatar: '' });
        } catch (err) {
            console.error('Failed to edit group:', err);
        }
    };

    // Delete Group
    const handleDeleteGroup = async () => {
        if (!selectedGroup) return;
        
        const confirmDelete = window.confirm(`Are you sure you want to delete group: ${selectedGroup.group_name}?`);
        
        if (confirmDelete) {
            try {
                const response = await axios.delete(`${baseUrl}/group/delete-group/${selectedGroup.group_id}`);
                console.log('Group deleted:', response.data);
    
                const updatedGroups = await axios.get(`${baseUrl}/group/show-groups`);
                setGroups(updatedGroups.data);
                setSelectedGroup(null);
            } catch (err) {
                console.error('Failed to delete group:', err);
            }
        }
    };

    // Leave Group
    const handleLeaveGroup = async () => {
        try {
            const response = await axios.delete(`${baseUrl}/group/leave-group/${selectedGroup.group_id}`);
            console.log('Group left:', response.data);

            const updatedGroups = await axios.get(`${baseUrl}/group/show-groups`);
            setGroups(updatedGroups.data);
        } catch (err) {
            console.error('Failed to leave group:', err);
        }
    };

    // Request to Join Group
    const handleRequestGroup = async () => {
        try {
            const response = await axios.get(`${baseUrl}/group/request-join/${selectedGroup.group_id}`);
            console.log('Group requested:', response.data);

            // const updatedGroups = await axios.get(`${baseUrl}/group/show-groups`);
            // setGroups(updatedGroups.data);

        } catch (err) {
            console.error('Failed to request to join group:', err);
        }
    };

    // Handle New Event Input
    const handleEventInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "is_all_day") {
            const isAllDay = value === "true";
            setNewEvent({
                ...newEvent,
                is_all_day: isAllDay,
                start_date: isAllDay ? newEvent.start_date : '',
                end_date: isAllDay ? newEvent.end_date : '',
                start_date_time: !isAllDay ? newEvent.start_date_time : '',
                end_date_time: !isAllDay ? newEvent.end_date_time : '',
            });
        } else {
            setNewEvent({
                ...newEvent,
                [name]: value,
            });
        }
    };

    // Format date_time for display
    const formatDateTime = (timestamp) => {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    // Create New Event for a Group
    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('event_name', newEvent.event_name);
            if (newEvent.is_all_day) {
                formData.append('start_date_time', `${newEvent.start_date}T00:00`);
                formData.append('end_date_time', `${newEvent.end_date}T23:59`);
            } else {
                formData.append('start_date_time', newEvent.start_date_time);
                formData.append('end_date_time', newEvent.end_date_time);
            }
            formData.append('is_all_day', newEvent.is_all_day);
    
            const response = await axios.post(`${baseUrl}/group/create-event/${selectedGroup.group_id}`, formData);
            console.log('Event created:', response.data);
            
            const updatedEvents = await axios.get(`${baseUrl}/group/show-events/${selectedGroup.group_id}`);
            
            setGroupEvents((prevState) => ({
                ...prevState,
                [selectedGroup.group_id]: updatedEvents.data,
            }));
    
            setCreateEventModal(false);
            setNewEvent({ event_name: '', start_date_time: '', end_date_time: '', start_date: '', end_date: '', is_all_day: null });
        } catch (err) {
            console.error('Failed to create new event:', err);
        }
    };

    // Show Event Detail Info & Buttons for edit, cancel, register, unregister, request_join
    const handleEventClick = async (e, event_id) => {
        console.log("______EFOREVENT", e);
        console.log("_______EVENTID", event_id);
        try {
            const response = await axios.get(`${baseUrl}/group/to-event/${event_id}`);
            const eventData = await response.data;
            console.log('Group clicked:', eventData);
            setSelectedEvent(eventData);
        } catch (err) {
            console.error('Failed to fetch event data:', err);
        }
    };

    // Deselect Event
    const handleCloseEvent = async () => {
        if (!selectedEvent) return;
        setSelectedEvent(null);
    };

    // Show Edit Event Modal & Prepare Edit
    const handleEditEventClick = async () => {
        setEditedEvent({
            event_name: selectedEvent.event_name,

            start_date: selectedEvent.is_all_day ? new Date(selectedEvent.start_date).toISOString().slice(0, 10) : new Date(),
            end_date: selectedEvent.is_all_day ? new Date(selectedEvent.end_date).toISOString().slice(0, 10) : new Date(),

            start_date_time: selectedEvent.is_all_day ? new Date() : new Date(selectedEvent.start_date_time).toISOString().slice(0, 16),
            end_date_time: selectedEvent.is_all_day ? new Date() : new Date(selectedEvent.end_date_time).toISOString().slice(0, 16),

            is_all_day: selectedEvent.is_all_day
        });
    
        setEditEventModal(true);
    };

    // Edit Event
    const handleEditEvent = async (e) => {
        console.log('Edit event called')
        e.preventDefault();
        try {
            const formData = new FormData();
            if (editedEvent.is_all_day) {
                formData.append('start_date_time', `${editedEvent.start_date}T00:00`);
                formData.append('end_date_time', `${editedEvent.end_date}T23:59`);
            } else {
                formData.append('start_date_time', editedEvent.start_date_time);
                formData.append('end_date_time', editedEvent.end_date_time);
            }
            formData.append('is_all_day', editedEvent.is_all_day);

            const response = await axios.put(`${baseUrl}/group/edit-event/${selectedEvent.event_id}`, formData);
            console.log('Event updated:', response.data);
            
            const groupResponse = await axios.get(`${baseUrl}/group/get-group-id/${selectedEvent.event_id}`);
            const thisGroupID = groupResponse.data;
            const updatedEvents = await axios.get(`${baseUrl}/group/show-events/${thisGroupID}`);
            setGroupEvents((prevState) => ({
                ...prevState,
                [thisGroupID]: updatedEvents.data,
            }));
    
            setEditEventModal(false);
            setEditedEvent({ event_name: '', start_date_time: '', end_date_time: '', start_date: '', end_date: '', is_all_day: null });
        } catch (err) {
            console.error('Failed to create edit event:', err);
        }
    };

    // Cancel Event
    const handleCancelEvent = async () => {
        if (!selectedEvent) return;
        
        const confirmDelete = window.confirm(`Are you sure you want to cancel event: ${selectedEvent.event_name}?`);
        
        if (confirmDelete) {
            try {
                const groupResponse = await axios.get(`${baseUrl}/group/get-group-id/${selectedEvent.event_id}`);
                const thisGroupID = groupResponse.data;

                const response = await axios.delete(`${baseUrl}/group/cancel-event/${selectedEvent.event_id}`);
                console.log('Event deleted:', response.data);
                
                const updatedEvents = await axios.get(`${baseUrl}/group/show-events/${thisGroupID}`);
                setGroupEvents((prevState) => ({
                    ...prevState,
                    [thisGroupID]: updatedEvents.data,
                }));

                setSelectedEvent(null);
            } catch (err) {
                console.error('Failed to cancel event:', err);
            }
        }
    };

    // Register Event
    const handleRegisterEvent = async () => {
        try {
            const response = await axios.get(`${baseUrl}/group/register-event/${selectedEvent.event_id}`);
            console.log('Event registered:', response.data);

            const groupResponse = await axios.get(`${baseUrl}/group/get-group-id/${selectedEvent.event_id}`);
            const thisGroupID = groupResponse.data;
            const updatedEvents = await axios.get(`${baseUrl}/group/show-events/${thisGroupID}`);
            setGroupEvents((prevState) => ({
                ...prevState,
                [thisGroupID]: updatedEvents.data,
            }));

        } catch (err) {
            console.error('Failed to register for event:', err);
        }
    };

    // Drop Event
    const handleDropEvent = async () => {
        try {
            const response = await axios.delete(`${baseUrl}/group/drop-event/${selectedEvent.event_id}`);
            console.log('Event dropped:', response.data);

            const groupResponse = await axios.get(`${baseUrl}/group/get-group-id/${selectedEvent.event_id}`);
            const thisGroupID = groupResponse.data;
            const updatedEvents = await axios.get(`${baseUrl}/group/show-events/${thisGroupID}`);
            setGroupEvents((prevState) => ({
                ...prevState,
                [thisGroupID]: updatedEvents.data,
            }));

        } catch (err) {
            console.error('Failed to drop event:', err);
        }
    };



    return (
        <div className="group-index-page-container">
            <div className="group-index-header">
                <h2>Groups</h2>
                <button className="create-group-button" onClick={() => setCreateGroupModal(true)}>
                        Create Group
                </button>
            </div>
        
            <div>
                <input 
                    type="text" 
                    placeholder="Search by group ID or name..." 
                    value={searchTerm} 
                    onChange={(e) => handleSearch(e)} 
                />
                <div className="group-list">
                    {filteredGroups.map(group => (
                        <div key={group.group_id} className="group-section">
                            <div className="group-card">
                                <div className="profile-picture">
                                    <img src={group.avatar} alt="Group's Avatar" />
                                </div>
                                <div className="profile-info">
                                    <h2 onClick={(e) => handleGroupClick(e, group.group_id)}> {group.group_name} </h2>
                                    <p>ID: {group.group_id}</p>
                                    <p>Administrator: {group.admin_id}</p>
                                </div>
                            </div>
                            <div className="group-events">
                                {groupEvents[group.group_id] && groupEvents[group.group_id].length > 0 ? (
                                    groupEvents[group.group_id].map(event => (
                                        <div key={event.event_id} className="event-card">
                                            <h3 onClick={(e) => handleEventClick(e, event.event_id)}>
                                                {event.event_name}
                                            </h3>
                                            <p>{formatDateTime(event.start_date_time)} - {formatDateTime(event.end_date_time)}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p>No events available.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {createGroupModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create New Group</h2>
                        <form onSubmit={handleCreateGroup}>
                            <label>
                                Group Name:
                                <input 
                                    type="text" 
                                    name="group_name" 
                                    value={newGroup.group_name} 
                                    onChange={handleGroupInputChange} 
                                    required 
                                />
                            </label>
                            <label>
                                Avatar:
                                <input 
                                    type="text" 
                                    name="group_avatar" 
                                    value={newGroup.group_avatar} // how to upload a photo
                                    onChange={handleGroupInputChange} 
                                    required 
                                />
                            </label>
                            <div className="modal-actions">
                                <button type="submit">Create Group</button>
                                <button type="button" onClick={() => setCreateGroupModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="group-details">
                {selectedGroup ? (
                    <div className="group-details-content">
                        <div className="group-avatar">
                            <img src={selectedGroup.avatar} alt="Group's Avatar" />
                        </div>
                        <div className="group-profile">
                            <h2> {selectedGroup.group_name} </h2>
                            <p>ID: {selectedGroup.group_id}</p>
                            <p>Administrator: {selectedGroup.admin_id}</p>
                        </div>
                        <div className="group-actions">
                            {selectedGroup.is_admin && (
                                <>  
                                    <button onClick={() => setCreateEventModal(true)}>Create Event</button>
                                    <button onClick={() => handleEditGroupClick()}>Edit Group</button>
                                    <button onClick={() => handleDeleteGroup()}>Delete Group</button>
                                    {/* <button onClick={handleManageMembers}>Manage Members</button> */}
                                </>
                            )}
                            {selectedGroup.is_member && (
                                <>
                                    <button onClick={() => handleLeaveGroup()}>Leave Group</button>
                                    {/* <button onClick={handleViewMembers}>View Members</button> */}
                                </>
                            )}
                            {selectedGroup.is_guest && (
                                <>
                                    <button onClick={handleRequestGroup()}>Request to Join</button>
                                </>
                            )}
                            <button className='close-group-button' onClick={handleCloseGroup}>
                                Close
                            </button>
                        </div>

                    </div>
                ) : (
                    <p>Select a group to view details</p>
                )}
            </div>

            {editGroupModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Edit Group</h2>
                        <form onSubmit={handleEditGroup}>
                            <label>
                                Group Name:
                                <input 
                                    type="text" 
                                    name="group_name" 
                                    value={editedGroup.group_name} 
                                    onChange={(e) => setEditedGroup({ ...editedGroup, group_name: e.target.value })} 
                                    required 
                                />
                            </label>
                            <label>
                                Group Avatar:
                                <input
                                    type="text"   
                                    name="group_avatar" 
                                    value={editedGroup.group_avatar} 
                                    onChange={(e) => setEditedGroup({ ...editedGroup, category: e.target.value })} 
                                    required
                                />
                            </label>
                            <div className="modal-actions">
                                <button type="submit">Update Group</button>
                                <button type="button" onClick={() => setEditGroupModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {createEventModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create New Event</h2>
                        <form onSubmit={(e) => handleCreateEvent(e)}>
                            <label>
                                Event Name:
                                <input 
                                    type="text" 
                                    name="event_name" 
                                    value={newEvent.event_name} 
                                    onChange={handleEventInputChange} 
                                    required 
                                />
                            </label>
                            {newEvent.is_all_day ? (
                                <>
                                    <label>
                                        Start Date:
                                        <input 
                                            type="date" 
                                            name="start_date" 
                                            value={newEvent.start_date} 
                                            onChange={handleEventInputChange} 
                                            required 
                                        />
                                    </label>
                                    <label>
                                        End Date:
                                        <input 
                                            type="date" 
                                            name="end_date" 
                                            value={newEvent.end_date} 
                                            onChange={handleEventInputChange} 
                                            required 
                                        />
                                    </label>
                                </>
                            ) : (
                                <>
                                    <label>
                                        Start Date Time:
                                        <input 
                                            type="datetime-local" 
                                            name="start_date_time" 
                                            value={newEvent.start_date_time} 
                                            onChange={handleEventInputChange} 
                                            required 
                                        />
                                    </label>
                                    <label>
                                        End Date Time:
                                        <input 
                                            type="datetime-local" 
                                            name="end_date_time" 
                                            value={newEvent.end_date_time} 
                                            onChange={handleEventInputChange} 
                                            required 
                                        />
                                    </label>
                                </>
                            )}
                            <label>
                                Is All Day:
                                <div>
                                    <input
                                        type="radio"
                                        name="is_all_day"
                                        value="true"
                                        checked={newEvent.is_all_day === true}
                                        onChange={handleEventInputChange}
                                    />
                                    <label>Yes</label>
                                    <input
                                        type="radio"
                                        name="is_all_day"
                                        value="false"
                                        checked={newEvent.is_all_day === false}
                                        onChange={handleEventInputChange}
                                    />
                                    <label>No</label>
                                </div>
                            </label>
                            <div className="modal-actions">
                                <button type="submit">Create Event</button>
                                <button type="button" onClick={() => setCreateEventModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="event-details">
                {selectedEvent ? (
                    <div className="event-details-content">
                        <div className="event-profile">
                            <h2> {selectedEvent.event_name} </h2>
                            <p>ID: {selectedEvent.event_id}</p>
                            {/* <p>Organized by: {selectedGroup.group_name}</p> */}
                            <p>{formatDateTime(selectedEvent.start_date_time)} - {formatDateTime(selectedEvent.end_date_time)}</p>
                        </div>
                        <div className="event-actions">
                            {selectedEvent.is_admin && (
                                <>
                                    {selectedEvent.registered ? (
                                        <>
                                            <button onClick={() => handleDropEvent()}>Drop Registration</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => handleRegisterEvent()}>Register</button>
                                        </>
                                    )}
                                    <button onClick={() => handleEditEventClick()}>Edit Event</button>
                                    <button onClick={() => handleCancelEvent()}>Cancel Event</button>
                                </>
                            )}
                            {selectedEvent.is_member && (
                                <>
                                    {selectedEvent.registered ? (
                                        <>
                                            <button onClick={() => handleDropEvent()}>Drop Registration</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => handleRegisterEvent()}>Register</button>
                                        </>
                                    )}
                                </>
                            )}
                            {selectedEvent.is_guest && (
                                <>
                                    {selectedEvent.registered ? (
                                        <>
                                            <button onClick={() => handleDropEvent()}>Drop Registration</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => handleRequestGroup()}>Request to Join Group</button>
                                        </>
                                    )}
                                </>
                            )}
                            <button className='close-event-button' onClick={handleCloseEvent}>
                                Close
                            </button>
                        </div>

                    </div>
                ) : (
                    <p>Select an event to view details</p>
                )}
            </div>

            {editEventModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Edit Event</h2>
                        <form onSubmit={handleEditEvent}>
                            <label>
                                Event Name:
                                <input 
                                    type="text" 
                                    name="event_name" 
                                    value={editedEvent.event_name} 
                                    onChange={(e) => setEditedEvent({ ...editedEvent, event_name: e.target.value })} 
                                    required 
                                />
                            </label>

                            {editedEvent.is_all_day ? (
                                <>
                                    <label>
                                        Start Date:
                                        <input 
                                            type="date" 
                                            name="start_date" 
                                            value={editedEvent.start_date} 
                                            onChange={(e) => setEditedEvent({ ...editedEvent, start_date: e.target.value })} 
                                            required 
                                        />
                                    </label>
                                    <label>
                                        End Date:
                                        <input 
                                            type="date" 
                                            name="end_date" 
                                            value={editedEvent.end_date} 
                                            onChange={(e) => setEditedEvent({ ...editedEvent, end_date: e.target.value })} 
                                            required 
                                        />
                                    </label>
                                </>
                            ) : (
                                <>
                                    <label>
                                        Start Date Time:
                                        <input 
                                            type="datetime-local" 
                                            name="start_date_time" 
                                            value={editedEvent.start_date_time} 
                                            onChange={(e) => setEditedEvent({ ...editedEvent, start_date_time: e.target.value })} 
                                            required 
                                        />
                                    </label>
                                    <label>
                                        End Date Time:
                                        <input 
                                            type="datetime-local" 
                                            name="end_date_time" 
                                            value={editedEvent.end_date_time} 
                                            onChange={(e) => setEditedEvent({ ...editedEvent, end_date_time: e.target.value })} 
                                            required 
                                        />
                                    </label>
                                </>
                            )}

                            <label>
                                Is All Day:
                                <div>
                                    <input
                                        type="radio"
                                        name="is_all_day"
                                        value="true"
                                        checked={editedEvent.is_all_day === true}
                                        onChange={() => setEditedEvent({ ...editedEvent, is_all_day: true })}
                                    />
                                    <label>Yes</label>
                                    <input
                                        type="radio"
                                        name="is_all_day"
                                        value="false"
                                        checked={editedEvent.is_all_day === false}
                                        onChange={() => setEditedEvent({ ...editedEvent, is_all_day: false })}
                                    />
                                    <label>No</label>
                                </div>
                            </label>

                            <div className="modal-actions">
                                <button type="submit">Update Event</button>
                                <button type="button" onClick={() => setEditEventModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );

};

export default Groups;
