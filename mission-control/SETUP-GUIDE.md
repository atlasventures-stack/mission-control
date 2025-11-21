# Firebase Setup for project-768383142242

## Your Firebase Project ID
`project-768383142242`

## Step 1: Get Your Firebase Web App Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **project-768383142242**
3. Click the **gear icon** ⚙️ next to "Project Overview" (left sidebar)
4. Click **"Project settings"**
5. Scroll down to **"Your apps"** section
6. If you don't see a web app yet:
   - Click the **Web icon** `</>`
   - Register app with nickname: `mission-control-web`
   - **Don't** check "Set up Firebase Hosting"
   - Click **"Register app"**
7. You'll see the Firebase configuration object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "project-768383142242.firebaseapp.com",
  projectId: "project-768383142242",
  storageBucket: "project-768383142242.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Copy these values** - you'll need them for your `.env` file.

## Step 2: Enable Email/Password Authentication

1. In Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Toggle **"Enable"** to ON
6. Click **"Save"**

## Step 3: Create Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose your region (pick closest to you, e.g., `us-central`)
5. Click **"Enable"**

### Update Firestore Security Rules

1. Click on the **"Rules"** tab in Firestore Database
2. Replace the content with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

This ensures users can only access their own data.

## Step 4: Get Google API Keys (for AI features)

### Enable APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **project-768383142242** from the dropdown at the top
3. In the search bar, type **"Google Calendar API"**
4. Click on it and click **"Enable"**
5. Go back and search for **"Generative Language API"**
6. Click on it and click **"Enable"**

### Create API Key

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"API key"**
3. **Copy the API key** that appears
4. Click **"Restrict Key"**
5. Under "API restrictions", select **"Restrict key"**
6. Check these APIs:
   - ✅ Google Calendar API
   - ✅ Generative Language API
7. Click **"Save"**

### Create OAuth Client ID

1. Still in **"Credentials"** page
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. If prompted to configure consent screen:
   - Click **"Configure Consent Screen"**
   - Select **"External"** > **"Create"**
   - Fill in:
     - App name: `Mission Control`
     - User support email: your email
     - Developer contact: your email
   - Click **"Save and Continue"** through all steps
   - Click **"Back to Dashboard"**
4. Now create OAuth client ID:
   - Click **"Create Credentials"** > **"OAuth client ID"**
   - Application type: **"Web application"**
   - Name: `mission-control-client`
   - Authorized JavaScript origins:
     - `http://localhost:5173`
   - Authorized redirect URIs:
     - `http://localhost:5173`
   - Click **"Create"**
5. **Copy the Client ID** that appears (looks like: `123456-abc.apps.googleusercontent.com`)

## Step 5: Create Your .env File

Now create a file called `.env` in your project root with all the values you collected:

```bash
cd /Users/apple/mission-control
nano .env
```

Paste this and **replace the values** with your actual credentials:

```env
# Firebase Config (from Step 1)
VITE_FIREBASE_API_KEY=AIza...your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=project-768383142242.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-768383142242
VITE_FIREBASE_STORAGE_BUCKET=project-768383142242.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Google APIs (from Step 4)
VITE_GOOGLE_CLIENT_ID=123456-abc.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIza...your_google_api_key
```

Press `Ctrl+O` to save, `Enter` to confirm, then `Ctrl+X` to exit.

## Step 6: Run Your App!

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

You should see the login page with no errors!

## Next Steps

1. **Create your account** - any email and password
2. **Add your first task** - type something like "Buy groceries tomorrow"
3. **Set a goal** - go to Settings > Add New Goal
4. **Try AI parsing** - type "Call John at 3pm tomorrow" and watch it auto-parse

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check that `VITE_FIREBASE_API_KEY` in `.env` matches exactly what's in Firebase Console
- Make sure there are no extra spaces or quotes

### "AI not working"
- Verify `VITE_GOOGLE_API_KEY` is set correctly
- Check that "Generative Language API" is enabled in Google Cloud Console

### "Module not found"
- Run `npm install` first
- Make sure you're in the `/Users/apple/mission-control` directory

---

**All set?** You're ready to go! 🚀
