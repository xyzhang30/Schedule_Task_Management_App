import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const baseUrl = process.env.REACT_APP_BASE_URL;

const SpotifyCallback = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topTracks, setTopTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const isFirstRender = useRef(true); // set a flag so that the callback is run only once

  useEffect(() => {

    const fetchAuthorizationCode = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        try {
          const response = await axios.get(`${baseUrl}/spotify/callback?code=${code}`);
          const tokens = response.data;
          console.log('Response:', tokens)
          console.log('Access Token:', tokens.access_token);

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
    };

  }, []);

  useEffect(() => {

    const fetchSongTracks = async () => {
      try {
        const response = await axios.get(`${baseUrl}/spotify/top-tracks`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json', // ChatGPT's debug suggestion
          },
        });

        console.log("__MY_TOP_TRACKS__: ", response.data);
        setTopTracks(response.data.items || []);
      } catch (error) {
        console.error('Error fetching top tracks:', error);
        alert('Failed to fetch top tracks. Please try again.');
      }
    };

      if (accessToken) {
        console.log("calling fetchsongtracks");
        fetchSongTracks();
      }
      setLoading(false);

  }, [accessToken]);


  if (loading) {
    return <div>Processing Spotify Login...</div>;
  }

  if (!accessToken) {
    return <div>Failed to retrieve access token. Please try logging in again.</div>;
  }


  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
  };

  return (
    <div>
      <h2>Welcome to Spotify Dashboard</h2>
      <h3>Your Top Tracks</h3>
      {loading && <p>Loading tracks...</p>}

      {/* Display the list of top tracks */}
      {!loading && topTracks.length > 0 ? (
        <div>
          <h2>Top Tracks</h2>
          <ul>
            {topTracks.map((track, index) => (
              <li key={index} onClick={() => handlePlayTrack(track)}>
                {track.name} by {track.artists.map(artist => artist.name).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No top tracks found.</p>
      )}

      {/* Display the current track and play the audio */}
      {currentTrack && (
        <div>
          <h3>Now Playing: {currentTrack.name} by {currentTrack.artists.map(artist => artist.name).join(', ')}</h3>
          <audio controls autoPlay>
            <source src={currentTrack.preview_url} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
  
};

export default SpotifyCallback;
