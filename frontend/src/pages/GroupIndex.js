import React, { useState, useEffect } from 'react';
import axios from 'axios';

// list all groups
// for the groups of which the user is a guest, has request to join button

// TODO: ADD to sidebar

const baseUrl = process.env.REACT_APP_BASE_URL;

const GroupIndex = () => {
    const [groups, setGroups] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);

    const [selectedGroup, setSelectedGroup] = useState(null);

    const [sentRequestModal, setSentRequestModal] = useState(false);
    const [newRequest, setNewRequest] = useState({ message: '' });

    const [viewPendingRequest, setViewPendingRequest] = useState(false);
    const [pendingRequest, setPendingRequest] = useState(null);

    // Fetch Groups - Runs once when the component mounts
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get(`${baseUrl}/group/`);
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

    // Show Group Detail Info & Buttons for edit, delete, leave, request_join, request_pending
    const handleGroupClick = async (e, group_id) => {
        console.log("_________E", e);
        console.log("_________GROUPID", group_id);
        try {
            const request_response = await axios.get(`${baseUrl}/group-request/get-grp-request/${group_id}`);
            if (request_response.data) {
                const requestData = request_response.data;
                console.log('Request fectched:', requestData);
                if (requestData.is_pending) {
                    console.log('Pending request fectched:', requestData);
                    setPendingRequest(requestData);
                }
            }

            const response = await axios.get(`${baseUrl}/group/to-group/${group_id}`);
            const groupData = await response.data;
            console.log('Group clicked:', groupData);
            setSelectedGroup(groupData);

        } catch (err) {
            console.error('Failed to fetch group data and/or pending request:', err);
        }
    };

    // Deselect Group
    const handleCloseGroup = async () => {
        if (!selectedGroup) return;
        setSelectedGroup(null);
    };

    // Handle Request Input Change
    const handleRequestInputChange = (e) => {
        setNewRequest({
            ...newRequest,
            [e.target.name]: e.target.value
        });
    };

    // Handle Sent Request
    const handleSentRequest = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('message', newRequest.message);
    
            const response = await axios.post(`${baseUrl}/group-request/send-request/${selectedGroup.group_id}`, formData);
            console.log('Request sent:', response.data);

            // const updatedMyRequests = await axios.get(`${baseUrl}/group-request/show-out-request`);
            // setMyRequests(updatedMyRequests.data);

            setNewRequest({ message: '' });
            setSentRequestModal(false);
        } catch (err) {
            console.error('Failed to send request:', err);
        }
    };

    return(
        <div className="group-index-page-container">
            <div className="group-index-header">
                <h2>All Groups</h2>
                <input 
                    type="text" 
                    placeholder="Search by group ID or name..." 
                    value={searchTerm} 
                    onChange={(e) => handleSearch(e)} 
                />
            </div>

            <div className="left-section">
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
                        </div>
                    ))}
                </div>
            </div>

            <div className="right-section">
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
                                {selectedGroup.is_guest && !pendingRequest && (
                                    <>
                                        <button onClick={() => setSentRequestModal(true)}>Request to Join</button>
                                    </>
                                )}
                                {pendingRequest && (
                                    <>
                                        <button onClick={() => setViewPendingRequest(true)}>Request Pending</button>
                                    </>
                                )}
                                <button className="close-group-button" onClick={handleCloseGroup}>
                                    Close
                                </button>
                            </div>

                        </div>
                    ) : (
                        <p>Select a group to view details</p>
                    )}
                </div>
            </div>

            {sentRequestModal && (
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
            )}

            {viewPendingRequest && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Pending Request</h2>
                        <div key={pendingRequest.request_id} className="request-card">
                            <p>Group ID: {pendingRequest.group_id}</p>
                            <p>Admin ID: {pendingRequest.account_id_to}</p>
                            <p>Message: {pendingRequest.message}</p>
                            <p>Created at: {pendingRequest.created_at}</p>
                        </div>

                        <div className="modal-actions">
                            <button type="button" onClick={() => setViewPendingRequest(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default GroupIndex;
