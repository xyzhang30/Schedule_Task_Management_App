import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ViewState, EditingState } from '@devexpress/dx-react-scheduler';
import {
  Scheduler,
  WeekView,
  MonthView,
  DayView,
  Appointments,
  Toolbar,
  DateNavigator,
  TodayButton,
  ViewSwitcher,
  AppointmentTooltip,
  AllDayPanel,
  CurrentTimeIndicator,
} from '@devexpress/dx-react-scheduler-material-ui';
import Paper from '@mui/material/Paper';
import './Calendar.css';
import EventUpdateModal from './EventUpdate';
import { withStyles } from '@mui/styles';
import { AccessTime } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import '../App.css';
import './SplitScreen.css';

const baseUrl = process.env.REACT_APP_BASE_URL;

const FindSharedAvailability = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [date, setDate] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [participants, setParticipants] = useState([]);
  const [showAddParticipantsPopup, setShowAddParticipantsPopup] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentMeta, setAppointmentMeta] = useState({});

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

  useEffect(() => {
    const appointmentsData = generateAppointments();
    setAppointments(appointmentsData);
  }, [availability]);

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
      console.log("______availability: ", availability);
      setLoading(false);
      // generateAppointments();
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

  // useEffect(() => {
  //   refreshEvents();
  // }, []);

  // const refreshEvents = async () => {
  //   try {
  //     const formData = new FormData();
  //     formData.append("date", date);
  //     formData.append("start_time", timeFrom);
  //     formData.append("end_time", timeTo);
  //     formData.append("participant_ids", participants.map(p => p.account_id).join(','));
  //     // const response = await axios.get(`${baseUrl}/event/getEventsByAccount`);
  //     const response = await axios.post(`${baseUrl}/availability/generate`, formData, {withCredentials: true});
  //     setAvailability(response.data)

  //     // const eventData = response.data.events || [];
  //     // setEvents(eventData);
  //     const appointmentsData = generateAppointments(response.data);
  //     setAppointments(appointmentsData);
  //    }
  //    catch (error) {
  //   //   console.error('Error fetching events!', error);
  //   //   if (error.response && error.response.status === 401) {
  //   //     window.location.href = '/login';
  //   //   }
  //   // } finally {
  //   //   setLoading(false);
  //    }
  // };

  const generateAppointments = () => {
    try{
      if (availability) {
        const appointments = [];
        console.log("______ in generate: ", availability);
        availability.map((interval) => {
          const startDate = new Date(interval.start_time);
          const endDate = new Date(interval.end_time);

          appointments.push({
            // title: event.name,
            startDate,
            endDate
            // id: event.event_id,
            // originalEvent: event,
          });
        });
        return appointments;
      }
    }catch (error) {
      console.error('Error fetching events!', error);
    }
  };

  const Appointment = withStyles({
    appointment: {
      borderRadius: '8px',
      // backgroundColor: (props) =>
      //   props.data.label_color ? props.data.label_color : '#1976d2',
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
  })(({ classes, ...restProps }) => {
    const { data } = restProps;
    // const event = data.originalEvent;
    return (
      <Appointments.Appointment
        {...restProps}
        className={classes.appointment}
      >
        <div>
          <div className={classes.buttonsContainer}>
            <EditIcon
              className={classes.iconButton}
              fontSize="small"
              // onClick={onEditClick}
            />
            <DeleteIcon
              className={classes.iconButton}
              fontSize="small"
              // onClick={onDeleteClick}
            />
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

  const TimeIndicator = ({ top, ...restProps }) => (
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
      )};

      <div className="scheduler-container">
        <Paper>
          <Scheduler data={appointments} height={660}>
            <ViewState
              currentDate={currentDate}
              onCurrentDateChange={setCurrentDate}
            />
            
            {/* <MonthView />
            <WeekView startDayHour={0} endDayHour={24} /> */}
            <DayView startDayHour={0} endDayHour={24} />
            {/* <AllDayPanel /> */}
            <Appointments
              appointmentComponent={Appointment}
            />
            {/* <Toolbar /> */}
            {/* <DateNavigator /> */}
            {/*  */}
            {/* <ViewSwitcher /> */}
            {/* <TodayButton /> */}
{/*             
            <AppointmentTooltip
              showCloseButton
              visible={tooltipVisible}
              onVisibilityChange={setTooltipVisible}
              appointmentMeta={appointmentMeta}
              onAppointmentMetaChange={setAppointmentMeta}
            /> */}
            <CurrentTimeIndicator
              shadePreviousCells
              shadePreviousAppointments
              updateInterval={60000}
              indicatorComponent={TimeIndicator}
            />
          </Scheduler>
        </Paper>
        {/* <EventUpdateModal
          showUpdateEventModal={showUpdateEventModal}
          setShowUpdateEventModal={setShowUpdateEventModal}
          eventToUpdate={eventToUpdate}
          setEventToUpdate={setEventToUpdate}
          categories={categories}
          setCategories={setCategories}
          refreshEvents={refreshEvents}
        /> */}
      </div>

    </div>
  );
};

export default FindSharedAvailability;
