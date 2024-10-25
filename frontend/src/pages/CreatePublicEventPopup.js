import React, { useState } from 'react';

const CreateEventPopup = ({ isOpen, onRequestClose, onCreate }) => {
    const [eventDetails, setEventDetails] = useState({
        event_name: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        is_all_day: false,
    });

    const handleSubmit = () => {
        onCreate(eventDetails);
    };

    if (!isOpen) return null;

    return (
        <div className="popup">
            <h2>Create New Event</h2>
            <input
                type="text"
                value={eventDetails.event_name}
                onChange={e => setEventDetails({ ...eventDetails, event_name: e.target.value })}
                placeholder="Event Name"
            />
            <input
                type="date"
                value={eventDetails.start_date}
                onChange={e => setEventDetails({ ...eventDetails, start_date: e.target.value })}
            />
            <input
                type="date"
                value={eventDetails.end_date}
                onChange={e => setEventDetails({ ...eventDetails, end_date: e.target.value })}
            />
            {/* Additional inputs for time and other fields */}
            <button onClick={handleSubmit}>Create Event</button>
            <button onClick={onRequestClose}>Cancel</button>
        </div>
    );
};

export default CreateEventPopup;
