"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Badge } from "@midday/ui/badge";
import { Skeleton } from "@midday/ui/skeleton";
import { EventCard } from "./event-card";
import { type MockEvent } from "@/lib/mock/calendar-mock";

interface MonthViewProps {
  events: MockEvent[];
  currentDate: Date;
  onEventClick: (event: MockEvent) => void;
  onEventCreate: (startDate: Date, endDate?: Date, allDay?: boolean) => void;
  onEventEdit: (event: MockEvent) => void;
  onEventDelete: (event: MockEvent) => void;
  loading: boolean;
}

export function MonthView({
  events,
  currentDate,
  onEventClick,
  onEventCreate,
  onEventEdit,
  onEventDelete,
  loading
}: MonthViewProps) {
  const [draggedEvent, setDraggedEvent] = useState<MockEvent | null>(null);
  const [dragOver, setDragOver] = useState<Date | null>(null);

  // Get the first day of the month and adjust to start from Sunday
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startOfWeek = new Date(firstDayOfMonth);
  startOfWeek.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
  
  const endOfWeek = new Date(lastDayOfMonth);
  endOfWeek.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));

  // Generate all days in the calendar view
  const calendarDays = [];
  const currentDay = new Date(startOfWeek);
  
  while (currentDay <= endOfWeek) {
    calendarDays.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = new Date(event.startDate).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, MockEvent[]>);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getDayEvents = (date: Date) => {
    return eventsByDate[date.toDateString()] || [];
  };

  const handleDayClick = (date: Date) => {
    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0); // Default to 9 AM
    const endDate = new Date(startDate);
    endDate.setHours(10, 0, 0, 0); // 1 hour duration
    
    onEventCreate(startDate, endDate, false);
  };

  const handleDragStart = (event: MockEvent, e: React.DragEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (date: Date, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(date);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (date: Date, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    
    if (draggedEvent) {
      // Calculate the difference in days
      const originalDate = new Date(draggedEvent.startDate);
      const daysDiff = Math.floor((date.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff !== 0) {
        const newStartDate = new Date(draggedEvent.startDate);
        newStartDate.setDate(newStartDate.getDate() + daysDiff);
        
        const newEndDate = new Date(draggedEvent.endDate);
        newEndDate.setDate(newEndDate.getDate() + daysDiff);
        
        onEventEdit({
          ...draggedEvent,
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString()
        });
      }
      
      setDraggedEvent(null);
    }
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }, (_, i) => (
            <div key={i} className="min-h-[120px] border rounded-lg p-2">
              <Skeleton className="h-4 w-6 mb-2" />
              <div className="space-y-1">
                {Math.random() > 0.5 && <Skeleton className="h-6 w-full" />}
                {Math.random() > 0.7 && <Skeleton className="h-6 w-full" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          const dayEvents = getDayEvents(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDay = isToday(date);
          const isDraggedOver = dragOver?.toDateString() === date.toDateString();
          
          return (
            <div
              key={index}
              className={cn(
                "min-h-[120px] border rounded-lg p-2 cursor-pointer transition-colors",
                "hover:bg-muted/50",
                !isCurrentMonthDay && "bg-muted/20 text-muted-foreground",
                isTodayDay && "bg-blue-50 border-blue-200",
                isDraggedOver && "bg-blue-100 border-blue-300"
              )}
              onClick={() => handleDayClick(date)}
              onDragOver={(e) => handleDragOver(date, e)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(date, e)}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium",
                  isTodayDay && "text-blue-600 font-bold"
                )}>
                  {date.getDate()}
                </span>
                {dayEvents.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    +{dayEvents.length - 3}
                  </Badge>
                )}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => handleDragStart(event, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className="cursor-pointer"
                  >
                    <EventCard
                      event={event}
                      variant="compact"
                      showTime={!event.allDay}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Meeting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Task</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Reminder</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Deadline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span>Milestone</span>
        </div>
      </div>
    </div>
  );
}