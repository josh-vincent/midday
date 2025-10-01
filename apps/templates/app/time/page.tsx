"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { useToast } from "@midday/ui/use-toast";
import { 
  Clock, 
  Calendar,
  BarChart3,
  Timer,
  DollarSign,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Plus,
  TrendingUp
} from "lucide-react";

// Components
import { TimeDataTable } from "@/components/tables/time/data-table";
import { TimeHeader } from "@/components/time-header";
import { TimeEntrySheet } from "@/components/sheets/time-entry-sheet";
import { TimerSheet } from "@/components/sheets/timer-sheet";
import { TimesheetSubmitSheet } from "@/components/sheets/timesheet-submit-sheet";
import { ActiveTimer } from "@/components/time/active-timer";
import { TimeCalendar } from "@/components/time/time-calendar";
import { TimeStats } from "@/components/time/time-stats";
import { QuickEntry } from "@/components/time/quick-entry";
import { TimesheetView } from "@/components/time/timesheet-view";

// Mock data
import { 
  timeAPI, 
  type MockTimeEntry, 
  type MockTimer,
  type MockTimesheet 
} from "@/lib/mock/time-mock";

export default function TimePage() {
  const [activeView, setActiveView] = useState("entries");
  const { toast } = useToast();

  // State
  const [timeEntries, setTimeEntries] = useState<MockTimeEntry[]>([]);
  const [activeTimers, setActiveTimers] = useState<MockTimer[]>([]);
  const [timesheets, setTimesheets] = useState<MockTimesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [billableFilter, setBillableFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  // Sheet states
  const [selectedEntry, setSelectedEntry] = useState<MockTimeEntry | null>(null);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [showTimerSheet, setShowTimerSheet] = useState(false);
  const [showTimesheetSubmit, setShowTimesheetSubmit] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<MockTimesheet | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-refresh active timers every minute
    const interval = setInterval(() => {
      if (activeTimers.length > 0) {
        loadActiveTimers();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [activeTimers.length]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTimeEntries(),
        loadActiveTimers(),
        loadTimesheets(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeEntries = async () => {
    const data = await timeAPI.getTimeEntries({
      startDate: dateRange.from.toISOString().split('T')[0],
      endDate: dateRange.to.toISOString().split('T')[0],
    });
    setTimeEntries(data);
  };

  const loadActiveTimers = async () => {
    const data = await timeAPI.getActiveTimers();
    setActiveTimers(data);
  };

  const loadTimesheets = async () => {
    const data = await timeAPI.getTimesheets();
    setTimesheets(data);
  };

  // Filter functions
  const filteredEntries = timeEntries.filter(entry => {
    const matchesSearch = 
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.jobName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = !projectFilter || entry.projectId === projectFilter;
    const matchesClient = !clientFilter || entry.clientId === clientFilter;
    const matchesBillable = !billableFilter || 
      (billableFilter === "billable" && entry.billable) ||
      (billableFilter === "non-billable" && !entry.billable);
    
    return matchesSearch && matchesProject && matchesClient && matchesBillable;
  });

  // Calculate statistics
  const todayEntries = timeEntries.filter(e => e.date === new Date().toISOString().split('T')[0]);
  const thisWeekEntries = timeEntries.filter(e => {
    const entryDate = new Date(e.date);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return entryDate >= weekStart;
  });

  const stats = {
    todayHours: todayEntries.reduce((sum, e) => sum + e.duration / 60, 0),
    weekHours: thisWeekEntries.reduce((sum, e) => sum + e.duration / 60, 0),
    totalBillable: thisWeekEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration / 60, 0),
    totalRevenue: thisWeekEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration / 60) * e.hourlyRate, 0),
    activeTimers: activeTimers.length,
    avgDaily: thisWeekEntries.length > 0 ? thisWeekEntries.reduce((sum, e) => sum + e.duration / 60, 0) / 7 : 0,
  };

  // Event handlers
  const handleEntryClick = (entry: MockTimeEntry) => {
    setSelectedEntry(entry);
    setShowEntryDetails(true);
  };

  const handleEditEntry = (entry: MockTimeEntry) => {
    setSelectedEntry(entry);
    setShowEntryDetails(true);
  };

  const handleDeleteEntry = async (entry: MockTimeEntry) => {
    try {
      await timeAPI.deleteTimeEntry(entry.id);
      toast({
        title: "Time entry deleted",
        description: "The time entry has been deleted successfully",
      });
      await loadTimeEntries();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
    }
  };

  const handleStartTimer = async (data: { description: string; projectId?: string; jobId?: string }) => {
    try {
      await timeAPI.startTimer({
        description: data.description,
        projectId: data.projectId,
        jobId: data.jobId,
        userId: "user_1",
      });
      toast({
        title: "Timer started",
        description: `Started tracking time for: ${data.description}`,
      });
      await loadActiveTimers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      });
    }
  };

  const handleStopTimer = async (timer: MockTimer) => {
    try {
      const entry = await timeAPI.stopTimer(timer.id);
      toast({
        title: "Timer stopped",
        description: `Logged ${(entry.duration / 60).toFixed(1)} hours`,
      });
      await Promise.all([loadActiveTimers(), loadTimeEntries()]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive",
      });
    }
  };

  const handlePauseTimer = async (timer: MockTimer) => {
    try {
      await timeAPI.pauseTimer(timer.id);
      toast({
        title: "Timer paused",
        description: "Timer has been paused",
      });
      await loadActiveTimers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause timer",
        variant: "destructive",
      });
    }
  };

  const handleResumeTimer = async (timer: MockTimer) => {
    try {
      await timeAPI.resumeTimer(timer.id);
      toast({
        title: "Timer resumed",
        description: "Timer has been resumed",
      });
      await loadActiveTimers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resume timer",
        variant: "destructive",
      });
    }
  };

  const handleCreateEntry = async (data: Partial<MockTimeEntry>) => {
    try {
      await timeAPI.createTimeEntry(data);
      toast({
        title: "Time entry created",
        description: "New time entry has been added",
      });
      setShowQuickEntry(false);
      await loadTimeEntries();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create time entry",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const url = await timeAPI.exportTimeEntries({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      });
      toast({
        title: "Export started",
        description: "Your timesheet is being exported",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export timesheet",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <TimeHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        clientFilter={clientFilter}
        onClientFilterChange={setClientFilter}
        billableFilter={billableFilter}
        onBillableFilterChange={setBillableFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onStartTimer={() => setShowTimerSheet(true)}
        onQuickEntry={() => setShowQuickEntry(true)}
        onExport={handleExport}
        onRefresh={handleRefresh}
        isRefreshing={loading}
        totalEntries={timeEntries.length}
      />

      {/* Active Timers */}
      {activeTimers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Timers</h3>
          <div className="grid gap-4">
            {activeTimers.map((timer) => (
              <ActiveTimer
                key={timer.id}
                timer={timer}
                onStop={() => handleStopTimer(timer)}
                onPause={() => handlePauseTimer(timer)}
                onResume={() => handleResumeTimer(timer)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Entry */}
      {showQuickEntry && (
        <QuickEntry
          onSubmit={handleCreateEntry}
          onCancel={() => setShowQuickEntry(false)}
        />
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Today
              <Clock className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.todayHours.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {todayEntries.length} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              This Week
              <Calendar className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.weekHours.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {thisWeekEntries.length} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Billable
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalBillable.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Active Timers
              <Timer className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.activeTimers}
            </div>
            <p className="text-xs text-muted-foreground">
              Running now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Avg Daily
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgDaily.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Utilization
              <BarChart3 className="h-4 w-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.weekHours / 40) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of 40h week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="stats">Analytics</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="mt-6 space-y-6">
          <TimeDataTable
            data={filteredEntries}
            loading={loading}
            hasFilters={!!searchQuery || !!projectFilter || !!clientFilter || !!billableFilter}
            onEntryClick={handleEntryClick}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            onStartTimer={handleStartTimer}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <TimeCalendar
            entries={timeEntries}
            onEntryClick={handleEntryClick}
            onDateSelect={(date) => {
              setDateRange({ from: date, to: date });
              setActiveView("entries");
            }}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <TimeStats 
            entries={timeEntries}
            timers={activeTimers}
          />
        </TabsContent>

        <TabsContent value="timesheets" className="mt-6">
          <TimesheetView
            timesheets={timesheets}
            onSubmit={(timesheet) => {
              setSelectedTimesheet(timesheet);
              setShowTimesheetSubmit(true);
            }}
            onView={(timesheet) => {
              setSelectedTimesheet(timesheet);
              setShowTimesheetSubmit(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Sheet Components */}
      <TimeEntrySheet
        entry={selectedEntry}
        open={showEntryDetails}
        onOpenChange={setShowEntryDetails}
        onSave={async (data) => {
          if (selectedEntry) {
            await timeAPI.updateTimeEntry(selectedEntry.id, data);
            toast({
              title: "Time entry updated",
              description: "Changes have been saved",
            });
            await loadTimeEntries();
          }
        }}
        onDelete={selectedEntry ? () => handleDeleteEntry(selectedEntry) : undefined}
      />

      <TimerSheet
        open={showTimerSheet}
        onOpenChange={setShowTimerSheet}
        onStart={handleStartTimer}
      />

      <TimesheetSubmitSheet
        timesheet={selectedTimesheet}
        open={showTimesheetSubmit}
        onOpenChange={setShowTimesheetSubmit}
        onSubmit={async (timesheetId) => {
          await timeAPI.submitTimesheet(timesheetId);
          toast({
            title: "Timesheet submitted",
            description: "Your timesheet has been submitted for approval",
          });
          await loadTimesheets();
        }}
        onApprove={async (timesheetId) => {
          await timeAPI.approveTimesheet(timesheetId, "user_1");
          toast({
            title: "Timesheet approved",
            description: "The timesheet has been approved",
          });
          await loadTimesheets();
        }}
      />
    </div>
  );
}