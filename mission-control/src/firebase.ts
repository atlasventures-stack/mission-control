import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Check if Firebase is configured
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

export const isFirebaseConfigured = missingVars.length === 0;

if (!isFirebaseConfigured) {
  console.warn(`
⚠️  Firebase is not configured. Missing environment variables:
${missingVars.map(v => `   - ${v}`).join('\n')}

Please follow the setup instructions in QUICKSTART.md to configure Firebase.
  `);
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'not-configured',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'not-configured',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'not-configured',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'not-configured',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'not-configured',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'not-configured',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
