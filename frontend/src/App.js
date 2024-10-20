import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/landingPage.js';
import Friends from './pages/Friends.js';
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
        <Route path="/friends" element={<Friends/>} />
        <Route path="/tasks" element={<Tasks/>} />
        <Route path="/posts" element={<Posts/>} />
        <Route path="/event" element={<Events />} />
      </Routes>
      {/* </div> */}
    </Router>
  );
}

export default App;
