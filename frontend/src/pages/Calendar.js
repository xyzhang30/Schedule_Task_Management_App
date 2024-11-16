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
import { styled, alpha } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import classNames from 'clsx';

axios.defaults.withCredentials = true;

const baseUrl = process.env.REACT_APP_BASE_URL;

// Define the default color for appointments without a label
const DEFAULT_APPOINTMENT_COLOR = '#2196F3';

// Styled Appointment Component
const StyledAppointment = styled(Appointments.Appointment)(({ data }) => ({
  backgroundColor: data.label_color || DEFAULT_APPOINTMENT_COLOR,
  borderRadius: '10px',
  position: 'relative',
  marginBottom: '2px',
  overflow: 'hidden',
  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: alpha(data.label_color || DEFAULT_APPOINTMENT_COLOR, 0.85),
  },
  '&:focus': {
    backgroundColor: alpha(data.label_color || DEFAULT_APPOINTMENT_COLOR, 0.9),
  },
}));

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

  // Fetch events from backend
  useEffect(() => {
    refreshEvents();
  }, []);

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
    setEventToUpdate(event);
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
            label_color:
              changes.label_text && changes.label_text.trim() !== ''
                ? changes.label_color || DEFAULT_APPOINTMENT_COLOR
                : DEFAULT_APPOINTMENT_COLOR,
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

  // Custom Appointment Content Component
  const CustomAppointmentContent = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '8px',
    '& .title': {
      fontSize: '1rem',
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: '4px',
    },
    '& .text': {
      fontSize: '0.9rem',
      color: '#fff',
    },
  }));

  // Custom Appointment Component
  const Appointment = ({ data, ...restProps }) => {
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
      <StyledAppointment data={data} {...restProps}>
        <div>
          <div className="buttons-container" style={{
            position: 'absolute',
            top: 2,
            right: 2,
            display: 'flex',
            gap: '4px',
          }}>
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
          <CustomAppointmentContent>
            <div className="title">{data.title}</div>
            {data.category && (
              <div className="text">Category: {data.category}</div>
            )}
            {data.location && (
              <div className="text">Location: {data.location}</div>
            )}
          </CustomAppointmentContent>
        </div>
      </StyledAppointment>
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
        <Scheduler data={appointments} height={660}>
          <ViewState
            currentDate={currentDate}
            onCurrentDateChange={setCurrentDate}
          />
          <EditingState onCommitChanges={handleCommitChanges} />
          <MonthView />
          <WeekView startDayHour={0} endDayHour={24} />
          <DayView startDayHour={0} endDayHour={24} />
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
