export interface User {
  id: string;
  email: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  category: string; // Keep for backward compatibility
  tags?: string[]; // Multiple AI-generated tags
  date: string; // ISO date string
  completed: boolean;
  isFromCalendar?: boolean;
  calendarEventId?: string;
  eventEndTime?: string; // ISO datetime string for auto-completing calendar events
  createdAt: string;
}

export interface DailyEntry {
  id: string;
  userId: string;
  date: string;
  completedCategories: string[];
  progressPercent: number;
}

export interface WeeklyEntry {
  id: string;
  userId: string;
  weekStart: string;
  categoryProgress: { [category: string]: { target: number; achieved: number; percent: number } };
  overallProgress: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: string;
  isActive: boolean;
}

export interface WeeklyAnalysis {
  id: string;
  userId: string;
  weekStart: string;
  goalId: string;
  goalTitle: string;
  analysis: string;
  tasksReviewed: number;
  createdAt: string;
}
