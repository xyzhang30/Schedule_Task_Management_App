import React from 'react';
import axios from 'axios';

const baseUrl = process.env.REACT_APP_BASE_URL;
axios.defaults.withCredentials = true;

const EventUpdateModal = ({
  showUpdateEventModal,
  setShowUpdateEventModal,
  eventToUpdate,
  setEventToUpdate,
  categories,
  refreshEvents,
}) => {
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
    };
    delete formData.event_id;
    delete formData.customCategory;

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      alert('End date must be after start date.');
      return;
    }

    try {
      await axios.put(`${baseUrl}/event/updateEvent/${eventId}`, formData);
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
                value={eventToUpdate.customCategory || ''}
                onChange={handleUpdateInputChange}
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
