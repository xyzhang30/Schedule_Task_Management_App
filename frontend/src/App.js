import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Events from './pages/Events';
import LandingPage from './pages/landingPage';  // Assuming you want a landing page or a default page

function App() {
  return (
    <Router>
      <Routes>
        {/* Default Route */}
        {/* <Route path="/" element={<LandingPage />} /> */}

        {/* Events Route */}
        <Route path="/event" element={<Events />} />

        {/* Redirect to Events if no other route matches */}
        <Route path="*" element={<Navigate to="/event" />} />
      </Routes>
    </Router>
  );
}

export default App;
