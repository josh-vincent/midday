"use client";

import { useState } from "react";
import { Card } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { ScrollArea } from "@midday/ui/scroll-area";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isToday
} from "date-fns";
import { Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { TimeEntry } from "@/lib/mock/tracker-mock";

interface TrackerCalendarProps {
  entries: TimeEntry[];
  viewMode: "day" | "week" | "month";
  currentDate: Date;
  projects: any[];
  jobs: any[];
  onEntryClick: (entry: TimeEntry) => void;
}

export function TrackerCalendar({
  entries,
  viewMode,
  currentDate,
  projects,
  jobs,
  onEntryClick
}: TrackerCalendarProps) {
  const getDateRange = () => {
    if (viewMode === "day") {
      return [currentDate];
    } else if (viewMode === "week") {
      return eachDayOfInterval({
        start: startOfWeek(currentDate),
        end: endOfWeek(currentDate)
      });
    } else {
      return eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getEntriesForDate = (date: Date) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return isSameDay(entryDate, date);
    });
  };

  const getDayTotal = (date: Date) => {
    const dayEntries = getEntriesForDate(date);
    return dayEntries.reduce((sum, entry) => sum + entry.duration, 0);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const getJobTitle = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    return job?.title || "Unknown Job";
  };

  const dates = getDateRange();

  if (viewMode === "month") {
    // Month view - calendar grid
    const weeks = [];
    let week = [];
    
    const firstDay = startOfWeek(dates[0]);
    const lastDay = endOfWeek(dates[dates.length - 1]);
    const allDays = eachDayOfInterval({ start: firstDay, end: lastDay });
    
    allDays.forEach((day, index) => {
      week.push(day);
      if ((index + 1) % 7 === 0) {
        weeks.push(week);
        week = [];
      }
    });
    
    if (week.length > 0) {
      weeks.push(week);
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div key={`weekday-${index}`} className="bg-muted p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
          
          {weeks.map((week, weekIndex) => (
            week.map((day, dayIndex) => {
              const dayEntries = getEntriesForDate(day);
              const dayTotal = getDayTotal(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              
              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`
                    min-h-[100px] p-2 bg-background border-t
                    ${!isCurrentMonth ? 'opacity-40' : ''}
                    ${isToday(day) ? 'bg-primary/5' : ''}
                    hover:bg-muted/50 cursor-pointer transition-colors
                  `}
                  onClick={() => dayEntries.length > 0 && onEntryClick(dayEntries[0])}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-sm ${isToday(day) ? 'font-bold text-primary' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {dayTotal > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {formatDuration(dayTotal)}
                      </Badge>
                    )}
                  </div>
                  
                  <ScrollArea className="h-[60px]">
                    <div className="space-y-1">
                      {dayEntries.slice(0, 3).map(entry => (
                        <div
                          key={entry.id}
                          className="text-xs p-1 bg-primary/10 rounded truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEntryClick(entry);
                          }}
                        >
                          {getProjectName(entry.projectId)}
                        </div>
                      ))}
                      {dayEntries.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEntries.length - 3} more
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })
          ))}
        </div>
      </div>
    );
  }

  // Day and Week views - list format
  return (
    <div className="space-y-4">
      {dates.map(date => {
        const dayEntries = getEntriesForDate(date);
        const dayTotal = getDayTotal(date);
        
        return (
          <Card key={date.toISOString()} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className={`font-medium ${isToday(date) ? 'text-primary' : ''}`}>
                  {format(date, 'EEEE, MMMM d')}
                </span>
                {isToday(date) && (
                  <Badge variant="secondary">Today</Badge>
                )}
              </div>
              {dayTotal > 0 && (
                <Badge variant="outline">
                  Total: {formatDuration(dayTotal)}
                </Badge>
              )}
            </div>
            
            {dayEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No time entries for this day
              </div>
            ) : (
              <div className="space-y-3">
                {dayEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => onEntryClick(entry)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">
                          {getProjectName(entry.projectId)}
                        </Badge>
                        <Badge variant="secondary">
                          {getJobTitle(entry.jobId)}
                        </Badge>
                        {entry.status === 'running' && (
                          <Badge variant="destructive">Running</Badge>
                        )}
                      </div>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground">
                          {entry.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(entry.startTime), 'h:mm a')}
                          {entry.endTime && ` - ${format(new Date(entry.endTime), 'h:mm a')}`}
                        </span>
                        {entry.billable && (
                          <Badge variant="outline" className="text-xs">
                            Billable
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatDuration(entry.duration)}
                      </div>
                      {entry.billable && entry.rate && (
                        <div className="text-sm text-muted-foreground">
                          ${((entry.duration / 3600) * entry.rate).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}