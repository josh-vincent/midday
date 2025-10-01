"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { 
  Clock, 
  MapPin, 
  Users, 
  Video,
  Calendar,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { type MockEvent } from "@/lib/mock/calendar-mock";

interface UpcomingEventsProps {
  events: MockEvent[];
  onEventClick: (event: MockEvent) => void;
}

export function UpcomingEvents({ events, onEventClick }: UpcomingEventsProps) {
  const now = new Date();
  
  // Filter and sort upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.startDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return <Users className="h-3 w-3" />;
      case "task":
        return <Clock className="h-3 w-3" />;
      case "reminder":
        return <AlertCircle className="h-3 w-3" />;
      case "deadline":
        return <Clock className="h-3 w-3" />;
      case "milestone":
        return <Calendar className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "text-blue-500";
      case "task":
        return "text-green-500";
      case "reminder":
        return "text-yellow-500";
      case "deadline":
        return "text-red-500";
      case "milestone":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  const getTimeUntilEvent = (eventDate: Date) => {
    const diffMs = eventDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m`;
    } else {
      return "Now";
    }
  };

  const formatEventTime = (dateString: string, allDay: boolean) => {
    if (allDay) return "All day";
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const timeString = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    
    if (date.toDateString() === today.toDateString()) {
      return timeString;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${timeString}`;
    } else {
      const dayString = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });
      return `${dayString} ${timeString}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "tentative":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (upcomingEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No upcoming events
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming Events
          </div>
          <Badge variant="secondary" className="text-xs">
            {upcomingEvents.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingEvents.map((event) => {
          const eventDate = new Date(event.startDate);
          const timeUntil = getTimeUntilEvent(eventDate);
          
          return (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className="group cursor-pointer p-3 rounded-lg border hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={cn("p-1 rounded", getEventColor(event.type))}>
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate group-hover:text-blue-600">
                      {event.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatEventTime(event.startDate, event.allDay)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {timeUntil}
                  </Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-blue-600" />
                </div>
              </div>

              {/* Event details */}
              <div className="space-y-1">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge className={cn("text-xs", getStatusColor(event.status))}>
                    {event.status}
                  </Badge>
                  {event.type && (
                    <Badge variant="secondary" className="text-xs">
                      {event.type}
                    </Badge>
                  )}
                </div>

                {/* Location or Video */}
                {event.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
                
                {event.videoConference && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Video className="h-3 w-3" />
                    <span>{event.videoConference.type} meeting</span>
                  </div>
                )}

                {/* Attendees */}
                {event.attendees.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <div className="flex -space-x-1">
                      {event.attendees.slice(0, 3).map((attendee) => (
                        <Avatar key={attendee.id} className="h-4 w-4 border border-white">
                          <AvatarImage src={attendee.avatar} />
                          <AvatarFallback className="text-xs">
                            {attendee.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {event.attendees.length > 3 && (
                        <div className="h-4 w-4 rounded-full bg-muted border border-white flex items-center justify-center">
                          <span className="text-xs font-medium">+{event.attendees.length - 3}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {event.attendees.length} {event.attendees.length === 1 ? "attendee" : "attendees"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Show all button */}
        {events.filter(event => new Date(event.startDate) > now).length > 5 && (
          <Button 
            variant="outline" 
            className="w-full mt-3 text-xs"
            onClick={() => {
              // This would typically switch to list view or open a modal
              console.log("Show all upcoming events");
            }}
          >
            View All Upcoming Events
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}