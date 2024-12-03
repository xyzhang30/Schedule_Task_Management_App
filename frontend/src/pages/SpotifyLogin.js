import React from 'react';
import './EditProfileButtonPages.css'

const SpotifyLogin = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:8080/spotify/login';
  };

  return (
    <div className='edit-profile-pages'>
      <h1>Login to Spotify</h1>
      <button 
        className='button'
        onClick={handleLogin}>Login with Spotify
      </button>
    </div>
  );
};

export default SpotifyLogin;
