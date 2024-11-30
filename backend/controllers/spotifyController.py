import logging
from flask import Flask, Blueprint, request, jsonify, redirect, make_response
import requests
import os
import base64

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

bp = Blueprint('spotify', __name__, url_prefix='/spotify')

CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
REDIRECT_URI = 'http://localhost:3000/spotify-callback'

if not CLIENT_ID or not CLIENT_SECRET:
    raise ValueError("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set")

@bp.route('/login', methods=['GET'])
def login():
    """Redirect the user to Spotify's authorization page."""
    scope = 'user-read-playback-state user-modify-playback-state streaming user-top-read'
    spotify_auth_url = (
        f"https://accounts.spotify.com/authorize"
        f"?client_id={CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope={scope}"
    )
    return redirect(spotify_auth_url)

@bp.route('/callback', methods=['GET'])
def callback():
    """Handle Spotify's callback and exchange code for an access token."""

    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'Authorization failed'}), 400

    encodedauth = f"{CLIENT_ID}:{CLIENT_SECRET}".encode("ascii")
    encodedauth = base64.b64encode(encodedauth)
    encodedauth = encodedauth.decode("ascii")

    url = "https://accounts.spotify.com/api/token"

    payload = f"grant_type=authorization_code&code={code}&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fspotify-callback"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": f"Basic {encodedauth}"
    }

    response = requests.request("POST", url, data=payload, headers=headers)

    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to retrieve access token', 'details': response.text}), response.status_code
    
@bp.route('/top-tracks', methods=['GET', 'OPTIONS'])
def getTopTracks():

    # ChatGPT's debug suggestions: 
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'Preflight OK'})
        response.status_code = 200  # Explicitly set 200 OK
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        return response


    # Getting top tracks:
    access_token = request.headers.get('Authorization')  # Expecting 'Bearer <access_token>'
    if not access_token:
        return jsonify({'error': 'Authorization token missing'}), 401

    url = "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5"
    headers = {"Authorization": access_token}

    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        return jsonify({'error': response.json()}), response.status_code

    return jsonify(response.json())
