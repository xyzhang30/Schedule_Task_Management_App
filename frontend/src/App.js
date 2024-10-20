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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/change-username" element={<ChangeUsername />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/change-phone-number" element={<ChangePhoneNumber />} />
      </Routes>
    </Router>
  );
}

export default App;
