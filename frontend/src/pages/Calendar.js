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
  AppointmentForm,
  AllDayPanel,
  CurrentTimeIndicator,
} from '@devexpress/dx-react-scheduler-material-ui';
import Paper from '@mui/material/Paper';
import './Calendar.css';
import EventUpdateModal from './EventUpdate';
import { withStyles } from '@mui/styles';
import { colorManipulator } from '@mui/system';
import { AccessTime } from '@mui/icons-material';

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

      const repeatUntil = event.repeat_until
        ? new Date(event.repeat_until)
        : null;

      const frequency = event.frequency;

      if (frequency && frequency !== '' && repeatUntil) {
        let currentDate = new Date(startDate);
        while (currentDate <= repeatUntil) {
          appointments.push({
            title: event.name,
            startDate: new Date(currentDate),
            endDate: new Date(currentDate.getTime() + (endDate - startDate)),
            id: event.event_id,
            location: event.location,
            category: event.category,
            label_text: event.label_text,
            label_color: event.label_color,
            frequency: event.frequency,
            repeat_until: event.repeat_until,
            originalEvent: event,
          });

          // Calculate next occurrence based on frequency
          switch (frequency) {
            case 'Once a Week':
              currentDate.setDate(currentDate.getDate() + 7);
              break;
            case 'Twice a Week':
              currentDate.setDate(currentDate.getDate() + 3.5);
              break;
            case 'Every Day':
              currentDate.setDate(currentDate.getDate() + 1);
              break;
            default:
              currentDate = new Date(repeatUntil.getTime() + 1); // exit loop
              break;
          }
        }
      } else {
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
        });
      }
    });
    return appointments;
  };

  // Appointment Tooltip Content Component
  const AppointmentTooltipContent = ({ appointmentData, ...restProps }) => {
    const event = appointmentData.originalEvent;

    const handleDelete = async () => {
      if (window.confirm('Are you sure you want to delete this event?')) {
        try {
          await axios.delete(`${baseUrl}/event/deleteEvent/${event.event_id}`);
          refreshEvents();
        } catch (error) {
          console.error('Error deleting event:', error);
        }
      }
    };

    const handleEdit = () => {
      setEventToUpdate(event);
      setShowUpdateEventModal(true);
      setTooltipVisible(false); // Close the tooltip when modal opens
    };

    return (
      <AppointmentTooltip.Content
        {...restProps}
        appointmentData={appointmentData}
      >
        <div style={{ padding: '10px' }}>
          <div>Category: {event.category}</div>
          {event.frequency && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <AccessTime fontSize="small" style={{ marginRight: '5px' }} />
              Repeats: {event.frequency}
            </div>
          )}
        </div>
      </AppointmentTooltip.Content>
    );
  };

  // Custom Appointment Component
  const Appointment = withStyles({
    appointment: {
      borderRadius: '8px',
      backgroundColor: (props) =>
        props.data.label_color ? props.data.label_color : '#1976d2',
    },
  })(({ classes, ...restProps }) => (
    <Appointments.Appointment {...restProps} className={classes.appointment} />
  ));

  // Custom Recurring Icon
  const RecurringIcon = ({ ...restProps }) => (
    <AccessTime fontSize="small" style={{ marginRight: '5px' }} />
  );

  return (
    <div className="scheduler-container">
      <Paper>
        <Scheduler data={appointments} height={660}>
          <ViewState
            currentDate={currentDate}
            onCurrentDateChange={setCurrentDate}
          />
          <EditingState />
          <Toolbar />
          <DateNavigator />
          <TodayButton />
          <ViewSwitcher />
          <MonthView />
          <WeekView startDayHour={0} endDayHour={24} />
          <DayView startDayHour={0} endDayHour={24} />
          <AllDayPanel />
          <Appointments appointmentComponent={Appointment} />
          <AppointmentTooltip
            showCloseButton
            showOpenButton
            showDeleteButton
            visible={tooltipVisible}
            onVisibilityChange={setTooltipVisible}
            contentComponent={AppointmentTooltipContent}
            recurringIconComponent={RecurringIcon}
            onDeleteButtonClick={(e) => {
              e.stopPropagation();
            }}
            onOpenButtonClick={(e) => {
              e.stopPropagation();
            }}
          />
          <AppointmentForm readOnly />
          <CurrentTimeIndicator
            shadePreviousCells
            shadePreviousAppointments
            updateInterval={60000}
            indicatorComponent={() => (
              <div
                style={{
                  position: 'absolute',
                  zIndex: 1,
                  width: '100%',
                  height: '2px',
                  backgroundColor: 'red',
                }}
              />
            )}
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
