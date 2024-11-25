import React, { useState, useEffect,useRef} from 'react';
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
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RepeatIcon from '@mui/icons-material/Repeat';
import Tooltip from '@mui/material/Tooltip';

axios.defaults.withCredentials = true;

const baseUrl = process.env.REACT_APP_BASE_URL;

// Define the default color for appointments without a label
const DEFAULT_APPOINTMENT_COLOR = '#cad2c5';


// Custom Appointment Content Component
const CustomAppointmentContent = ({ data, ...restProps }) => {
  const event = data.originalEvent;

  return (
    <Tooltip
      title={
        <React.Fragment>
          <div>
            <strong>Time:</strong>{' '}
            {data.startDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            -{' '}
            {data.endDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          {event.location && (
            <div>
              <strong>Location:</strong> {event.location}
            </div>
          )}
          {event.category && (
            <div>
              <strong>Category:</strong> {event.category}
            </div>
          )}
        </React.Fragment>
      }
      arrow
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '2px 4px',
          height: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.title}
        </div>
      </div>
    </Tooltip>
  );
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateEventModal, setShowUpdateEventModal] = useState(false);
  const [eventToUpdate, setEventToUpdate] = useState({});
  const [categories, setCategories] = useState([]);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [appointmentMeta, setAppointmentMeta] = useState({});
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState(null);
  const schedulerRef = useRef(null);
  

  // Public Events
  const [pubEvents, setPubEvents] = useState([])
  const [pubAppointments, setPubAppointments] = useState([])
  const [loadingPub, setLoadingPub] = useState(true);

  // All Events
  const allAppointments = [...appointments, ...pubAppointments];

  // Fetch events from backend
  useEffect(() => {
    refreshEvents();
  }, []);

  useEffect(() => {
    const container = schedulerRef.current?.querySelector('.dx-scheduler-scrollable-appointments');
    if (container) {
      const scrollTop = (8 * container.scrollHeight) / 24; // Calculate position for 8 AM
      container.scrollTop = scrollTop;
    }
  }, [appointments]);

  const refreshEvents = async () => {
    try {
      const response = await axios.get(`${baseUrl}/event/getEventsByAccount`);
      const eventData = response.data.events || [];
      // Ensure label_color is set for all events
      eventData.forEach((event) => {
        if (!event.label_color || event.label_color.trim() === '') {
          event.label_color = DEFAULT_APPOINTMENT_COLOR;
        }
      });
      setEvents(eventData);
    } catch (error) {
      console.error('Error fetching events!', error);
      if (error.response && error.response.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Update appointments whenever events change
  useEffect(() => {
    const appointmentsData = generateAppointments(events);
    setAppointments(appointmentsData);
  }, [events]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${baseUrl}/event/category/all`);
        setCategories(response.data.map((cat) => cat.category_name));
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Generate appointments for the scheduler
  const generateAppointments = (events) => {
    const appointments = [];
    events.forEach((event) => {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);

      const frequency = event.frequency;
      const repeatUntil = event.repeat_until
        ? new Date(event.repeat_until)
        : null;

      let rRule = null;

      if (frequency && frequency !== '' && repeatUntil) {
        const untilStr = repeatUntil
          .toISOString()
          .replace(/[-:]/g, '')
          .split('.')[0] + 'Z';
        let freq;
        let interval = 1;

        switch (frequency) {
          case 'Once a Week':
            freq = 'WEEKLY';
            break;
          case 'Twice a Week':
            freq = 'WEEKLY';
            rRule = `FREQ=${freq};BYDAY=MO,TH;UNTIL=${untilStr}`;
            break;
          case 'Every Day':
            freq = 'DAILY';
            break;
          default:
            freq = null;
            break;
        }

        if (!rRule && freq) {
          rRule = `FREQ=${freq};INTERVAL=${interval};UNTIL=${untilStr}`;
        }
      }

      appointments.push({
        title: event.name,
        startDate,
        endDate,
        id: event.event_id,
        location: event.location,
        category: event.category,
        label_text: event.label_text,
        label_color: event.label_color,
        frequency: event.frequency,
        repeat_until: event.repeat_until,
        originalEvent: event,
        rRule,
        isPublic: false,
      });
    });
    return appointments;
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`${baseUrl}/event/deleteEvent/${eventId}`);
        refreshEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleEdit = (event) => {
    setEventToUpdate({
      ...event,
      customCategory: '',
      label_color: event.label_color || DEFAULT_APPOINTMENT_COLOR,
    });
    setShowUpdateEventModal(true);
    setTooltipVisible(false);
  };

  const handleAddedAppointment = (addedAppointment) => {
    setNewEventData(addedAppointment);
    setShowCreateEventModal(true);
  };

  const handleCommitChanges = ({ added, changed, deleted }) => {
    if (added) {
      handleAddedAppointment(added);
    }

    if (changed) {
      Object.keys(changed).forEach((eventIdStr) => {
        const eventId = parseInt(eventIdStr);
        const changes = changed[eventIdStr];

        const eventToChange = events.find(
          (event) => event.event_id === eventId
        );
        if (eventToChange) {
          const formData = {
            ...eventToChange,
            start_date: changes.startDate
              ? changes.startDate.toISOString().slice(0, 16)
              : eventToChange.start_date,
            end_date: changes.endDate
              ? changes.endDate.toISOString().slice(0, 16)
              : eventToChange.end_date,
            label_color: eventToChange.label_color || DEFAULT_APPOINTMENT_COLOR,
          };

          axios
            .put(`${baseUrl}/event/updateEvent/${eventId}`, formData)
            .then(() => {
              refreshEvents();
            })
            .catch((error) => {
              console.error('Error updating event:', error);
            });
        }
      });
    }

    if (deleted !== undefined) {
      const eventId = deleted;
      handleDelete(eventId);
    }
  };

  // Fetch Public events

  const refreshPubEvents = async () => {
    try {
      const response = await axios.get(`${baseUrl}/group/show-reg-events`);
      const pubEventData = response.data || [];
      setPubEvents(pubEventData);
      console.log('_____REPONSE_PUB_EVENTS', pubEventData);
    } catch (error) {
      console.error('Error fetching public events!', error);
      if (error.response && error.response.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoadingPub(false);
    }
  };


  const generatePubAppointments = (pubEvents) => {
    const pubAppointments = [];
    pubEvents.forEach((pubEvent) => {
      console.log('GENERATING THIS PUBEVENT: ', pubEvent)

      const event_id = pubEvent.event_id;
      const event_name = pubEvent.event_name;
      const group_id = pubEvent.group_id;
      const start_date_time = new Date(pubEvent.start_date_time);
      const end_date_time = new Date(pubEvent.end_date_time);
      const is_all_day = pubEvent.is_all_day;

      pubAppointments.push({
        title: event_name,
        group_id: group_id,
        startDate: start_date_time,
        endDate: end_date_time,
        is_all_day: is_all_day,
        id: event_id,
        originalEvent: pubEvent,
        isPublic: true,
      });

    });
    return pubAppointments;
  };


  useEffect(() => {
    refreshPubEvents();
  }, []);


  useEffect(() => {
    const pubAppointments = generatePubAppointments(pubEvents);
    setAppointments(pubAppointments);
    console.log('_____GENERATE_PUB_APPTS', pubAppointments);
  }, [pubEvents]);


  if (loadingPub) {
    return <div>Loading public events...</div>;
  }


  // Modified Appointment Component
  const Appointment = (props) => {
    const { data, style, ...restProps } = props;
    const event = data.originalEvent;

    const onEditClick = (e) => {
      e.stopPropagation();
      handleEdit(event);
    };

    const onDeleteClick = (e) => {
      e.stopPropagation();
      handleDelete(event.event_id);
    };

    return (
      <Appointments.Appointment
        {...restProps}
        data={data}
        style={{
          ...style,
          backgroundColor: data.label_color || DEFAULT_APPOINTMENT_COLOR,
          borderRadius: '10px',
          position: 'relative',
          marginBottom: '2px',
          overflow: 'hidden',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          cursor: 'pointer',
        }}
      >
        <div style={{ height: '100%', position: 'relative' }}>
          <CustomAppointmentContent data={data} />
          <div
            className="icons-container"
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              display: 'flex',
              gap: '4px',
              zIndex: 1,
            }}
          >
            {!data.isPublic && (
              <>
                {event.frequency && (
                  <RepeatIcon
                    style={{
                      color: '#fff',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '2px',
                      borderRadius: '4px',
                    }}
                    fontSize="small"
                  />
                )}
                <EditIcon
                  style={{
                    color: '#fff',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    padding: '2px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  fontSize="small"
                  onClick={onEditClick}
                />
              </>
            )}
            <DeleteIcon
              style={{
                color: '#fff',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '2px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              fontSize="small"
              onClick={onDeleteClick}
            />
          </div>
        </div>
      </Appointments.Appointment>
    );
  };

  // Custom Time Indicator
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

  const CustomTooltipContent = ({ appointmentData, ...restProps }) => {
    return (
      <AppointmentTooltip.Content {...restProps}>
        <div>
          <p>{appointmentData.location || 'No location provided'}</p>
          <p>{appointmentData.category || 'No category specified'}</p>
          <p>{appointmentData.group_id ? `Group: ${appointmentData.group_id}` : 'Private Event'}</p>
        </div>
      </AppointmentTooltip.Content>
    );
  };

  return (
    <div className="scheduler-container">
      <Paper>
        <Scheduler data={allAppointments} height={700} ref={schedulerRef}>
          <ViewState
            currentDate={currentDate}
            onCurrentDateChange={setCurrentDate}
          />
          <EditingState onCommitChanges={handleCommitChanges} />
          <DayView startDayHour={8} endDayHour={24} />
          <WeekView startDayHour={0} endDayHour={24} />
          <MonthView />
          <AllDayPanel />
          <Appointments appointmentComponent={Appointment} />
          <Toolbar />
          <DateNavigator />
          <ViewSwitcher />
          <TodayButton />
          <AppointmentTooltip
            showCloseButton
            visible={tooltipVisible}
            onVisibilityChange={setTooltipVisible}
            appointmentMeta={appointmentMeta}
            onAppointmentMetaChange={setAppointmentMeta}
            contentComponent={CustomTooltipContent}
          />
          <CurrentTimeIndicator
            shadePreviousCells
            shadePreviousAppointments
            updateInterval={60000}
            indicatorComponent={TimeIndicator}
          />
        </Scheduler>
      </Paper>
      <EventUpdateModal
        showUpdateEventModal={showUpdateEventModal}
        setShowUpdateEventModal={setShowUpdateEventModal}
        eventToUpdate={eventToUpdate}
        setEventToUpdate={setEventToUpdate}
        categories={categories}
        setCategories={setCategories}
        refreshEvents={refreshEvents}
      />
    </div>
  );
};

export default Calendar;
