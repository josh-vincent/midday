"use client";

import { useState } from "react";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { EventCard } from "./event-card";
import { type MockEvent } from "@/lib/mock/calendar-mock";

interface WeekViewProps {
  events: MockEvent[];
  currentDate: Date;
  onEventClick: (event: MockEvent) => void;
  onEventCreate: (startDate: Date, endDate?: Date, allDay?: boolean) => void;
  onEventEdit: (event: MockEvent) => void;
  onEventDelete: (event: MockEvent) => void;
  loading: boolean;
}

export function WeekView({
  events,
  currentDate,
  onEventClick,
  onEventCreate,
  onEventEdit,
  onEventDelete,
  loading
}: WeekViewProps) {
  const [draggedEvent, setDraggedEvent] = useState<MockEvent | null>(null);
  const [resizingEvent, setResizingEvent] = useState<MockEvent | null>(null);

  // Get the start of the week (Sunday)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
  // Generate the 7 days of the week
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + index);
    return day;
  });

  // Generate time slots (24 hours)
  const timeSlots = Array.from({ length: 24 }, (_, index) => {
    const hour = index;
    return {
      hour,
      time: hour === 0 ? "12 AM" : 
            hour < 12 ? `${hour} AM` : 
            hour === 12 ? "12 PM" : 
            `${hour - 12} PM`
    };
  });

  // Group events by date and calculate positions
  const eventsByDate = events.reduce((acc, event) => {
    const eventDate = new Date(event.startDate);
    const dateKey = eventDate.toDateString();
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    
    // Calculate position and height for time-based events
    const startTime = new Date(event.startDate);
    const endTime = new Date(event.endDate);
    
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    const duration = endHour - startHour;
    
    acc[dateKey].push({
      ...event,
      startHour,
      endHour,
      duration,
      top: startHour * 60, // 60px per hour
      height: Math.max(duration * 60, 30) // Minimum 30px height
    });
    
    return acc;
  }, {} as Record<string, Array<MockEvent & { startHour: number; endHour: number; duration: number; top: number; height: number }>>);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    return hours * 60; // 60px per hour
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const startDate = new Date(date);
    startDate.setHours(hour, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(hour + 1, 0, 0, 0);
    
    onEventCreate(startDate, endDate, false);
  };

  const handleAllDayClick = (date: Date) => {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    onEventCreate(startDate, endDate, true);
  };

  const handleDragStart = (event: MockEvent & { startHour: number; endHour: number }, e: React.DragEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (date: Date, hour: number, e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedEvent) {
      const newStartDate = new Date(date);
      newStartDate.setHours(hour, 0, 0, 0);
      
      const originalDuration = new Date(draggedEvent.endDate).getTime() - new Date(draggedEvent.startDate).getTime();
      const newEndDate = new Date(newStartDate.getTime() + originalDuration);
      
      onEventEdit({
        ...draggedEvent,
        startDate: newStartDate.toISOString(),
        endDate: newEndDate.toISOString()
      });
      
      setDraggedEvent(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full">
        {/* Time column */}
        <div className="w-20 border-r">
          <div className="h-16 border-b"></div> {/* All day row */}
          {timeSlots.map(slot => (
            <div key={slot.hour} className="h-15 border-b p-2">
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
        
        {/* Day columns */}
        <div className="flex-1">
          <div className="grid grid-cols-7 border-b">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="h-16 border-r p-2">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 relative">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="border-r">
                {timeSlots.map(slot => (
                  <div key={slot.hour} className="h-15 border-b relative">
                    {Math.random() > 0.8 && (
                      <Skeleton className="absolute inset-x-1 top-1 h-12" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentTimePosition = getCurrentTimePosition();
  const today = new Date();
  const showCurrentTimeLine = weekDays.some(day => isToday(day));

  return (
    <div className="flex h-full overflow-hidden">
      {/* Time column */}
      <div className="w-20 border-r bg-muted/20 flex-shrink-0">
        {/* All day header */}
        <div className="h-16 border-b flex items-center justify-center text-xs font-medium text-muted-foreground">
          All Day
        </div>
        
        {/* Time slots */}
        {timeSlots.map(slot => (
          <div key={slot.hour} className="h-15 border-b px-2 py-1 text-xs text-muted-foreground">
            {slot.time}
          </div>
        ))}
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-auto">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/20 sticky top-0 z-10">
          {weekDays.map((day, index) => {
            const dayEvents = eventsByDate[day.toDateString()] || [];
            const allDayEvents = dayEvents.filter(event => event.allDay);
            const isTodayDay = isToday(day);
            
            return (
              <div 
                key={index} 
                className={cn(
                  "h-16 border-r p-2 cursor-pointer hover:bg-muted/30",
                  isTodayDay && "bg-blue-50"
                )}
                onClick={() => handleAllDayClick(day)}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className={cn(
                  "text-lg font-semibold",
                  isTodayDay && "text-blue-600"
                )}>
                  {day.getDate()}
                </div>
                
                {/* All day events */}
                <div className="space-y-1 mt-1">
                  {allDayEvents.slice(0, 1).map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className="cursor-pointer"
                    >
                      <EventCard event={event} variant="compact" showTime={false} />
                    </div>
                  ))}
                  {allDayEvents.length > 1 && (
                    <div className="text-xs text-muted-foreground">
                      +{allDayEvents.length - 1} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="relative">
          <div className="grid grid-cols-7">
            {weekDays.map((day, dayIndex) => {
              const dayEvents = eventsByDate[day.toDateString()] || [];
              const timedEvents = dayEvents.filter(event => !event.allDay);
              
              return (
                <div key={dayIndex} className="border-r relative">
                  {/* Time slots */}
                  {timeSlots.map(slot => (
                    <div
                      key={slot.hour}
                      className="h-15 border-b cursor-pointer hover:bg-muted/20 relative"
                      onClick={() => handleTimeSlotClick(day, slot.hour)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(day, slot.hour, e)}
                    >
                      {/* Hour line */}
                      <div className="absolute top-0 left-0 right-0 border-t border-muted" />
                    </div>
                  ))}
                  
                  {/* Timed events */}
                  {timedEvents.map((event, eventIndex) => (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={(e) => handleDragStart(event, e)}
                      className="absolute left-1 right-1 z-20 cursor-pointer"
                      style={{
                        top: `${event.top}px`,
                        height: `${event.height}px`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <EventCard
                        event={event}
                        variant="compact"
                        className="h-full"
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Current time line */}
          {showCurrentTimeLine && (
            <div
              className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="w-3 h-3 bg-red-500 rounded-full -mt-1.5 -ml-1.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}