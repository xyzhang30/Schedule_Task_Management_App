// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/landingPage.js';
import Friends from './pages/Friends.js';
import Login from './pages/Login.js';
import Profile from './pages/Profile.js';
import Register from './pages/Register.js';
import Logout from './pages/Logout.js';
import ChangeUsername from './pages/ChangeUsername.js';
import ChangePassword from './pages/ChangePassword.js';
import ChangeEmail from './pages/ChangeEmail.js';
import ChangePhoneNumber from './pages/ChangePhoneNumber.js';
import ChangeMajor from './pages/ChangeMajor.js';
import ChangeAvatar from './pages/ChangeAvatar.js'
import ResetPassword from './pages/ResetPassword.js';
import Tasks from './pages/Tasks.js';
import NavBar from './navbar.js';
import Posts from './pages/Posts.js';
import Events from './pages/Events';
import ForgotPassword from './pages/ForgotPassword.js';
import StudyTime from './pages/StudyTime.js';
import SchedulerPage from './pages/Calendar.js';
import Leaderboard from './pages/LeaderBoard.js';
import FindSharedAvailability from './pages/Availability.js';
import Groups from './pages/Groups.js';
import Inbox from './pages/Inbox.js';
import GroupIndex from './pages/GroupIndex.js';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import SpotifyLogin from './pages/SpotifyLogin.js';
import SpotifyCallback from './pages/SpotifyCallback.js';

// Define your custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#a3b18a',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#ffffff', // Button text color
          '&:hover': {
            backgroundColor: '#a3b18a', // Hover background color
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Main />
      </Router>
    </ThemeProvider>
  );
}

const Main = () => {
  const location = useLocation();
  const hideNavBar = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className={`main-container ${hideNavBar ? 'no-navbar' : ''}`}>
      {!hideNavBar && <NavBar />}
      <Routes>
        {/* Landing Page (Homepage) */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Profile Routes */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-username" element={<ChangeUsername />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/change-phone-number" element={<ChangePhoneNumber />} />
        <Route path="/change-email" element={<ChangeEmail />} />
        <Route path="/change-major" element={<ChangeMajor />} />
        <Route path="/change-avatar" element={<ChangeAvatar />} />
        <Route path="/inbox" element={<Inbox />} />

        {/* Feature Routes */}
        <Route path="/friends" element={<Friends />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/event" element={<Events />} />
        <Route path="/calendar" element={<SchedulerPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/studytime" element={<StudyTime />} />
        <Route path="/availability" element={<FindSharedAvailability />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groupindex" element={<GroupIndex />} />
        <Route path="/spotify-login" element={<SpotifyLogin />} />
        <Route path="/spotify-callback" element={<SpotifyCallback />} />
      </Routes>
    </div>
  );
};

export default App;
