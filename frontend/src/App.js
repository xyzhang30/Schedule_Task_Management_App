import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/landingPage.js';
import Friends from './pages/Friends.js';
import NavBar from './navbar.js';

function App() {
  return (
    // <div className="App">
    //   <LandingPage />
    // </div>
    <Router>
      {/* <div>
        <NavBar /> */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/friends" element={<Friends/>} />
      </Routes>
      {/* </div> */}
    </Router>
  );
}

export default App;
