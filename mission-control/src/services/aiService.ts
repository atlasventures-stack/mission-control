import { CATEGORIES } from '../constants';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export const isAIConfigured = !!GOOGLE_API_KEY && GOOGLE_API_KEY !== 'not-configured';

if (!isAIConfigured) {
  console.warn(`
⚠️  Google AI is not configured. AI features will not work.
Please add VITE_GOOGLE_API_KEY to your .env file.
See QUICKSTART.md for instructions.
  `);
}

const checkConfig = () => {
  if (!isAIConfigured) {
    throw new Error('Google AI is not configured. Please add your Google API Key to the .env file. See QUICKSTART.md for instructions.');
  }
};

interface ParsedTask {
  title: string;
  category: string;
  tags: string[];
  date: string; // ISO date string
}

export const parseNoteIntoTasks = async (note: string): Promise<ParsedTask[]> => {
  checkConfig();

  const today = new Date().toISOString().split('T')[0];

  // Get AI-generated categories from localStorage
  const aiCategoriesJson = localStorage.getItem('aiGeneratedCategories');
  const customCategoriesJson = localStorage.getItem('customCategories');

  const aiCategories = aiCategoriesJson ? JSON.parse(aiCategoriesJson) : [];
  const customCategories = customCategoriesJson ? JSON.parse(customCategoriesJson) : [];
  const availableCategories = [...new Set([...aiCategories, ...customCategories, ...CATEGORIES])];

  const prompt = `You are an AI task parsing assistant. Analyze the task and intelligently assign the most relevant category.

Available categories: ${availableCategories.join(', ')}

Task Extraction Rules:
1. Analyze the task content deeply to understand what it's about
2. Assign the MOST RELEVANT category from the available categories above
3. For work tasks, prefer specific work categories (Product, Engineering, Sales, etc.) over generic ones (Work, Other)
4. For company-specific tasks (like "Repurpose"), use the company name as category if available
5. Examples:
   - "Build potpot app" → "Product" or "Development" or "Engineering"
   - "Call gardeners" → "Personal" or "Home"
   - "Draft investor email" → "Fundraising" or "Business"
   - "Complete repurpose list" → "Repurpose" (if available) or "Work"
6. Date: If not mentioned, use today (${today}). Parse "tomorrow", "next week", etc. to ISO format
7. Return ONLY valid JSON array, no markdown

Note: "${note}"

Return format:
[{"title": "Task title", "category": "MostRelevantCategory", "date": "YYYY-MM-DD"}]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    // Extract JSON from response (it might have markdown formatting)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const tasks = JSON.parse(jsonMatch[0]);

    // Get available categories again for validation
    const aiCategoriesJson = localStorage.getItem('aiGeneratedCategories');
    const customCategoriesJson = localStorage.getItem('customCategories');
    const aiCategories = aiCategoriesJson ? JSON.parse(aiCategoriesJson) : [];
    const customCategories = customCategoriesJson ? JSON.parse(customCategoriesJson) : [];
    const validCategories = [...new Set([...aiCategories, ...customCategories, ...CATEGORIES])];

    // Validate and sanitize
    return tasks.map((task: any) => ({
      title: task.title || note,
      category: validCategories.includes(task.category) ? task.category : (aiCategories[0] || 'Other'),
      tags: task.tags || [],
      date: task.date || today,
    }));
  } catch (error) {
    console.error('AI parsing error:', error);

    // Try to intelligently guess category from the note text
    const aiCategoriesJson = localStorage.getItem('aiGeneratedCategories');
    const aiCategories = aiCategoriesJson ? JSON.parse(aiCategoriesJson) : [];

    // Simple keyword matching as fallback
    const noteLower = note.toLowerCase();
    let guessedCategory = 'Other';

    if (aiCategories.length > 0) {
      // Try to match keywords in the note with category names
      for (const category of aiCategories) {
        if (noteLower.includes(category.toLowerCase())) {
          guessedCategory = category;
          break;
        }
      }
      // If no match, use the first AI category as it's likely more relevant than "Other"
      if (guessedCategory === 'Other') {
        guessedCategory = aiCategories[0];
      }
    }

    // Fallback: create a simple task with best-guess category
    return [{
      title: note,
      category: guessedCategory,
      tags: [],
      date: today,
    }];
  }
};

export const analyzeWeeklyProgress = async (
  goalTitle: string,
  goalDescription: string,
  completedTasks: string[]
): Promise<string> => {
  checkConfig();

  const prompt = `You are a productivity coach analyzing weekly progress.

Goal: ${goalTitle}
Description: ${goalDescription}

Tasks completed this week:
${completedTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Provide a brief analysis (2-3 sentences) on:
1. Are these tasks aligned with the goal?
2. What's going well?
3. What should be the focus for next week?

Keep it motivating and actionable.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('AI analysis error:', error);
    return 'Unable to generate analysis at this time. Keep up the great work!';
  }
};

export const generateCategoriesFromData = async (
  calendarEvents: string[],
  taskTitles: string[],
  goals: { title: string; description: string }[]
): Promise<string[]> => {
  checkConfig();

  const prompt = `You are an intelligent categorization assistant. Analyze the user's work data and generate 5-10 relevant work categories.

CALENDAR EVENTS:
${calendarEvents.slice(0, 50).map((e, i) => `${i + 1}. ${e}`).join('\n')}

TASKS:
${taskTitles.slice(0, 50).map((t, i) => `${i + 1}. ${t}`).join('\n')}

GOALS:
${goals.map((g, i) => `${i + 1}. ${g.title} - ${g.description}`).join('\n')}

Based on this data, generate 5-10 work categories that represent the user's actual work areas.

Rules:
1. Categories should be broad enough to group multiple tasks but specific enough to be meaningful
2. Use professional, clear category names (1-2 words each)
3. Focus on work domains, not actions (e.g., "Product" not "Planning")
4. Include company/project names if they appear frequently (e.g., "Repurpose")
5. Return ONLY a JSON array of category names, nothing else

Example output format:
["Product", "Engineering", "Fundraising", "Repurpose", "Marketing", "Sales", "Operations"]

Return only the JSON array:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const categories = JSON.parse(jsonMatch[0]);
    return categories;
  } catch (error) {
    console.error('AI category generation error:', error);
    // Fallback to basic categories
    return ['Work', 'Personal', 'Meetings', 'Development', 'Other'];
  }
};
