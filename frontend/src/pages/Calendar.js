import React, { useState } from 'react';
import { ViewState } from '@devexpress/dx-react-scheduler';
import {
  Scheduler,
  WeekView,
  Appointments,
  Toolbar,
  DateNavigator,
  TodayButton,
  ViewSwitcher,
  AppointmentForm,
  AppointmentTooltip,
} from '@devexpress/dx-react-scheduler-material-ui';
import { Paper } from '@mui/material';
import './Calendar.css';


const initialAppointments = [
  {
    title: 'Meeting with John',
    startDate: new Date(2024, 3, 20, 9, 0),
    endDate: new Date(2024, 3, 20, 10, 0),
    id: 0,
  },
  {
    title: 'Lunch with Sarah',
    startDate: new Date(2024, 3, 21, 12, 0),
    endDate: new Date(2024, 3, 21, 13, 0),
    id: 1,
  },
  
];

const SchedulerPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState(initialAppointments);

  return (
    <Paper>
      <Scheduler
        data={appointments}
        height={660}
      >
        <ViewState
          currentDate={currentDate}
          onCurrentDateChange={setCurrentDate}
        />
        <Toolbar />
        <ViewSwitcher />
        <WeekView
          startDayHour={8}
          endDayHour={20}
        />
       
        <DateNavigator />
        <TodayButton />
        <Appointments />
        <AppointmentTooltip
          showCloseButton
          showDeleteButton
        />
        <AppointmentForm />
      </Scheduler>
    </Paper>
  );
};

export default SchedulerPage;