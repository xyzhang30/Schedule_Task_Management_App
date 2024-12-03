import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SplitScreen.css'
import './Groups.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faTrash, faPencilAlt, faCheck, faCircleXmark, faUser, faUserPlus, faUserLargeSlash, faCirclePlus, faEye, faStar, faUsersLine } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const baseUrl = process.env.REACT_APP_BASE_URL;

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [groupEvents, setGroupEvents] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);
    
    const [createGroupModal, setCreateGroupModal] = useState(false);
    const [newGroup, setNewGroup] = useState({ group_name: '' });

    const [selectedGroup, setSelectedGroup] = useState(null);

    const [groupActionsModal, setGroupActionsModal] = useState(false);

    const [editGroupModal, setEditGroupModal] = useState(false);
    const [editedGroup, setEditedGroup] = useState({ group_name: '' });

    const [createEventModal, setCreateEventModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ event_name: '', start_date_time: '', end_date_time: '', start_date: '', end_date: '', is_all_day: null });

    const [selectedEvent, setSelectedEvent] = useState(null);

    const [editEventModal, setEditEventModal] = useState(false);
    const [editedEvent, setEditedEvent] = useState({ event_name: '', start_date_time: '', end_date_time: '', start_date: '', end_date: '', is_all_day: null })

    const [selectedMembers, setSelectedMembers] = useState([]);

    const [addMemberModal, setAddMemberModal] = useState(false);
    const [newMembership, setNewMembership] = useState({ group_id: '', member_name: '' });

    const [myRequestsModal, setMyRequestsModal] = useState(false);
    const [myRequests, setMyRequests] = useState([]);

    // const [sentRequestModal, setSentRequestModal] = useState(false);
    // const [newRequest, setNewRequest] = useState({ message: '' });

    const [memberRequestsModal, setMemberRequestsModal] = useState(false);
    const [memberRequests, setMemberRequests] = useState([]);

    const [selectedAdmin, setSelectedAdmin] = useState(null);

    const navigate = useNavigate();

    
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

    // Fetch My Requests - Runs once when the component mounts
    useEffect(() => {
        const fetchMyRequests = async () => {
            try {
                const response = await axios.get(`${baseUrl}/group-request/show-out-request`);
                console.log("____RESPONSE_MY_RQ: ", response.data);
                setMyRequests(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching my requests: ", err);
                setError('Failed to fetch my requests.');
                setLoading(false);
            }
        };
        fetchMyRequests();
    }, []);

    // Fetch Member Requests - Runs once when the component mounts
    useEffect(() => {
        const fetchMemberRequests = async () => {
            try {
                const response = await axios.get(`${baseUrl}/group-request/show-in-request`);
                console.log("____RESPONSE_MEM_RQ: ", response.data);
                setMemberRequests(response.data);
            } catch (err) {
                console.error("Error fetching member requests: ", err);
            }
        };
        fetchMemberRequests();
    }, []);

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
            // formData.append('group_avatar', newGroup.group_avatar);
    
            const response = await axios.post(`${baseUrl}/group/create-group`, formData);
            console.log('Group created:', response.data);

            const updatedGroups = await axios.get(`${baseUrl}/group/show-groups`);
            setGroups(updatedGroups.data);

            const updatedMemberRequests = await axios.get(`${baseUrl}/group-request/show-in-request`);
            setMemberRequests(updatedMemberRequests.data);

            setCreateGroupModal(false);
            setNewGroup({ group_name: '' });
        } catch (err) {
            console.error('Failed to create group:', err);
        }
    };

    // Show Group Detail Info & Buttons for edit, delete, leave, request_join
    const handleGroupClick = async (e, group_id) => {
        setSelectedGroup(null);
        setSelectedEvent(null);
        setSelectedMembers([]);
        setSelectedAdmin(null);
        console.log("_________E", e);
        console.log("_________GROUPID", group_id);
        try {
            const response = await axios.get(`${baseUrl}/group/to-group/${group_id}`);
            const groupData = await response.data;
            console.log('Group clicked:', groupData);
            setSelectedGroup(groupData);

            const admin_response = await axios.get(`${baseUrl}/account/name-by-id/${groupData.admin_id}`);
            console.log('Admin: ', admin_response.data);
            setSelectedAdmin(admin_response.data);
        } catch (err) {
            console.error('Failed to fetch group data:', err);
        }
    };

    // Deselect Group
    const handleCloseGroup = async () => {
        if (!selectedGroup) return;
        setSelectedGroup(null);
        setSelectedEvent(null);
        setSelectedMembers([]);
        setSelectedAdmin(null);
    };

    // Show Edit Group Modal & Prepare Edit
    const handleEditGroupClick = async () => {
        setEditedGroup({
            group_name: selectedGroup.group_name,
            // group_avatar: selectedGroup.group_avatar
        });
        setEditGroupModal(true);
    };

    // Edit Group
    const handleEditGroup = async (e) => {
        console.log('Edit group called')
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('new_group_name', editedGroup.group_name);
            // formData.append('group_avatar', editedGroup.group_avatar);
    
            const response = await axios.put(`${baseUrl}/group/edit-group/${selectedGroup.group_id}`, formData);
            console.log('Group updated:', response.data);
    
            const updatedGroups = await axios.get(`${baseUrl}/group/show-groups`);
            setGroups(updatedGroups.data);
            
            setEditGroupModal(false);
            setEditedGroup({ group_name: '' });
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

                const updatedMemberRequests = await axios.get(`${baseUrl}/group-request/show-in-request`);
                setMemberRequests(updatedMemberRequests.data);
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

            start_date: selectedEvent.is_all_day ? new Date(selectedEvent.start_date_time).toISOString().slice(0, 10) : new Date(),
            end_date: selectedEvent.is_all_day ? new Date(selectedEvent.end_date_time).toISOString().slice(0, 10) : new Date(),

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

    // Show View Members Modal & Set Selected Members
    const handleViewMembersClick = async () => {
        try {
            const response = await axios.get(`${baseUrl}/group/show-members/${selectedGroup.group_id}`);
            console.log("Fetched members:", response.data);
            setSelectedMembers(response.data);
        } catch (err) {
            console.error("Error fetching group members: ", err);
        }
    };

    // Deselect Members
    const handleCloseMembers = async () => {
        if (!selectedMembers) return;
        setSelectedMembers([]);
    };

    // Handle New Member Input
    const handleMemberInputChange = (e) => {
        setNewMembership({
            ...newMembership,
            [e.target.name]: e.target.value
        });
    };

    // Add Member
    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('group_id', selectedGroup.group_id);
            formData.append('member_name', newMembership.member_name);
    
            const response = await axios.post(`${baseUrl}/group/add-member/${selectedGroup.group_id}`, formData);
            console.log('Member added:', response.data);
            
            const updatedMembers = await axios.get(`${baseUrl}/group/show-members/${selectedGroup.group_id}`);
            setSelectedMembers(updatedMembers.data);
    
            setNewMembership({ group_id: '', member_name: '' });
            setAddMemberModal(false);
        } catch (err) {
            console.error('Failed to add member:', err);
        }
    };

    // Remove Member
    const handleRemoveMember = async (member_id) => {
        
        const confirmRemove = window.confirm(`Are you sure you want to remove member: ${member_id}?`);
        
        if (confirmRemove) {
            try {
                const response = await axios.delete(`${baseUrl}/group/remove-member/${selectedGroup.group_id}/${member_id}`);
                console.log('Member removed:', response.data);
    
                const updatedMembers = await axios.get(`${baseUrl}/group/show-members/${selectedGroup.group_id}`);
                setSelectedMembers(updatedMembers.data);
            } catch (err) {
                console.error('Failed to remove member:', err);
            }
        }
    };

    // // Handle Request Input Change
    // const handleRequestInputChange = (e) => {
    //     setNewRequest({
    //         ...newRequest,
    //         [e.target.name]: e.target.value
    //     });
    // };

    // // Handle Sent Request
    // const handleSentRequest = async (e) => {
    //     e.preventDefault();
    //     try {
    //         const formData = new FormData();
    //         formData.append('message', newRequest.message);
    
    //         const response = await axios.post(`${baseUrl}/group-request/send-request/${selectedGroup.group_id}`, formData);
    //         console.log('Request sent:', response.data);

    //         const updatedMyRequests = await axios.get(`${baseUrl}/group-request/show-out-request`);
    //         setMyRequests(updatedMyRequests.data);

    //         setNewRequest({ message: '' });
    //         setSentRequestModal(false);
    //     } catch (err) {
    //         console.error('Failed to send request:', err);
    //     }
    // };

    // Handle Accept Request
    const handleAcceptRequest = async (request_id) => {
        try {
            const response = await axios.put(`${baseUrl}/group-request/accept-request/${request_id}`);
            console.log('Request accepted:', response.data);

            const updatedMemberRequests = await axios.get(`${baseUrl}/group-request/show-in-request`, {withCredentials: true});
            setMemberRequests(updatedMemberRequests.data);
        } catch (err) {
            console.error('Failed to accept request:', err);
        }
    };

    // Handle Decline Request
    const handleDeclineRequest = async (request_id) => {
        try {
          const response = await axios.delete(`${baseUrl}/group-request/decline-request/${request_id}`);
          console.log('Request declined:', response.data);
    
          const updatedMemberRequests = await axios.get(`${baseUrl}/group-request/show-in-request`, {withCredentials: true});
        setMemberRequests(updatedMemberRequests.data);
        } catch (err) {
          console.error('Error declining group request:', err);
        }
      };

    return (
        <div className="split-screen-container">
            <div className="split-screen-content">

                <div className="split-screen-filter-container">
                    <h2>My Groups</h2>
                    <div className="main-actions">
                        <button className="button add-button" onClick={() => setCreateGroupModal(true)}>
                            <FontAwesomeIcon icon={faCirclePlus} /> Create Group
                        </button>
                        <button className="button view-button" onClick={() => setMyRequestsModal(true)}>
                            <FontAwesomeIcon icon={faStar} /> View My Pending Requests
                        </button>
                        <button className="button view-button" onClick={() => setMemberRequestsModal(true)}>
                            <FontAwesomeIcon icon={faUsersLine} /> View Member Requests
                        </button>
                        <button className="button view-button" onClick={() => window.location.href = 'http://localhost:3000/groupindex'}>
                            <FontAwesomeIcon icon={faEye} /> View All Groups
                        </button>
                    </div>
                </div>

                <div className="split-screen-left">
                    <div className="search-bar">
                        <input 
                            type="text" 
                            placeholder="Search by group ID or name..." 
                            value={searchTerm} 
                            onChange={(e) => handleSearch(e)} 
                        />
                    </div>
                    <div className="group-list">
                        {filteredGroups.map(group => (
                            <div key={group.group_id} className="group-section">
                                <div className="group-card">
                                    <div className="profile-info">
                                        <p onClick={(e) => handleGroupClick(e, group.group_id)}> {group.group_name} </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="split-screen-right">
                    <div className="group-details">
                        {selectedGroup ? (
                            <div className="group-details-content">
                                {/* <div className="group-avatar">
                                    <img src={selectedGroup.avatar} alt="Group's Avatar" />
                                </div> */}
                                <div className="group-profile-header">
                                    <h2>{selectedGroup.group_name}</h2>
                                    {selectedGroup.is_admin && (
                                        <>  
                                            <button className="button add-button" onClick={() => setCreateEventModal(true)}>
                                                <FontAwesomeIcon icon={faCirclePlus} />Event
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="group-profile-footer">
                                    <p>Administrator: {selectedAdmin || "Loading..."}</p>
                                    <button className="dots" onClick={() => setGroupActionsModal(true)}>
                                        <FontAwesomeIcon icon={faEllipsis} />
                                    </button>
                                </div>
                                <div className="group-events">
                                    {groupEvents[selectedGroup.group_id] && groupEvents[selectedGroup.group_id].length > 0 ? (
                                        groupEvents[selectedGroup.group_id].map(event => (
                                            <div key={event.event_id} className="event-card">
                                                <h3>{event.event_name}</h3>
                                                <p>{formatDateTime(event.start_date_time)} - {formatDateTime(event.end_date_time)}</p>
                                                <button className="dots" onClick={(e) => handleEventClick(e, event.event_id)}>
                                                    <FontAwesomeIcon icon={faEllipsis} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No events available.</p>
                                    )}
                                </div>

                            </div>
                        ) : (
                            <p>Select a group to view details</p>
                        )}
                    </div>

                    {groupActionsModal && selectedGroup && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2> {selectedGroup.group_name} </h2>
                                <div className="group-actions">
                                    {selectedGroup.is_admin && (
                                        <>  
                                            <button className="button edit-button" onClick={() => handleEditGroupClick()}>
                                                <FontAwesomeIcon icon={faPencilAlt} />Edit
                                            </button>
                                            <button className="button view-button" onClick={() => handleViewMembersClick()}>
                                                <FontAwesomeIcon icon={faUser} />Manage
                                            </button>
                                            <button className="button delete-button" onClick={() => handleDeleteGroup()}>
                                                <FontAwesomeIcon icon={faTrash} />Delete
                                            </button>
                                        </>
                                    )}
                                    {selectedGroup.is_member && (
                                        <>
                                            <button className="button edit-button" onClick={() => handleLeaveGroup()}>
                                                <FontAwesomeIcon icon={faUserLargeSlash} />Leave Group
                                            </button>
                                            <button className="button view-button" onClick={() => handleViewMembersClick()}>
                                                <FontAwesomeIcon icon={faUser} />View Members
                                            </button>
                                        </>
                                    )}
                                    {/* {selectedGroup.is_guest && (
                                        <>
                                            <button onClick={() => setSentRequestModal(true)}>Request to Join</button>
                                        </>
                                    )} */}
                                    <button className='button close-button' onClick={() => setGroupActionsModal(false)}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {selectedEvent && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2> {selectedEvent.event_name} </h2>
                                <div className="event-actions">
                                    {selectedEvent.is_admin && (
                                        <>
                                            {selectedEvent.registered ? (
                                                <>
                                                    <button className="button edit-button" onClick={() => handleDropEvent()}>
                                                        <FontAwesomeIcon icon={faCircleXmark} /> Drop
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="button add-button" onClick={() => handleRegisterEvent()}>
                                                        <FontAwesomeIcon icon={faCheck} /> Register
                                                    </button>
                                                </>
                                            )}
                                            <button className="button edit-button" onClick={() => handleEditEventClick()}>
                                                <FontAwesomeIcon icon={faPencilAlt} /> Edit
                                            </button>
                                            <button className="button delete-button" onClick={() => handleCancelEvent()}>
                                                <FontAwesomeIcon icon={faTrash} /> Cancel
                                            </button>
                                        </>
                                    )}
                                    {selectedEvent.is_member && (
                                        <>
                                            {selectedEvent.registered ? (
                                                <>
                                                    <button className="button edit-button" onClick={() => handleDropEvent()}>
                                                        <FontAwesomeIcon icon={faCircleXmark} /> Drop
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="button add-button" onClick={() => handleRegisterEvent()}>
                                                        <FontAwesomeIcon icon={faCheck} /> Register
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                    <button className='button close-button' onClick={handleCloseEvent}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
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
                            {/* <label>
                                Avatar:
                                <input 
                                    type="text" 
                                    name="group_avatar" 
                                    value={newGroup.group_avatar}
                                    onChange={handleGroupInputChange} 
                                    required 
                                />
                            </label> */}
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
                            {/* <label>
                                Group Avatar:
                                <input
                                    type="text"   
                                    name="group_avatar" 
                                    value={editedGroup.group_avatar} 
                                    onChange={(e) => setEditedGroup({ ...editedGroup, category: e.target.value })} 
                                    required
                                />
                            </label> */}
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
                            <label>
                                Is All Day:
                                <div className="radio-group">
                                    <div className="radio-item">
                                        <input
                                            type="radio"
                                            id="all_day_yes"
                                            name="is_all_day"
                                            value="true"
                                            checked={newEvent.is_all_day === true}
                                            onChange={handleEventInputChange}
                                        />
                                        <label htmlFor="all_day_yes">Yes</label>
                                    </div>
                                    <div className="radio-item">
                                        <input
                                            type="radio"
                                            id="all_day_no"
                                            name="is_all_day"
                                            value="false"
                                            checked={newEvent.is_all_day === false}
                                            onChange={handleEventInputChange}
                                        />
                                        <label htmlFor="all_day_no">No</label>
                                    </div>
                                </div>
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

                            <label>
                                Is All Day:
                                <div className="radio-group">
                                    <div className="radio-item">
                                        <input
                                            type="radio"
                                            name="is_all_day"
                                            value="true"
                                            checked={editedEvent.is_all_day === true}
                                            onChange={() => setEditedEvent({ ...editedEvent, is_all_day: true })}
                                        />
                                        <label htmlFor="all_day_yes">Yes</label>
                                    </div>
                                    <div className="radio-item">
                                        <input
                                            type="radio"
                                            name="is_all_day"
                                            value="false"
                                            checked={editedEvent.is_all_day === false}
                                            onChange={() => setEditedEvent({ ...editedEvent, is_all_day: false })}
                                        />
                                        <label htmlFor="all_day_yes">No</label>
                                    </div>
                                </div>
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

            {selectedMembers.members && selectedGroup && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2> {selectedGroup.group_name} </h2>
                        <div className="member-list">
                            {selectedMembers.members && selectedMembers.members.length > 0 ? (
                                selectedMembers.members.map(member => (
                                    <div key={member.account_id} className="member-card">
                                        <p>{member.username}</p>
                                        {selectedGroup.is_admin && (
                                            <>  
                                                <button className="button delete-button" onClick={() => handleRemoveMember(member.account_id)}>
                                                    <FontAwesomeIcon icon={faUserLargeSlash} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p>No members available.</p>
                            )}
                        </div>
                        <div className="member-actions">
                            {selectedGroup.is_admin && (
                                <>  
                                    <button className="button add-button" onClick={() => setAddMemberModal(true)}>
                                        <FontAwesomeIcon icon={faUserPlus} />
                                    </button>
                                </>
                            )}
                            <button className='button close-button' onClick={handleCloseMembers}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {addMemberModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add Member</h2>
                        <form onSubmit={handleAddMember}>
                            <label>
                                Member Name:
                                <input 
                                    type="text" 
                                    name="member_name" 
                                    value={newMembership.member_name} 
                                    onChange={handleMemberInputChange} 
                                    required 
                                />
                            </label>
                            <div className="modal-actions">
                                <button type="submit">Add Member</button>
                                <button type="button" onClick={() => setAddMemberModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* {sentRequestModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Request to Join Group</h2>
                        <form onSubmit={handleSentRequest}>
                            <label>
                                Request Message:
                                <input 
                                    type="text" 
                                    name="message" 
                                    value={newRequest.message} 
                                    onChange={handleRequestInputChange} 
                                    required 
                                />
                            </label>
                            <div className="modal-actions">
                                <button type="submit">Send</button>
                                <button type="button" onClick={() => setSentRequestModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )} */}

            {myRequestsModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2> My Pending Requests </h2>
                        <div className="request-list">
                            {myRequests && myRequests.length > 0 ? (
                                myRequests.map(request => (
                                    <div key={request.request_id} className="request-card">
                                        <p>To group: {request.group_name}</p>
                                        <p>Message: {request.message}</p>
                                        <p>Created at: {request.created_at}</p>
                                    </div>
                                ))
                            ) : (
                                <p>No requests available.</p>
                            )}
                        </div>
                        <div className="request-actions">
                            <button className='button close-button' onClick={() => setMyRequestsModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {memberRequestsModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2> Member Pending Requests </h2>
                        <div className="request-list">
                            {memberRequests && memberRequests.length > 0 ? (
                                memberRequests.map(request => (
                                    <div key={request.request_id} className="request-card">
                                        <p>To group: {request.group_name}</p>
                                        <p>From: {request.account_name_from}</p>
                                        <p>Message: {request.message}</p>
                                        <p>Created at: {request.created_at}</p>
                                        <button className='button edit-button' onClick={() => handleAcceptRequest(request.request_id)}>
                                            Accept
                                        </button>
                                        <button className="button delete-button" onClick={() => handleDeclineRequest(request.notification_id)}>
                                            Decline
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p>No requests available.</p>
                            )}
                        </div>
                        <div className="request-actions">
                            <button className='button close-button' onClick={() => setMemberRequestsModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );

};

export default Groups;