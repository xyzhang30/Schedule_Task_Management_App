import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPencilAlt, faCheck } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import './Tasks.css';

const baseUrl = process.env.REACT_APP_BASE_URL;

const Tasks = () => {
    const [tasks, setTasks] = useState({});
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ task_name: '', category: '', due_time: '' });
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [editedTask, setEditedTask] = useState({ task_name: '', category: '', due_time: '' });
    const [events, setEvents] = useState([]);
    const [notifications, setNotifications] = useState([]);



    useEffect(() => {
        const fetchTasks = async () => {
            try {
                console.log("Fetching tasks...");
                const response = await axios.get(`${baseUrl}/task/sorted`, {withCredentials:true});
                console.log("Fetched tasks data:", response.data);
                setTasks(response.data); 
                setLoading(false);
            } catch (err) {
                console.error("Error fetching tasks:", err);
                setError('Failed to fetch tasks.');
                setLoading(false);
            }
        };
    
        fetchTasks();
    }, []);    

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${baseUrl}/task/category/all`, {withCredentials:true});
                console.log("Fetched categories:", response.data);
                setCategories(response.data);
            } catch (err) {
                console.error("Error fetching categories:", err);
                setError('Failed to fetch categories.');
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get(`${baseUrl}/task/events`, { withCredentials: true });
                console.log("Fetched events:", response.data.events);
                setEvents(response.data.events);
            } catch (err) {
                console.error("Error fetching events:", err);
                setError('Failed to fetch events.');
            }
        };

        fetchEvents();
    }, []);

    const handleTaskClick = (task) => {
        console.log('Task clicked:', task);
        setSelectedTask(task);
    };

    const handleEditButtonClick = (task) => {
        setEditedTask({
            task_name: task.task_name,
            category: task.category,
            due_time: new Date(task.due_time).toISOString().slice(0, 16),
        });
        setSelectedTask(task);
        setShowEditTaskModal(true);
    };
    

    const formatDueTime = (timestamp) => {
        const date = new Date(timestamp);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    const handleInputChange = (e) => {
        setNewTask({
            ...newTask,
            [e.target.name]: e.target.value
        });
    };

    const handleInputChangeEventID = (e) => {
        const selectedEventName = e.target.value;
        const selectedEvent = events.find(event => event.name === selectedEventName);
        
        setNewTask({
            ...newTask,
            event_id: selectedEvent ? selectedEvent.event_id : '',
            event_name: selectedEventName 
        });
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('task_name', newTask.task_name);
            formData.append('category', newTask.category);
            formData.append('due_time', newTask.due_time);
            formData.append('account_id', '1');
            console.log(events)
            formData.append('event_id', newTask.event_id);
            console.log(newTask)

            const response = await axios.post(`${baseUrl}/task/create`, formData, {withCredentials:true});
            console.log('Task created:', response.data);
            setShowAddTaskModal(false);
            setNewTask({ task_name: '', category: '', due_time: '', event_id: ''});

            const updatedTasks = await axios.get(`${baseUrl}/task/sorted`, {withCredentials:true});
            setTasks(updatedTasks.data);
        } catch (err) {
            console.error('Error creating task:', err);
            setError('Failed to create task.');
        }
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };

    const handleNewCategoryChange = (e) => {
        setNewCategory(e.target.value);
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (categories.some(category => category.category_name === newCategory)) {
            alert('This category already exists.');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('category_name', newCategory);

            const response = await axios.post(`${baseUrl}/task/category/create`, formData);
            console.log('Category created:', response.data);
            setNewCategory('');
            setShowAddCategoryModal(false);
            const updatedCategories = await axios.get(`${baseUrl}/task/category/all`);
            setCategories(updatedCategories.data);
        } catch (err) {
            console.error('Error creating category:', err);
            setError('Failed to create category.');
        }
    };

    const filteredTasks = Object.keys(tasks).reduce((filtered, date) => {
        const tasksForDate = tasks[date].filter(task => 
            selectedCategory === '' || task.category === selectedCategory
        );
        if (tasksForDate.length) {
            filtered[date] = tasksForDate;
        }
        return filtered;
    }, {});


    const updateTaskNotification = async (taskId) => {
        try {
            const response = await axios.put(`${baseUrl}/task/update-task-notification/${taskId}`, null, {
                withCredentials: true,
            });
            console.log('Task notification updated:', response.data);
            return true;
        } catch (err) {
            console.error('Error updating task notification:', err);
            setError('Failed to update task notification.');
            return false;
        }
    };


    const handleEditTask = async (e) => {
        console.log('Edit task called')
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('task_name', editedTask.task_name);
            formData.append('category', editedTask.category);
            formData.append('due_time', editedTask.due_time);
    
            const response = await axios.put(`${baseUrl}/task/update/${selectedTask.task_id}`, formData, {withCredentials:true});
            console.log('Task updated:', response.data);

            const notificationUpdated = await updateTaskNotification(selectedTask.task_id);
            if (notificationUpdated) {
                console.log('Notification updated successfully.');
            }
    
            const updatedTasks = await axios.get(`${baseUrl}/task/sorted`, {withCredentials:true});
            setTasks(updatedTasks.data);
    
            setShowEditTaskModal(false);
            setSelectedTask(null);
        } catch (err) {
            console.error('Error updating task:', err);
            setError('Failed to update task.');
        }
    };
    

    const handleDeleteTask = async () => {
        if (!selectedTask) return;
        
        const confirmDelete = window.confirm(`Are you sure you want to delete task: ${selectedTask.task_name}?`);
        
        if (confirmDelete) {
            try {
                const response = await axios.delete(`${baseUrl}/task/remove/${selectedTask.task_id}`, );
                console.log('Task deleted:', response.data);
    
                const updatedTasks = await axios.get(`${baseUrl}/task/sorted`, {withCredentials:true});
                setTasks(updatedTasks.data);
                setSelectedTask(null);
            } catch (err) {
                console.error('Error deleting task:', err);
                setError('Failed to delete task.');
            }
        }
    };

    const handleCompleteTask = async () => {
        if (!selectedTask) return;
            try {
                await axios.post(`${baseUrl}/task/complete/${selectedTask.task_id}`, {withCredentials:true});
    
                const completedTasks = await axios.get(`${baseUrl}/task/sorted`, {withCredentials:true});
                window.alert('Task marked as completed!');
                setTasks(completedTasks.data);
            } catch (err) {
                console.error('Error completing task:', err);
                setError('Failed to complete task.');
            }
    };

    return (
        <div className="tasks-page-container">
            <div className="tasks-header">
                <h2>Tasks</h2>
                <div className="button-container">
                <button className="button" onClick={() => setShowAddCategoryModal(true)}>
                    Add Category
                </button>
                <button className="button" onClick={() => setShowAddTaskModal(true)}>
                    Add Task
                </button>
                </div>
            </div>
    
            <div>
                <label htmlFor="categoryFilter">Filter by Category: </label>
                <select id="categoryFilter" value={selectedCategory} onChange={handleCategoryChange}>
                    <option value="">All Categories</option>
                    {categories.map(category => (
                        <option key={category.category_name} value={category.category_name}>
                            {category.category_name}
                        </option>
                    ))}
                </select>
                
                {/* <form onSubmit={handleAddCategory} className="add-category-form">
                    <input 
                        type="text" 
                        placeholder="New Category" 
                        value={newCategory} 
                        onChange={handleNewCategoryChange} 
                        required 
                    />
                    <button type="submit" className="button">
                        Add Category
                    </button>
                </form> */}
            </div>

            {showAddCategoryModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add a New Category</h2>
                        <form onSubmit={handleAddCategory}>
                            <label>
                                Category Name:
                                <input
                                    type="text"
                                    placeholder="New Category"
                                    value={newCategory}
                                    onChange={handleNewCategoryChange}
                                    required
                                />
                            </label>
                            <div className="modal-actions">
                                <button type="submit">Create Category</button>
                                <button type="button" onClick={() => setShowAddCategoryModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
    
            {showAddTaskModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add a New Task</h2>
                        <form onSubmit={handleAddTask}>
                            <label>
                                Task Name:
                                <input 
                                    type="text" 
                                    name="task_name" 
                                    value={newTask.task_name} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </label>
                            <label>
                                Category:
                                <select 
                                    name="category" 
                                    value={newTask.category} 
                                    onChange={handleInputChange} 
                                    required
                                >
                                    <option value="">Select a Category</option>
                                    {categories.map(category => (
                                        <option key={category.category_name} value={category.category_name}>
                                            {category.category_name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Due Time:
                                <input 
                                    type="datetime-local" 
                                    name="due_time" 
                                    value={newTask.due_time} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </label>
                            <label>
                                Associated Event:
                                <select
                                    name="event_name" 
                                    value={newTask.event_name || ''}
                                    onChange={handleInputChangeEventID}
                                >
                                    <option value="">Select an Event</option>
                                    {events.map(event => (
                                        <option key={event.event_id} value={event.name}>
                                            {event.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="modal-actions">
                                <button type="submit">Create Task</button>
                                <button type="button" onClick={() => setShowAddTaskModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditTaskModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Edit Task</h2>
                        <form onSubmit={handleEditTask}>
                            <label>
                                Task Name:
                                <input 
                                    type="text" 
                                    name="task_name" 
                                    value={editedTask.task_name} 
                                    onChange={(e) => setEditedTask({ ...editedTask, task_name: e.target.value })} 
                                    required 
                                />
                            </label>
                            <label>
                                Category:
                                <select 
                                    name="category" 
                                    value={editedTask.category} 
                                    onChange={(e) => setEditedTask({ ...editedTask, category: e.target.value })} 
                                    required
                                >
                                    <option value="">Select a Category</option>
                                    {categories.map(category => (
                                        <option key={category.category_name} value={category.category_name}>
                                            {category.category_name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Due Time:
                                <input 
                                    type="datetime-local" 
                                    name="due_time" 
                                    value={editedTask.due_time} 
                                    onChange={(e) => setEditedTask({ ...editedTask, due_time: e.target.value })} 
                                    required 
                                />
                            </label>
                            <div className="modal-actions">
                                <button type="submit">Update Task</button>
                                <button type="button" onClick={() => setShowEditTaskModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

    
            {loading ? (
                <p>Loading tasks...</p>
            ) : error ? (
                <p>{error}</p>
            ) : (
                <div className="tasks-list">
                    {Object.keys(filteredTasks).map(date => (
                        <div key={date} className="tasks-date">
                            <h3>{date}</h3>
                            {Array.isArray(filteredTasks[date]) ? (
                                filteredTasks[date].map(task => (
                                    <div
                                        key={task.id}
                                        className={`task-item ${task.complete ? 'completed-task' : ''}`}
                                        onClick={() => handleTaskClick(task)}
                                    >
                                        {task.task_name}
                                    </div>
                                ))
                            ) : (
                                <p>No tasks available for this date</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
    
                <div className="task-details">
                {selectedTask ? (
                    <div className="task-details-content">
                        <div className="task-header">
                            <h2>{selectedTask.task_name}</h2>
                            <button className="complete-task-button" onClick={handleCompleteTask}>
                                <FontAwesomeIcon icon={faCheck} />
                            </button>
                        </div>
                        <p>Category: {selectedTask.category}</p>
                        <p>Due Time: {formatDueTime(selectedTask.due_time)}</p>
                        <p>Associated Event: {
                            events.find(event => event.event_id === selectedTask.event_id)?.name || "No associated event"
                        }</p>
                    
                        <div className="task-actions">
                            <button className="edit-task-button" onClick={() => handleEditButtonClick(selectedTask)}>
                                <FontAwesomeIcon icon={faPencilAlt} /> Edit
                            </button>
                            <button className="delete-task-button" onClick={handleDeleteTask}>
                                <FontAwesomeIcon icon={faTrash} /> Delete
                            </button>
                        </div>
                    </div>
                ) : (
                    <p>Select a task to view details</p>
                )}
            </div>

        </div>
    );    
};

export default Tasks;
