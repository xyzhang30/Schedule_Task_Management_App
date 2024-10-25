// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/landingPage.js';
import Friends from './pages/Friends.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import Logout from './pages/Logout.js';
import ChangeUsername from './pages/ChangeUsername.js';
import ChangePassword from './pages/ChangePassword.js';
import ChangePhoneNumber from './pages/ChangePhoneNumber.js';
import ResetPassword from './pages/ResetPassword.js';
import Tasks from './pages/Tasks.js';
import NavBar from './navbar.js';
import Posts from './pages/Posts.js';
import Events from './pages/Events';

function App() {
  return (
    <Router>
      {/* <div>
        <NavBar /> */}
      <Routes>
        {/* Default Route */}
        {/* <Route path="/" element={<LandingPage />} /> */}

        {/* Events Route */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/change-username" element={<ChangeUsername />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/change-phone-number" element={<ChangePhoneNumber />} />
        <Route path="/friends" element={<Friends/>} />
        <Route path="/tasks" element={<Tasks/>} />
        <Route path="/posts" element={<Posts/>} />
        <Route path="/event" element={<Events />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
      {/* </div> */}
    </Router>
  );
}

export default App;
