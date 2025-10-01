"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  DollarSign,
  Calendar as CalendarIcon
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from "date-fns";
import type { MockTimeEntry } from "@/lib/mock/time-mock";

type Props = {
  entries: MockTimeEntry[];
  onEntryClick: (entry: MockTimeEntry) => void;
  onDateSelect: (date: Date) => void;
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
}

export function TimeCalendar({ entries, onEntryClick, onDateSelect }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, MockTimeEntry[]>);

  const getDayData = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayEntries = entriesByDate[dateKey] || [];
    const totalDuration = dayEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const billableDuration = dayEntries.filter(e => e.billable).reduce((sum, entry) => sum + entry.duration, 0);
    const totalRevenue = dayEntries.filter(e => e.billable).reduce((sum, entry) => sum + (entry.duration / 60) * entry.hourlyRate, 0);

    return {
      entries: dayEntries,
      totalDuration,
      billableDuration,
      totalRevenue,
      hasEntries: dayEntries.length > 0,
    };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Time Calendar
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-lg font-semibold min-w-[180px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarDays.map((date) => {
            const dayData = getDayData(date);
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isTodayDate = isToday(date);
            
            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors",
                  "hover:bg-muted/50",
                  !isCurrentMonth && "opacity-40",
                  isTodayDate && "bg-blue-50 border-blue-200",
                  dayData.hasEntries && "bg-green-50 border-green-200"
                )}
                onClick={() => onDateSelect(date)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium",
                    isTodayDate && "text-blue-600 font-bold"
                  )}>
                    {format(date, 'd')}
                  </span>
                  
                  {dayData.hasEntries && (
                    <Badge variant="secondary" className="text-xs">
                      {dayData.entries.length}
                    </Badge>
                  )}
                </div>
                
                {dayData.hasEntries && (
                  <div className="space-y-1">
                    {/* Total Time */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDuration(dayData.totalDuration)}
                    </div>
                    
                    {/* Revenue */}
                    {dayData.totalRevenue > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <DollarSign className="h-3 w-3" />
                        ${dayData.totalRevenue.toFixed(0)}
                      </div>
                    )}
                    
                    {/* Entry Indicators */}
                    <div className="flex flex-wrap gap-1">
                      {dayData.entries.slice(0, 3).map((entry, index) => (
                        <div
                          key={entry.id}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            entry.billable ? "bg-green-400" : "bg-gray-400"
                          )}
                          title={`${entry.description} - ${formatDuration(entry.duration)}`}
                        />
                      ))}
                      {dayData.entries.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayData.entries.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span>Billable Time</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Non-billable Time</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border border-blue-200 bg-blue-50" />
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}