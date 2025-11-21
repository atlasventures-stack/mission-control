import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import { User } from '../types';

interface CalendarAccount {
  email: string;
  accessToken: string;
  connectedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  syncGoogleCalendar: () => Promise<void>;
  disconnectCalendar: (email: string) => void;
  connectedCalendars: CalendarAccount[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectedCalendars, setConnectedCalendars] = useState<CalendarAccount[]>([]);

  // Load connected calendars from localStorage (user-specific)
  useEffect(() => {
    if (user) {
      // Try user-specific key first
      let stored = localStorage.getItem(`connectedCalendars_${user.id}`);

      // MIGRATION: If user-specific key doesn't exist, check old global key
      if (!stored) {
        const oldStored = localStorage.getItem('connectedCalendars');
        if (oldStored) {
          console.log('📦 Migrating calendar connections to user-specific storage');
          // Migrate to user-specific key
          localStorage.setItem(`connectedCalendars_${user.id}`, oldStored);
          // Remove old global key
          localStorage.removeItem('connectedCalendars');
          stored = oldStored;
        }
      }

      if (stored) {
        try {
          setConnectedCalendars(JSON.parse(stored));
          console.log('✅ Loaded connected calendars:', JSON.parse(stored).length);
        } catch (error) {
          console.error('Failed to load connected calendars:', error);
        }
      }
    } else {
      // Clear calendars when no user is logged in
      setConnectedCalendars([]);
    }
  }, [user]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please add your Firebase credentials to the .env file. See QUICKSTART.md for instructions.');
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please add your Firebase credentials to the .env file. See QUICKSTART.md for instructions.');
    }
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!isFirebaseConfigured) return;
    await firebaseSignOut(auth);
  };

  const syncGoogleCalendar = async () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

    console.log('🔑 Checking credentials...');
    console.log('Client ID:', GOOGLE_CLIENT_ID);
    console.log('API Key:', GOOGLE_API_KEY?.substring(0, 10) + '...');

    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY ||
        GOOGLE_CLIENT_ID.includes('your_') || GOOGLE_API_KEY.includes('your_')) {
      alert('Google API credentials are not configured. Please add VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY to your .env file. See QUICKSTART.md for instructions.');
      return;
    }

    try {
      console.log('📥 Loading Google Identity Services...');

      // Load Google Identity Services (new method)
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = resolve;
        script.onerror = reject;
        if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
          document.body.appendChild(script);
        } else {
          resolve(null);
        }
      });
      console.log('✅ Google Identity Services loaded');

      // Load gapi for Calendar API calls
      console.log('📥 Loading Google API client...');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = resolve;
        script.onerror = reject;
        if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
          document.body.appendChild(script);
        } else {
          resolve(null);
        }
      });

      await new Promise((resolve) => {
        (window as any).gapi.load('client', resolve);
      });
      console.log('✅ Google API client loaded');

      // Initialize the Google API client
      await (window as any).gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      });
      console.log('✅ API client initialized');

      // Use Google Identity Services for OAuth
      console.log('🔑 Initializing OAuth with Google Identity Services...');
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email',
        callback: async (response: any) => {
          console.log('✅ OAuth callback received:', response);

          if (response.error) {
            console.error('❌ OAuth error:', response);
            throw new Error(response.error);
          }

          // Token received successfully
          console.log('✅ Access token received');

          try {
            // Get user's email using the access token
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                Authorization: `Bearer ${response.access_token}`,
              },
            });
            const userInfo = await userInfoResponse.json();
            console.log('✅ User info received:', userInfo);

            // Check if account is already connected
            if (connectedCalendars.some(cal => cal.email === userInfo.email)) {
              alert(`Calendar account ${userInfo.email} is already connected!`);
              return;
            }

            // Add new calendar account
            const newAccount: CalendarAccount = {
              email: userInfo.email,
              accessToken: response.access_token,
              connectedAt: new Date().toISOString(),
            };

            const updatedCalendars = [...connectedCalendars, newAccount];
            setConnectedCalendars(updatedCalendars);
            if (user) {
              localStorage.setItem(`connectedCalendars_${user.id}`, JSON.stringify(updatedCalendars));
            }

            alert(`Google Calendar connected successfully! 🎉\n\nAccount: ${userInfo.email}\n\nNote: Calendar event syncing as tasks is a premium feature coming soon. For now, you can manually add calendar events as tasks.`);
          } catch (error) {
            console.error('Failed to get user info:', error);
            alert('Connected to calendar but failed to get account details.');
          }
        },
      });

      console.log('🚪 Requesting access token...');
      tokenClient.requestAccessToken({ prompt: 'consent' });

    } catch (error: any) {
      console.error('❌ Calendar sync error:', error);

      // Try to extract the actual error message from various possible structures
      let errorMessage = 'Unknown error';
      let errorDetails = null;

      if (error.result?.error) {
        // gapi error format
        errorDetails = error.result.error;
        errorMessage = errorDetails.message || JSON.stringify(errorDetails);
      } else if (error.error) {
        // Nested error format
        errorDetails = error.error;
        errorMessage = typeof error.error === 'string' ? error.error : (error.error.message || JSON.stringify(error.error));
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('Error details:', {
        message: errorMessage,
        fullError: errorDetails || error,
        errorType: typeof error,
        errorKeys: Object.keys(error || {})
      });

      if (errorMessage.includes('popup_closed_by_user')) {
        alert('Calendar sync cancelled.');
      } else if (errorMessage.includes('popup_blocked')) {
        alert('Popup was blocked by your browser.\n\nPlease allow popups for this site and try again.');
      } else if (errorMessage.includes('idpiframe_initialization_failed') || errorMessage.includes('Not a valid origin')) {
        alert('OAuth configuration error.\n\nThe domain is not authorized for Google Sign-In.\n\nPlease add the following to "Authorized JavaScript origins" in Google Cloud Console:\n• ' + window.location.origin + '\n\nThen refresh the page and try again.');
      } else {
        alert('Failed to sync calendar.\n\nError: ' + errorMessage + '\n\nCheck browser console (F12) for details.\n\nPossible solutions:\n1. Make sure Google Calendar API is enabled in your Google Cloud Console\n2. Verify OAuth consent screen is configured\n3. Add this domain to Authorized JavaScript origins\n4. Check that popup blockers are disabled');
      }
    }
  };

  const disconnectCalendar = (email: string) => {
    const updatedCalendars = connectedCalendars.filter(cal => cal.email !== email);
    setConnectedCalendars(updatedCalendars);
    if (user) {
      localStorage.setItem(`connectedCalendars_${user.id}`, JSON.stringify(updatedCalendars));
    }
    alert(`Calendar account ${email} has been disconnected.`);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    syncGoogleCalendar,
    disconnectCalendar,
    connectedCalendars,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
