// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/landingPage.js';
import Friends from './pages/Friends.js';
import Login from './pages/Login.js';
import Profile from './pages/Profile.js'
import Register from './pages/Register.js';
import Logout from './pages/Logout.js';
import ChangeUsername from './pages/ChangeUsername.js';
import ChangePassword from './pages/ChangePassword.js';
import ChangePhoneNumber from './pages/ChangePhoneNumber.js';
import ResetPassword from './pages/ResetPassword.js'
import Tasks from './pages/Tasks.js';
import NavBar from './navbar.js';
import Posts from './pages/Posts.js';
import Events from './pages/Events';
import GroupIndexPage from './pages/GroupIndex.js';
import GroupInfoPage from './pages/GroupInfo.js';
import ForgotPassword from './pages/ForgotPassword.js';
import StudyTime from './pages/StudyTime.js';
import LeaderBoard from './pages/LeaderBoard.js';

function App() {
  return (
    <Router>
      <div className='main-container'>
        <NavBar />
      <Routes>
        {/* Default Route */}
        {/* <Route path="/" element={<LandingPage />} /> */}

        {/* Events Route */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/change-username" element={<ChangeUsername />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/change-phone-number" element={<ChangePhoneNumber />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/friends" element={<Friends/>} />
        <Route path="/tasks" element={<Tasks/>} />
        <Route path="/posts" element={<Posts/>} />
        <Route path="/event" element={<Events />} />
        <Route path="/groups" element={<GroupIndexPage/>} />
        <Route path="/group-info" element={<GroupInfoPage/>} />
        <Route path="/studytime" element={<StudyTime/>} />
        <Route path="/leaderboard" element={<LeaderBoard/>} />
      </Routes>
      </div>
    </Router>
  );
}

export default App;
