// src/SchedulerPage.js

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
import Paper from '@mui/material/Paper';
import './Calendar.css';

const initialAppointments = [
  {
    title: 'Meeting with John',
    startDate: new Date(2024, 10, 5, 9, 0), // Months are 0-indexed (11 = December)
    endDate: new Date(2024, 10, 5, 10, 0),
    id: 0,
  },
  {
    title: 'Lunch with Sarah',
    startDate: new Date(2024, 10, 6, 12, 0),
    endDate: new Date(2024, 10, 6, 13, 0),
    id: 1,
  },
  // Add more appointments as needed
];

const SchedulerPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments] = useState(initialAppointments); // If appointments are static, no need for setAppointments

  return (
    <Paper>
      <Scheduler data={appointments} height={660}>
        <ViewState
          currentDate={currentDate}
          onCurrentDateChange={setCurrentDate}
        />
        <Toolbar />
        <ViewSwitcher />
        <WeekView startDayHour={8} endDayHour={20} />
        <DateNavigator />
        <TodayButton />
        <Appointments />
        <AppointmentTooltip showCloseButton showDeleteButton />
        <AppointmentForm />
      </Scheduler>
    </Paper>
  );
};

export default SchedulerPage;
