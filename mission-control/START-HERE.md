# 🚀 Start Here - Mission Control Setup

Your Firebase project `project-768383142242` is created! Let's get you running in 15 minutes.

## Current Status

```bash
cd /Users/apple/mission-control
./check-setup.sh
```

This shows what's configured (✅) and what needs real values (⚠️).

## Next Steps

### Option 1: Full Setup (Recommended - 15 min)

Get all features working including AI task parsing and calendar sync.

**Follow SETUP-GUIDE.md** - it has detailed instructions for your specific project.

Quick summary:
1. Firebase Console → Get web app config
2. Enable Authentication & Firestore
3. Google Cloud Console → Get API keys
4. Update `.env` file
5. Run `npm install && npm run dev`

### Option 2: Quick Test (5 min)

Just want to see the UI first? You can run it with mock/placeholder credentials:

```bash
npm install
npm run dev
```

Open http://localhost:5173 - you'll see a configuration error with instructions on what to add.

## File Guide

- **SETUP-GUIDE.md** ← Start here! Step-by-step for your Firebase project
- **NEXT-STEPS.md** - Quick overview of the app
- **QUICKSTART.md** - Detailed guide with screenshots
- **README.md** - Complete documentation
- **.env** - Your configuration file (needs real values)
- **check-setup.sh** - Run this to verify your setup

## Your .env File Status

Run this to check what's still needed:

```bash
./check-setup.sh
```

You should see:
- ✅ Project ID (already set)
- ✅ Auth domain (already set)
- ✅ Storage bucket (already set)
- ⚠️ API Key (need from Firebase Console)
- ⚠️ App ID (need from Firebase Console)
- ⚠️ Messaging Sender ID (need from Firebase Console)
- ⚠️ Google Client ID (need from Google Cloud)
- ⚠️ Google API Key (need from Google Cloud)

## Getting the Missing Values

All of these come from **one place**: Firebase Console → Project Settings → Your Apps

1. Go to https://console.firebase.google.com/
2. Select project: `project-768383142242`
3. Click gear icon ⚙️ → Project settings
4. Scroll to "Your apps"
5. Click Web icon `</>` to add a web app (if not already there)
6. Copy all the config values

**See SETUP-GUIDE.md for screenshots and detailed steps.**

## Commands You'll Need

```bash
# 1. Navigate to project
cd /Users/apple/mission-control

# 2. Check what's configured
./check-setup.sh

# 3. Edit .env file (after getting credentials)
nano .env
# or
code .env

# 4. Install dependencies
npm install

# 5. Run the app
npm run dev

# 6. Deploy (later)
vercel
```

## What You'll Get

Once configured, you'll have:

- ✅ Beautiful dashboard with notebook-style input
- ✅ AI-powered task parsing ("Call mom tomorrow" → auto-scheduled)
- ✅ Smart backlog tracking
- ✅ Goal setting and progress tracking
- ✅ Weekly analytics by category
- ✅ Google Calendar sync
- ✅ Fully deployed web app (with Vercel)

## Need Help?

1. **Can't find Firebase config?** → See SETUP-GUIDE.md Step 1
2. **Don't know what API keys to create?** → See SETUP-GUIDE.md Step 4
3. **App shows error?** → Run `./check-setup.sh` to see what's missing
4. **Want to see UI first?** → Just run `npm run dev` (it will tell you what's needed)

## Quick Win Path

1. Open **SETUP-GUIDE.md**
2. Follow Step 1 (get Firebase config) - 5 minutes
3. Update `.env` with those values
4. Run `npm install && npm run dev`
5. Create account and add your first task!

You can add Google API keys later for AI features.

---

**Ready?** Open `SETUP-GUIDE.md` and let's get started! 🎉
