import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  isWithinInterval,
  parseISO
} from 'date-fns';

export type CalendarView = 'day' | 'week' | 'month' | 'year' | 'list';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string | Date;
  endDate: string | Date;
  allDay?: boolean;
  color?: string;
  type?: string;
  status?: string;
  location?: string;
  attendees?: string[];
  recurrence?: string;
  metadata?: Record<string, any>;
}

/**
 * Get the date range for a specific calendar view
 */
export function getCalendarDateRange(date: Date, view: CalendarView): DateRange {
  switch (view) {
    case 'day':
      return {
        start: new Date(date.setHours(0, 0, 0, 0)),
        end: new Date(date.setHours(23, 59, 59, 999))
      };
    case 'week':
      return {
        start: startOfWeek(date),
        end: endOfWeek(date)
      };
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date)
      };
    case 'year':
      const yearStart = new Date(date.getFullYear(), 0, 1);
      const yearEnd = new Date(date.getFullYear(), 11, 31);
      return { start: yearStart, end: yearEnd };
    case 'list':
      // Default to next 3 months for list view
      return {
        start: new Date(),
        end: addMonths(new Date(), 3)
      };
    default:
      return {
        start: startOfWeek(date),
        end: endOfWeek(date)
      };
  }
}

/**
 * Navigate to the next period based on view
 */
export function navigateCalendar(date: Date, view: CalendarView, direction: 'prev' | 'next'): Date {
  const isNext = direction === 'next';
  
  switch (view) {
    case 'day':
      return isNext ? addDays(date, 1) : subDays(date, 1);
    case 'week':
      return isNext ? addWeeks(date, 1) : subWeeks(date, 1);
    case 'month':
      return isNext ? addMonths(date, 1) : subMonths(date, 1);
    case 'year':
      return isNext ? addMonths(date, 12) : subMonths(date, 12);
    default:
      return date;
  }
}

/**
 * Get all days in a month view (including padding days)
 */
export function getMonthViewDays(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const startWeek = startOfWeek(start);
  const endWeek = endOfWeek(end);
  
  return eachDayOfInterval({ start: startWeek, end: endWeek });
}

/**
 * Get week days for calendar header
 */
export function getWeekDayNames(short: boolean = false): string[] {
  const baseDate = new Date(2024, 0, 7); // A Sunday
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(baseDate, i);
    days.push(format(date, short ? 'EEEEE' : 'EEEE'));
  }
  
  return days;
}

/**
 * Check if an event occurs on a specific date
 */
export function eventOccursOnDate(event: CalendarEvent, date: Date): boolean {
  const eventStart = typeof event.startDate === 'string' 
    ? parseISO(event.startDate) 
    : event.startDate;
  const eventEnd = typeof event.endDate === 'string'
    ? parseISO(event.endDate)
    : event.endDate;
  
  if (event.allDay) {
    // For all-day events, check if date falls within the range
    return isWithinInterval(date, { start: eventStart, end: eventEnd }) ||
           isSameDay(date, eventStart) ||
           isSameDay(date, eventEnd);
  }
  
  // For timed events, check if they occur on the same day
  return isSameDay(eventStart, date) || 
         (eventEnd && isWithinInterval(date, { start: eventStart, end: eventEnd }));
}

/**
 * Get events for a specific date
 */
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter(event => eventOccursOnDate(event, date));
}

/**
 * Sort events by start time
 */
export function sortEventsByTime(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const dateA = typeof a.startDate === 'string' ? parseISO(a.startDate) : a.startDate;
    const dateB = typeof b.startDate === 'string' ? parseISO(b.startDate) : b.startDate;
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Group events by date
 */
export function groupEventsByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const grouped: Record<string, CalendarEvent[]> = {};
  
  events.forEach(event => {
    const date = typeof event.startDate === 'string' 
      ? parseISO(event.startDate) 
      : event.startDate;
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });
  
  // Sort events within each group
  Object.keys(grouped).forEach(key => {
    grouped[key] = sortEventsByTime(grouped[key]);
  });
  
  return grouped;
}

/**
 * Format event time range
 */
export function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return 'All day';
  
  const start = typeof event.startDate === 'string' 
    ? parseISO(event.startDate) 
    : event.startDate;
  const end = typeof event.endDate === 'string'
    ? parseISO(event.endDate)
    : event.endDate;
  
  const startTime = format(start, 'h:mm a');
  const endTime = end ? format(end, 'h:mm a') : '';
  
  return endTime && !isSameDay(start, end)
    ? `${startTime} - ${format(end, 'MMM d, h:mm a')}`
    : endTime
    ? `${startTime} - ${endTime}`
    : startTime;
}

/**
 * Get calendar view title
 */
export function getCalendarTitle(date: Date, view: CalendarView): string {
  switch (view) {
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy');
    case 'week':
      const weekStart = startOfWeek(date);
      const weekEnd = endOfWeek(date);
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`;
      }
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    case 'month':
      return format(date, 'MMMM yyyy');
    case 'year':
      return format(date, 'yyyy');
    default:
      return format(date, 'MMMM yyyy');
  }
}

/**
 * Check if a date is in the current period
 */
export function isInCurrentPeriod(date: Date, currentDate: Date, view: CalendarView): boolean {
  const range = getCalendarDateRange(currentDate, view);
  return isWithinInterval(date, range);
}

export const calendarColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
] as const;

export function getEventColor(index: number): string {
  return calendarColors[index % calendarColors.length];
}