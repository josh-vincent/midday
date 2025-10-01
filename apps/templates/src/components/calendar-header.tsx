"use client";

import { Button } from "@midday/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Badge } from "@midday/ui/badge";
import { 
  Calendar,
  ChevronLeft, 
  ChevronRight,
  Plus,
  Settings,
  Filter,
  RefreshCw
} from "lucide-react";

interface CalendarHeaderProps {
  currentView: "month" | "week" | "day" | "list";
  onViewChange: (view: "month" | "week" | "day" | "list") => void;
  currentDate: Date;
  onNavigate: (direction: "prev" | "next") => void;
  onToday: () => void;
  onCreateEvent: () => void;
  onSettings: () => void;
  eventTypeFilter: string;
  onEventTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  totalEvents: number;
}

export function CalendarHeader({
  currentView,
  onViewChange,
  currentDate,
  onNavigate,
  onToday,
  onCreateEvent,
  onSettings,
  eventTypeFilter,
  onEventTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  totalEvents,
}: CalendarHeaderProps) {
  const formatDateTitle = () => {
    switch (currentView) {
      case "month":
        return currentDate.toLocaleDateString("en-US", { 
          month: "long", 
          year: "numeric" 
        });
      case "week":
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.toLocaleDateString("en-US", { 
            month: "long", 
            day: "numeric" 
          })} - ${weekEnd.toLocaleDateString("en-US", { 
            day: "numeric",
            year: "numeric"
          })}`;
        } else {
          return `${weekStart.toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric" 
          })} - ${weekEnd.toLocaleDateString("en-US", { 
            month: "short",
            day: "numeric",
            year: "numeric"
          })}`;
        }
      case "day":
        return currentDate.toLocaleDateString("en-US", { 
          weekday: "long",
          month: "long", 
          day: "numeric",
          year: "numeric" 
        });
      case "list":
        return "Upcoming Events";
      default:
        return "";
    }
  };

  const viewLabels = {
    month: "Month",
    week: "Week", 
    day: "Day",
    list: "List"
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold">Calendar</h1>
              <p className="text-sm text-muted-foreground">
                {totalEvents} events
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onCreateEvent} className="gap-2">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
          <Button variant="outline" size="icon" onClick={onSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation and view controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => onNavigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={onToday} className="min-w-[80px]">
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => onNavigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Current date/period */}
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              {formatDateTitle()}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={eventTypeFilter} onValueChange={onEventTypeFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="tentative">Tentative</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View selector */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {(["month", "week", "day", "list"] as const).map((view) => (
              <Button
                key={view}
                variant={currentView === view ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(view)}
                className="px-3 py-1 text-xs"
              >
                {viewLabels[view]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Active filters */}
      {(eventTypeFilter || statusFilter) && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {eventTypeFilter && (
            <Badge variant="secondary" className="gap-1">
              Type: {eventTypeFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => onEventTypeFilterChange("")}
              >
                ×
              </Button>
            </Badge>
          )}
          {statusFilter && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => onStatusFilterChange("")}
              >
                ×
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}