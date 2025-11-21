# Mission Control - Quick Start Guide

This guide will help you deploy your Mission Control app in **under 15 minutes**.

## Overview

Mission Control is your personal task management system with:
- ✅ AI-powered task creation from notes
- 📅 Google Calendar integration
- 🎯 Goal tracking and weekly analysis
- 📊 Clean, notebook-style interface

## Prerequisites

You'll need:
1. A Google account (for Firebase)
2. A GitHub account (for deployment)
3. Node.js installed on your computer ([Download here](https://nodejs.org/))

## Step 1: Set Up Firebase (5 minutes)

Firebase will handle your database and authentication.

### 1.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Name it `mission-control` (or any name you prefer)
4. Disable Google Analytics (not needed)
5. Click **"Create project"**

### 1.2 Enable Authentication

1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Click on **"Email/Password"** under Sign-in providers
4. Enable the **"Email/Password"** toggle
5. Click **"Save"**

### 1.3 Create Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose your region (pick the closest to you)
5. Click **"Enable"**

### 1.4 Update Security Rules

1. In Firestore Database, click on the **"Rules"** tab
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

### 1.5 Get Your Firebase Config

1. Click the **gear icon** ⚙️ next to "Project Overview" in the left sidebar
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** `</>`
5. Register your app with nickname `mission-control-web`
6. **IMPORTANT**: Copy the `firebaseConfig` object - you'll need these values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

Keep this tab open - you'll paste these values in Step 3.

## Step 2: Get Google API Keys (3 minutes)

For AI task creation and Calendar sync.

### 2.1 Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project from the dropdown (same name as Step 1)
3. In the search bar, type **"Google Calendar API"**
4. Click on it and click **"Enable"**
5. Go back and search for **"Generative Language API"**
6. Click on it and click **"Enable"**

### 2.2 Create API Key

1. In Google Cloud Console, go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"API key"**
3. Copy the API key that appears
4. Click **"Restrict Key"** for security
5. Under "API restrictions", select **"Restrict key"**
6. Check:
   - Google Calendar API
   - Generative Language API
7. Click **"Save"**

This is your **Google API Key** - keep it safe.

### 2.3 Create OAuth Client ID

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
4. Back in "Create OAuth client ID":
   - Application type: **"Web application"**
   - Name: `mission-control-client`
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `https://your-app-name.vercel.app` (you'll update this later)
   - Authorized redirect URIs:
     - `http://localhost:5173`
     - `https://your-app-name.vercel.app` (you'll update this later)
5. Click **"Create"**
6. Copy the **Client ID** that appears

## Step 3: Download and Configure the Project (2 minutes)

### 3.1 Download the Project

1. Open Terminal (Mac/Linux) or Command Prompt (Windows)
2. Navigate to where you want the project:
   ```bash
   cd ~/Desktop
   ```
3. Create the project folder:
   ```bash
   mkdir mission-control
   cd mission-control
   ```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Configure Environment Variables

1. Create a file called `.env` in the project root:
   ```bash
   touch .env
   ```

2. Open `.env` in any text editor and paste:

```env
# Firebase Config (from Step 1.5)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google APIs (from Step 2)
VITE_GOOGLE_CLIENT_ID=your_oauth_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your_google_api_key_here
```

3. Replace all the `your_*_here` values with the real values from Steps 1 and 2
4. Save the file

## Step 4: Test Locally (1 minute)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

You should see the login page! Try creating an account and logging in.

## Step 5: Deploy to Vercel (4 minutes)

Vercel offers free hosting for this type of app.

### 5.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 5.2 Login to Vercel

```bash
vercel login
```

Follow the prompts to log in with GitHub, GitLab, or email.

### 5.3 Deploy

```bash
vercel
```

The CLI will ask several questions:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No
- **Project name?** `mission-control` (or whatever you prefer)
- **Which directory?** `./` (just press Enter)
- **Override settings?** No

After deployment completes, you'll see a URL like:
```
https://mission-control-xyz123.vercel.app
```

### 5.4 Add Environment Variables to Vercel

```bash
vercel env add VITE_FIREBASE_API_KEY
```

Paste the value, then press Enter.

Repeat for all variables:
```bash
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_GOOGLE_CLIENT_ID
vercel env add VITE_GOOGLE_API_KEY
```

### 5.5 Update OAuth Redirect URIs

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **"APIs & Services"** > **"Credentials"**
3. Click on your OAuth client ID
4. Under **"Authorized JavaScript origins"**, add:
   ```
   https://your-actual-vercel-url.vercel.app
   ```
5. Under **"Authorized redirect URIs"**, add:
   ```
   https://your-actual-vercel-url.vercel.app
   ```
6. Click **"Save"**

### 5.6 Redeploy

```bash
vercel --prod
```

## You're Done! 🎉

Your Mission Control app is now live at your Vercel URL!

## First Steps in the App

1. **Create an account** - Use any email and password
2. **Add a task** - Type in the notebook area and click "Add to Tasks"
3. **Try AI** - Type something like "Call mom tomorrow at 3pm" and watch it auto-schedule
4. **Sync Calendar** - Go to Settings and connect your Google Calendar
5. **Set a goal** - Click "Add New Goal" and type your objective

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check that you copied the Firebase config correctly in `.env`
- Make sure there are no extra spaces or quotes

### "Calendar sync not working"
- Verify your Google Client ID is correct
- Check that you added your Vercel URL to authorized origins in Google Cloud Console

### "AI not creating tasks"
- Verify your Google API Key is correct and not restricted
- Check that Generative Language API is enabled in Google Cloud Console

## Need Help?

If you get stuck, double-check:
1. All values in `.env` are correct (no typos, no extra spaces)
2. All APIs are enabled in Google Cloud Console
3. OAuth redirect URIs include your Vercel URL
4. Firestore security rules are published

---

**Privacy Note**: This app stores all your data in your personal Firebase project. No one else has access to it, not even me. You own and control everything.
