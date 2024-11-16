import React, { useState } from 'react';
import axios from 'axios';

const baseUrl = process.env.REACT_APP_BASE_URL;
axios.defaults.withCredentials = true;

// Define the default color for events without a label
const DEFAULT_LABEL_COLOR = '#2196F3';

const EventUpdateModal = ({
  showUpdateEventModal,
  setShowUpdateEventModal,
  eventToUpdate,
  setEventToUpdate,
  categories,
  setCategories,
  refreshEvents,
}) => {
  const [errors, setErrors] = useState({});

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setEventToUpdate({ ...eventToUpdate, [name]: value });
  };

  const handleUpdateEventSubmit = async (e) => {
    e.preventDefault();
    const eventId = eventToUpdate.event_id;
    const formData = {
      ...eventToUpdate,
      category:
        eventToUpdate.category === 'custom'
          ? eventToUpdate.customCategory
          : eventToUpdate.category,
      repeat_until: eventToUpdate.repeat_until ? eventToUpdate.repeat_until : null,
      label_color: eventToUpdate.label_color || DEFAULT_LABEL_COLOR,
    };
    delete formData.event_id;
    delete formData.customCategory;

    const newErrors = {};
    if (
      (eventToUpdate.label_text && !eventToUpdate.label_color) ||
      (!eventToUpdate.label_text && eventToUpdate.label_color)
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
      await axios.put(`${baseUrl}/event/updateEvent/${eventId}`, formData);

      // Update categories if custom category was added
      if (eventToUpdate.category === 'custom') {
        // Create the category in the backend if it doesn't exist
        try {
          const data = { category_name: eventToUpdate.customCategory };
          await axios.post(`${baseUrl}/event/category/create`, data);
          // Update categories in the frontend
          setCategories((prevCategories) => {
            if (!prevCategories.includes(eventToUpdate.customCategory)) {
              return [...prevCategories, eventToUpdate.customCategory];
            }
            return prevCategories;
          });
        } catch (err) {
          console.error('Error creating category:', err);
          // Handle error if needed
        }
      }

      setShowUpdateEventModal(false);
      await refreshEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event.');
    }
  };

  if (!showUpdateEventModal) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Update Event</h2>
        <form onSubmit={handleUpdateEventSubmit}>
          <label>
            Event Name:
            <input
              type="text"
              name="name"
              value={eventToUpdate.name}
              onChange={handleUpdateInputChange}
              required
            />
          </label>
          <label>
            Location:
            <input
              type="text"
              name="location"
              value={eventToUpdate.location}
              onChange={handleUpdateInputChange}
              required
            />
          </label>
          <label>
            Start Date:
            <input
              type="datetime-local"
              name="start_date"
              value={eventToUpdate.start_date}
              onChange={handleUpdateInputChange}
              required
            />
          </label>
          <label>
            End Date:
            <input
              type="datetime-local"
              name="end_date"
              value={eventToUpdate.end_date}
              onChange={handleUpdateInputChange}
              min={eventToUpdate.start_date}
              required
            />
          </label>
          {errors.date && <p className="error">{errors.date}</p>}
          <label>
            Category:
            <select
              name="category"
              value={eventToUpdate.category}
              onChange={handleUpdateInputChange}
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
          {eventToUpdate.category === 'custom' && (
            <label>
              Custom Category:
              <input
                type="text"
                name="customCategory"
                value={eventToUpdate.customCategory}
                onChange={handleUpdateInputChange}
                required
              />
            </label>
          )}
          <label>
            Label Text:
            <input
              type="text"
              name="label_text"
              value={eventToUpdate.label_text || ''}
              onChange={handleUpdateInputChange}
            />
          </label>
          <label>
            Label Color:
            <input
              type="color"
              name="label_color"
              value={eventToUpdate.label_color || DEFAULT_LABEL_COLOR}
              onChange={handleUpdateInputChange}
            />
          </label>
          {errors.label && <p className="error">{errors.label}</p>}
          <label>
            Frequency:
            <select
              name="frequency"
              value={eventToUpdate.frequency || ''}
              onChange={handleUpdateInputChange}
            >
              <option value="">None</option>
              <option value="Once a Week">Once a Week</option>
              <option value="Every Day">Every Day</option>
              <option value="Twice a Week">Twice a Week</option>
            </select>
          </label>
          {eventToUpdate.frequency && (
            <label>
              Repeat Until:
              <input
                type="datetime-local"
                name="repeat_until"
                value={eventToUpdate.repeat_until || ''}
                onChange={handleUpdateInputChange}
                min={eventToUpdate.end_date}
                required
              />
            </label>
          )}
          <div className="modal-actions">
            <button type="submit">Update Event</button>
            <button
              type="button"
              onClick={() => setShowUpdateEventModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventUpdateModal;
