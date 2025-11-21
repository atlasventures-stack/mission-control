import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getGoals, createGoal, updateGoal, deleteGoal, clearAllUserData, getTasks } from '../services/api';
import { syncAllCalendars } from '../services/calendarService';
import { generateCategoriesFromData, isAIConfigured } from '../services/aiService';
import { Goal } from '../types';

const Settings: React.FC = () => {
  const { user, syncGoogleCalendar, disconnectCalendar, connectedCalendars } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [regeneratingCategories, setRegeneratingCategories] = useState(false);

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    try {
      const allGoals = await getGoals(user.id);
      setGoals(allGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!user || !newGoalTitle.trim()) return;

    try {
      const newGoal = await createGoal({
        userId: user.id,
        title: newGoalTitle,
        description: newGoalDescription,
        isActive: true,
      });

      setGoals([newGoal, ...goals]);
      setNewGoalTitle('');
      setNewGoalDescription('');
      setShowNewGoal(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal');
    }
  };

  const handleToggleActive = async (goalId: string) => {
    if (!user) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    try {
      await updateGoal(user.id, goalId, { isActive: !goal.isActive });
      setGoals(goals.map(g => (g.id === goalId ? { ...g, isActive: !g.isActive } : g)));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user || !confirm('Are you sure you want to delete this goal?')) return;

    try {
      await deleteGoal(user.id, goalId);
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal');
    }
  };

  const handleSyncCalendars = async () => {
    if (!user || connectedCalendars.length === 0) {
      alert('Please connect at least one calendar account first.');
      return;
    }

    setSyncing(true);
    setSyncMessage(null);

    try {
      console.log('🔄 Starting calendar sync...');
      const result = await syncAllCalendars(user.id, connectedCalendars);

      if (result.total === 0 && result.errors === 0) {
        setSyncMessage('✅ All calendar events are already synced!');
      } else if (result.errors > 0) {
        setSyncMessage(`⚠️ Synced ${result.total} new tasks, but ${result.errors} failed. Check console for details.`);
      } else {
        setSyncMessage(`🎉 Successfully created ${result.total} new tasks from your calendar events!`);
      }

      // Refresh after a delay so user can see the message and DB writes complete
      setTimeout(() => {
        // Use replace + reload to force fresh data
        window.location.replace('/dashboard');
        setTimeout(() => window.location.reload(), 100);
      }, 3000);
    } catch (error) {
      console.error('Error syncing calendars:', error);
      setSyncMessage('❌ Failed to sync calendar events. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const handleRegenerateCategories = async () => {
    if (!user || !isAIConfigured) {
      alert('AI is not configured. Please add your Google API Key to use this feature.');
      return;
    }

    setRegeneratingCategories(true);

    try {
      // Get all data
      const allTasks = await getTasks(user.id);
      const allGoals = await getGoals(user.id);

      const calendarEvents = allTasks
        .filter(t => t.isFromCalendar)
        .map(t => t.title);

      const taskTitles = allTasks
        .filter(t => !t.isFromCalendar)
        .map(t => t.title);

      const goalsData = allGoals.map(g => ({ title: g.title, description: g.description }));

      // Generate new categories
      const aiCategories = await generateCategoriesFromData(calendarEvents, taskTitles, goalsData);

      // Save to localStorage
      localStorage.setItem('aiGeneratedCategories', JSON.stringify(aiCategories));
      localStorage.setItem('categoriesGeneratedDate', new Date().toISOString().split('T')[0]);

      alert(`✅ Successfully generated ${aiCategories.length} categories based on your data:\n\n${aiCategories.join(', ')}`);
    } catch (error) {
      console.error('Error regenerating categories:', error);
      alert('❌ Failed to regenerate categories. Check console for details.');
    } finally {
      setRegeneratingCategories(false);
    }
  };

  const handleClearAllData = async () => {
    if (!user) return;

    const confirmed = confirm(
      '⚠️ WARNING: This will permanently delete ALL your data including:\n\n' +
      '• All tasks (including calendar tasks)\n' +
      '• All goals\n' +
      '• All daily entries\n' +
      '• All weekly entries\n' +
      '• All weekly analyses\n' +
      '• Synced calendar event history\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Are you absolutely sure you want to continue?'
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      'Last chance! Are you 100% sure you want to delete everything?'
    );

    if (!doubleConfirm) return;

    setLoading(true);

    try {
      await clearAllUserData(user.id);
      alert('✅ All data has been cleared successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('❌ Failed to clear data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-lg h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Calendar Sync */}
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-indigo-600">
            <h2 className="text-2xl font-bold text-white">Google Calendar Sync</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-300 mb-6 font-medium">
              Connect your Google Calendar accounts to automatically sync today's and tomorrow's meetings as tasks. Calendar events auto-complete when meetings end and new events are synced every 5 minutes.
            </p>

            {/* Connected Accounts */}
            {connectedCalendars.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="text-lg font-bold text-gray-200">Connected Accounts</h3>
                {connectedCalendars.map((calendar) => (
                  <div
                    key={calendar.email}
                    className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 flex items-center justify-between group hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-white">{calendar.email}</p>
                        <p className="text-xs text-gray-500 font-medium">
                          Connected {new Date(calendar.connectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Disconnect ${calendar.email}?`)) {
                          disconnectCalendar(calendar.email);
                        }
                      }}
                      className="px-4 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 font-bold text-sm border border-red-900"
                    >
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Sync Calendar Events Button */}
            {connectedCalendars.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={handleSyncCalendars}
                  disabled={syncing}
                  className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {syncing ? 'Syncing Calendar Events...' : 'Sync Calendar Events to Tasks'}
                </button>
                {syncMessage && (
                  <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700 text-center">
                    <p className="text-sm font-bold text-gray-200">{syncMessage}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 text-center font-medium">
                  Manually sync today and tomorrow's events. Auto-sync runs every 5 minutes automatically!
                </p>
              </div>
            )}

            {/* Add Calendar Button */}
            <button
              onClick={syncGoogleCalendar}
              className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              {connectedCalendars.length === 0 ? 'Sync with Google Calendar' : 'Add Another Calendar Account'}
            </button>

            <p className="text-sm text-gray-500 mt-4 font-medium text-center">
              Note: Google Calendar sync requires VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY in your .env file. See QUICKSTART.md for setup instructions.
            </p>
          </div>
        </div>

        {/* Goals */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-4 bg-indigo-600 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">My Goals</h2>
            <button
              onClick={() => setShowNewGoal(true)}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-bold shadow-lg"
            >
              Add Goal
            </button>
          </div>

          <div className="p-6 space-y-4">
            {goals.map(goal => (
              <div key={goal.id} className="bg-gray-700 rounded-lg p-5 border border-gray-600 group hover:border-indigo-500 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">{goal.title}</h3>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${
                          goal.isActive ? 'bg-green-900/30 text-green-400 border-green-900' : 'bg-gray-700 text-gray-400 border-gray-600'
                        }`}
                      >
                        {goal.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-400 font-medium">{goal.description}</p>
                    <p className="mt-2 text-xs text-gray-500 font-bold">
                      Created {new Date(goal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(goal.id)}
                      className="px-3 py-1 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 text-sm font-bold"
                    >
                      {goal.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="px-3 py-1 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 text-sm font-bold border border-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {goals.length === 0 && (
              <div className="p-12 text-center text-orange-300">
                <p className="text-lg font-bold text-gray-200">No goals yet</p>
                <p className="text-sm mt-2 font-medium text-gray-400">Click "Add New Goal" to create your first goal</p>
              </div>
            )}
          </div>
        </div>

        {/* Account */}
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-indigo-600">
            <h2 className="text-2xl font-bold text-white">Account</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-gray-900 rounded-lg p-5 shadow-lg border border-gray-700 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-300">Email:</span>
                <span className="text-white font-bold">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-300">User ID:</span>
                <span className="text-xs text-gray-500 font-mono font-bold">{user?.id}</span>
              </div>
            </div>

            {/* AI Categories */}
            {isAIConfigured && (
              <div className="bg-gray-900 rounded-lg p-5 shadow-lg border border-gray-700">
                <h3 className="text-lg font-bold text-indigo-300 mb-3">AI Categories</h3>
                <p className="text-sm text-gray-300 font-medium mb-4">
                  AI automatically generates categories based on your calendar events, tasks, and goals. Click below to regenerate them based on your latest data.
                </p>
                <button
                  onClick={handleRegenerateCategories}
                  disabled={regeneratingCategories}
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  {regeneratingCategories ? 'Generating...' : 'Regenerate Categories'}
                </button>
              </div>
            )}

            {/* Danger Zone */}
            <div className="bg-gray-900 rounded-lg p-5 shadow-lg border border-red-700">
              <h3 className="text-lg font-bold text-red-300 mb-3">Danger Zone</h3>
              <p className="text-sm text-gray-300 font-medium mb-4">
                This will permanently delete all your data including tasks, goals, and calendar sync history. This action cannot be undone!
              </p>
              <button
                onClick={handleClearAllData}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Goal Modal */}
      {showNewGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowNewGoal(false)}>
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-8 border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-6">Create New Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="E.g., Launch MVP by Q2"
                  className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-4 focus:ring-orange-300 focus:border-orange-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  placeholder="What does success look like?"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-4 focus:ring-orange-300 focus:border-orange-500 font-medium"
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNewGoal(false);
                  setNewGoalTitle('');
                  setNewGoalDescription('');
                }}
                className="px-6 py-3 text-sm font-bold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
