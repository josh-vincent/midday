"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type MockEvent } from "@/lib/mock/calendar-mock";

interface MiniCalendarProps {
  currentDate: Date;
  events: MockEvent[];
  onDateSelect: (date: Date) => void;
}

export function MiniCalendar({ currentDate, events, onDateSelect }: MiniCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

  // Get the first day of the month and adjust to start from Sunday
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const lastDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
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

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + (direction === "next" ? 1 : -1));
    setViewDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === currentDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === viewDate.getMonth();
  };

  const hasEvents = (date: Date) => {
    return (eventsByDate[date.toDateString()]?.length ?? 0) > 0;
  };

  const getEventCount = (date: Date) => {
    return eventsByDate[date.toDateString()]?.length || 0;
  };

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => navigateMonth("prev")}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        
        <div className="text-sm font-medium">
          {viewDate.toLocaleDateString("en-US", { 
            month: "long", 
            year: "numeric" 
          })}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => navigateMonth("next")}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div key={`weekday-${index}`} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const isTodayDay = isToday(date);
          const isSelectedDay = isSelected(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const hasEventsDay = hasEvents(date);
          const eventCount = getEventCount(date);
          
          return (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={cn(
                "relative aspect-square p-1 text-xs rounded hover:bg-muted transition-colors",
                "flex flex-col items-center justify-center",
                !isCurrentMonthDay && "text-muted-foreground opacity-50",
                isTodayDay && "bg-blue-500 text-white hover:bg-blue-600",
                isSelectedDay && !isTodayDay && "bg-muted ring-2 ring-blue-500",
                hasEventsDay && !isTodayDay && !isSelectedDay && "bg-blue-50"
              )}
            >
              <span className={cn(
                "font-medium",
                isTodayDay && "font-bold"
              )}>
                {date.getDate()}
              </span>
              
              {/* Event indicator */}
              {hasEventsDay && (
                <div className="flex items-center justify-center mt-0.5">
                  {eventCount <= 3 ? (
                    <div className="flex gap-0.5">
                      {Array.from({ length: eventCount }, (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1 h-1 rounded-full",
                            isTodayDay ? "bg-white" : "bg-blue-500"
                          )}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={cn(
                      "w-4 h-3 rounded-sm text-xs font-medium flex items-center justify-center",
                      isTodayDay 
                        ? "bg-white text-blue-500" 
                        : "bg-blue-500 text-white"
                    )}>
                      {eventCount}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Has events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-500 ring-offset-1" />
          <span>Selected date</span>
        </div>
      </div>
    </div>
  );
}