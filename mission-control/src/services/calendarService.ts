import { createTask, getTasks, updateTask } from './api';
// @ts-ignore - Used for type checking
import { Task } from '../types';
import { hasPassed } from '../utils/timezone';

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
  htmlLink?: string;
}

interface SyncResult {
  newTasks: number;
  skipped: number;
  errors: number;
}

// Get synced event IDs from localStorage (user-specific)
const getSyncedEventIds = (userId: string): Set<string> => {
  // Try user-specific key first
  let stored = localStorage.getItem(`syncedCalendarEvents_${userId}`);

  // MIGRATION: If user-specific key doesn't exist, check old global key
  if (!stored) {
    const oldStored = localStorage.getItem('syncedCalendarEvents');
    if (oldStored) {
      console.log('📦 Migrating synced events to user-specific storage');
      // Migrate to user-specific key
      localStorage.setItem(`syncedCalendarEvents_${userId}`, oldStored);
      // Don't remove old key yet (multiple users might need it)
      stored = oldStored;
    }
  }

  return stored ? new Set(JSON.parse(stored)) : new Set();
};

// Save synced event IDs to localStorage (user-specific)
const saveSyncedEventIds = (userId: string, eventIds: Set<string>) => {
  localStorage.setItem(`syncedCalendarEvents_${userId}`, JSON.stringify(Array.from(eventIds)));
};

// Check if we've already synced calendar for today
const hasSyncedToday = (userId: string): boolean => {
  const lastSyncDate = localStorage.getItem(`lastCalendarSync_${userId}`);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return lastSyncDate === today;
};

// Mark today as synced
const markTodayAsSynced = (userId: string) => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`lastCalendarSync_${userId}`, today);
};

// Fetch calendar events from Google Calendar API (TODAY ONLY in IST)
export const fetchCalendarEvents = async (accessToken: string): Promise<CalendarEvent[]> => {
  // Get IST current time
  const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  // Start of today IST (00:00:00)
  const today = new Date(istNow);
  today.setHours(0, 0, 0, 0);
  const timeMin = today.toISOString();

  // End of today IST (23:59:59)
  const endOfToday = new Date(istNow);
  endOfToday.setHours(23, 59, 59, 999);
  const timeMax = endOfToday.toISOString();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${encodeURIComponent(timeMin)}&` +
    `timeMax=${encodeURIComponent(timeMax)}&` +
    `singleEvents=true&` +
    `orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
};

// Sync TODAY'S calendar events to tasks (simple & clean)
export const syncCalendarToTasks = async (
  userId: string,
  accessToken: string
): Promise<SyncResult> => {
  const result: SyncResult = {
    newTasks: 0,
    skipped: 0,
    errors: 0,
  };

  const syncedEventIds = getSyncedEventIds(userId);
  const today = new Date().toISOString().split('T')[0];

  try {
    const events = await fetchCalendarEvents(accessToken);
    console.log(`📅 [${today}] Found ${events.length} events for TODAY`);

    for (const event of events) {
      // Skip if already synced
      if (syncedEventIds.has(event.id)) {
        result.skipped++;
        continue;
      }

      // Skip events without a title
      if (!event.summary) {
        result.skipped++;
        continue;
      }

      try {
        // Get event start and end times
        const eventDate = event.start.dateTime || event.start.date;
        const eventEndTime = event.end.dateTime || event.end.date;

        if (!eventDate || !eventEndTime) {
          result.skipped++;
          continue;
        }

        // Check if event has already ended (using IST)
        const isCompleted = hasPassed(eventEndTime);

        // Create task for TODAY's event
        await createTask({
          userId,
          title: `📅 ${event.summary}`,
          category: 'Work',
          date: today, // Always today
          completed: isCompleted,
          isFromCalendar: true,
          calendarEventId: event.id,
          eventEndTime: eventEndTime,
        });

        // Mark as synced
        syncedEventIds.add(event.id);
        result.newTasks++;

        console.log(`✅ Created task: ${event.summary}${isCompleted ? ' [Completed]' : ''}`);
      } catch (error) {
        console.error(`❌ Failed to create task for event: ${event.summary}`, error);
        result.errors++;
      }
    }

    // Save synced event IDs
    saveSyncedEventIds(userId, syncedEventIds);

    // Mark today as synced
    markTodayAsSynced(userId);
    console.log(`✅ Today's calendar synced successfully`);
  } catch (error) {
    console.error(`❌ Failed to sync calendar:`, error);
    throw error;
  }

  return result;
};

// Smart auto-sync: Only sync if we haven't synced today yet
export const autoSyncTodaysCalendar = async (
  userId: string,
  connectedCalendars: Array<{ email: string; accessToken: string }>
): Promise<{ synced: boolean; total: number; errors: number }> => {
  // Check if we've already synced today
  if (hasSyncedToday(userId)) {
    console.log(`⏭️  Already synced today, skipping`);
    return { synced: false, total: 0, errors: 0 };
  }

  console.log(`🔄 Auto-syncing TODAY's calendar...`);
  const result = await syncAllCalendars(userId, connectedCalendars);
  return { synced: true, ...result };
};

// Sync all connected calendars (manual sync)
export const syncAllCalendars = async (
  userId: string,
  connectedCalendars: Array<{ email: string; accessToken: string }>
): Promise<{ total: number; errors: number }> => {
  let totalNewTasks = 0;
  let totalErrors = 0;

  for (const calendar of connectedCalendars) {
    try {
      const result = await syncCalendarToTasks(userId, calendar.accessToken);
      totalNewTasks += result.newTasks;
      totalErrors += result.errors;
    } catch (error) {
      console.error(`❌ Failed to sync calendar:`, error);
      totalErrors++;
    }
  }

  return {
    total: totalNewTasks,
    errors: totalErrors,
  };
};

// Auto-complete calendar tasks that have ended (using IST)
export const autoCompleteExpiredCalendarTasks = async (userId: string): Promise<number> => {
  try {
    const tasks = await getTasks(userId);
    let completedCount = 0;

    for (const task of tasks) {
      // Skip if not a calendar task or already completed
      if (!task.isFromCalendar || task.completed || !task.eventEndTime) {
        continue;
      }

      // Check if event has ended (using IST)
      if (hasPassed(task.eventEndTime)) {
        await updateTask(userId, task.id, { completed: true });
        completedCount++;
        console.log(`✅ Auto-completed calendar task: ${task.title}`);
      }
    }

    if (completedCount > 0) {
      console.log(`🎯 Auto-completed ${completedCount} expired calendar tasks`);
    }

    return completedCount;
  } catch (error) {
    console.error('❌ Failed to auto-complete calendar tasks:', error);
    return 0;
  }
};

// Clean up synced event IDs for events older than 7 days
export const cleanupOldSyncedEvents = (userId: string) => {
  try {
    const syncedEventIds = getSyncedEventIds(userId);
    // For now, we'll keep all synced events. In the future, we could add logic
    // to remove event IDs for events that are older than a certain date
    console.log(`📊 Currently tracking ${syncedEventIds.size} synced calendar events`);
  } catch (error) {
    console.error('Failed to cleanup old events:', error);
  }
};
