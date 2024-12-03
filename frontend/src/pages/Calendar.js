import React, { useState, useEffect, useRef } from 'react';
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
const DEFAULT_APPOINTMENT_COLOR = '#2196F3';

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
      const response = await axios.get(`${baseUrl}/event/getEventsByAccount`, {
        params: {
          include_past: true, // Fetch all events, including past events
        },
      });
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

      // Removed recurrence rule generation to avoid duplicates
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
        // Removed rRule to prevent duplicate events
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
    if (event.series_id && event.event_id !== event.series_id) {
      alert('Cannot edit individual occurrences of a recurring event. Please edit the original event.');
      return;
    }
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

        const eventToChange = events.find((event) => event.event_id === eventId);
        if (eventToChange) {
          if (eventToChange.series_id && eventToChange.event_id !== eventToChange.series_id) {
            alert('Cannot edit individual occurrences of a recurring event. Please edit the original event.');
            return;
          }
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

  return (
    <div className="scheduler-container">
      <Paper>
        <Scheduler data={appointments} height={700} ref={schedulerRef}>
          <ViewState
            currentDate={currentDate}
            onCurrentDateChange={setCurrentDate}
          />
          <EditingState onCommitChanges={handleCommitChanges} />
          <WeekView startDayHour={0} endDayHour={24} />
          <DayView startDayHour={8} endDayHour={24} />
          
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