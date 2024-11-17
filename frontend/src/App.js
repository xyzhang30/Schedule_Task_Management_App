
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
import ChangeEmail from './pages/ChangeEmail.js'
import ChangePhoneNumber from './pages/ChangePhoneNumber.js';
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

function App() {
  return (
    <Router>
      <Main />
    </Router>
  );
}

const Main = () => {
  const location = useLocation();
  const hideNavBar = location.pathname === '/';

  return (
    <div className='main-container'>
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

        {/* Feature Routes */}
        <Route path="/friends" element={<Friends />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/event" element={<Events />} />
        <Route path="/calendar" element={<SchedulerPage />} />
        <Route path="/leaderboard" element={<Leaderboard/>} />
        <Route path="/studytime" element={<StudyTime/>} />
        <Route path="/availability" element={<FindSharedAvailability/>} />
        <Route path="/groups" element={<Groups/>} />
      </Routes>
    </div>
  );
};

export default App;
