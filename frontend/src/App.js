import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/landingPage.js';
import Friends from './pages/Friends.js';
import Posts from './pages/Posts.js';

function App() {
  return (
    // <div className="App">
    //   <LandingPage />
    // </div>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/friends" element={<Friends/>} />
        <Route path="/posts" element={<Posts/>} />
      </Routes>
    </Router>
  );
}

export default App;
