import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css'
import './SplitScreen.css'

const baseUrl = process.env.REACT_APP_BASE_URL;

const FindSharedAvailability = () => {
  const [date, setDate] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [participants, setParticipants] = useState([]);
  const [showAddParticipantsPopup, setShowAddParticipantsPopup] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availability, setAvailability] = useState(null);

  const handleDateChange = (e) => {
    console.log('Date changed:', e.target.value); 
    setDate(e.target.value);
  }
  const handleTimeFromChange = (e) => {
    console.log('time changed:', e.target.value); 
    setTimeFrom(e.target.value);
  }

  const handleTimeToChange = (e) => setTimeTo(e.target.value);

  useEffect(() => {
    fetchFriends();
    
  }, []); 

  const handleParticipantChange = (index, event) => {
    const updatedParticipants = [...participants];
    updatedParticipants[index].name = event.target.value;
    setParticipants(updatedParticipants);
  };

  const toggleAddParticipantPopup = () => {
    setShowAddParticipantsPopup(!showAddParticipantsPopup);
  }


  const handleSelectFriend = (friend) => {
    if (participants.some(p => p.account_id === friend.account_id)) {
      // remove
      setParticipants(participants.filter(p => p.account_id !== friend.account_id));
      console.log(participants);
    } else {
      // add
      setParticipants(prevParticipants => [...prevParticipants, friend]);
      console.log(participants);
    }
  };

  const handleSubmit = async () => {
    if (!date || !timeFrom || !timeTo || participants.length < 1) {
      alert('Please fill in all fields and add participants.');
      return;
    }

    setLoading(true);
    setAvailability(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("date", date);
      formData.append("start_time", timeFrom);
      formData.append("end_time", timeTo);
      formData.append("participant_ids", participants.map(p => p.account_id).join(','));

      const response = await axios.post(`${baseUrl}/availability/generate`, formData, {withCredentials: true});
      setAvailability(response.data)
      setLoading(false);
    } catch (err) {
      console.error("Error generating shared availability:", err);
      setError('Failed generating shared availability.');
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${baseUrl}/friend/get-friends`, {withCredentials: true});
      setFriends(response.data); 
      setLoading(false);
    } catch (err) {
      console.error("Error fetching friends:", err);
      setError('Failed to fetch friends.');
      setLoading(false);
    }
  };

  return (
    <div className="find-shared-availability">
      <h2>Find Shared Availability</h2>
      
      <div className="input-group">
        <label>Date:</label>
        <input
            type="date"
            value={date}
            onChange={handleDateChange}
        />
      </div>

      <div className="input-group">
        <label>Time range: from</label>
        <input
          type="time"
          value={timeFrom}
          onChange={handleTimeFromChange}
        />
        <label>to</label>
        <input
          type="time"
          value={timeTo}
          onChange={handleTimeToChange}
        />
      </div>

      <div className="participants-section">
        <label>Participants:</label>
        <div className="participants">
            {participants.map(participant => (
                <div key={participant.account_id} className='participant-item'>
                    <p>{participant.username}</p>
                </div>
            ))}
            <button className='add-participant-button' onClick={toggleAddParticipantPopup}>
                Add Participant
            </button>
        </div>
      </div>

      <button onClick={handleSubmit} className="generate-button">
        Generate
      </button>

      <div className='availability-display'>
      {loading ? (
          <p>Generating your shared availability...</p>
        ) : error ? (
          <p>{error}</p>
        ) : availability ? (
          <ul>
            {availability.map((interval, index) => (
              <li key={index}>
                {`Start: ${interval.start_time}, End: ${interval.end_time}`}
              </li>
            ))}
          </ul>
        ) : (
          <p></p>
        )}
      </div>

      {showAddParticipantsPopup && (
        <div className='modal-overlay'>
            <div className='modal-content'>
                <h3>Select Participants</h3>
                <button className='close-popup' onClick={toggleAddParticipantPopup}>Close</button>
                <div className='friends-list'>
                    {friends.map(friend => (
                        <div key={friend.account_id} className='friend-item'>
                            <p>{friend.username}</p>
                            <button 
                                onClick={() => handleSelectFriend(friend)}
                                className={participants.some(p => p.account_id === friend.account_id) ? 'selected' : ''}
                            />
                            {participants.some(p => p.account_id === friend.account_id) ? 'Selected' : 'Select'}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default FindSharedAvailability;
