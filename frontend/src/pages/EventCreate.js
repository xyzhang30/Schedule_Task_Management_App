import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Events.css';

const baseUrl = process.env.REACT_APP_BASE_URL;

const DEFAULT_LABEL_COLOR = '#2196F3';

const EventCreate = ({
  show,
  onClose,
  categories,
  refreshEvents,
  initialEventData = {},
  timeRange = {},
}) => {
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
    ...initialEventData,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setNewEvent((prevEvent) => ({
      ...prevEvent,
      ...initialEventData,
    }));
  }, [initialEventData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();

    // Check if time exceeds the available range
    if (timeRange && timeRange.start && timeRange.end) {
      const eventStart = new Date(newEvent.start_date);
      const eventEnd = new Date(newEvent.end_date);
      const rangeStart = new Date(timeRange.start);
      const rangeEnd = new Date(timeRange.end);

      if (eventStart < rangeStart || eventEnd > rangeEnd) {
        alert('Selected time exceeds the available time range.');
        return;
      }
    }

    const formData = {
      ...newEvent,
      category:
        newEvent.category === 'custom' ? newEvent.customCategory : newEvent.category,
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
        } catch (err) {
          console.error('Error creating category:', err);
        }
      }

      onClose();
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
    }
  };

  return (
    <>
      {show && (
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
                <button type="button" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EventCreate;
