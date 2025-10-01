"use client";

import { Badge } from "@midday/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import { 
  Clock, 
  MapPin, 
  Users, 
  Video,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Calendar
} from "lucide-react";
import { type MockEvent } from "@/lib/mock/calendar-mock";

interface EventCardProps {
  event: MockEvent;
  variant?: "default" | "compact" | "detailed";
  showTime?: boolean;
  className?: string;
}

export function EventCard({ 
  event, 
  variant = "default", 
  showTime = true,
  className 
}: EventCardProps) {
  const getEventIcon = () => {
    switch (event.type) {
      case "meeting":
        return <Users className="h-3 w-3" />;
      case "task":
        return <CheckCircle className="h-3 w-3" />;
      case "reminder":
        return <AlertCircle className="h-3 w-3" />;
      case "deadline":
        return <Clock className="h-3 w-3" />;
      case "milestone":
        return <Briefcase className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  const getEventColor = () => {
    switch (event.type) {
      case "meeting":
        return "bg-blue-500";
      case "task":
        return "bg-green-500";
      case "reminder":
        return "bg-yellow-500";
      case "deadline":
        return "bg-red-500";
      case "milestone":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const getStatusColor = () => {
    switch (event.status) {
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

  if (variant === "compact") {
    return (
      <div 
        className={cn(
          "rounded px-2 py-1 text-xs font-medium truncate",
          getEventColor(),
          "text-white hover:opacity-80 transition-opacity",
          className
        )}
        title={event.title}
      >
        <div className="flex items-center gap-1">
          {getEventIcon()}
          <span className="truncate">
            {showTime && !event.allDay && `${formatTime(event.startDate)} `}
            {event.title}
          </span>
        </div>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={cn(
        "bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow",
        className
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-1 rounded", getEventColor(), "text-white")}>
              {getEventIcon()}
            </div>
            <div>
              <h3 className="font-medium text-sm line-clamp-2">{event.title}</h3>
              <Badge variant="secondary" className="text-xs mt-1">
                {event.type}
              </Badge>
            </div>
          </div>
          <Badge className={cn("text-xs", getStatusColor())}>
            {event.status}
          </Badge>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Clock className="h-3 w-3" />
          {event.allDay ? (
            <span>All day</span>
          ) : (
            <span>
              {formatTime(event.startDate)} - {formatTime(event.endDate)}
            </span>
          )}
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Video conference */}
        {event.videoConference && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Video className="h-3 w-3" />
            <span className="truncate">{event.videoConference.type} meeting</span>
          </div>
        )}

        {/* Attendees */}
        {event.attendees.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <div className="flex -space-x-1">
              {event.attendees.slice(0, 3).map((attendee, index) => (
                <Avatar key={attendee.id} className="h-5 w-5 border-2 border-white">
                  <AvatarImage src={attendee.avatar} />
                  <AvatarFallback className="text-xs">
                    {attendee.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
              {event.attendees.length > 3 && (
                <div className="h-5 w-5 rounded-full bg-muted border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium">+{event.attendees.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && variant === "detailed" && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
            {event.description}
          </p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1 rounded", getEventColor(), "text-white")}>
          {getEventIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{event.title}</h3>
          {showTime && (
            <p className="text-xs text-muted-foreground">
              {event.allDay ? "All day" : `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`}
            </p>
          )}
        </div>
        <Badge className={cn("text-xs", getStatusColor())}>
          {event.status}
        </Badge>
      </div>

      {/* Additional info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {event.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{event.location}</span>
          </div>
        )}
        {event.attendees.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{event.attendees.length}</span>
          </div>
        )}
        {event.videoConference && (
          <Video className="h-3 w-3" />
        )}
      </div>
    </div>
  );
}