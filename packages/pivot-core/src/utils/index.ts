import { format } from 'date-fns';

/**
 * Pivot-specific utility functions
 */

export function formatPivotDate(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

export function generatePivotId(prefix = 'pivot'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Add more Pivot-specific utilities here
