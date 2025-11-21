import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTasks, createTask, updateTask, deleteTask, getDailyEntry, saveDailyEntry, getGoals } from '../services/api';
import { parseNoteIntoTasks, isAIConfigured, generateCategoriesFromData } from '../services/aiService';
import { autoSyncTodaysCalendar } from '../services/calendarService';
import { Task, DailyEntry, Goal } from '../types';
import TaskItem from '../components/TaskItem';
import { CATEGORIES } from '../constants';

const Dashboard: React.FC = () => {
  const { user, connectedCalendars } = useAuth();
  const [note, setNote] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailyEntry, setDailyEntry] = useState<DailyEntry | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [categoryModalTask, setCategoryModalTask] = useState<Task | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      loadData();
      rolloverIncompleteTasks();
      // Auto-sync today's calendar (only once per day)
      if (connectedCalendars.length > 0) {
        autoSyncTodaysCalendar(user.id, connectedCalendars)
          .then((result) => {
            if (result.synced && result.total > 0) {
              console.log(`✅ Auto-synced ${result.total} calendar events`);
              loadData(); // Reload to show new tasks
            }
          })
          .catch((error) => {
            console.warn('⚠️  Auto-sync failed (you can sync manually):', error);
          });
      }
    }
  }, [user]);

  const rolloverIncompleteTasks = async () => {
    if (!user) return;

    try {
      const allTasks = await getTasks(user.id);

      // Find all incomplete tasks from yesterday or earlier
      const tasksToRollover = allTasks.filter(t => !t.completed && t.date < today);

      // Update each task to today's date
      const updatePromises = tasksToRollover.map(task =>
        updateTask(user.id, task.id, { date: today })
      );

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        // Reload tasks to reflect the changes
        loadData();
      }
    } catch (error) {
      console.error('Error rolling over incomplete tasks:', error);
    }
  };

  // Generate and load categories based on user data
  useEffect(() => {
    const generateCategories = async () => {
      if (!user || !isAIConfigured) {
        // Fallback to default categories if AI not configured
        const customCategories = localStorage.getItem('customCategories');
        if (customCategories) {
          setCategories([...CATEGORIES, ...JSON.parse(customCategories)]);
        } else {
          setCategories([...CATEGORIES]);
        }
        return;
      }

      try {
        // Check if we already generated categories today
        const lastGenerated = localStorage.getItem('categoriesGeneratedDate');
        const today = new Date().toISOString().split('T')[0];

        if (lastGenerated === today) {
          // Use cached categories
          const cachedCategories = localStorage.getItem('aiGeneratedCategories');
          const manualCategories = localStorage.getItem('customCategories');

          if (cachedCategories) {
            const aiCats = JSON.parse(cachedCategories);
            const manualCats = manualCategories ? JSON.parse(manualCategories) : [];
            setCategories([...new Set([...aiCats, ...manualCats])]);
            return;
          }
        }

        // Generate new categories from data
        const allTasks = await getTasks(user.id);
        const allGoals = await getGoals(user.id);

        // Get calendar event titles from tasks marked as from calendar
        const calendarEvents = allTasks
          .filter(t => t.isFromCalendar)
          .map(t => t.title);

        const taskTitles = allTasks
          .filter(t => !t.isFromCalendar)
          .map(t => t.title);

        const goalsData = allGoals.map(g => ({ title: g.title, description: g.description }));

        // Generate categories using AI
        const aiCategories = await generateCategoriesFromData(calendarEvents, taskTitles, goalsData);

        // Save to localStorage
        localStorage.setItem('aiGeneratedCategories', JSON.stringify(aiCategories));
        localStorage.setItem('categoriesGeneratedDate', today);

        // Merge with manual categories
        const manualCategories = localStorage.getItem('customCategories');
        const manualCats = manualCategories ? JSON.parse(manualCategories) : [];

        setCategories([...new Set([...aiCategories, ...manualCats])]);
      } catch (error) {
        console.error('Error generating categories:', error);
        // Fallback to default categories
        const customCategories = localStorage.getItem('customCategories');
        if (customCategories) {
          setCategories([...CATEGORIES, ...JSON.parse(customCategories)]);
        } else {
          setCategories([...CATEGORIES]);
        }
      }
    };

    generateCategories();
  }, [user, tasks.length, goals.length]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [allTasks, entry, allGoals] = await Promise.all([
        getTasks(user.id),
        getDailyEntry(user.id, today),
        getGoals(user.id),
      ]);

      setTasks(allTasks);
      setDailyEntry(entry);
      setGoals(allGoals.filter(g => g.isActive));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!note.trim() || !user || submitting) return;

    setSubmitting(true);

    try {
      let parsedTasks;

      if (isAIConfigured) {
        parsedTasks = await parseNoteIntoTasks(note);
      } else {
        parsedTasks = [{
          title: note,
          category: 'Other',
          date: today,
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

      setTasks([...tasks, ...newTasks]);
      setNote('');
      await updateDailyProgress();
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updated = { ...task, completed: !task.completed };

    try {
      await updateTask(user.id, taskId, { completed: updated.completed });
      setTasks(tasks.map(t => (t.id === taskId ? updated : t)));
      await updateDailyProgress();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const updateDailyProgress = async () => {
    if (!user) return;

    const todaysTasks = tasks.filter(t => t.date === today);
    const completedToday = todaysTasks.filter(t => t.completed);

    const completedCategories = Array.from(
      new Set(completedToday.map(t => t.category))
    );

    const progressPercent = todaysTasks.length > 0
      ? Math.round((completedToday.length / todaysTasks.length) * 100)
      : 0;

    const entry: Omit<DailyEntry, 'id'> = {
      userId: user.id,
      date: today,
      completedCategories,
      progressPercent,
    };

    const saved = await saveDailyEntry(entry);
    setDailyEntry(saved);
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
      await updateDailyProgress();
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
      await updateDailyProgress();
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
      await updateDailyProgress();
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

  const todaysTasks = useMemo(() => tasks.filter(t => t.date === today), [tasks, today]);
  const backlogTasks = useMemo(() => tasks.filter(t => t.date < today && !t.completed), [tasks, today]);
  const completedTasks = useMemo(() => todaysTasks.filter(t => t.completed), [todaysTasks]);
  const incompleteTodaysTasks = useMemo(() => todaysTasks.filter(t => !t.completed), [todaysTasks]);

  const todaysCategories = useMemo(() => {
    return Array.from(new Set(todaysTasks.map(t => t.category)));
  }, [todaysTasks]);

  const completedCategories = useMemo(() => {
    return Array.from(new Set(completedTasks.map(t => t.category)));
  }, [completedTasks]);

  const currentGoal = goals.length > 0 ? goals[currentGoalIndex] : null;

  const cycleGoal = () => {
    if (goals.length > 1) {
      setCurrentGoalIndex((currentGoalIndex + 1) % goals.length);
    }
  };

  const progress = dailyEntry?.progressPercent || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-lg h-16 w-16 border border-gray-700 border-t-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 font-medium">Loading your mission...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Notepad */}
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-white">
                Today's Notepad
              </h2>
              <div className="text-sm font-bold text-indigo-400 bg-gray-800 px-4 py-2 rounded-lg shadow">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleAddTask();
                }
              }}
              placeholder="Jot down a task... e.g., 'Finish the pitch deck for tomorrow's meeting'"
              className="w-full px-6 py-4 text-lg border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-medium placeholder-gray-500 bg-gray-700 text-white"
              rows={3}
            />
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAIConfigured ? (
                  <span className="text-sm font-medium text-indigo-400">
                    AI Enabled
                  </span>
                ) : (
                  <span className="text-sm font-medium text-gray-500">
                    Add Google API Key for AI
                  </span>
                )}
              </div>
              <button
                onClick={handleAddTask}
                disabled={!note.trim() || submitting}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                {submitting ? 'Adding...' : 'Add Task with AI'}
              </button>
            </div>
          </div>

          {/* Backlog Section */}
          {backlogTasks.length > 0 && (
            <div className="bg-gray-800 border border-red-900/50 rounded-lg shadow-xl p-6">
              <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                Overdue ({backlogTasks.length})
              </h3>
              <div className="space-y-3">
                {backlogTasks.map(task => (
                  <div key={task.id} className="bg-gray-700 rounded-lg p-4 border border-red-900/50 hover:border-red-500 transition-colors">
                    <TaskItem task={task} onToggle={handleToggleTask} isBacklog={true} onEdit={handleEdit} onDelete={handleDelete} onCategoryClick={handleCategoryClick} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Mission */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6">
            <h3 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
              Today's Mission ({incompleteTodaysTasks.length} left)
            </h3>
            <div className="space-y-3">
              {incompleteTodaysTasks.length > 0 ? (
                incompleteTodaysTasks.map(task => (
                  <div key={task.id} className="rounded-lg p-4 bg-gray-700 border border-gray-600 hover:border-indigo-500 transition-colors">
                    <TaskItem task={task} onToggle={handleToggleTask} isBacklog={false} onEdit={handleEdit} onDelete={handleDelete} onCategoryClick={handleCategoryClick} />
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg font-bold">No tasks yet!</p>
                  <p className="text-sm">Add some above to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Goal Card */}
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-indigo-400">Primary Goal</h3>
              {goals.length > 1 && (
                <button
                  onClick={cycleGoal}
                  className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg font-bold text-gray-300"
                >
                  Next →
                </button>
              )}
            </div>
            {currentGoal ? (
              <div>
                <p className="text-2xl font-bold mb-2 text-white">{currentGoal.title}</p>
                <p className="text-sm text-gray-400">{currentGoal.description}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No active goals. Set one in Settings!</p>
            )}
          </div>

          {/* Today's Execution */}
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-200 mb-4">Today's Execution</h3>
            <div className="space-y-3 mb-6">
              {todaysCategories.length > 0 ? (
                todaysCategories.map(category => (
                  <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                    <span className="font-bold text-gray-200">{category}</span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${completedCategories.includes(category) ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-400'}`}>
                      {completedCategories.includes(category) ? '✓' : '○'}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Add tasks to see categories</p>
              )}
            </div>

            {/* Progress Circle */}
            {todaysTasks.length > 0 && (
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-gray-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                      className={`transition-all duration-500 ${progress >= 70 ? 'text-green-500' : progress >= 40 ? 'text-indigo-500' : 'text-orange-500'}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{progress}%</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-400 mt-2">Daily Progress</p>
              </div>
            )}
          </div>

          {/* This Week Stats */}
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">This Week</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center border border-gray-600">
                <div className="text-3xl font-bold text-green-400">
                  {tasks.filter(t => {
                    const taskDate = new Date(t.date);
                    const weekAgo = new Date(Date.now() - 7 * 86400000);
                    return t.completed && taskDate >= weekAgo;
                  }).length}
                </div>
                <div className="text-xs font-bold text-gray-400 mt-1">Completed</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center border border-gray-600">
                <div className="text-3xl font-bold text-orange-400">
                  {tasks.filter(t => {
                    const taskDate = new Date(t.date);
                    const weekAgo = new Date(Date.now() - 7 * 86400000);
                    const tomorrow = new Date(Date.now() + 86400000);
                    return !t.completed && taskDate >= weekAgo && taskDate <= tomorrow;
                  }).length}
                </div>
                <div className="text-xs font-bold text-gray-400 mt-1">Pending</div>
              </div>
            </div>
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

export default Dashboard;
