import React, { useState, useEffect } from 'react';
import './StudyTime.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const baseUrl = process.env.REACT_APP_BASE_URL;

const StudyTime = () => {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [todayHours, setTodayHours] = useState(0);
    const [todayMinutes, setTodayMinutes] = useState(0);
    const [weekMinutes, setWeekMinutes] = useState(0);
    const [weekHours, setWeekHours] = useState(0);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (isRunning) {
        timer = setInterval(() => {
            setTime((prevTime) => prevTime + 1);
        }, 1000);
        }
        return () => clearInterval(timer);
    }, [isRunning]);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const fetchDailyAndWeeklyHours = async () => {
      try {
          const response = await axios.get(`${baseUrl}/studytime/day`, { withCredentials: true });
          const studyTimeInSeconds = response.data.study_time
          const hours = Math.floor(studyTimeInSeconds / 3600);
          const minutes = Math.floor((studyTimeInSeconds % 3600) / 60);
  
          if (response.status === 200) {
              setTodayHours(hours);
              setTodayMinutes(minutes);
          }
  
          const weekResponse = await axios.get(`${baseUrl}/studytime/week`, { withCredentials: true });
          const weekTimeInSeconds = weekResponse.data.study_time
          const weekhours = Math.floor(weekTimeInSeconds / 3600);
          const weekminutes = Math.floor((weekTimeInSeconds % 3600) / 60);
          if (weekResponse.status === 200) {
              console.log(weekhours);
              setWeekHours(weekhours);
              setWeekMinutes(weekminutes);
          }
      } catch (error) {
          console.error("Error fetching study time data:", error);
          setError("Failed to fetch study time data.");
      }
  };

    useEffect(() => {
        fetchDailyAndWeeklyHours();
    }, []);

    const handleSave = async (e) => {
      e.preventDefault();
      const formattedTime = formatTime(time);

      try {
          const response = await axios.post(
          `${baseUrl}/studytime/update/${formattedTime}`,
          null,
          { withCredentials: true }
          );
          
          console.log("Study time updated:", response.data);

          setTodayHours(todayHours + time / 3600);
          setTodayMinutes(todayMinutes + time / 60);
          setWeekHours(weekHours + time / 3600);
          setWeekMinutes(weekMinutes + time / 60);
          setTime(0);
          setIsRunning(false);
      } catch (err) {
          console.error("Error saving study time:", err);
          setError("Failed to save study time.");
      }
    };


    const handlePause = () => {
        setIsRunning(!isRunning);
    };

    const handleClear = () => {
        setTime(0);
        setIsRunning(false);
    };

    const handleNavigate = () => {
      navigate('/leaderboard');
    };

  return (
    <div className="container">
      <div className="header-container">
          <button className="button" onClick={() => navigate('/leaderboard')}>
              Go to LeaderBoard
          </button>
      </div>
      <div className="timer-container">
        <div className="timer-circle">
          <span className="timer-text">{formatTime(time)}</span>
        </div>
      </div>
      <div className="buttons-container">
        <button onClick={handleSave} className="button">Save</button>
        <button onClick={handlePause} className="button">
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button onClick={handleClear} className="button">Clear</button>
      </div>
      <div className="summary-container">
        <p>You worked {todayHours.toFixed(0)} hours and {todayMinutes.toFixed(0)} minutes today.</p>
        <p>You worked {weekHours.toFixed(0)} hours and {weekMinutes.toFixed(0)} minutes in total this week.</p>
      </div>
    </div>
  );
}

export default StudyTime;
