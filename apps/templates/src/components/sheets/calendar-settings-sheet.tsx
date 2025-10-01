"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Switch } from "@midday/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Separator } from "@midday/ui/separator";
import { 
  Calendar,
  Settings,
  Users,
  Share,
  Trash2,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Bell,
  Clock,
  Palette
} from "lucide-react";
import { type MockCalendar } from "@/lib/mock/calendar-mock";

interface CalendarSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendars: MockCalendar[];
  onCalendarUpdate: () => void;
}

const colorOptions = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
  "#FFEAA7", "#74B9FF", "#A29BFE", "#FD79A8",
  "#6C5CE7", "#00B894", "#FDCB6E", "#E17055"
];

export function CalendarSettingsSheet({
  open,
  onOpenChange,
  calendars,
  onCalendarUpdate
}: CalendarSettingsSheetProps) {
  const [activeTab, setActiveTab] = useState("calendars");
  const [editingCalendar, setEditingCalendar] = useState<string | null>(null);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [newCalendarColor, setNewCalendarColor] = useState(colorOptions[0]);
  const [shareEmail, setShareEmail] = useState("");

  const handleCreateCalendar = async () => {
    if (newCalendarName.trim()) {
      // Simulate API call
      console.log("Creating calendar:", { name: newCalendarName, color: newCalendarColor });
      setNewCalendarName("");
      setNewCalendarColor(colorOptions[0]);
      onCalendarUpdate();
    }
  };

  const handleDeleteCalendar = async (calendarId: string) => {
    // Simulate API call
    console.log("Deleting calendar:", calendarId);
    onCalendarUpdate();
  };

  const handleToggleVisibility = async (calendarId: string) => {
    // Simulate API call
    console.log("Toggling visibility for calendar:", calendarId);
    onCalendarUpdate();
  };

  const handleShareCalendar = async (calendarId: string) => {
    if (shareEmail.trim()) {
      // Simulate API call
      console.log("Sharing calendar:", calendarId, "with:", shareEmail);
      setShareEmail("");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Calendar Settings
          </SheetTitle>
          <SheetDescription>
            Manage your calendars, sharing, and preferences
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendars">Calendars</TabsTrigger>
            <TabsTrigger value="sharing">Sharing</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="calendars" className="space-y-6 mt-6">
            {/* Create New Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="calendarName">Calendar Name</Label>
                  <Input
                    id="calendarName"
                    value={newCalendarName}
                    onChange={(e) => setNewCalendarName(e.target.value)}
                    placeholder="Enter calendar name"
                  />
                </div>

                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCalendarColor(color)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          newCalendarColor === color ? "border-gray-900" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleCreateCalendar}
                  disabled={!newCalendarName.trim()}
                  className="w-full"
                >
                  Create Calendar
                </Button>
              </CardContent>
            </Card>

            {/* Existing Calendars */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  My Calendars
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {calendars.map((calendar) => (
                  <div key={calendar.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: calendar.color }}
                    />
                    
                    <div className="flex-1">
                      {editingCalendar === calendar.id ? (
                        <Input
                          defaultValue={calendar.name}
                          onBlur={() => setEditingCalendar(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingCalendar(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{calendar.name}</h3>
                            {calendar.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {calendar.shared.length > 0 && `Shared with ${calendar.shared.length} people`}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleVisibility(calendar.id)}
                        className="h-8 w-8"
                      >
                        {calendar.isVisible ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCalendar(calendar.id)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>

                      {!calendar.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCalendar(calendar.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {calendars.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No calendars yet. Create your first calendar above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sharing" className="space-y-6 mt-6">
            {/* Share Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Share className="h-4 w-4" />
                  Share Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shareCalendar">Select Calendar</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose calendar to share" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendars.map((calendar) => (
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

                <div>
                  <Label htmlFor="shareEmail">Email Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="shareEmail"
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                    <Button onClick={() => handleShareCalendar("calendar_id")}>
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shared Calendars */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Shared Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {calendars.map((calendar) =>
                  calendar.shared.length > 0 ? (
                    <div key={calendar.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: calendar.color }}
                        />
                        <h4 className="font-medium">{calendar.name}</h4>
                      </div>
                      
                      {calendar.shared.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {user.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {user.permission}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null
                )}

                {calendars.every(cal => cal.shared.length === 0) && (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No shared calendars yet. Share a calendar above to get started.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6 mt-6">
            {/* General Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Default View</Label>
                    <p className="text-xs text-muted-foreground">
                      Choose your preferred calendar view
                    </p>
                  </div>
                  <Select defaultValue="month">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Week starts on</Label>
                    <p className="text-xs text-muted-foreground">
                      First day of the week
                    </p>
                  </div>
                  <Select defaultValue="sunday">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Time format</Label>
                    <p className="text-xs text-muted-foreground">
                      12-hour or 24-hour format
                    </p>
                  </div>
                  <Select defaultValue="12">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12-hour</SelectItem>
                      <SelectItem value="24">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Desktop notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Show popup notifications for events
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email reminders</Label>
                    <p className="text-xs text-muted-foreground">
                      Send email notifications for events
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Default reminder time</Label>
                    <p className="text-xs text-muted-foreground">
                      Default notification time for new events
                    </p>
                  </div>
                  <Select defaultValue="15">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="1440">1 day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Working Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start time</Label>
                    <Input type="time" defaultValue="09:00" />
                  </div>
                  <div>
                    <Label>End time</Label>
                    <Input type="time" defaultValue="17:00" />
                  </div>
                </div>

                <div>
                  <Label>Working days</Label>
                  <div className="flex gap-2 mt-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                      <Button
                        key={day}
                        variant={index < 5 ? "default" : "outline"}
                        size="sm"
                        className="w-12"
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}