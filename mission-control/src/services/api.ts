import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { Task, DailyEntry, WeeklyEntry, Goal, WeeklyAnalysis } from '../types';

const checkConfig = () => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Please add your Firebase credentials to the .env file. See QUICKSTART.md for instructions.');
  }
};

// Tasks
export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
  checkConfig();
  const tasksRef = collection(db, 'users', task.userId, 'tasks');
  const newTaskRef = doc(tasksRef);
  const newTask: Task = {
    ...task,
    id: newTaskRef.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(newTaskRef, newTask);
  return newTask;
};

export const getTasks = async (userId: string, date?: string): Promise<Task[]> => {
  checkConfig();
  const tasksRef = collection(db, 'users', userId, 'tasks');
  let q = query(tasksRef);

  if (date) {
    q = query(tasksRef, where('date', '==', date));
  }

  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map(doc => doc.data() as Task);

  // Sort in memory: by date (asc), then by createdAt (desc - newest first)
  return tasks.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date); // Sort by date ascending
    }
    return b.createdAt.localeCompare(a.createdAt); // Then by createdAt descending (newest first)
  });
};

export const updateTask = async (userId: string, taskId: string, updates: Partial<Task>): Promise<void> => {
  checkConfig();
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  await updateDoc(taskRef, updates);
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  checkConfig();
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  await deleteDoc(taskRef);
};

// Daily Entries
export const saveDailyEntry = async (entry: Omit<DailyEntry, 'id'>): Promise<DailyEntry> => {
  checkConfig();
  const dailyRef = doc(db, 'users', entry.userId, 'daily', entry.date);
  const newEntry: DailyEntry = {
    ...entry,
    id: entry.date,
  };
  await setDoc(dailyRef, newEntry);
  return newEntry;
};

export const getDailyEntry = async (userId: string, date: string): Promise<DailyEntry | null> => {
  checkConfig();
  const dailyRef = doc(db, 'users', userId, 'daily', date);
  const snapshot = await getDoc(dailyRef);
  return snapshot.exists() ? snapshot.data() as DailyEntry : null;
};

export const getDailyEntries = async (userId: string, startDate?: string, endDate?: string): Promise<DailyEntry[]> => {
  checkConfig();
  const dailyRef = collection(db, 'users', userId, 'daily');
  let q = query(dailyRef, orderBy('date', 'desc'));

  if (startDate && endDate) {
    q = query(dailyRef, where('date', '>=', startDate), where('date', '<=', endDate), orderBy('date', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as DailyEntry);
};

// Weekly Entries
export const saveWeeklyEntry = async (entry: Omit<WeeklyEntry, 'id'>): Promise<WeeklyEntry> => {
  checkConfig();
  const weeklyRef = doc(db, 'users', entry.userId, 'weekly', entry.weekStart);
  const newEntry: WeeklyEntry = {
    ...entry,
    id: entry.weekStart,
  };
  await setDoc(weeklyRef, newEntry);
  return newEntry;
};

export const getWeeklyEntry = async (userId: string, weekStart: string): Promise<WeeklyEntry | null> => {
  checkConfig();
  const weeklyRef = doc(db, 'users', userId, 'weekly', weekStart);
  const snapshot = await getDoc(weeklyRef);
  return snapshot.exists() ? snapshot.data() as WeeklyEntry : null;
};

export const getWeeklyEntries = async (userId: string): Promise<WeeklyEntry[]> => {
  checkConfig();
  const weeklyRef = collection(db, 'users', userId, 'weekly');
  const q = query(weeklyRef, orderBy('weekStart', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as WeeklyEntry);
};

// Goals
export const createGoal = async (goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> => {
  checkConfig();
  const goalsRef = collection(db, 'users', goal.userId, 'goals');
  const newGoalRef = doc(goalsRef);
  const newGoal: Goal = {
    ...goal,
    id: newGoalRef.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(newGoalRef, newGoal);
  return newGoal;
};

export const getGoals = async (userId: string): Promise<Goal[]> => {
  checkConfig();
  const goalsRef = collection(db, 'users', userId, 'goals');
  const q = query(goalsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Goal);
};

export const updateGoal = async (userId: string, goalId: string, updates: Partial<Goal>): Promise<void> => {
  checkConfig();
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  await updateDoc(goalRef, updates);
};

export const deleteGoal = async (userId: string, goalId: string): Promise<void> => {
  checkConfig();
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  await deleteDoc(goalRef);
};

// Weekly Analysis
export const saveWeeklyAnalysis = async (analysis: Omit<WeeklyAnalysis, 'id' | 'createdAt'>): Promise<WeeklyAnalysis> => {
  checkConfig();
  const analysisRef = collection(db, 'users', analysis.userId, 'weeklyAnalysis');
  const newAnalysisRef = doc(analysisRef);
  const newAnalysis: WeeklyAnalysis = {
    ...analysis,
    id: newAnalysisRef.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(newAnalysisRef, newAnalysis);
  return newAnalysis;
};

export const getWeeklyAnalyses = async (userId: string): Promise<WeeklyAnalysis[]> => {
  checkConfig();
  const analysisRef = collection(db, 'users', userId, 'weeklyAnalysis');
  const q = query(analysisRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as WeeklyAnalysis);
};

// Clear all user data
export const clearAllUserData = async (userId: string): Promise<void> => {
  checkConfig();
  console.log('🗑️ Clearing all data for user:', userId);

  // Delete all tasks
  const tasksRef = collection(db, 'users', userId, 'tasks');
  const tasksSnapshot = await getDocs(tasksRef);
  const taskDeletes = tasksSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(taskDeletes);
  console.log(`✅ Deleted ${tasksSnapshot.size} tasks`);

  // Delete all goals
  const goalsRef = collection(db, 'users', userId, 'goals');
  const goalsSnapshot = await getDocs(goalsRef);
  const goalDeletes = goalsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(goalDeletes);
  console.log(`✅ Deleted ${goalsSnapshot.size} goals`);

  // Delete all daily entries
  const dailyRef = collection(db, 'users', userId, 'daily');
  const dailySnapshot = await getDocs(dailyRef);
  const dailyDeletes = dailySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(dailyDeletes);
  console.log(`✅ Deleted ${dailySnapshot.size} daily entries`);

  // Delete all weekly entries
  const weeklyRef = collection(db, 'users', userId, 'weekly');
  const weeklySnapshot = await getDocs(weeklyRef);
  const weeklyDeletes = weeklySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(weeklyDeletes);
  console.log(`✅ Deleted ${weeklySnapshot.size} weekly entries`);

  // Delete all weekly analyses
  const analysisRef = collection(db, 'users', userId, 'weeklyAnalysis');
  const analysisSnapshot = await getDocs(analysisRef);
  const analysisDeletes = analysisSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(analysisDeletes);
  console.log(`✅ Deleted ${analysisSnapshot.size} weekly analyses`);

  // Clear localStorage data
  localStorage.removeItem('syncedCalendarEvents');
  console.log('✅ Cleared synced calendar events from localStorage');

  console.log('🎉 All user data cleared successfully!');
};
