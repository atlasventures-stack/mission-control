import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTasks, createTask, updateTask, deleteTask } from '../services/api';
import { parseNoteIntoTasks, isAIConfigured } from '../services/aiService';
import { syncAllCalendars, autoCompleteExpiredCalendarTasks } from '../services/calendarService';
import { getTodayIST } from '../utils/timezone';
import { Task } from '../types';
import { CATEGORIES } from '../constants';

const Tasks: React.FC = () => {
  const { user, connectedCalendars } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryModalTask, setCategoryModalTask] = useState<Task | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  // Load AI-generated and custom categories
  useEffect(() => {
    const loadCategories = () => {
      const aiCategories = localStorage.getItem('aiGeneratedCategories');
      const manualCategories = localStorage.getItem('customCategories');

      const aiCats = aiCategories ? JSON.parse(aiCategories) : CATEGORIES;
      const manualCats = manualCategories ? JSON.parse(manualCategories) : [];

      setCategories([...new Set([...aiCats, ...manualCats])]);
    };

    loadCategories();
  }, [tasks.length]);

  // Auto-sync calendar events and auto-complete expired ones
  useEffect(() => {
    if (!user || connectedCalendars.length === 0) return;

    // Run immediately on mount
    const syncAndComplete = async () => {
      try {
        // Auto-complete expired calendar tasks
        await autoCompleteExpiredCalendarTasks(user.id);

        // Sync new calendar events
        await syncAllCalendars(user.id, connectedCalendars);

        // Reload tasks to show updates
        loadTasks();
      } catch (error) {
        console.error('Background sync error:', error);
      }
    };

    // Run immediately
    syncAndComplete();

    // Set up interval to run every 5 minutes
    const intervalId = setInterval(syncAndComplete, 5 * 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [user, connectedCalendars]);

  const loadTasks = async () => {
    if (!user) return;

    try {
      const allTasks = await getTasks(user.id);
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !user || submitting) return;

    setSubmitting(true);

    try {
      let parsedTasks;
      const todayIST = getTodayIST();

      if (isAIConfigured) {
        parsedTasks = await parseNoteIntoTasks(newTaskText);
        // Default to today IST if AI didn't provide a date
        parsedTasks = parsedTasks.map(task => ({
          ...task,
          date: task.date || todayIST,
        }));
      } else {
        parsedTasks = [{
          title: newTaskText,
          category: 'Other',
          date: todayIST, // Use IST for today
        }];
      }

      const newTasks = await Promise.all(
        parsedTasks.map(parsed =>
          createTask({
            userId: user.id,
            title: parsed.title,
            category: parsed.category,
            date: parsed.date,
            completed: false,
          })
        )
      );

      setTasks([...newTasks, ...tasks]); // Add new tasks at the beginning
      setNewTaskText('');
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (taskId: string) => {
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await updateTask(user.id, taskId, { completed: !task.completed });
      setTasks(tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDate(task.date);
  };

  const handleSaveEdit = async () => {
    if (!user || !editingTask) return;

    try {
      await updateTask(user.id, editingTask.id, {
        title: editTitle,
        date: editDate,
      });
      setTasks(tasks.map(t => (t.id === editingTask.id ? { ...t, title: editTitle, date: editDate } : t)));
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!user || !confirm('Delete this task?')) return;

    try {
      await deleteTask(user.id, taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleCategoryClick = (task: Task) => {
    setCategoryModalTask(task);
  };

  const handleChangeCategory = async (category: string) => {
    if (!user || !categoryModalTask) return;

    try {
      await updateTask(user.id, categoryModalTask.id, { category });
      setTasks(tasks.map(t => (t.id === categoryModalTask.id ? { ...t, category } : t)));
      setCategoryModalTask(null);
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;

    const customCategories = localStorage.getItem('customCategories');
    const existing: string[] = customCategories ? JSON.parse(customCategories) : [];

    if (!existing.includes(newCategory)) {
      const updated = [...existing, newCategory];
      localStorage.setItem('customCategories', JSON.stringify(updated));
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };

  // Get today's date in IST for comparison
  const todayIST = getTodayIST();

  console.log('Task Filtering Debug:');
  console.log('Today IST:', todayIST);
  console.log('Total tasks:', tasks.length);
  console.log('Tasks breakdown:', {
    calendar: tasks.filter(t => t.isFromCalendar).length,
    regular: tasks.filter(t => !t.isFromCalendar).length,
    completed: tasks.filter(t => t.completed).length,
    notCompleted: tasks.filter(t => !t.completed).length,
  });

  const todoTasks = tasks.filter(t => !t.completed && t.date >= todayIST);
  const inProgressTasks = tasks.filter(t => !t.completed && t.date < todayIST);
  const doneTasks = tasks.filter(t => t.completed);

  console.log('Filtered tasks:', {
    todo: todoTasks.length,
    inProgress: inProgressTasks.length,
    done: doneTasks.length,
  });

  const renderTaskCard = (task: Task) => {
    const isOverdue = task.date < todayIST;

    return (
      <div
        key={task.id}
        className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-indigo-500 transition-colors"
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => handleToggle(task.id)}
            className="mt-1 w-5 h-5 text-indigo-600 rounded border-2 border-gray-500 bg-gray-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          />
          <div className="flex-1">
            <h4 className={`font-bold text-gray-200 mb-2 ${task.completed ? 'line-through opacity-60' : ''}`}>
              {task.title}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleCategoryClick(task)}
                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-indigo-300 hover:from-purple-200 hover:to-pink-200 transition-all cursor-pointer"
                title="Click to change category"
              >
                {task.category}
              </button>
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${isOverdue && !task.completed ? 'bg-red-900/30 text-red-300' : 'bg-blue-900/30 text-blue-300'}`}>
                {isOverdue && !task.completed ? 'Overdue' : new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleEdit(task)}
              className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-all"
              title="Edit task"
            >
             
            </button>
            <button
              onClick={() => handleDelete(task.id)}
              className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-all"
              title="Delete task"
            >
             
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-lg h-16 w-16 border border-gray-700 border-t-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 font-medium">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white mb-4">
          My Tasks
        </h1>
        <p className="text-gray-400 font-medium">Organize your day, week, and life.</p>
      </div>

      {/* Add Task Bar */}
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8 border border-gray-700">
        <div className="flex gap-4">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask();
            }}
            placeholder="e.g., Draft the investor update email"
            className="flex-1 px-6 py-4 rounded-lg border-2 border-gray-600 bg-gray-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 font-medium text-lg placeholder-gray-400"
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskText.trim() || submitting}
            className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg transition-all"
          >
            {submitting ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* To Do Column */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-blue-400">To Do</h2>
            <span className="bg-blue-900/30 text-blue-400 font-bold px-4 py-2 rounded-lg text-sm border border-blue-900">
              {todoTasks.length}
            </span>
          </div>
          <div className="space-y-4">
            {todoTasks.length > 0 ? (
              todoTasks.map(renderTaskCard)
            ) : (
              <div className="text-center py-12 text-blue-300">
                <p className="font-bold">All caught up!</p>
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-orange-400">Overdue</h2>
            <span className="bg-orange-900/30 text-orange-400 font-bold px-4 py-2 rounded-lg text-sm border border-orange-900">
              {inProgressTasks.length}
            </span>
          </div>
          <div className="space-y-4">
            {inProgressTasks.length > 0 ? (
              inProgressTasks.map(renderTaskCard)
            ) : (
              <div className="text-center py-12 text-orange-300">
                <p className="font-bold">Nothing overdue!</p>
              </div>
            )}
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-green-400">Done</h2>
            <span className="bg-green-900/30 text-green-400 font-bold px-4 py-2 rounded-lg text-sm border border-green-900">
              {doneTasks.length}
            </span>
          </div>
          <div className="space-y-4">
            {doneTasks.length > 0 ? (
              doneTasks.slice(0, 10).map(renderTaskCard)
            ) : (
              <div className="text-center py-12 text-green-300">
                <p className="font-bold">Start completing!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setEditingTask(null)}>
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-6">Edit Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-4 focus:ring-purple-300 focus:border-purple-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-4 focus:ring-purple-300 focus:border-purple-500 font-medium"
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3 justify-end">
              <button
                onClick={() => setEditingTask(null)}
                className="px-6 py-3 text-sm font-bold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {categoryModalTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setCategoryModalTask(null)}>
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-6">Change Category</h3>

            {/* Category Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleChangeCategory(category)}
                  className={`px-4 py-3 rounded-lg font-bold text-sm transition-all border ${
                    categoryModalTask.category === category
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-indigo-500'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Add New Category */}
            <div className="border-t-2 border-gray-200 pt-6">
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Create New Category
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCategory();
                  }}
                  placeholder="e.g., Marketing"
                  className="flex-1 px-4 py-3 border-2 border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-4 focus:ring-purple-300 focus:border-purple-500 font-medium"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setCategoryModalTask(null)}
                className="w-full px-6 py-3 text-sm font-bold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
