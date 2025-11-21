# Next Steps - Get Your App Running

You're almost there! Follow these simple steps to get Mission Control up and running.

## Step 1: Navigate to the Project

```bash
cd /Users/apple/mission-control
```

## Step 2: Install Dependencies

```bash
npm install
```

This will download all the necessary packages (React, Firebase, Tailwind, etc.).

## Step 3: Set Up Firebase

You need a Firebase project to store your data. This is **100% free** for your usage level.

### Option A: Quick Setup (Recommended)

Open `QUICKSTART.md` and follow the detailed step-by-step guide. It will walk you through:

1. Creating a Firebase project (5 min)
2. Getting your Google API keys (3 min)
3. Creating your `.env` file (2 min)

### Option B: Skip for Now (Limited Functionality)

If you want to see the UI first and set up Firebase later:

1. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Leave the placeholder values as-is

3. Run the app (see Step 4)

⚠️ **Note**: Without Firebase credentials, you'll see a configuration error message with instructions.

## Step 4: Run the Development Server

```bash
npm run dev
```

This will start the app at [http://localhost:5173](http://localhost:5173)

## Step 5: Create Your Account

1. Open [http://localhost:5173](http://localhost:5173) in your browser
2. Click "Create Account"
3. Enter any email and password (stored securely in Firebase)
4. Start adding tasks!

## Step 6: Deploy to the Web (Optional)

Once everything works locally, deploy to Vercel for free:

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts, then add your environment variables:

```bash
vercel env add VITE_FIREBASE_API_KEY
# ... repeat for all env vars
```

See `QUICKSTART.md` Section 5 for complete deployment instructions.

## What You Get

Once set up, you'll have:

✅ A beautiful dashboard with notebook-style task input
✅ AI-powered task parsing (if you added Google API key)
✅ Smart backlog tracking
✅ Goal setting and progress tracking
✅ Weekly progress visualizations
✅ Google Calendar sync (if configured)

## Need Help?

### "I don't see any files!"

Make sure you're in the right directory:
```bash
cd /Users/apple/mission-control
ls -la
```

You should see files like `package.json`, `README.md`, `QUICKSTART.md`, etc.

### "npm: command not found"

You need to install Node.js first:
1. Go to [nodejs.org](https://nodejs.org/)
2. Download and install the LTS version
3. Restart your terminal
4. Try again

### "I see a Firebase error"

This is expected if you haven't set up Firebase yet. Options:

1. **Quick fix**: Follow `QUICKSTART.md` to get your Firebase credentials (15 min total)
2. **Later**: The error message will show you exactly what's missing

### "How do I get Firebase credentials?"

Open `QUICKSTART.md` and jump to Step 1. It has screenshots and detailed instructions for getting your Firebase API keys.

## Project Structure

```
mission-control/
├── src/                  # Source code
│   ├── pages/           # Dashboard, Tasks, Weekly, Settings
│   ├── components/      # Reusable UI components
│   ├── services/        # API and AI logic
│   └── contexts/        # Authentication
├── .env                 # Your API keys (create this)
├── package.json         # Dependencies
├── QUICKSTART.md        # Detailed setup guide
├── README.md           # Full documentation
└── NEXT-STEPS.md       # This file
```

## Keyboard Shortcuts

- **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows): Add task from notebook

## Tips for First Use

1. **Start small**: Add 2-3 tasks for today to see how it works
2. **Try AI parsing**: Type "Call John tomorrow at 2pm" to see AI extract the date
3. **Set a goal**: Go to Settings > Add New Goal
4. **Check weekly view**: See your progress by category

## What's Next?

Once you're comfortable with the app:

1. Sync your Google Calendar (Settings page)
2. Set up weekly goals
3. Deploy to Vercel for access anywhere
4. Customize categories in `src/constants.ts` if needed

---

**Ready?** Run `npm install` and let's get started! 🚀
