import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faHome, faCalendar, faCog, faUsers, faInfoCircle, faCalendarAlt,faPeopleGroup, faCalendarCheck, faComments  } from '@fortawesome/free-solid-svg-icons';

import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

library.add(faHome, faCalendar, faCog, faUsers, faInfoCircle, faCalendarAlt,faPeopleGroup, faCalendarCheck, faComments );

// Create a theme instance (customize as needed)
const theme = createTheme({
  // Customize your theme here
});



// // Initial render
// Root.render(
//   <React.StrictMode>
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <App />
//     </ThemeProvider>
//   </React.StrictMode>
// );

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();