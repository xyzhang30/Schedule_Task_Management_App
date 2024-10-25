
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
  const [newEvent, setNewEvent] = useState({
    name: '',
    location: '',
    start_date: '',
    end_date: '',
    category: '',
    customCategory: '',
  });
  const [categories, setCategories] = useState(['personal', 'academic']);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showUpdateEventModal, setShowUpdateEventModal] = useState(false);
  const [updatedEvent, setUpdatedEvent] = useState({});
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [currentLabelEvent, setCurrentLabelEvent] = useState(null);
  const [labelData, setLabelData] = useState({ label_text: '', label_color: '#ffffff' });
  const [alertEvent, setAlertEvent] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${baseUrl}/event/getEventsByAccount/1`);
        const eventData = response.data.events || [];
        eventData.forEach(event => {
          event.alerted = false;
        });
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

  useEffect(() => {
    const checkEvents = () => {
      const now = new Date();
      for (const date in events) {
        for (const event of events[date]) {
          if (!event.alerted) {
            const eventStart = new Date(event.start_date);
            if (Math.abs(eventStart - now) < 60000) { 
              setAlertEvent(event);
              event.alerted = true;
            }
          }
        }
      }
    };

    checkEvents();
    const interval = setInterval(checkEvents, 60000); 
    return () => clearInterval(interval);
  }, [events]);

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
    const categorySet = new Set(categories);
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
        category: newEvent.category === 'custom' ? newEvent.customCategory : newEvent.category,
        account_id: '1',
      };
      delete formData.customCategory;

      const response = await axios.post(`${baseUrl}/event/createEvent`, formData);
      setShowAddEventModal(false);
      setNewEvent({ name: '', location: '', start_date: '', end_date: '', category: '', customCategory: '' });

      
      const updatedEventsResponse = await axios.get(`${baseUrl}/event/getEventsByAccount/1`);
      const eventData = updatedEventsResponse.data.events || [];
      eventData.forEach(event => {
        event.alerted = false;
      });
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
      customCategory: '',
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
        category: updatedEvent.category === 'custom' ? updatedEvent.customCategory : updatedEvent.category,
      };
      delete formData.event_id;
      delete formData.customCategory;

      await axios.put(`${baseUrl}/event/updateEvent/${eventId}`, formData);
      setShowUpdateEventModal(false);

      
      const updatedEventsResponse = await axios.get(`${baseUrl}/event/getEventsByAccount/1`);
      const eventData = updatedEventsResponse.data.events || [];
      eventData.forEach(event => {
        event.alerted = false;
      });
      const groupedEvents = groupEventsByDate(eventData);
      setEvents(groupedEvents);
      extractCategories(eventData);

      
      setSelectedEvent(prevEvent => (prevEvent && prevEvent.event_id === eventId ? { ...prevEvent, ...formData } : prevEvent));
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event.');
    }
  };

  const handleAddLabelClick = (event) => {
    setCurrentLabelEvent(event);
    setLabelData({ label_text: event.label_text || '', label_color: event.label_color || '#ffffff' });
    setShowLabelModal(true);
  };

  const handleLabelInputChange = (e) => {
    const { name, value } = e.target;
    setLabelData({ ...labelData, [name]: value });
  };

  const handleLabelSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventId = currentLabelEvent.event_id;
      const formData = {
        label_text: labelData.label_text,
        label_color: labelData.label_color,
      };

      await axios.put(`${baseUrl}/event/updateEvent/${eventId}`, formData);

      // Update the event in the state
      setEvents(prevEvents => {
        const updatedEvents = { ...prevEvents };
        for (const date in updatedEvents) {
          updatedEvents[date] = updatedEvents[date].map(event => {
            if (event.event_id === eventId) {
              return { ...event, ...formData };
            }
            return event;
          });
        }
        return updatedEvents;
      });

      setShowLabelModal(false);
    } catch (error) {
      console.error('Error updating label:', error);
      setError('Failed to update label.');
    }
  };

  const navigateTo = (link) => {
    const fullLink = `http://localhost:3000${link}`;
    console.log(`Navigating to ${fullLink}`);
    window.location.href = fullLink;
  };

  return (
    <div className="events-page-container">

      <div className="sidebar">
        <button onClick={() => navigateTo(``)}><i className="fas fa-home"></i> <span>Home</span></button>
        <button onClick={() => navigateTo('/tasks')}><i className="fas fa-calendar"></i> <span>Tasks</span></button>
        <button onClick={() => navigateTo('/posts')}><i className="fas fa-cog"></i> <span>Posts</span></button>
        <button onClick={() => navigateTo('/friends')}><i className="fas fa-info-circle"></i> <span>Friends</span></button>
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
                <select
                  name="category"
                  value={newEvent.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </label>
              {newEvent.category === 'custom' && (
                <label>
                  Custom Category:
                  <input
                    type="text"
                    name="customCategory"
                    value={newEvent.customCategory}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              )}
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
                <select
                  name="category"
                  value={updatedEvent.category}
                  onChange={handleUpdateInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </label>
              {updatedEvent.category === 'custom' && (
                <label>
                  Custom Category:
                  <input
                    type="text"
                    name="customCategory"
                    value={updatedEvent.customCategory}
                    onChange={handleUpdateInputChange}
                    required
                  />
                </label>
              )}
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

      {showLabelModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Set Label</h2>
            <form onSubmit={handleLabelSubmit}>
              <label>
                Label Text:
                <input
                  type="text"
                  name="label_text"
                  value={labelData.label_text}
                  onChange={handleLabelInputChange}
                  required
                />
              </label>
              <label>
                Label Color:
                <input
                  type="color"
                  name="label_color"
                  value={labelData.label_color}
                  onChange={handleLabelInputChange}
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="submit">Save Label</button>
                <button type="button" onClick={() => setShowLabelModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {alertEvent && (
        <div className="alert-overlay">
          <div className="alert-box">
            <h2>Event Starting Now!</h2>
            <p><strong>{alertEvent.name}</strong></p>
            <p>Location: {alertEvent.location}</p>
            <p>Category: {alertEvent.category}</p>
            <button onClick={() => setAlertEvent(null)}>Close</button>
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
                    {event.label_text && (
                      <span
                        className="event-label"
                        style={{ backgroundColor: event.label_color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddLabelClick(event);
                        }}
                      >
                        {event.label_text}
                      </span>
                    )}
                  </div>
                  <button
                    className="add-label-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddLabelClick(event);
                    }}
                  >
                    +
                  </button>
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
          {categories.map(categoryOption => (
            <option key={categoryOption} value={categoryOption}>
              {categoryOption}
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
