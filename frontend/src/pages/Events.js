import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Events.css';

const baseUrl = process.env.REACT_APP_BASE_URL;

const Events = () => {
  const [events, setEvents] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', location: '', start_date: '', end_date: '', category: '' });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showUpdateEventModal, setShowUpdateEventModal] = useState(false);
  const [updatedEvent, setUpdatedEvent] = useState({});

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${baseUrl}/event/getEventsByAccount/1`);
        const eventData = response.data.events || [];
        const groupedEvents = groupEventsByDate(eventData);
        setEvents(groupedEvents);
        extractCategories(eventData);
      } catch (error) {
        console.error("There was an error fetching the events!", error);
        setError('Failed to fetch events.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const groupEventsByDate = (events) => {
    const grouped = {};
    events.forEach(event => {
      const date = new Date(event.start_date).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    return grouped;
  };

  const extractCategories = (events) => {
    const categorySet = new Set();
    events.forEach(event => {
      if (event.category) {
        categorySet.add(event.category);
      }
    });
    setCategories([...categorySet]);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const filteredEvents = Object.keys(events).reduce((filtered, date) => {
    const eventsForDate = events[date].filter(event =>
      selectedCategory === '' || event.category === selectedCategory
    );
    if (eventsForDate.length) {
      filtered[date] = eventsForDate;
    }
    return filtered;
  }, {});

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...newEvent,
        account_id: '1',
      };
      const response = await axios.post(`${baseUrl}/event/createEvent`, formData);
      setShowAddEventModal(false);
      setNewEvent({ name: '', location: '', start_date: '', end_date: '', category: '' });

      // Fetch updated events
      const updatedEventsResponse = await axios.get(`${baseUrl}/event/getEventsByAccount/1`);
      const eventData = updatedEventsResponse.data.events || [];
      const groupedEvents = groupEventsByDate(eventData);
      setEvents(groupedEvents);
      extractCategories(eventData);
    } catch (error) {
      console.error("There was an error creating the event!", error.response?.data || error.message);
      setError('Failed to create event.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(`${baseUrl}/event/deleteEvent/${eventId}`);
      // Remove the event from the state
      setEvents(prevEvents => {
        const updatedEvents = { ...prevEvents };
        for (const date in updatedEvents) {
          updatedEvents[date] = updatedEvents[date].filter(event => event.event_id !== eventId);
          if (updatedEvents[date].length === 0) {
            delete updatedEvents[date];
          }
        }
        return updatedEvents;
      });
      if (selectedEvent && selectedEvent.event_id === eventId) {
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event.');
    }
  };

  const handleUpdateEventClick = (event) => {
    setUpdatedEvent({
      ...event,
    });
    setShowUpdateEventModal(true);
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedEvent({ ...updatedEvent, [name]: value });
  };

  const handleUpdateEventSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventId = updatedEvent.event_id;
      const formData = {
        ...updatedEvent,
      };
      delete formData.event_id;

      await axios.put(`${baseUrl}/event/updateEvent/${eventId}`, formData);
      setShowUpdateEventModal(false);

      // Fetch updated events
      const updatedEventsResponse = await axios.get(`${baseUrl}/event/getEventsByAccount/1`);
      const eventData = updatedEventsResponse.data.events || [];
      const groupedEvents = groupEventsByDate(eventData);
      setEvents(groupedEvents);
      extractCategories(eventData);

      // Update the selectedEvent
      setSelectedEvent(prevEvent => (prevEvent && prevEvent.event_id === eventId ? { ...prevEvent, ...formData } : prevEvent));
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event.');
    }
  };

  return (
    <div className="events-page-container">
      
      <div className="sidebar">
        <button><i className="fas fa-bars"></i></button>
        <button><i className="fas fa-bars"></i></button>
        <button><i className="fas fa-bars"></i></button>
      </div>

     

      {showAddEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add a New Event</h2>
            <form onSubmit={handleAddEvent}>
              <label>
                Event Name:
                <input
                  type="text"
                  name="name"
                  value={newEvent.name}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Location:
                <input
                  type="text"
                  name="location"
                  value={newEvent.location}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Start Date:
                <input
                  type="datetime-local"
                  name="start_date"
                  value={newEvent.start_date}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                End Date:
                <input
                  type="datetime-local"
                  name="end_date"
                  value={newEvent.end_date}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Category:
                <input
                  type="text"
                  name="category"
                  value={newEvent.category}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="submit">Create Event</button>
                <button type="button" onClick={() => setShowAddEventModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpdateEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Update Event</h2>
            <form onSubmit={handleUpdateEventSubmit}>
              <label>
                Event Name:
                <input
                  type="text"
                  name="name"
                  value={updatedEvent.name}
                  onChange={handleUpdateInputChange}
                  required
                />
              </label>
              <label>
                Location:
                <input
                  type="text"
                  name="location"
                  value={updatedEvent.location}
                  onChange={handleUpdateInputChange}
                  required
                />
              </label>
              <label>
                Start Date:
                <input
                  type="datetime-local"
                  name="start_date"
                  value={updatedEvent.start_date}
                  onChange={handleUpdateInputChange}
                  required
                />
              </label>
              <label>
                End Date:
                <input
                  type="datetime-local"
                  name="end_date"
                  value={updatedEvent.end_date}
                  onChange={handleUpdateInputChange}
                  required
                />
              </label>
              <label>
                Category:
                <input
                  type="text"
                  name="category"
                  value={updatedEvent.category}
                  onChange={handleUpdateInputChange}
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="submit">Update Event</button>
                <button type="button" onClick={() => setShowUpdateEventModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading events...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="events-list">
          {Object.keys(filteredEvents).map(date => (
            <div key={date} className="events-date">
              <h3>{date}</h3>
              {filteredEvents[date].map(event => (
                <div key={event.event_id} className="event-item-container">
                  <div
                    className="event-item"
                    onClick={() => handleEventClick(event)}
                  >
                    {event.name}
                  </div>
                  <button
                    className="delete-event-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event.event_id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      
       <div className="filter-container">
        <h2>Events</h2>
        <label htmlFor="categoryFilter">Filter by Category: </label>
        <select id="categoryFilter" value={selectedCategory} onChange={handleCategoryChange}>
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button className="add-event-button" onClick={() => setShowAddEventModal(true)}>
          Add Event
        </button>
      </div>

      <div className="event-details">
        {selectedEvent ? (
          <div className="event-details-content">
            <h2>{selectedEvent.name}</h2>
            <p>Location: {selectedEvent.location}</p>
            <p>Category: {selectedEvent.category}</p>
            <p>Start Date: {formatDateTime(selectedEvent.start_date)}</p>
            <p>End Date: {formatDateTime(selectedEvent.end_date)}</p>
            <button
              className="update-event-button"
              onClick={() => handleUpdateEventClick(selectedEvent)}
            >
              Update Event
            </button>
          </div>
        ) : (
          <p></p>
        )}
      </div>
    </div>
  );
};

export default Events;
