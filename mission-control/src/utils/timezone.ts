// Indian Standard Time (IST) utilities

/**
 * Get current date in IST timezone
 * @returns Date string in YYYY-MM-DD format (IST)
 */
export const getTodayIST = (): string => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Get current datetime in IST timezone
 * @returns ISO datetime string in IST
 */
export const getNowIST = (): string => {
  const now = new Date();
  return now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
};

/**
 * Convert date to IST
 * @param date Date object or ISO string
 * @returns Date string in YYYY-MM-DD format (IST)
 */
export const toISTDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const istTime = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Check if a date is today in IST
 * @param date Date string in YYYY-MM-DD format
 * @returns true if date is today in IST
 */
export const isToday = (date: string): boolean => {
  return date === getTodayIST();
};

/**
 * Check if a datetime has passed in IST
 * @param datetime ISO datetime string
 * @returns true if datetime has passed
 */
export const hasPassed = (datetime: string): boolean => {
  const target = new Date(datetime);
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return target < now;
};
