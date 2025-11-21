import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Weekly from './pages/Weekly';
import Settings from './pages/Settings';
import { isFirebaseConfigured } from './firebase';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="max-w-2xl bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Firebase Not Configured</h1>
          <p className="text-gray-300 mb-4">
            Mission Control requires Firebase to store your data. Please follow these steps:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-300 mb-6">
            <li>Open the <code className="bg-gray-700 px-2 py-1 rounded text-gray-200">QUICKSTART.md</code> file in the project root</li>
            <li>Follow the instructions to create a Firebase project</li>
            <li>Create a <code className="bg-gray-700 px-2 py-1 rounded text-gray-200">.env</code> file with your Firebase credentials</li>
            <li>Restart the development server</li>
          </ol>
          <p className="text-sm text-gray-400">
            See <code className="bg-gray-700 px-2 py-1 rounded text-gray-200">QUICKSTART.md</code> for detailed instructions.
          </p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-white">
                  Mission Control
                </h1>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-2">
                <a
                  href="/dashboard"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/dashboard'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Dashboard
                </a>
                <a
                  href="/tasks"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/tasks'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Tasks
                </a>
                <a
                  href="/weekly"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/weekly'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Weekly
                </a>
                <a
                  href="/settings"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === '/settings'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Settings
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white font-medium text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-6">{children}</main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Layout>
                  <Tasks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/weekly"
            element={
              <ProtectedRoute>
                <Layout>
                  <Weekly />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
