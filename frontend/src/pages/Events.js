import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Events.css';
import EventUpdateModal from './EventUpdate';

const baseUrl = process.env.REACT_APP_BASE_URL;

axios.defaults.withCredentials = true;

const DEFAULT_LABEL_COLOR = '#2196F3';

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
    frequency: '',
    repeat_until: '',
    label_text: '',
    label_color: DEFAULT_LABEL_COLOR,
  });
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [labels, setLabels] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [showUpdateEventModal, setShowUpdateEventModal] = useState(false);
  const [updatedEvent, setUpdatedEvent] = useState({});
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [currentLabelEvent, setCurrentLabelEvent] = useState(null);
  const [labelData, setLabelData] = useState({
    label_text: '',
    label_color: DEFAULT_LABEL_COLOR,
  });
  const [alertEvent, setAlertEvent] = useState(null);
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    refreshEvents();
  }, [showPastEvents]);

  const refreshEvents = async () => {
    try {
      const response = await axios.get(`${baseUrl}/event/getEventsByAccount`, {
        params: {
          include_past: showPastEvents,
        },
      });
      const eventData = response.data.events || [];
      eventData.forEach((event) => {
        event.alerted = false;
        if (!event.label_color || event.label_color.trim() === '') {
          event.label_color = DEFAULT_LABEL_COLOR;
        }
      });
      eventData.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      const groupedEvents = groupEventsByDate(eventData);
      setEvents(groupedEvents);
      extractLabels(eventData);
    } catch (error) {
      console.error('There was an error fetching the events!', error);
      setError('Failed to fetch events.');
      if (error.response && error.response.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${baseUrl}/event/category/all`);
        setCategories(response.data.map((cat) => cat.category_name));
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to fetch categories.');
      }
    };
    fetchCategories();
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
    events.forEach((event) => {
      const date = new Date(event.start_date).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    for (const date in grouped) {
      grouped[date].sort(
        (a, b) => new Date(a.start_date) - new Date(b.start_date)
      );
    }

    return grouped;
  };

  const extractLabels = (events) => {
    const labelSet = new Set();
    events.forEach((event) => {
      if (event.label_text) {
        labelSet.add(event.label_text);
      }
    });
    setLabels([...labelSet]);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleLabelChange = (e) => {
    setSelectedLabel(e.target.value);
  };

  const toggleShowPastEvents = () => {
    setShowPastEvents(!showPastEvents);
  };

  const filteredEvents = Object.keys(events).reduce((filtered, date) => {
    const eventsForDate = events[date].filter(
      (event) =>
        (selectedCategory === '' || event.category === selectedCategory) &&
        (selectedLabel === '' || event.label_text === selectedLabel)
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
    const formData = {
      ...newEvent,
      category:
        newEvent.category === 'custom'
          ? newEvent.customCategory
          : newEvent.category,
      repeat_until: newEvent.repeat_until ? newEvent.repeat_until : null,
      label_color: newEvent.label_color || DEFAULT_LABEL_COLOR,
    };
    delete formData.customCategory;

    const newErrors = {};
    if (
      (newEvent.label_text && !newEvent.label_color) ||
      (!newEvent.label_text && newEvent.label_color)
    ) {
      newErrors.label = 'Please provide both label text and label color.';
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.date = 'End date must be after start date.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    } else {
      setErrors({});
    }

    try {
      await axios.post(`${baseUrl}/event/createEvent`, formData);

      if (newEvent.category === 'custom') {
        try {
          const data = { category_name: newEvent.customCategory };
          await axios.post(`${baseUrl}/event/category/create`, data);
          setCategories((prevCategories) => {
            if (!prevCategories.includes(newEvent.customCategory)) {
              return [...prevCategories, newEvent.customCategory];
            }
            return prevCategories;
          });
        } catch (err) {
          console.error('Error creating category:', err);
        }
      }

      setShowAddEventModal(false);
      setNewEvent({
        name: '',
        location: '',
        start_date: '',
        end_date: '',
        category: '',
        customCategory: '',
        frequency: '',
        repeat_until: '',
        label_text: '',
        label_color: DEFAULT_LABEL_COLOR,
      });
      await refreshEvents();
    } catch (error) {
      console.error(
        'There was an error creating the event!',
        error.response?.data || error.message
      );
      setError('Failed to create event.');
    }
  };

  const handleDeleteEventClick = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      handleDeleteEvent(eventId);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(`${baseUrl}/event/deleteEvent/${eventId}`);
      setEvents((prevEvents) => {
        const updatedEvents = { ...prevEvents };
        for (const date in updatedEvents) {
          updatedEvents[date] = updatedEvents[date].filter(
            (event) => event.event_id !== eventId
          );
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
    if (event.series_id && event.event_id !== event.series_id) {
      alert('Cannot update individual occurrences of a recurring event. Please update the original event.');
      return;
    }
    setUpdatedEvent({
      ...event,
      customCategory: '',
      label_color: event.label_color || DEFAULT_LABEL_COLOR,
    });
    setShowUpdateEventModal(true);
  };

  const handleAddLabelClick = (event) => {
    setCurrentLabelEvent(event);
    setLabelData({
      label_text: event.label_text || '',
      label_color: event.label_color || DEFAULT_LABEL_COLOR,
    });
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
        label_color: labelData.label_color || DEFAULT_LABEL_COLOR,
      };

      if (
        (labelData.label_text && !labelData.label_color) ||
        (!labelData.label_text && labelData.label_color)
      ) {
        alert('Please provide both label text and label color.');
        return;
      }

      await axios.put(`${baseUrl}/event/updateEvent/${eventId}`, formData);

      setEvents((prevEvents) => {
        const updatedEvents = { ...prevEvents };
        for (const date in updatedEvents) {
          updatedEvents[date] = updatedEvents[date].map((event) => {
            if (event.event_id === eventId) {
              return { ...event, ...formData };
            }
            return event;
          });
        }
        return updatedEvents;
      });

      setShowLabelModal(false);
      refreshEvents();
    } catch (error) {
      console.error('Error updating label:', error);
      setError('Failed to update label.');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const data = { category_name: newCategoryName };
      await axios.post(`${baseUrl}/event/category/create`, data);
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      // Fetch updated categories
      const categoriesResponse = await axios.get(
        `${baseUrl}/event/category/all`
      );
      setCategories(categoriesResponse.data.map((cat) => cat.category_name));
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Failed to create category.');
    }
  };

  const handleCleanCategories = async () => {
    try {
      await axios.delete(`${baseUrl}/event/category/clean`);
      // Fetch updated categories
      const categoriesResponse = await axios.get(
        `${baseUrl}/event/category/all`
      );
      setCategories(categoriesResponse.data.map((cat) => cat.category_name));
      alert('Unused categories have been cleaned.');
    } catch (err) {
      console.error('Error cleaning categories:', err);
      setError('Failed to clean categories.');
    }
  };


  return (
    <div className="events-page-container">
      <div className="events-content">
        
        <div className="filter-container">
          <h2>Events</h2>
          <div className="filter-group">
            <label htmlFor="categoryFilter">Filter by Category: </label>
            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <option value="">All Categories</option>
              {categories.map((categoryOption) => (
                <option key={categoryOption} value={categoryOption}>
                  {categoryOption}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="labelFilter">Filter by Label: </label>
            <select
              id="labelFilter"
              value={selectedLabel}
              onChange={handleLabelChange}
            >
              <option value="">All Labels</option>
              {labels.map((labelOption) => (
                <option key={labelOption} value={labelOption}>
                  {labelOption}
                </option>
              ))}
            </select>
          </div>
          <div className="button-group">
            <button
              className="add-category-button"
              onClick={() => setShowAddCategoryModal(true)}
            >
              Add Category
            </button>
            <button
              className="add-event-button"
              onClick={() => setShowAddEventModal(true)}
            >
              Add Event
            </button>
            <button
              className="clean-categories-button"
              onClick={handleCleanCategories}
            >
              Clean Categories
            </button>
          </div>
        </div>
        
        {loading ? (
          <p>Loading events...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <div className="events-list">
            <button className="button" id="toggle-button" onClick={toggleShowPastEvents}>
          {showPastEvents ? 'Hide Past Events' : 'Past Events'}
          </button>
            {Object.keys(filteredEvents)
              .sort((a, b) => new Date(a) - new Date(b))
              .map((date) => (
                <div key={date} className="events-date">
                  <h3>{date}</h3>
                  {filteredEvents[date]
                    .sort(
                      (a, b) => new Date(a.start_date) - new Date(b.start_date)
                    )
                    .map((event) => (
                      <div key={event.event_id} className="event-item-container">
                        <div
                          className="event-item"
                          onClick={() => handleEventClick(event)}
                        >
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
                          {event.name}
                        </div>
                        {/* <button
                          className="add-label-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddLabelClick(event);
                          }}
                        >
                          +
                        </button> */}
                        <button
                          className="delete-event-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEventClick(event.event_id);
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

        <div className="event-details">
          {selectedEvent ? (
            <div className="event-details-content">
              <h2>{selectedEvent.name}</h2>
              <p>Location: {selectedEvent.location}</p>
              <p>Category: {selectedEvent.category}</p>
              <p>Start Date: {formatDateTime(selectedEvent.start_date)}</p>
              <p>End Date: {formatDateTime(selectedEvent.end_date)}</p>
              <p>Frequency: {selectedEvent.frequency || 'None'}</p>
              {selectedEvent.frequency && (
                <p>
                  Repeat Until:{' '}
                  {selectedEvent.repeat_until
                    ? formatDateTime(selectedEvent.repeat_until)
                    : 'N/A'}
                </p>
              )}
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
                  min={newEvent.start_date}
                  required
                />
              </label>
              {errors.date && <p className="error">{errors.date}</p>}
              <label>
                Category:
                <select
                  name="category"
                  value={newEvent.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
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
              <label>
                Label Text:
                <input
                  type="text"
                  name="label_text"
                  value={newEvent.label_text}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Label Color:
                <input
                  type="color"
                  name="label_color"
                  value={newEvent.label_color || DEFAULT_LABEL_COLOR}
                  onChange={handleInputChange}
                />
              </label>
              {errors.label && <p className="error">{errors.label}</p>}
              <label>
                Frequency:
                <select
                  name="frequency"
                  value={newEvent.frequency}
                  onChange={handleInputChange}
                >
                  <option value="">None</option>
                  <option value="Once a Week">Once a Week</option>
                  <option value="Every Day">Every Day</option>
                  <option value="Twice a Week">Twice a Week</option>
                </select>
              </label>
              {newEvent.frequency && (
                <label>
                  Repeat Until:
                  <input
                    type="datetime-local"
                    name="repeat_until"
                    value={newEvent.repeat_until}
                    onChange={handleInputChange}
                    min={newEvent.end_date}
                    required
                  />
                </label>
              )}
              <div className="modal-actions">
                <button type="submit">Create Event</button>
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <EventUpdateModal
        showUpdateEventModal={showUpdateEventModal}
        setShowUpdateEventModal={setShowUpdateEventModal}
        eventToUpdate={updatedEvent}
        setEventToUpdate={setUpdatedEvent}
        categories={categories}
        setCategories={setCategories}
        refreshEvents={refreshEvents}
      />

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
                  value={labelData.label_color || DEFAULT_LABEL_COLOR}
                  onChange={handleLabelInputChange}
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="submit">Save Label</button>
                <button
                  type="button"
                  onClick={() => setShowLabelModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {alertEvent && (
        <div className="alert-overlay">
          <div className="alert-box">
            <h2>Event Starting Now!</h2>
            <p>
              <strong>{alertEvent.name}</strong>
            </p>
            <p>Location: {alertEvent.location}</p>
            <p>Category: {alertEvent.category}</p>
            <button onClick={() => setAlertEvent(null)}>Close</button>
          </div>
        </div>
      )}

      {showAddCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add a New Category</h2>
            <form onSubmit={handleAddCategory}>
              <label>
                Category Name:
                <input
                  type="text"
                  name="category_name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="submit">Create Category</button>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
