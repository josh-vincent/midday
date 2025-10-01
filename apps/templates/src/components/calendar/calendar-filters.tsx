"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Checkbox } from "@midday/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { 
  Filter,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Briefcase,
  Eye,
  EyeOff
} from "lucide-react";
import { type MockCalendar } from "@/lib/mock/calendar-mock";

interface CalendarFiltersProps {
  calendars: MockCalendar[];
  selectedCalendars: string[];
  onCalendarToggle: (calendarId: string) => void;
  eventTypeFilter: string;
  onEventTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function CalendarFilters({
  calendars,
  selectedCalendars,
  onCalendarToggle,
  eventTypeFilter,
  onEventTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
}: CalendarFiltersProps) {
  const eventTypes = [
    { value: "meeting", label: "Meetings", icon: Users, color: "text-blue-500" },
    { value: "task", label: "Tasks", icon: CheckCircle, color: "text-green-500" },
    { value: "reminder", label: "Reminders", icon: AlertCircle, color: "text-yellow-500" },
    { value: "deadline", label: "Deadlines", icon: Clock, color: "text-red-500" },
    { value: "milestone", label: "Milestones", icon: Briefcase, color: "text-purple-500" },
  ];

  const eventStatuses = [
    { value: "confirmed", label: "Confirmed", color: "bg-green-100 text-green-800" },
    { value: "tentative", label: "Tentative", color: "bg-yellow-100 text-yellow-800" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
  ];

  const toggleAllCalendars = () => {
    if (selectedCalendars.length === calendars.length) {
      // If all are selected, deselect all
      calendars.forEach(cal => onCalendarToggle(cal.id));
    } else {
      // If not all are selected, select all
      calendars.forEach(cal => {
        if (!selectedCalendars.includes(cal.id)) {
          onCalendarToggle(cal.id);
        }
      });
    }
  };

  const clearAllFilters = () => {
    onEventTypeFilterChange("");
    onStatusFilterChange("");
  };

  return (
    <div className="space-y-4">
      {/* Calendars */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              My Calendars
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAllCalendars}
              className="text-xs h-6"
            >
              {selectedCalendars.length === calendars.length ? "None" : "All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {calendars.map((calendar) => {
            const isSelected = selectedCalendars.includes(calendar.id);
            
            return (
              <div key={calendar.id} className="flex items-center space-x-2">
                <Checkbox
                  id={calendar.id}
                  checked={isSelected}
                  onCheckedChange={() => onCalendarToggle(calendar.id)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: calendar.color }}
                  />
                  <label
                    htmlFor={calendar.id}
                    className={cn(
                      "text-sm font-medium cursor-pointer flex-1",
                      !isSelected && "text-muted-foreground"
                    )}
                  >
                    {calendar.name}
                  </label>
                  {calendar.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                  {!calendar.isVisible && (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
          
          {calendars.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No calendars available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Types */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Event Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={eventTypeFilter} onValueChange={onEventTypeFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {eventTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-3 w-3", type.color)} />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {/* Visual filter options */}
          <div className="mt-3 space-y-2">
            {eventTypes.map((type) => {
              const Icon = type.icon;
              const isActive = eventTypeFilter === type.value;
              
              return (
                <button
                  key={type.value}
                  onClick={() => onEventTypeFilterChange(isActive ? "" : type.value)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded text-sm transition-colors",
                    "hover:bg-muted/50",
                    isActive && "bg-blue-50 border border-blue-200"
                  )}
                >
                  <Icon className={cn("h-3 w-3", type.color)} />
                  <span className="flex-1 text-left">{type.label}</span>
                  {isActive && <CheckCircle className="h-3 w-3 text-blue-500" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {eventStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", status.color)} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Visual status options */}
          <div className="mt-3 space-y-2">
            {eventStatuses.map((status) => {
              const isActive = statusFilter === status.value;
              
              return (
                <button
                  key={status.value}
                  onClick={() => onStatusFilterChange(isActive ? "" : status.value)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded text-sm transition-colors",
                    "hover:bg-muted/50",
                    isActive && "bg-blue-50 border border-blue-200"
                  )}
                >
                  <Badge className={cn("text-xs", status.color)}>
                    {status.label}
                  </Badge>
                  <span className="flex-1 text-left">{status.label}</span>
                  {isActive && <CheckCircle className="h-3 w-3 text-blue-500" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Summary */}
      {(eventTypeFilter || statusFilter) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {eventTypeFilter && (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="gap-1">
                  Type: {eventTypes.find(t => t.value === eventTypeFilter)?.label}
                  <button
                    onClick={() => onEventTypeFilterChange("")}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full w-3 h-3 flex items-center justify-center"
                  >
                    ×
                  </button>
                </Badge>
              </div>
            )}
            
            {statusFilter && (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="gap-1">
                  Status: {eventStatuses.find(s => s.value === statusFilter)?.label}
                  <button
                    onClick={() => onStatusFilterChange("")}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full w-3 h-3 flex items-center justify-center"
                  >
                    ×
                  </button>
                </Badge>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="w-full text-xs"
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}