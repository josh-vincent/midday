"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  CalendarDays,
  List,
  Grid3x3
} from "lucide-react";
import { format } from "date-fns";
import type { CalendarView } from "./calendar-utils";
import { getCalendarTitle, navigateCalendar } from "./calendar-utils";

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onToday?: () => void;
  showViewSelector?: boolean;
  showTodayButton?: boolean;
  className?: string;
  title?: string;
}

const viewOptions: { value: CalendarView; label: string; icon: React.ElementType }[] = [
  { value: 'day', label: 'Day', icon: Calendar },
  { value: 'week', label: 'Week', icon: CalendarDays },
  { value: 'month', label: 'Month', icon: Grid3x3 },
  { value: 'list', label: 'List', icon: List },
];

export function CalendarHeader({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onToday,
  showViewSelector = true,
  showTodayButton = true,
  className,
  title
}: CalendarHeaderProps) {
  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = navigateCalendar(currentDate, view, direction);
    onDateChange(newDate);
  };

  const handleToday = () => {
    if (onToday) {
      onToday();
    } else {
      onDateChange(new Date());
    }
  };

  const displayTitle = title || getCalendarTitle(currentDate, view);

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate('prev')}
            aria-label="Previous period"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate('next')}
            aria-label="Next period"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Today button */}
        {showTodayButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
          >
            Today
          </Button>
        )}

        {/* Date title */}
        <h2 className="text-lg font-semibold">
          {displayTitle}
        </h2>
      </div>

      {/* View selector */}
      {showViewSelector && (
        <div className="flex items-center gap-1">
          {viewOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant={view === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => onViewChange(option.value)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{option.label}</span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}