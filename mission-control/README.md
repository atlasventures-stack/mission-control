# Mission Control

Your personal productivity and task management system with AI-powered features.

## Features

- **AI-Powered Task Creation**: Write notes naturally, AI extracts and schedules tasks automatically
- **Google Calendar Integration**: Sync calendar events as tasks
- **Smart Dashboard**: Notebook-style interface with backlog tracking
- **Goal Tracking**: Set goals and get AI analysis on your progress
- **Weekly Progress**: Visualize completion rates by category

## Quick Start

### Prerequisites

- Node.js 18+ installed
- A Google account (for Firebase)
- 15 minutes to set up

### Setup Instructions

1. **Install Dependencies**
   ```bash
   cd mission-control
   npm install
   ```

2. **Configure Firebase & Google APIs**

   Follow the detailed guide in `QUICKSTART.md` to:
   - Create a Firebase project
   - Enable authentication and Firestore
   - Get your Google API keys
   - Create a `.env` file with your credentials

3. **Run Locally**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173)

4. **Deploy to Production**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

   See `QUICKSTART.md` for complete deployment instructions.

## Usage

### Adding Tasks

1. **Quick Add**: Type your task in the notebook area on the Dashboard
   - AI will parse the task, category, and date automatically
   - Example: "Call mom tomorrow at 3pm"
   - Press "Add to Tasks" or Cmd+Enter

2. **Manual Task Management**: Go to the Tasks page to edit or delete tasks

### Setting Goals

1. Go to Settings
2. Click "Add New Goal"
3. Enter your goal title and description
4. The dashboard will show your active goals

### Calendar Sync

1. Go to Settings
2. Click "Sync with Google Calendar"
3. Authorize the app
4. Your calendar events will appear as tasks with a 📅 icon

### Weekly Review

- Go to the Weekly page to see:
  - Progress by category for this week and last week
  - Total tasks, completed tasks, and overall percentage
  - AI analyses of your progress (if enabled)

## File Structure

```
mission-control/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth)
│   ├── pages/           # Page components (Dashboard, Tasks, etc.)
│   ├── services/        # API and AI services
│   ├── types.ts         # TypeScript type definitions
│   ├── constants.ts     # Task categories
│   ├── firebase.ts      # Firebase configuration
│   ├── App.tsx          # Main app component
│   ├── index.tsx        # Entry point
│   └── index.css        # Tailwind CSS
├── .env                 # Environment variables (create this)
├── package.json         # Dependencies
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── QUICKSTART.md        # Detailed setup guide
└── README.md           # This file
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google APIs
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your_google_api_key
```

See `QUICKSTART.md` for how to get these values.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI**: Google Gemini API
- **Hosting**: Vercel (recommended)

## Features in Detail

### AI Task Parsing

The AI automatically:
- Extracts multiple tasks from a single note
- Identifies the correct category (Development, Admin, Health, etc.)
- Parses natural language dates ("tomorrow", "next Monday", "in 3 days")
- Falls back gracefully if AI is unavailable

### Smart Backlog

- Tasks from previous days automatically move to "Backlog"
- Backlog tasks stay visible until completed or rescheduled
- Red highlighting makes overdue tasks obvious

### Dynamic Execution Checklist

- Categories on the dashboard update based on today's tasks
- Only shows categories that have tasks scheduled for today
- Weekly view shows all categories for complete overview

### Goal-Oriented Workflow

- Set multiple goals and cycle through them on the dashboard
- Weekly AI analysis compares your completed tasks to your goals
- Actionable feedback helps you stay aligned

## Troubleshooting

### "Firebase is not configured"

- Make sure you created a `.env` file with your Firebase credentials
- Verify all `VITE_FIREBASE_*` variables are set correctly
- Restart the dev server after adding the `.env` file

### "AI features not working"

- Add `VITE_GOOGLE_API_KEY` to your `.env` file
- Enable the "Generative Language API" in Google Cloud Console
- The app will work without AI, but tasks won't be auto-parsed

### "Google Calendar sync not working"

- Add `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY` to `.env`
- Enable "Google Calendar API" in Google Cloud Console
- Add your app URL to authorized origins in OAuth settings

## Privacy & Security

- All data is stored in **your** personal Firebase project
- You own and control all your data
- No third-party servers involved (except Google's services)
- Environment variables keep your API keys secure

## Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Recurring tasks
- [ ] Task templates
- [ ] Time tracking
- [ ] Collaboration features
- [ ] Export to CSV/PDF

## Support

For issues or questions:
1. Check `QUICKSTART.md` for setup help
2. Verify your `.env` file is configured correctly
3. Check the browser console for error messages

## License

MIT License - feel free to use and modify as needed

---

Built for Avish with ❤️ by Claude
