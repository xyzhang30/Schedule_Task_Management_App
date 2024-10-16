import React, { useState, useEffect } from 'react';
import './Events.css'; // Ensure styles are correctly linked.
import axios from 'axios'; // Import axios for HTTP requests


const baseUrl = process.env.REACT_APP_BASE_URL;
const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState(null); // Track the currently selected event
  const [events, setEvents] = useState([]); // Fetch events from the API
  const [showCreateEventModal, setShowCreateEventModal] = useState(false); // Toggle create event modal
  const [newEvent, setNewEvent] = useState({ name: '', location: '', startDate: '', endDate: '', category: '' });

  // Fetch events from the API when the component mounts
  useEffect(() => {
    axios.get(`${baseUrl}/event/get-events`) // Adjust to your Flask API route
      .then(response => {
        setEvents(response.data); // Assume the API returns a list of events
      })
      .catch(error => {
        console.error("There was an error fetching the events!", error);
      });
  }, []);

  // Function to handle click on an event to show details
  const handleEventClick = (eventName, startDate) => {
    setSelectedEvent({
      name: eventName,
      startDate: new Date(startDate).toLocaleString(),
    });
  };

  // Function to close event details
  const closeEventDetails = () => {
    setSelectedEvent(null); // Clear the selected event when close button is clicked
  };

  // Function to delete an event
  const deleteEvent = (eventId) => {
    axios.delete(`${baseUrl}/event/deleteEvent/${eventId}`) // Adjust to your Flask API route
      .then(response => {
        setEvents(events.filter(event => event.id !== eventId)); // Update the state
      })
      .catch(error => {
        console.error("There was an error deleting the event!", error);
      });
  };

  // Function to handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  // Function to create a new event
  const handleCreateEvent = () => {
    console.log("New Event Data:", newEvent); // Debugging step
    
    // Ensure that all fields are filled before sending the request
    if (!newEvent.name || !newEvent.location || !newEvent.startDate || !newEvent.endDate || !newEvent.category) {
      alert("Please fill in all fields");
      return;
    }
  
    axios.post('${baseUrl}/event/createEvent', newEvent) // Adjust to your Flask API route
      .then(response => {
        console.log('Event created', response.data); // Debugging step
        setEvents([...events, response.data.event]); // Update the state with the new event
        setShowCreateEventModal(false); // Close the modal
        setNewEvent({ name: '', location: '', startDate: '', endDate: '', category: '' }); // Reset form
      })
      .catch(error => {
        console.error("There was an error creating the event!", error);
      });
  };
  

  return (
    <div className="main-container">
      {/* Sidebar */}
      <div className="sidebar">
        <button><i className="fas fa-bars"></i></button>
        <button><i className="fas fa-bars"></i></button>
        <button><i className="fas fa-bars"></i></button>
      </div>

      {/* Main content */}
      <div className="content">
        {/* Event list section */}
        <div className="left-section">
          <h1>Events</h1>
          {events.map((event) => (
            <div key={event.id}>
              <h2>{new Date(event.date).toLocaleDateString()}</h2>
              <div
                className="event-section"
                onClick={() => handleEventClick(event.name, event.date)} // Trigger details on click
              >
                <div className="event">
                  <span>{event.name}</span>
                  <span>{new Date(event.date).toLocaleString()}</span>
                </div>
                <button className="delete-button" onClick={() => deleteEvent(event.id)}>X</button>
              </div>
            </div>
          ))}
        </div>

        {/* Middle section with filters */}
        <div className="filter-section">
          <h3>Filter by</h3>
          <div>
            <strong>Category</strong>
            <label><input type="checkbox" /> Social</label>
            <label><input type="checkbox" /> Other</label>
          </div>
          <div>
            <strong>Location</strong>
            <label><input type="checkbox" /> Onsite</label>
            <label><input type="checkbox" /> Other</label>
          </div>
          <button className="create-button" onClick={() => setShowCreateEventModal(true)}>Create new event</button>
        </div>

        {/* Event Details Section */}
        <div className={`right-section event-details ${selectedEvent ? 'visible' : ''}`}>
          {selectedEvent && (
            <>
              <button className="close-button" onClick={closeEventDetails}>X</button>
              <h2>{selectedEvent.name} <span className="category-badge">category</span></h2>
              <p><strong>Location:</strong> Location text</p>
              <p><strong>Start Date:</strong> {selectedEvent.startDate}</p>
              <p><strong>End Date:</strong> End date text</p>
              <p><strong>Notes:</strong> Who else joined... <br />Friends: xxx, xxx, ...</p>
              <button className="update-button">Update</button>
            </>
          )}
        </div>

        {/* Create Event Modal */}
        {showCreateEventModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Create New Event</h2>
              <div className="modal-form">
                <label>Event Name:</label>
                <input type="text" name="name" value={newEvent.name} onChange={handleInputChange} />

                <label>Location:</label>
                <input type="text" name="location" value={newEvent.location} onChange={handleInputChange} />

                <label>Start Date:</label>
                <input type="datetime-local" name="startDate" value={newEvent.startDate} onChange={handleInputChange} />

                <label>End Date:</label>
                <input type="datetime-local" name="endDate" value={newEvent.endDate} onChange={handleInputChange} />

                <label>Category:</label>
                <input type="text" name="category" value={newEvent.category} onChange={handleInputChange} />

                <div className="modal-actions">
                  <button className="create-button" onClick={handleCreateEvent}>Create</button>
                  <button className="close-button" onClick={() => setShowCreateEventModal(false)}></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
