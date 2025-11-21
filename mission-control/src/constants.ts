export const CATEGORIES = [
  'Development',
  'Admin',
  'Health',
  'Learning',
  'Relationships',
  'Sales',
  'Operations',
  'Content',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];
