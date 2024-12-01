import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ViewState } from '@devexpress/dx-react-scheduler';
import {
  Scheduler,
  DayView,
  Appointments,
  DateNavigator,
  Toolbar,
  TodayButton,
  AllDayPanel,
  CurrentTimeIndicator,
} from '@devexpress/dx-react-scheduler-material-ui';
import Paper from '@mui/material/Paper';
import './Calendar.css';
import { withStyles } from '@mui/styles';
import EditIcon from '@mui/icons-material/Edit';
import '../App.css';
import './SplitScreen.css';
import EventCreate from './EventCreate';
import './Availability.css';

const baseUrl = process.env.REACT_APP_BASE_URL;

const FindSharedAvailability = () => {
  const [date, setDate] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [participants, setParticipants] = useState([]);
  const [showAddParticipantsPopup, setShowAddParticipantsPopup] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false); // Set initial loading to false
  const [error, setError] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [initialEventData, setInitialEventData] = useState({});
  const [timeRange, setTimeRange] = useState({});
  const [currUserName, setCurrUserName] = useState([""]);

  const handleDateChange = (e) => {
    setDate(e.target.value);
    // Update currentDate when date changes
    if (e.target.value) {
      const [year, month, day] = e.target.value.split('-').map(Number);
      setCurrentDate(new Date(year, month - 1, day));
    }
  };

  const handleTimeFromChange = (e) => {
    setTimeFrom(e.target.value);
  };

  const handleTimeToChange = (e) => setTimeTo(e.target.value);

  useEffect(() => {
    fetchFriends();
    fetchCategories();
    setCurrUserInfo();
  }, []);

  const setCurrUserInfo = async () => {
    const usernameRes = await axios.get(`${baseUrl}/account/get_username`, { withCredentials: true });
    setCurrUserName(usernameRes.data.username);
  }

  useEffect(() => {
    const appointmentsData = generateAppointments();
    setAppointments(appointmentsData);
  }, [availability]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${baseUrl}/event/category/all`, { withCredentials: true });
      setCategories(response.data.map((cat) => cat.category_name));
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories.');
    }
  };

  const toggleAddParticipantsPopup = () => {
    setShowAddParticipantsPopup(!showAddParticipantsPopup);
  };

  const handleSelectFriend = (friend) => {
    if (participants.some((p) => p.account_id === friend.account_id)) {
      // Remove participant
      setParticipants(participants.filter((p) => p.account_id !== friend.account_id));
    } else {
      // Add participant
      setParticipants((prevParticipants) => [...prevParticipants, friend]);
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
      formData.append('date', date);
      formData.append('start_time', timeFrom);
      formData.append('end_time', timeTo);
      formData.append('participant_ids', participants.map((p) => p.account_id).join(','));

      const response = await axios.post(`${baseUrl}/availability/generate`, formData, {
        withCredentials: true,
      });
      setAvailability(response.data);

      // Set time range for creating events
      setTimeRange({
        start: `${date}T${timeFrom}`,
        end: `${date}T${timeTo}`,
      });
    } catch (err) {
      console.error('Error generating shared availability:', err);
      setError('Failed generating shared availability.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${baseUrl}/friend/get-friends`, { withCredentials: true });
      setFriends(response.data);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to fetch friends.');
    } finally {
      setLoading(false);
    }
  };

  // Function to parse date and time strings without timezone effects
  const parseLocalDateTime = (dateTimeString) => {
    if (!dateTimeString) {
      console.error("parseLocalDateTime called with undefined dateTimeString");
      return null;
    }
    const splitDateTime = dateTimeString.includes('T')
      ? dateTimeString.split('T')
      : dateTimeString.split(' ');
    const [datePart, timePart] = splitDateTime;
    if (!datePart || !timePart) {
      console.error("Invalid dateTimeString format:", dateTimeString);
      return null;
    }

    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute);
  };

  const generateAppointments = () => {
    try {
      if (availability) {
        const appointments = [];
        availability.forEach((interval) => {
          const startDate = parseLocalDateTime(interval.start_time);
          const endDate = parseLocalDateTime(interval.end_time);

          if (startDate && endDate) {
            appointments.push({
              startDate,
              endDate,
            });
          } else {
            console.error("Invalid interval:", interval);
          }
        });
        return appointments;
      }
    } catch (error) {
      console.error('Error generating appointments!', error);
    }
    return [];
  };

  // Function to format Date objects to 'YYYY-MM-DDTHH:mm' without timezone effects
  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-based
    const day = ('0' + date.getDate()).slice(-2);
    const hour = ('0' + date.getHours()).slice(-2);
    const minute = ('0' + date.getMinutes()).slice(-2);
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  const Appointment = withStyles({
    appointment: {
      borderRadius: '8px',
      position: 'relative',
    },
    buttonsContainer: {
      position: 'absolute',
      top: 2,
      right: 2,
      display: 'flex',
      gap: '4px',
    },
    iconButton: {
      color: '#fff',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      padding: '2px',
      borderRadius: '4px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
    title: {
      color: '#fff',
    },
  })(function AppointmentComponent({ classes, ...restProps }) {
    const { data } = restProps;
    const onEditClick = (e) => {
      e.stopPropagation();
      setShowAddEventModal(true);
      setInitialEventData({
        start_date: formatDateTimeLocal(data.startDate),
        end_date: formatDateTimeLocal(data.endDate),
      });
    };
    return (
      <Appointments.Appointment {...restProps} className={classes.appointment}>
        <div>
          <div className={classes.buttonsContainer}>
            <EditIcon className={classes.iconButton} fontSize="small" onClick={onEditClick} />
          </div>
          <Appointments.AppointmentContent
            {...restProps}
            formatDate={() => ''}
            className={classes.title}
          />
        </div>
      </Appointments.Appointment>
    );
  });

  const TimeIndicator = ({ top }) => (
    <div
      style={{
        position: 'absolute',
        zIndex: 1,
        left: 0,
        right: 0,
        top: top,
        height: '2px',
        backgroundColor: 'red',
      }}
    />
  );

  return (
    
    <div className="split-screen-container">
      <div className="split-screen-content">
        <div className="split-screen-filter-container">
        
          <h2>Find Shared Availability</h2>
        </div>
        <div className="split-screen-left">
          <div className="input-group">
            <label>Date:</label>
            <input type="date" value={date} onChange={handleDateChange} />
          </div>

          <div className="input-group">
            <label>Time range: from</label>
            <input type="time" value={timeFrom} onChange={handleTimeFromChange} />
            <label>to</label>
            <input type="time" value={timeTo} onChange={handleTimeToChange} />
          </div>

          <div className="participants-section">
            <label>Participants:</label>
            <div className="participants">
              <div className="friend-item">
                  <p>{currUserName}</p>
                </div>
              {participants.map((participant) => (
                <div key={participant.account_id} className="friend-item">
                  <p>{participant.username}</p>
                </div>
              ))}
              <button className="add-participant-button" onClick={toggleAddParticipantsPopup}>
                Add Participant
              </button>
            </div>
          </div>

          <button onClick={handleSubmit} className="generate-button">
            Generate
          </button>
        

          <div className="availability-display">
            {loading ? (
              <p>Generating your shared availability...</p>
            ) : error ? (
              <p>{error}</p>
            ) : availability ? (
              <p>Available times are displayed on the right. Click on a time slot to create an event.</p>
            ) : (
              <p></p>
            )}
          </div>
        </div>
        <div className="split-screen-right">
          <div className="scheduler-container">
            <Paper>
              <Scheduler data={appointments} height={660}>
                <ViewState currentDate={currentDate} onCurrentDateChange={setCurrentDate} />
                <DayView startDayHour={0} endDayHour={24} />
                <AllDayPanel />
                <Appointments appointmentComponent={Appointment} />
                <Toolbar />
                <DateNavigator />
                <TodayButton />
                <CurrentTimeIndicator
                  shadePreviousCells
                  shadePreviousAppointments
                  updateInterval={60000}
                  indicatorComponent={TimeIndicator}
                />
              </Scheduler>
            </Paper>
          </div>
        </div>
      </div>

      {showAddParticipantsPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Select Participants</h3>
            <button className='button' id="close-popup" onClick={toggleAddParticipantsPopup}>
              Close
            </button>
            <div className="friends-list">
              {friends.map((friend) => (
                <div key={friend.account_id} className="friend-item" id='friends-list-item' >
                  <p>{friend.username}</p>
                  <button
                    onClick={() => handleSelectFriend(friend)}
                    className="button"
                    id='smaller-button'
                  >
                    {participants.some((p) => p.account_id === friend.account_id)
                      ? 'Remove'
                      : 'Select'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      <EventCreate
        show={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        categories={categories}
        refreshEvents={handleSubmit}
        initialEventData={initialEventData}
        timeRange={timeRange}
      />
    </div>
  );
};

export default FindSharedAvailability;
