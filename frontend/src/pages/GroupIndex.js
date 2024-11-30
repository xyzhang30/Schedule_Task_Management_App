import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SplitScreen.css';
import './Groups.css';
import { useNavigate } from 'react-router-dom';

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

    const [selectedAdmin, setSelectedAdmin] = useState(null);

    const navigate = useNavigate();

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

            const admin_response = await axios.get(`${baseUrl}/account/name-by-id/${groupData.admin_id}`);
            console.log('Admin: ', admin_response.data);
            setSelectedAdmin(admin_response.data);

        } catch (err) {
            console.error('Failed to fetch group data and/or pending request:', err);
        }
    };

    // Deselect Group
    const handleCloseGroup = async () => {
        if (!selectedGroup) return;
        setSelectedGroup(null);
        setSelectedAdmin(null);
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
        <div className="split-screen-container">
            <div className="split-screen-content">
                
                <div className="split-screen-filter-container">
                    <h2>All Groups</h2>
                    <button className="view-my-groups-button" onClick={() => window.location.href = 'http://localhost:3000/groups'}>
                        View My Groups
                    </button>
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
                                <div className="group-profile">
                                    <h2> {selectedGroup.group_name} </h2>
                                    <p>Administrator: {selectedAdmin || "Loading..."}</p>
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
        </div>
    );
};

export default GroupIndex;
