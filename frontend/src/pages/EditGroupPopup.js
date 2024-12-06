import React, { useState } from 'react';

const EditGroupPopup = ({ isOpen, onRequestClose, group, onEdit }) => {
    const [newGroupName, setNewGroupName] = useState(group.group_name);
    const [newGroupAvatar, setNewGroupAvatar] = useState(group.group_avatar);

    // sends the new group name and/or new group avatar to the onEdit function to save
    const handleSubmit = () => {
        onEdit(newGroupName, newGroupAvatar);
    };

    if (!isOpen) return null;

    return (
        <div className="popup">
            <h2>Edit Group</h2>
            <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="Group Name"
            />
            <input
                type="text"
                value={newGroupAvatar}
                onChange={e => setNewGroupAvatar(e.target.value)}
                placeholder="Group Avatar URL"
            />
            <button onClick={handleSubmit}>Save Changes</button>
            <button onClick={onRequestClose}>Cancel</button>
        </div>
    );
};

export default EditGroupPopup;
