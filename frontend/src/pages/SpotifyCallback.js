import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './SpotifyCallback.css';
import './SplitScreen.css';

const baseUrl = process.env.REACT_APP_BASE_URL;

const SpotifyCallback = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topTracks, setTopTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const fetchAuthorizationCode = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        try {
          const response = await axios.get(`${baseUrl}/spotify/callback?code=${code}`);
          const tokens = response.data;
          setAccessToken(tokens.access_token);
        } catch (error) {
          console.error('Error exchanging code for token:', error);
          alert('Failed to log in with Spotify. Please try again.');
        }
      } else {
        alert('No authorization code provided. Redirecting back to login.');
        window.location.href = 'http://localhost:3000/spotify-login';
      }
    };

    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchAuthorizationCode();
    }
  }, []);

  useEffect(() => {
    const fetchSongTracks = async () => {
      try {
        const response = await axios.get(`${baseUrl}/spotify/top-tracks`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setTopTracks(response.data.items || []);
      } catch (error) {
        console.error('Error fetching top tracks:', error);
        alert('Failed to fetch top tracks. Please try again.');
      }
    };

    if (accessToken) {
      fetchSongTracks();
      setLoading(false);
    }
  }, [accessToken]);

  if (loading) {
    return <div className="loading">Processing Spotify Login...</div>;
  }

  if (!accessToken) {
    return <div className="error">Failed to retrieve access token. Please try logging in again.</div>;
  }

  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
  };

  return (
    <div className="split-screen-container">
      <div className="split-screen-content">

        <div className="split-screen-filter-container">
          <h2>Welcome to Spotify Dashboard</h2>
          {loading && <p className="loading">Loading tracks...</p>}
        </div>

        <div className="split-screen-left">
          {!loading && topTracks.length > 0 ? (
            <div className="tracks-container">
              <h2>Your Top Tracks</h2>
              <ul className="track-list">
                {topTracks.map((track, index) => (
                  <li
                    key={index}
                    className="track-item"
                    onClick={() => handlePlayTrack(track)}
                  >
                    {track.name} by {track.artists.map((artist) => artist.name).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="no-tracks">No top tracks found.</p>
          )}
        </div>
        
        <div className="split-screen-right">
          {currentTrack && (
            <div className="now-playing">
              <h3>
                Now Playing: {currentTrack.name} by{' '}
                {currentTrack.artists.map((artist) => artist.name).join(', ')}
              </h3>
              {currentTrack.external_urls?.spotify && (
                <p>
                  <button
                    onClick={() => window.open(currentTrack.external_urls.spotify, "_blank", "noopener,noreferrer")}
                    className="spotify-button button"
                  >
                    Listen on Spotify
                  </button>
                </p>
                // <p>
                //   <a
                //     href={currentTrack.external_urls.spotify}
                //     target="_blank"
                //     rel="noopener noreferrer"
                //     className="spotify-link"
                //   >
                //     Listen on Spotify
                //   </a>
                // </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SpotifyCallback;
