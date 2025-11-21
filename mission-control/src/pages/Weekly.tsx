import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTasks, getWeeklyAnalyses } from '../services/api';
import { Task, WeeklyAnalysis } from '../types';

const Weekly: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analyses, setAnalyses] = useState<WeeklyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [allTasks, allAnalyses] = await Promise.all([
        getTasks(user.id),
        getWeeklyAnalyses(user.id),
      ]);

      setTasks(allTasks);
      setAnalyses(allAnalyses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getWeeksToShow = () => {
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weeks.push(getWeekStart(weekStart));
    }
    return weeks;
  };

  const getTasksForWeek = (weekStart: Date) => {
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
    return tasks.filter(t => {
      const taskDate = new Date(t.date);
      return taskDate >= weekStart && taskDate < weekEnd;
    });
  };

  const getProgressByCategory = (weekTasks: Task[]) => {
    const progress: { [key: string]: { total: number; completed: number; percent: number } } = {};

    // Collect all unique categories from tasks
    const allCategories = new Set<string>();
    weekTasks.forEach(task => {
      allCategories.add(task.category);
    });

    // Calculate progress for each category
    allCategories.forEach(category => {
      const categoryTasks = weekTasks.filter(t => t.category === category);
      const completed = categoryTasks.filter(t => t.completed).length;
      const total = categoryTasks.length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      if (total > 0) {
        progress[category] = { total, completed, percent };
      }
    });

    // Sort by total tasks (descending)
    const sorted = Object.entries(progress).sort((a, b) => b[1].total - a[1].total);
    return Object.fromEntries(sorted);
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'from-green-400 to-emerald-500';
    if (percent >= 60) return 'from-blue-400 to-cyan-500';
    if (percent >= 40) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  const weeks = getWeeksToShow();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-lg h-16 w-16 border border-gray-700 border-t-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 font-medium">Loading your weeks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Weekly Goals
        </h1>
        <p className="text-gray-400 font-medium">Track your progress week by week</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {weeks.map((weekStart, index) => {
          const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
          const weekTasks = getTasksForWeek(weekStart);
          const progress = getProgressByCategory(weekTasks);
          const completedTasks = weekTasks.filter(t => t.completed).length;
          const totalTasks = weekTasks.length;
          const overallPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          const isCurrentWeek = index === 0;

          const gradients = [
            'from-purple-400 via-pink-400 to-red-400',
            'from-blue-400 via-cyan-400 to-teal-400',
            'from-green-400 via-emerald-400 to-lime-400',
            'from-yellow-400 via-orange-400 to-red-400',
          ];

          return (
            <div
              key={weekStart.toISOString()}
              className={`bg-gradient-to-br ${gradients[index % 4]} rounded-lg p-1 shadow-xl ${isCurrentWeek ? 'ring-4 ring-purple-600 ring-offset-4' : ''}`}
            >
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-200">
                      {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </h2>
                    <p className="text-sm font-bold text-gray-500">
                      {isCurrentWeek ? 'Current Week' : `${index} week${index > 1 ? 's' : ''} ago`}
                    </p>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300 font-bold text-sm">
                    Edit
                  </button>
                </div>

                {/* Overall Progress */}
                <div className="mb-6 p-4 bg-gradient-to-r bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-300">Overall</span>
                    <span className="text-2xl font-bold text-white">{overallPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-lg h-3">
                    <div
                      className={`bg-gradient-to-r ${getProgressColor(overallPercent)} h-3 rounded-lg transition-all duration-500`}
                      style={{ width: `${overallPercent}%` }}
                    />
                  </div>
                </div>

                {/* Category-based Progress Bars */}
                <div className="space-y-3">
                  {Object.entries(progress).length > 0 ? (
                    Object.entries(progress).map(([category, data]) => (
                      <div key={category} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-gray-300">{category}</span>
                          <span className="text-sm font-bold text-gray-400">
                            {data.completed}/{data.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-lg h-2">
                          <div
                            className={`bg-gradient-to-r ${getProgressColor(data.percent)} h-2 rounded-lg transition-all duration-300`}
                            style={{ width: `${data.percent}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm font-bold">No tasks this week</p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                {totalTasks > 0 && (
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="bg-blue-900/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-400">{totalTasks}</div>
                      <div className="text-xs font-bold text-blue-300">Total</div>
                    </div>
                    <div className="bg-green-900/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-400">{completedTasks}</div>
                      <div className="text-xs font-bold text-green-300">Done</div>
                    </div>
                    <div className="bg-orange-900/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-orange-400">{totalTasks - completedTasks}</div>
                      <div className="text-xs font-bold text-orange-300">Left</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Analyses Section */}
      {analyses.length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-gray-200 mb-6">AI Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analyses.slice(0, 4).map((analysis) => (
              <div
                key={analysis.id}
                className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg border border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-indigo-300">{analysis.goalTitle}</h3>
                    <p className="text-sm font-bold text-indigo-600">
                      {new Date(analysis.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="bg-indigo-200 text-indigo-300 font-bold px-3 py-1 rounded-lg text-xs">
                    {analysis.tasksReviewed} tasks
                  </span>
                </div>
                <p className="text-gray-300 font-medium leading-relaxed">{analysis.analysis}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="mt-12 text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-3xl font-bold text-gray-200 mb-3">No weekly data yet!</h3>
          <p className="text-gray-400 font-medium mb-6">Start adding tasks from the Dashboard to track your progress</p>
          <a
            href="/dashboard"
            className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Go to Dashboard
          </a>
        </div>
      )}
    </div>
  );
};

export default Weekly;
