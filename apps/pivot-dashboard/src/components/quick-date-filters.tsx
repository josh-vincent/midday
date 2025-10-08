"use client";

import { getDateRange } from "@/utils/date";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { 
  Calendar, 
  CalendarRange, 
  CalendarDays,
  History,
  TrendingUp
} from "lucide-react";

type QuickDateFiltersProps = {
  onSelectRange: (start: string | null, end: string | null) => void;
  currentStart?: string | null;
  currentEnd?: string | null;
  className?: string;
};

const filters = [
  { 
    id: 'yesterday', 
    label: 'Yesterday', 
    icon: History,
    period: 'yesterday' as const 
  },
  { 
    id: 'thisWeek', 
    label: 'This Week', 
    icon: CalendarDays,
    period: 'thisWeek' as const 
  },
  { 
    id: 'lastWeek', 
    label: 'Last Week', 
    icon: CalendarRange,
    period: 'lastWeek' as const 
  },
  { 
    id: 'thisMonth', 
    label: 'This Month', 
    icon: Calendar,
    period: 'thisMonth' as const 
  },
  { 
    id: 'lastMonth', 
    label: 'Last Month', 
    icon: TrendingUp,
    period: 'lastMonth' as const 
  },
];

export function QuickDateFilters({ 
  onSelectRange, 
  currentStart, 
  currentEnd,
  className 
}: QuickDateFiltersProps) {
  const handleSelectPeriod = (period: 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth') => {
    const range = getDateRange(period);
    onSelectRange(range.start, range.end);
  };

  const isActive = (period: 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth') => {
    if (!currentStart || !currentEnd) return false;
    const range = getDateRange(period);
    return range.start === currentStart && range.end === currentEnd;
  };

  const handleClearDates = () => {
    onSelectRange(null, null);
  };

  const hasDateFilter = currentStart || currentEnd;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filters.map((filter) => {
        const Icon = filter.icon;
        const active = isActive(filter.period);
        
        return (
          <Button
            key={filter.id}
            variant={active ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleSelectPeriod(filter.period)}
            className={cn(
              "h-8 px-3 text-xs font-normal",
              active && "bg-secondary font-medium"
            )}
          >
            <Icon className="h-3 w-3 mr-1.5" />
            {filter.label}
          </Button>
        );
      })}
      
      {hasDateFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearDates}
          className="h-8 px-3 text-xs font-normal text-muted-foreground hover:text-foreground"
        >
          Clear dates
        </Button>
      )}
    </div>
  );
}