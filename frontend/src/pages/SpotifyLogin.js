import React from 'react';

const SpotifyLogin = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:8080/spotify/login';
  };

  return (
    <div>
      <h1>Login to Spotify</h1>
      <button onClick={handleLogin}>Login with Spotify</button>
    </div>
  );
};

export default SpotifyLogin;
