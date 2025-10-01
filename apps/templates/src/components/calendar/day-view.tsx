"use client";

import { useState } from "react";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { EventCard } from "./event-card";
import { type MockEvent } from "@/lib/mock/calendar-mock";

interface DayViewProps {
  events: MockEvent[];
  currentDate: Date;
  onEventClick: (event: MockEvent) => void;
  onEventCreate: (startDate: Date, endDate?: Date, allDay?: boolean) => void;
  onEventEdit: (event: MockEvent) => void;
  onEventDelete: (event: MockEvent) => void;
  loading: boolean;
}

export function DayView({
  events,
  currentDate,
  onEventClick,
  onEventCreate,
  onEventEdit,
  onEventDelete,
  loading
}: DayViewProps) {
  const [draggedEvent, setDraggedEvent] = useState<MockEvent | null>(null);

  // Generate time slots (24 hours, with 30-minute intervals)
  const timeSlots = Array.from({ length: 48 }, (_, index) => {
    const totalMinutes = index * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return {
      hour,
      minutes,
      time: hour === 0 && minutes === 0 ? "12:00 AM" :
            hour < 12 ? `${hour || 12}:${minutes.toString().padStart(2, '0')} AM` :
            hour === 12 ? `12:${minutes.toString().padStart(2, '0')} PM` :
            `${hour - 12}:${minutes.toString().padStart(2, '0')} PM`,
      totalMinutes,
      isHour: minutes === 0
    };
  });

  // Filter events for the current day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startDate);
    return eventDate.toDateString() === currentDate.toDateString();
  });

  // Separate all-day and timed events
  const allDayEvents = dayEvents.filter(event => event.allDay);
  const timedEvents = dayEvents.filter(event => !event.allDay).map(event => {
    const startTime = new Date(event.startDate);
    const endTime = new Date(event.endDate);
    
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    const duration = endMinutes - startMinutes;
    
    return {
      ...event,
      startMinutes,
      endMinutes,
      duration,
      top: (startMinutes / 30) * 40, // 40px per 30-minute slot
      height: Math.max((duration / 30) * 40, 40) // Minimum 40px height
    };
  });

  const isToday = currentDate.toDateString() === new Date().toDateString();

  const getCurrentTimePosition = () => {
    if (!isToday) return null;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return (currentMinutes / 30) * 40; // 40px per 30-minute slot
  };

  const handleTimeSlotClick = (totalMinutes: number) => {
    const startDate = new Date(currentDate);
    startDate.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(startDate.getMinutes() + 60); // 1 hour duration
    
    onEventCreate(startDate, endDate, false);
  };

  const handleAllDayClick = () => {
    const startDate = new Date(currentDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(currentDate);
    endDate.setHours(23, 59, 59, 999);
    
    onEventCreate(startDate, endDate, true);
  };

  const handleDragStart = (event: typeof timedEvents[0], e: React.DragEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (totalMinutes: number, e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedEvent) {
      const newStartDate = new Date(currentDate);
      newStartDate.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
      
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
      <div className="p-4 space-y-4">
        {/* All day section */}
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-16" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
        
        {/* Time slots */}
        <div className="flex">
          <div className="w-20">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="h-20 p-2">
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-2">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="h-20 border rounded">
                {Math.random() > 0.7 && (
                  <Skeleton className="h-12 m-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric"
            })}
          </h2>
          {isToday && (
            <Badge variant="secondary" className="mt-1">
              Today
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
        </div>
      </div>

      {/* All Day Events */}
      {allDayEvents.length > 0 && (
        <Card>
          <CardHeader 
            className="pb-2 cursor-pointer hover:bg-muted/50"
            onClick={handleAllDayClick}
          >
            <CardTitle className="text-sm">All Day</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allDayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className="cursor-pointer"
              >
                <EventCard event={event} showTime={false} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Time Schedule */}
      <Card>
        <CardContent className="p-0">
          <div className="flex">
            {/* Time column */}
            <div className="w-20 border-r">
              {timeSlots.filter(slot => slot.isHour).map(slot => (
                <div key={slot.totalMinutes} className="h-20 px-2 py-1 text-xs text-muted-foreground border-b">
                  {slot.time}
                </div>
              ))}
            </div>

            {/* Events column */}
            <div className="flex-1 relative">
              {/* Time slots background */}
              {timeSlots.map(slot => (
                <div
                  key={slot.totalMinutes}
                  className={cn(
                    "h-10 border-b cursor-pointer hover:bg-muted/20",
                    slot.isHour && "border-b-2"
                  )}
                  onClick={() => handleTimeSlotClick(slot.totalMinutes)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(slot.totalMinutes, e)}
                />
              ))}

              {/* Events */}
              {timedEvents.map((event, index) => (
                <div
                  key={event.id}
                  draggable
                  onDragStart={(e) => handleDragStart(event, e)}
                  className="absolute left-2 right-2 z-20 cursor-pointer"
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
                    variant="detailed"
                    className="h-full overflow-hidden"
                  />
                </div>
              ))}

              {/* Current time line */}
              {currentTimePosition !== null && (
                <div
                  className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none"
                  style={{ top: `${currentTimePosition}px` }}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full -mt-1.5 -ml-1.5" />
                  <span className="text-xs text-red-500 bg-white px-1 ml-2">
                    {new Date().toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">
              {dayEvents.filter(e => e.type === "meeting").length}
            </div>
            <div className="text-xs text-muted-foreground">Meetings</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {dayEvents.filter(e => e.type === "task").length}
            </div>
            <div className="text-xs text-muted-foreground">Tasks</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">
              {dayEvents.filter(e => e.type === "deadline").length}
            </div>
            <div className="text-xs text-muted-foreground">Deadlines</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">
              {allDayEvents.length}
            </div>
            <div className="text-xs text-muted-foreground">All Day</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}