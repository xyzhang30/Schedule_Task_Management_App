import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Leaderboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';

const baseUrl = process.env.REACT_APP_BASE_URL;

const Leaderboard = () => {
    const [weeklyStudyTimes, setWeeklyStudyTimes] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAllWeeklyStudyTimes();
    }, []);

    //fetch everyone's weekly study time
    const fetchAllWeeklyStudyTimes = async () => {
        try {
            const response = await axios.get(`${baseUrl}/studytime/all_weekly`);
            setWeeklyStudyTimes(response.data.weekly_study_times);
        } catch (err) {
            setError("Could not fetch weekly study times.");
        }
    };

    return (
        <div className="leaderboard-container">
            <h1>Weekly Study Leaderboard</h1>
            {error && <p className="error">{error}</p>}

            <section className="leaderboard">
                <div className="leaderboard-header">
                    <span className="leaderboard-rank">Rank</span>
                    <span className="leaderboard-name">Name</span>
                    <span className="leaderboard-score">Study Time</span>
                </div>
                {weeklyStudyTimes.length > 0 ? (
                    <ol className="leaderboard-list">
                        {weeklyStudyTimes.map((user, index) => (
                            <li key={index} className="leaderboard-item">
                                <span className="leaderboard-rank">
                                    {index === 0 ? (
                                        <>
                                            <FontAwesomeIcon icon={faCrown} className="crown-icon" />
                                            {index + 1}
                                        </>
                                    ) : (
                                        index + 1
                                    )}
                                </span>
                                <span className="leaderboard-name">{user.username}</span>
                                <span className="leaderboard-score">{user.total_study_time}</span>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p>No study time recorded for this week.</p>
                )}
            </section>
        </div>
    );
};

export default Leaderboard;