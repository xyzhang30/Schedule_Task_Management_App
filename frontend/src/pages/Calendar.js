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

axios.defaults.withCredentials = true;

const baseUrl = process.env.REACT_APP_BASE_URL;

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
      setEvents(eventData);
      const appointmentsData = generateAppointments(eventData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching events!', error);
      if (error.response && error.response.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

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
      const changedEventIds = Object.keys(changed);

      changedEventIds.forEach((eventIdStr) => {
        const eventId = parseInt(eventIdStr);
        const changes = changed[eventId];

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

  // Custom Appointment Component
  const Appointment = withStyles({
    appointment: {
      borderRadius: '8px',
      backgroundColor: (props) =>
        props.data.label_color ? props.data.label_color : '#1976d2',
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
        className={classes.appointment}
      >
        <div>
          <div className={classes.buttonsContainer}>
            <EditIcon
              className={classes.iconButton}
              fontSize="small"
              onClick={onEditClick}
            />
            <DeleteIcon
              className={classes.iconButton}
              fontSize="small"
              onClick={onDeleteClick}
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
          
          <MonthView />
          <WeekView startDayHour={0} endDayHour={24} />
          <DayView startDayHour={0} endDayHour={24} />
          <AllDayPanel />
          <Appointments
            appointmentComponent={Appointment}
          />
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
