import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                console.log("Fetching tasks...");
                const response = await axios.get(`${baseUrl}/task/1/sorted`);
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

    const handleTaskClick = (task) => {
        console.log('Task clicked:', task);
        setSelectedTask(task);
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

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('task_name', newTask.task_name);
            formData.append('category', newTask.category);
            formData.append('due_time', newTask.due_time);
            formData.append('account_id', '1');

            const response = await axios.post(`${baseUrl}/task/create`, formData);
            console.log('Task created:', response.data);
            setShowAddTaskModal(false);
            setNewTask({ task_name: '', category: '', due_time: '' });

            const updatedTasks = await axios.get(`${baseUrl}/task/1/sorted`);
            setTasks(updatedTasks.data);
        } catch (err) {
            console.error('Error creating task:', err);
            setError('Failed to create task.');
        }
    };

    // const extractCategories = (tasks) => {
    //     const categorySet = new Set();
    //     Object.keys(tasks).forEach(date => {
    //         tasks[date].forEach(task => {
    //             if (task.category) {
    //                 categorySet.add(task.category);
    //             }
    //         });
    //     });
    //     setCategories([...categorySet]);
    // };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
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

    return (
        <div className="tasks-page-container">
            <div className="tasks-header">
                <h2>Tasks</h2>
                <button className="add-task-button" onClick={() => setShowAddTaskModal(true)}>
                    Add Task
                </button>
            </div>

            <div>
                <label htmlFor="categoryFilter">Filter by Category: </label>
                <select id="categoryFilter" value={selectedCategory} onChange={handleCategoryChange}>
                    <option value="">All Categories</option>
                    {categories.map(category => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

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
                                <input 
                                    type="text" 
                                    name="category" 
                                    value={newTask.category} 
                                    onChange={handleInputChange} 
                                    required 
                                />
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

            {loading ? (
                <p>Loading tasks...</p>
            ) : error ? (
                <p>{error}</p>
            ) : (
                <div className="tasks-list">
                    {Object.keys(tasks).map(date => (
                        <div key={date} className="tasks-date">
                            <h3>{date}</h3>
                            {Array.isArray(tasks[date]) ? (
                                tasks[date].map(task => (
                                    <div
                                        key={task.id}
                                        className="task-item"
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
                        <h2>{selectedTask.task_name}</h2>
                        <p>Category: {selectedTask.category}</p>
                        <p>Due Time: {formatDueTime(selectedTask.due_time)}</p>
                    </div>
                ) : (
                    <p>Select a task to view details</p>
                )}
            </div>
        </div>
    );
};

export default Tasks;
