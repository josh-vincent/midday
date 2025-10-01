"use client";

import { cn } from "@midday/ui/cn";
import { Button } from "@midday/ui/button";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Badge } from "@midday/ui/badge";
import {
  format,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth
} from "date-fns";
import type { CalendarEvent } from "./calendar-utils";
import { getEventsForDate, formatEventTime } from "./calendar-utils";

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  view: 'week' | 'month';
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventCreate?: (date: Date) => void;
  className?: string;
  showWeekNumbers?: boolean;
  firstDayOfWeek?: 0 | 1; // 0 = Sunday, 1 = Monday
}

export function CalendarGrid({
  currentDate,
  events,
  view,
  onEventClick,
  onDateClick,
  onEventCreate,
  className,
  showWeekNumbers = false,
  firstDayOfWeek = 0
}: CalendarGridProps) {
  const getDaysToDisplay = () => {
    if (view === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: firstDayOfWeek }),
        end: endOfWeek(currentDate, { weekStartsOn: firstDayOfWeek })
      });
    }

    // Month view - include padding days
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: firstDayOfWeek });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: firstDayOfWeek });
    
    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });
  };

  const days = getDaysToDisplay();
  const weekDayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  if (firstDayOfWeek === 1) {
    // Rotate array to start with Monday
    weekDayNames.push(weekDayNames.shift()!);
  }

  // Group days into weeks for month view
  const weeks: Date[][] = [];
  if (view === 'month') {
    let currentWeek: Date[] = [];
    days.forEach((day, index) => {
      currentWeek.push(day);
      if ((index + 1) % 7 === 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
  } else {
    weeks.push(days);
  }

  const renderEvent = (event: CalendarEvent, isCompact: boolean = false) => {
    if (isCompact) {
      return (
        <div
          key={event.id}
          className="text-xs p-0.5 bg-primary/10 dark:bg-primary/20 rounded truncate cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onEventClick?.(event);
          }}
          title={`${event.title} - ${formatEventTime(event)}`}
        >
          {event.title}
        </div>
      );
    }

    return (
      <div
        key={event.id}
        className={cn(
          "p-1 rounded text-xs cursor-pointer transition-colors",
          "hover:opacity-90",
          event.color || "bg-primary/10 dark:bg-primary/20"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick?.(event);
        }}
      >
        <div className="font-medium truncate">{event.title}</div>
        {!event.allDay && (
          <div className="text-xs opacity-75">
            {format(new Date(event.startDate), 'h:mm a')}
          </div>
        )}
      </div>
    );
  };

  const renderDay = (day: Date, isInCurrentMonth: boolean = true) => {
    const dayEvents = getEventsForDate(events, day);
    const hasEvents = dayEvents.length > 0;
    const isCurrentDay = isToday(day);
    const isSelected = isSameDay(day, currentDate);
    
    return (
      <div
        className={cn(
          "border border-border p-2 min-h-[100px] transition-colors",
          "hover:bg-muted/50 cursor-pointer",
          !isInCurrentMonth && "opacity-40 bg-muted/20",
          isCurrentDay && "bg-primary/5 dark:bg-primary/10",
          isSelected && "ring-2 ring-primary",
          className
        )}
        onClick={() => {
          onDateClick?.(day);
          if (!hasEvents) {
            onEventCreate?.(day);
          }
        }}
      >
        <div className="flex items-start justify-between mb-1">
          <span 
            className={cn(
              "text-sm",
              isCurrentDay && "font-bold text-primary"
            )}
          >
            {format(day, 'd')}
          </span>
          {hasEvents && (
            <Badge variant="secondary" className="text-xs h-5 px-1">
              {dayEvents.length}
            </Badge>
          )}
        </div>
        
        {view === 'month' ? (
          <ScrollArea className="h-[60px]">
            <div className="space-y-0.5">
              {dayEvents.slice(0, 3).map(event => renderEvent(event, true))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-muted-foreground pl-1">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-1">
            {dayEvents.map(event => renderEvent(event))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {weekDayNames.map((day, index) => (
          <div 
            key={`weekday-${index}`}
            className="bg-muted p-2 text-center text-sm font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-px">
        {weeks.map((week, weekIndex) => (
          <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-px">
            {week.map((day, dayIndex) => {
              const isInCurrentMonth = view === 'week' || 
                day.getMonth() === currentDate.getMonth();
              return (
                <div key={`${weekIndex}-${dayIndex}`}>
                  {renderDay(day, isInCurrentMonth)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}