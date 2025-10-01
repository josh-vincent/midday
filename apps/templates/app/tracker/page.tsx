"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { useToast } from "@midday/ui/use-toast";
import { 
  Clock, 
  Play,
  Pause,
  StopCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Timer,
  BarChart,
  Users,
  Briefcase,
  Target,
  TrendingUp,
  Activity,
  Plus
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

// Components
import { TrackerCalendar } from "@/components/tracker/calendar";
import { TrackerTimer } from "@/components/tracker/timer";
import { TrackerStats } from "@/components/tracker/stats";
import { TrackerEntrySheet } from "@/components/sheets/tracker-entry-sheet";
import { TrackerReport } from "@/components/tracker/report";

// Mock data
import { jobsAPI } from "@/lib/mock/jobs-mock";
import { trackerAPI, type TimeEntry } from "@/lib/mock/tracker-mock";

type ViewMode = "day" | "week" | "month";

export default function TrackerPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const { toast } = useToast();

  // State
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [selectedJob, setSelectedJob] = useState<string | undefined>(undefined);
  
  // Sheet state
  const [showEntrySheet, setShowEntrySheet] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesData, projectsData, jobsData] = await Promise.all([
        trackerAPI.getEntries(),
        jobsAPI.getProjects(),
        jobsAPI.getJobs()
      ]);
      
      setEntries(entriesData);
      setProjects(projectsData);
      setJobs(jobsData);
      
      // Check for active timer
      const active = entriesData.find(e => e.status === 'running');
      if (active) {
        setActiveTimer(active);
      }
    } finally {
      setLoading(false);
    }
  };

  // Date navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setCurrentDate(prev => direction === 'next' 
        ? new Date(prev.getTime() + 24 * 60 * 60 * 1000)
        : new Date(prev.getTime() - 24 * 60 * 60 * 1000)
      );
    } else if (viewMode === 'week') {
      setCurrentDate(prev => direction === 'next' 
        ? addWeeks(prev, 1)
        : subWeeks(prev, 1)
      );
    } else {
      setCurrentDate(prev => direction === 'next'
        ? addMonths(prev, 1)
        : subMonths(prev, 1)
      );
    }
  };

  const getDateRangeText = () => {
    if (viewMode === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  // Timer controls
  const startTimer = async () => {
    if (!selectedProject || !selectedJob) {
      toast({
        title: "Select project and job",
        description: "Please select a project and job to track time",
        variant: "destructive"
      });
      return;
    }

    try {
      const project = projects.find(p => p.id === selectedProject);
      const job = jobs.find(j => j.id === selectedJob);
      
      const entry = await trackerAPI.startTimer({
        projectId: selectedProject,
        jobId: selectedJob,
        description: "",
        projectName: project?.name,
        jobTitle: job?.title
      });
      
      // Update the entry with project and job names for display
      const entryWithNames = {
        ...entry,
        projectName: project?.name,
        jobTitle: job?.title
      };
      
      setActiveTimer(entryWithNames);
      setEntries(prev => [entryWithNames, ...prev]);
      
      toast({
        title: "Timer started",
        description: "Time tracking has begun"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive"
      });
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      const updated = await trackerAPI.stopTimer(activeTimer.id);
      
      setActiveTimer(null);
      setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
      
      toast({
        title: "Timer stopped",
        description: `Tracked ${formatDuration(updated.duration)}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Calculate stats
  const stats = {
    todayTotal: entries
      .filter(e => {
        const entryDate = new Date(e.startTime);
        const today = new Date();
        return entryDate.toDateString() === today.toDateString();
      })
      .reduce((sum, e) => sum + e.duration, 0),
    
    weekTotal: entries
      .filter(e => {
        const entryDate = new Date(e.startTime);
        const weekStart = startOfWeek(new Date());
        const weekEnd = endOfWeek(new Date());
        return entryDate >= weekStart && entryDate <= weekEnd;
      })
      .reduce((sum, e) => sum + e.duration, 0),
    
    monthTotal: entries
      .filter(e => {
        const entryDate = new Date(e.startTime);
        const monthStart = startOfMonth(new Date());
        const monthEnd = endOfMonth(new Date());
        return entryDate >= monthStart && entryDate <= monthEnd;
      })
      .reduce((sum, e) => sum + e.duration, 0),
    
    activeProjects: new Set(entries.map(e => e.projectId)).size,
    
    avgDailyHours: entries.length > 0 
      ? entries.reduce((sum, e) => sum + e.duration, 0) / 30 / 3600
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Tracker</h1>
          <p className="text-muted-foreground">Track time spent on projects and jobs</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Timer Controls */}
          <div className="flex items-center gap-2">
            <Select value={selectedProject || ""} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedJob || ""} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {jobs
                  .filter(job => !selectedProject || job.projectId === selectedProject)
                  .map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.number} - {job.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            
            {activeTimer ? (
              <Button onClick={stopTimer} variant="destructive" size="lg">
                <StopCircle className="h-5 w-5 mr-2" />
                Stop Timer
              </Button>
            ) : (
              <Button onClick={startTimer} size="lg">
                <Play className="h-5 w-5 mr-2" />
                Start Timer
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Active Timer Display */}
      {activeTimer && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <TrackerTimer entry={activeTimer} onStop={stopTimer} />
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Today
              <Clock className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats.todayTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Time tracked today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              This Week
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats.weekTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Weekly total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              This Month
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats.monthTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Active Projects
              <Briefcase className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              Projects worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Daily Average
              <Activity className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgDailyHours.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Avg hours per day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Time Entries</CardTitle>
            
            <div className="flex items-center gap-4">
              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="min-w-[200px] text-center font-medium">
                  {getDateRangeText()}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* View Mode Selector */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button onClick={() => setShowEntrySheet(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TrackerCalendar
            entries={entries}
            viewMode={viewMode}
            currentDate={currentDate}
            projects={projects}
            jobs={jobs}
            onEntryClick={(entry) => {
              setSelectedEntry(entry);
              setShowEntrySheet(true);
            }}
          />
        </CardContent>
      </Card>

      {/* Reports Tab */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="projects">By Project</TabsTrigger>
          <TabsTrigger value="jobs">By Job</TabsTrigger>
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <TrackerStats entries={entries} projects={projects} jobs={jobs} />
        </TabsContent>

        <TabsContent value="projects">
          <TrackerReport 
            entries={entries} 
            projects={projects} 
            groupBy="project"
          />
        </TabsContent>

        <TabsContent value="jobs">
          <TrackerReport 
            entries={entries} 
            jobs={jobs} 
            groupBy="job"
          />
        </TabsContent>

        <TabsContent value="daily">
          <TrackerReport 
            entries={entries} 
            groupBy="date"
          />
        </TabsContent>
      </Tabs>

      {/* Entry Sheet */}
      <TrackerEntrySheet
        open={showEntrySheet}
        onOpenChange={setShowEntrySheet}
        entry={selectedEntry}
        projects={projects}
        jobs={jobs}
        onSave={async (data) => {
          if (selectedEntry) {
            await trackerAPI.updateEntry(selectedEntry.id, data);
          } else {
            await trackerAPI.createEntry(data);
          }
          await loadData();
          setShowEntrySheet(false);
          setSelectedEntry(null);
        }}
        onDelete={async () => {
          if (selectedEntry) {
            await trackerAPI.deleteEntry(selectedEntry.id);
            await loadData();
            setShowEntrySheet(false);
            setSelectedEntry(null);
          }
        }}
      />
    </div>
  );
}