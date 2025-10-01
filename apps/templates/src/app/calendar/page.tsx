"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { useToast } from "@midday/ui/use-toast";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  MapPin,
  Plus,
  Filter,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Components
import { CalendarHeader } from "@/components/calendar-header";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { DayView } from "@/components/calendar/day-view";
import { ListView } from "@/components/calendar/list-view";
import { MiniCalendar } from "@/components/calendar/mini-calendar";
import { UpcomingEvents } from "@/components/calendar/upcoming-events";
import { CalendarFilters } from "@/components/calendar/calendar-filters";
import { EventSheet } from "@/components/sheets/event-sheet";
import { EventCreateSheet } from "@/components/sheets/event-create-sheet";
import { CalendarSettingsSheet } from "@/components/sheets/calendar-settings-sheet";

// Mock data
import { calendarAPI, type MockEvent, type MockCalendar } from "@/lib/mock/calendar-mock";

type CalendarView = "month" | "week" | "day" | "list";

export default function CalendarPage() {
  const [currentView, setCurrentView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();

  // State
  const [events, setEvents] = useState<MockEvent[]>([]);
  const [calendars, setCalendars] = useState<MockCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Sheet states
  const [selectedEvent, setSelectedEvent] = useState<MockEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);
  const [createEventData, setCreateEventData] = useState<{
    startDate?: Date;
    endDate?: Date;
    allDay?: boolean;
  } | null>(null);

  useEffect(() => {
    loadCalendars();
    loadEvents();
  }, [currentDate, currentView, selectedCalendars]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on current view
      let startDate: Date, endDate: Date;
      
      switch (currentView) {
        case "month":
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          break;
        case "week":
          const weekStart = new Date(currentDate);
          weekStart.setDate(currentDate.getDate() - currentDate.getDay());
          startDate = weekStart;
          endDate = new Date(weekStart);
          endDate.setDate(weekStart.getDate() + 6);
          break;
        case "day":
          startDate = new Date(currentDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(currentDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "list":
          startDate = new Date();
          endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 3);
          break;
      }
      
      const data = await calendarAPI.getEvents(
        startDate.toISOString(),
        endDate.toISOString(),
        selectedCalendars.length > 0 ? selectedCalendars : undefined
      );
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendars = async () => {
    const data = await calendarAPI.getCalendars();
    setCalendars(data);
    // Initialize with visible calendars
    setSelectedCalendars(data.filter(cal => cal.isVisible).map(cal => cal.id));
  };

  // Filter events based on selected filters
  const filteredEvents = events.filter(event => {
    const matchesCalendar = selectedCalendars.length === 0 || selectedCalendars.includes("all");
    const matchesType = !eventTypeFilter || event.type === eventTypeFilter;
    const matchesStatus = !statusFilter || event.status === statusFilter;
    
    return matchesCalendar && matchesType && matchesStatus;
  });

  // Navigation handlers
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    
    switch (currentView) {
      case "month":
        newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "day":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Event handlers
  const handleEventClick = (event: MockEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleEventCreate = (startDate: Date, endDate?: Date, allDay?: boolean) => {
    setCreateEventData({
      startDate,
      endDate: endDate || new Date(startDate.getTime() + 60 * 60 * 1000),
      allDay: allDay || false
    });
    setShowCreateEvent(true);
  };

  const handleEventEdit = (event: MockEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleEventDelete = async (event: MockEvent) => {
    try {
      await calendarAPI.deleteEvent(event.id);
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully",
      });
      await loadEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const handleCreateEvent = async (data: any) => {
    try {
      const newEvent = await calendarAPI.createEvent({
        ...data,
        ...createEventData
      });
      toast({
        title: "Event created",
        description: `${newEvent.title} has been created successfully`,
      });
      setShowCreateEvent(false);
      setCreateEventData(null);
      await loadEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    }
  };

  const handleUpdateEvent = async (id: string, data: any) => {
    try {
      await calendarAPI.updateEvent(id, data);
      toast({
        title: "Event updated",
        description: "The event has been updated successfully",
      });
      setShowEventDetails(false);
      await loadEvents();
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update event",
        variant: "destructive",
      });
    }
  };

  const handleCalendarToggle = (calendarId: string) => {
    setSelectedCalendars(prev => 
      prev.includes(calendarId) 
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    if (currentView === "list") {
      setCurrentView("day");
    }
  };

  // Calculate stats
  const today = new Date();
  const todayEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.startDate);
    return eventDate.toDateString() === today.toDateString();
  });

  const upcomingEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.startDate);
    return eventDate > today;
  }).slice(0, 5);

  const stats = {
    totalEvents: filteredEvents.length,
    todayEvents: todayEvents.length,
    upcomingEvents: upcomingEvents.length,
    meetings: filteredEvents.filter(e => e.type === "meeting").length,
    tasks: filteredEvents.filter(e => e.type === "task").length,
    deadlines: filteredEvents.filter(e => e.type === "deadline").length,
  };

  const renderCalendarView = () => {
    const commonProps = {
      events: filteredEvents,
      currentDate,
      onEventClick: handleEventClick,
      onEventCreate: handleEventCreate,
      onEventEdit: handleEventEdit,
      onEventDelete: handleEventDelete,
      loading
    };

    switch (currentView) {
      case "month":
        return <MonthView {...commonProps} />;
      case "week":
        return <WeekView {...commonProps} />;
      case "day":
        return <DayView {...commonProps} />;
      case "list":
        return <ListView {...commonProps} />;
      default:
        return <MonthView {...commonProps} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <CalendarHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        currentDate={currentDate}
        onNavigate={navigateDate}
        onToday={goToToday}
        onCreateEvent={() => handleEventCreate(new Date())}
        onSettings={() => setShowCalendarSettings(true)}
        eventTypeFilter={eventTypeFilter}
        onEventTypeFilterChange={setEventTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalEvents={stats.totalEvents}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Today
              <CalendarIcon className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.todayEvents}
            </div>
            <p className="text-xs text-muted-foreground">
              Events today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Upcoming
              <Clock className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.upcomingEvents}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 5 events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Meetings
              <Users className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.meetings}
            </div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Tasks
              <CalendarIcon className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.tasks}
            </div>
            <p className="text-xs text-muted-foreground">
              To complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Deadlines
              <Clock className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.deadlines}
            </div>
            <p className="text-xs text-muted-foreground">
              Coming up
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total Events
              <CalendarIcon className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalEvents}
            </div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Navigate</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniCalendar
                currentDate={currentDate}
                events={filteredEvents}
                onDateSelect={handleDateSelect}
              />
            </CardContent>
          </Card>

          {/* Calendar Filters */}
          <CalendarFilters
            calendars={calendars}
            selectedCalendars={selectedCalendars}
            onCalendarToggle={handleCalendarToggle}
            eventTypeFilter={eventTypeFilter}
            onEventTypeFilterChange={setEventTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          {/* Upcoming Events */}
          <UpcomingEvents
            events={upcomingEvents}
            onEventClick={handleEventClick}
          />
        </div>

        {/* Calendar View */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              {renderCalendarView()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sheet Components */}
      <EventSheet
        event={selectedEvent}
        open={showEventDetails}
        onOpenChange={setShowEventDetails}
        onEdit={handleUpdateEvent}
        onDelete={handleEventDelete}
      />

      <EventCreateSheet
        open={showCreateEvent}
        onOpenChange={setShowCreateEvent}
        onCreate={handleCreateEvent}
        initialData={createEventData}
        calendars={calendars}
      />

      <CalendarSettingsSheet
        open={showCalendarSettings}
        onOpenChange={setShowCalendarSettings}
        calendars={calendars}
        onCalendarUpdate={loadCalendars}
      />
    </div>
  );
}