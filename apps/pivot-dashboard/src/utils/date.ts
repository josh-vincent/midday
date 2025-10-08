/**
 * Get the current date in local timezone formatted as YYYY-MM-DD
 * This ensures dates are consistent with the user's local time,
 * not UTC which can cause day boundary issues
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert a date string or Date object to local date string
 */
export function toLocalDateString(date: string | Date): string {
  if (typeof date === 'string') {
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Otherwise parse and format
    return getLocalDateString(new Date(date));
  }
  return getLocalDateString(date);
}

/**
 * Get date range for common time periods
 */
export function getDateRange(period: 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth') {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'yesterday': {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 1);
      endDate = new Date(startDate);
      break;
    }

    case 'thisWeek': {
      // Get Monday of current week
      startDate = new Date(now);
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when Sunday
      startDate.setDate(diff);
      
      // Get Sunday of current week
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
    }

    case 'lastWeek': {
      // Get Monday of last week
      startDate = new Date(now);
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1) - 7; // previous week
      startDate.setDate(diff);
      
      // Get Sunday of last week
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
    }

    case 'thisMonth': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    }

    case 'lastMonth': {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    }
  }

  return {
    start: getLocalDateString(startDate),
    end: getLocalDateString(endDate),
  };
}