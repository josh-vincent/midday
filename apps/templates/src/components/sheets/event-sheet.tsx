"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Separator } from "@midday/ui/separator";
import { 
  Calendar,
  Clock, 
  MapPin, 
  Users, 
  Video,
  FileText,
  Paperclip,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Bell,
  Repeat,
  User
} from "lucide-react";
import { type MockEvent } from "@/lib/mock/calendar-mock";

interface EventSheetProps {
  event: MockEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: string, data: Partial<MockEvent>) => void;
  onDelete: (event: MockEvent) => void;
}

export function EventSheet({ event, open, onOpenChange, onEdit, onDelete }: EventSheetProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!event) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Event Details</SheetTitle>
            <SheetDescription>No event selected</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const getEventIcon = () => {
    switch (event.type) {
      case "meeting":
        return <Users className="h-4 w-4" />;
      case "task":
        return <Clock className="h-4 w-4" />;
      case "reminder":
        return <Bell className="h-4 w-4" />;
      case "deadline":
        return <Clock className="h-4 w-4" />;
      case "milestone":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventColor = () => {
    switch (event.type) {
      case "meeting":
        return "text-blue-500 bg-blue-50";
      case "task":
        return "text-green-500 bg-green-50";
      case "reminder":
        return "text-yellow-500 bg-yellow-50";
      case "deadline":
        return "text-red-500 bg-red-50";
      case "milestone":
        return "text-purple-500 bg-purple-50";
      default:
        return "text-gray-500 bg-gray-50";
    }
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
    };
  };

  const formatDuration = () => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const handleJoinMeeting = () => {
    if (event.videoConference?.url) {
      window.open(event.videoConference.url, '_blank');
    }
  };

  const startDateTime = formatDateTime(event.startDate);
  const endDateTime = formatDateTime(event.endDate);
  const isSameDay = startDateTime.date === endDateTime.date;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          {/* Header with icon and status */}
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${getEventColor()}`}>
              {getEventIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg leading-tight">
                {event.title}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor()}>
                  {event.status}
                </Badge>
                <Badge variant="outline">
                  {event.type}
                </Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(event)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            {event.videoConference && (
              <Button onClick={handleJoinMeeting} className="flex-1">
                <Video className="h-4 w-4 mr-2" />
                Join Meeting
              </Button>
            )}
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Date and Time */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {event.allDay ? (
                <div>
                  <p className="font-medium">{startDateTime.date}</p>
                  <p className="text-sm text-muted-foreground">All day</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">{startDateTime.date}</p>
                    <p className="text-sm text-muted-foreground">
                      {startDateTime.time} - {isSameDay ? endDateTime.time : `${endDateTime.date} ${endDateTime.time}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Duration: {formatDuration()}</span>
                  </div>
                </div>
              )}
              
              {event.recurrence && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 pt-2 border-t">
                  <Repeat className="h-3 w-3" />
                  <span>
                    Repeats {event.recurrence.type} 
                    {event.recurrence.interval > 1 && ` every ${event.recurrence.interval}`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          {event.location && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{event.location}</p>
              </CardContent>
            </Card>
          )}

          {/* Video Conference */}
          {event.videoConference && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video Conference
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm capitalize">{event.videoConference.type}</span>
                  <Button variant="outline" size="sm" onClick={handleJoinMeeting}>
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Join
                  </Button>
                </div>
                {event.videoConference.meetingId && (
                  <p className="text-xs text-muted-foreground">
                    Meeting ID: {event.videoConference.meetingId}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attendees */}
          {event.attendees.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Attendees ({event.attendees.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Organizer */}
                <div className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {event.organizer.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.organizer.name}</p>
                    <p className="text-xs text-muted-foreground">{event.organizer.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Organizer
                  </Badge>
                </div>

                {/* Attendees */}
                {event.attendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={attendee.avatar} />
                      <AvatarFallback>
                        {attendee.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{attendee.name}</p>
                      <p className="text-xs text-muted-foreground">{attendee.email}</p>
                    </div>
                    <Badge 
                      variant={attendee.status === "accepted" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {attendee.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {event.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{event.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {event.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{event.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {event.attachments && event.attachments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({event.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {event.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-3 p-2 border rounded">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Reminders */}
          {event.reminders.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {event.reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between text-sm">
                    <span>
                      {reminder.minutes < 60 
                        ? `${reminder.minutes} minutes before`
                        : `${Math.floor(reminder.minutes / 60)} hours before`
                      }
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {reminder.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(event.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated:</span>
                <span>{new Date(event.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Event ID:</span>
                <span className="font-mono">{event.id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}