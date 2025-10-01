"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Checkbox } from "@midday/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { 
  Calendar,
  Clock, 
  MapPin, 
  Users, 
  Video,
  Bell,
  Repeat,
  Plus,
  X
} from "lucide-react";
import { type MockEvent, type MockCalendar } from "@/lib/mock/calendar-mock";

interface EventCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: Partial<MockEvent>) => void;
  initialData?: {
    startDate?: Date;
    endDate?: Date;
    allDay?: boolean;
  } | null;
  calendars: MockCalendar[];
}

interface FormData {
  title: string;
  description: string;
  type: MockEvent["type"];
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  location: string;
  videoConference?: {
    type: "zoom" | "teams" | "meet";
    url: string;
    meetingId?: string;
  };
  attendeesInput: string;
  attendees: MockEvent["attendees"];
  status: MockEvent["status"];
  recurrence?: {
    type: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endDate?: string;
    daysOfWeek?: number[];
  };
  reminders: { minutes: number; type: "popup" | "email" }[];
  notes: string;
  calendarId: string;
}

const initialFormData: FormData = {
  title: "",
  description: "",
  type: "meeting",
  startDate: "",
  startTime: "09:00",
  endDate: "",
  endTime: "10:00",
  allDay: false,
  location: "",
  attendeesInput: "",
  attendees: [],
  status: "confirmed",
  reminders: [{ minutes: 15, type: "popup" }],
  notes: "",
  calendarId: "",
};

export function EventCreateSheet({
  open,
  onOpenChange,
  onCreate,
  initialData,
  calendars
}: EventCreateSheetProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      const start = initialData.startDate || new Date();
      const end = initialData.endDate || new Date(start.getTime() + 60 * 60 * 1000);
      
      setFormData(prev => ({
        ...prev,
        startDate: start.toISOString().split('T')[0],
        startTime: start.toTimeString().slice(0, 5),
        endDate: end.toISOString().split('T')[0],
        endTime: end.toTimeString().slice(0, 5),
        allDay: initialData.allDay || false,
        calendarId: calendars.find(c => c.isDefault)?.id || calendars[0]?.id || "",
      }));
    }
  }, [open, initialData, calendars]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time
      const startDateTime = formData.allDay 
        ? new Date(`${formData.startDate}T00:00:00`)
        : new Date(`${formData.startDate}T${formData.startTime}`);
      
      const endDateTime = formData.allDay
        ? new Date(`${formData.endDate}T23:59:59`)
        : new Date(`${formData.endDate}T${formData.endTime}`);

      const eventData: Partial<MockEvent> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        allDay: formData.allDay,
        location: formData.location || undefined,
        videoConference: formData.videoConference,
        attendees: formData.attendees,
        organizer: {
          id: "user_1",
          name: "John Smith",
          email: "john@company.com"
        },
        status: formData.status,
        color: "#4ECDC4",
        recurrence: isRecurring ? formData.recurrence : undefined,
        reminders: formData.reminders,
        notes: formData.notes || undefined,
      };

      await onCreate(eventData);
      
      // Reset form
      setFormData(initialFormData);
      setIsRecurring(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAttendee = () => {
    if (formData.attendeesInput.trim()) {
      const email = formData.attendeesInput.trim();
      const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      const newAttendee = {
        id: `attendee_${Date.now()}`,
        name,
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        status: "pending" as const
      };

      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee],
        attendeesInput: ""
      }));
    }
  };

  const removeAttendee = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a.id !== id)
    }));
  };

  const addReminder = () => {
    setFormData(prev => ({
      ...prev,
      reminders: [...prev.reminders, { minutes: 30, type: "popup" }]
    }));
  };

  const removeReminder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Event</SheetTitle>
          <SheetDescription>
            Add a new event to your calendar
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Event title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Event description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: MockEvent["type"]) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: MockEvent["status"]) => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="tentative">Tentative</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {calendars.length > 0 && (
                <div>
                  <Label htmlFor="calendar">Calendar</Label>
                  <Select value={formData.calendarId} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, calendarId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendars.map(calendar => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: calendar.color }}
                            />
                            {calendar.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date and Time */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allDay"
                  checked={formData.allDay}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, allDay: checked as boolean }))
                  }
                />
                <Label htmlFor="allDay">All day</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      startDate: e.target.value,
                      endDate: prev.endDate || e.target.value
                    }))}
                    required
                  />
                </div>

                {!formData.allDay && (
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>

                {!formData.allDay && (
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Add location"
                />
              </div>

              {/* Video Conference */}
              <div className="space-y-3">
                <Label>Video Conference (Optional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Select 
                    value={formData.videoConference?.type || ""} 
                    onValueChange={(value: "zoom" | "teams" | "meet" | "") => 
                      setFormData(prev => ({
                        ...prev,
                        videoConference: value ? { type: value, url: "" } : undefined
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="teams">Microsoft Teams</SelectItem>
                      <SelectItem value="meet">Google Meet</SelectItem>
                    </SelectContent>
                  </Select>

                  {formData.videoConference && (
                    <Input
                      placeholder="Meeting URL"
                      value={formData.videoConference.url}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        videoConference: prev.videoConference ? {
                          ...prev.videoConference,
                          url: e.target.value
                        } : undefined
                      }))}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendees */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Attendees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={formData.attendeesInput}
                  onChange={(e) => setFormData(prev => ({ ...prev, attendeesInput: e.target.value }))}
                  placeholder="Enter email address"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                />
                <Button type="button" onClick={addAttendee}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.attendees.length > 0 && (
                <div className="space-y-2">
                  {formData.attendees.map((attendee) => (
                    <div key={attendee.id} className="flex items-center gap-3 p-2 border rounded">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={attendee.avatar} />
                        <AvatarFallback className="text-xs">
                          {attendee.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{attendee.name}</p>
                        <p className="text-xs text-muted-foreground">{attendee.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttendee(attendee.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recurrence */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Recurrence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
                <Label htmlFor="recurring">Repeat this event</Label>
              </div>

              {isRecurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Frequency</Label>
                    <Select 
                      value={formData.recurrence?.type || "weekly"} 
                      onValueChange={(value: "daily" | "weekly" | "monthly" | "yearly") => 
                        setFormData(prev => ({
                          ...prev,
                          recurrence: { type: value, interval: 1 }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Interval</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.recurrence?.interval || 1}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurrence: prev.recurrence ? {
                          ...prev.recurrence,
                          interval: parseInt(e.target.value) || 1
                        } : undefined
                      }))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminders */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.reminders.map((reminder, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={reminder.minutes}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reminders: prev.reminders.map((r, i) => 
                        i === index ? { ...r, minutes: parseInt(e.target.value) || 0 } : r
                      )
                    }))}
                    className="w-20"
                  />
                  <Select 
                    value={reminder.type} 
                    onValueChange={(value: "popup" | "email") => 
                      setFormData(prev => ({
                        ...prev,
                        reminders: prev.reminders.map((r, i) => 
                          i === index ? { ...r, type: value } : r
                        )
                      }))
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popup">Popup</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground flex items-center">
                    minutes before
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReminder(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addReminder}>
                <Plus className="h-4 w-4 mr-2" />
                Add Reminder
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.title.trim()}
              className="flex-1"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}