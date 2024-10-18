import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/landingPage.js';
import Friends from './pages/Friends.js';
import Tasks from './pages/Tasks.js';

function App() {
  return (
    // <div className="App">
    //   <LandingPage />
    // </div>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/friends" element={<Friends/>} />
        <Route path="/tasks" element={<Tasks/>} />
      </Routes>
    </Router>
  );
}

export default App;
