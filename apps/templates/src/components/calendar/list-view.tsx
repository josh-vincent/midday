"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Skeleton } from "@midday/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { EventCard } from "./event-card";
import { type MockEvent } from "@/lib/mock/calendar-mock";
import { 
  Calendar,
  Clock, 
  MapPin, 
  Users, 
  Filter,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface ListViewProps {
  events: MockEvent[];
  currentDate: Date;
  onEventClick: (event: MockEvent) => void;
  onEventCreate: (startDate: Date, endDate?: Date, allDay?: boolean) => void;
  onEventEdit: (event: MockEvent) => void;
  onEventDelete: (event: MockEvent) => void;
  loading: boolean;
}

export function ListView({
  events,
  currentDate,
  onEventClick,
  onEventCreate,
  onEventEdit,
  onEventDelete,
  loading
}: ListViewProps) {
  const [groupBy, setGroupBy] = useState<"date" | "type" | "status">("date");
  const [sortBy, setSortBy] = useState<"date" | "title" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Filter events to upcoming only
  const now = new Date();
  const upcomingEvents = events.filter(event => new Date(event.startDate) >= now);

  // Sort events
  const sortedEvents = [...upcomingEvents].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "date":
        comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        break;
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Group events
  const groupedEvents = sortedEvents.reduce((groups, event) => {
    let groupKey: string;
    
    switch (groupBy) {
      case "date":
        groupKey = new Date(event.startDate).toDateString();
        break;
      case "type":
        groupKey = event.type;
        break;
      case "status":
        groupKey = event.status;
        break;
      default:
        groupKey = "other";
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(event);
    
    return groups;
  }, {} as Record<string, MockEvent[]>);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const formatGroupTitle = (groupKey: string) => {
    switch (groupBy) {
      case "date":
        const date = new Date(groupKey);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
          return "Today";
        } else if (date.toDateString() === tomorrow.toDateString()) {
          return "Tomorrow";
        } else {
          return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
          });
        }
      case "type":
        return groupKey.charAt(0).toUpperCase() + groupKey.slice(1) + "s";
      case "status":
        return groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
      default:
        return groupKey;
    }
  };

  const getGroupIcon = () => {
    switch (groupBy) {
      case "date":
        return <Calendar className="h-4 w-4" />;
      case "type":
        return <Filter className="h-4 w-4" />;
      case "status":
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {/* Controls skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        
        {/* Groups skeleton */}
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, j) => (
                <Skeleton key={j} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Group by:</span>
          <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort by:</span>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Order:</span>
          <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        <div className="text-sm text-muted-foreground">
          {sortedEvents.length} upcoming {sortedEvents.length === 1 ? "event" : "events"}
        </div>
      </div>

      {/* Event Groups */}
      {Object.keys(groupedEvents).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
            <p className="text-muted-foreground mb-4">
              Create your first event to get started.
            </p>
            <Button onClick={() => onEventCreate(new Date())}>
              Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedEvents).map(([groupKey, groupEvents]) => {
          const isExpanded = expandedGroups.has(groupKey);
          
          return (
            <Card key={groupKey}>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleGroup(groupKey)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getGroupIcon()}
                    {formatGroupTitle(groupKey)}
                    <Badge variant="secondary">
                      {groupEvents.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CardTitle>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="space-y-3">
                  {groupEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="cursor-pointer"
                    >
                      <EventCard event={event} variant="detailed" />
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => onEventCreate(new Date())}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Create New Event
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(9, 0, 0, 0);
              onEventCreate(tomorrow);
            }}
          >
            <Clock className="h-4 w-4 mr-2" />
            Schedule for Tomorrow
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => {
              const nextWeek = new Date();
              nextWeek.setDate(nextWeek.getDate() + 7);
              nextWeek.setHours(9, 0, 0, 0);
              onEventCreate(nextWeek);
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule for Next Week
          </Button>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">
              {sortedEvents.filter(e => e.type === "meeting").length}
            </div>
            <div className="text-xs text-muted-foreground">Meetings</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {sortedEvents.filter(e => e.type === "task").length}
            </div>
            <div className="text-xs text-muted-foreground">Tasks</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">
              {sortedEvents.filter(e => e.type === "deadline").length}
            </div>
            <div className="text-xs text-muted-foreground">Deadlines</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">
              {sortedEvents.filter(e => e.type === "milestone").length}
            </div>
            <div className="text-xs text-muted-foreground">Milestones</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}