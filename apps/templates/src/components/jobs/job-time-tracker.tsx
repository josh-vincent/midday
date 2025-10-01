"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { useToast } from "@midday/ui/use-toast";
import { format } from "date-fns";
import { 
  Play, 
  Pause, 
  Square,
  Timer,
  Clock,
  Plus,
  Calendar,
  TrendingUp,
  Target,
  Save,
  Trash2
} from "lucide-react";
import { cn } from "@midday/ui/cn";
import type { MockJob } from "@/lib/mock/jobs-mock";

type TimeEntry = {
  id: string;
  jobId: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  description: string;
  isRunning: boolean;
};

type Props = {
  job: MockJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTimeEntryAdded?: (entry: TimeEntry) => void;
  onTimeEntryUpdated?: (entry: TimeEntry) => void;
  onTimeEntryDeleted?: (entryId: string) => void;
};

export function JobTimeTracker({ 
  job, 
  open, 
  onOpenChange,
  onTimeEntryAdded,
  onTimeEntryUpdated,
  onTimeEntryDeleted 
}: Props) {
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [description, setDescription] = useState("");
  const [manualHours, setManualHours] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const { toast } = useToast();

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentEntry?.isRunning) {
      interval = setInterval(() => {
        const startTime = new Date(`${currentEntry.date}T${currentEntry.startTime}`);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 60000); // minutes
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentEntry]);

  // Load existing time entries for the job
  useEffect(() => {
    if (job?.timeEntries) {
      const entries = job.timeEntries.map(entry => ({
        id: entry.id,
        jobId: job.id,
        date: entry.date.split('T')[0],
        startTime: "09:00",
        duration: Math.round(entry.hours * 60),
        description: entry.description,
        isRunning: false,
      }));
      setTimeEntries(entries);
    }
  }, [job]);

  const startTimer = () => {
    if (!job) return;

    const now = new Date();
    const entry: TimeEntry = {
      id: `entry_${Date.now()}`,
      jobId: job.id,
      date: now.toISOString().split('T')[0],
      startTime: now.toTimeString().slice(0, 5),
      duration: 0,
      description: description || "Working on task",
      isRunning: true,
    };

    setCurrentEntry(entry);
    setElapsedTime(0);
    
    toast({
      title: "Timer Started",
      description: `Started tracking time for "${job.title}"`,
    });
  };

  const pauseTimer = () => {
    if (!currentEntry) return;

    const updatedEntry = {
      ...currentEntry,
      isRunning: false,
      duration: elapsedTime,
      endTime: new Date().toTimeString().slice(0, 5),
    };

    setCurrentEntry(updatedEntry);
    toast({
      title: "Timer Paused",
      description: `Paused at ${formatDuration(elapsedTime)}`,
    });
  };

  const resumeTimer = () => {
    if (!currentEntry) return;

    const updatedEntry = {
      ...currentEntry,
      isRunning: true,
    };

    setCurrentEntry(updatedEntry);
    toast({
      title: "Timer Resumed",
      description: "Timer resumed",
    });
  };

  const stopTimer = () => {
    if (!currentEntry) return;

    const finalEntry = {
      ...currentEntry,
      isRunning: false,
      duration: elapsedTime,
      endTime: new Date().toTimeString().slice(0, 5),
    };

    setTimeEntries(prev => [finalEntry, ...prev]);
    onTimeEntryAdded?.(finalEntry);
    setCurrentEntry(null);
    setElapsedTime(0);
    setDescription("");

    toast({
      title: "Time Entry Saved",
      description: `Saved ${formatDuration(elapsedTime)} for "${job?.title}"`,
    });
  };

  const addManualEntry = () => {
    if (!job || !manualHours || !manualDescription) {
      toast({
        title: "Invalid Entry",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const hours = parseFloat(manualHours);
    const minutes = Math.round(hours * 60);
    
    const entry: TimeEntry = {
      id: `manual_${Date.now()}`,
      jobId: job.id,
      date: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      duration: minutes,
      description: manualDescription,
      isRunning: false,
    };

    setTimeEntries(prev => [entry, ...prev]);
    onTimeEntryAdded?.(entry);
    setManualHours("");
    setManualDescription("");

    toast({
      title: "Manual Entry Added",
      description: `Added ${formatDuration(minutes)} for "${job.title}"`,
    });
  };

  const deleteEntry = (entryId: string) => {
    setTimeEntries(prev => prev.filter(e => e.id !== entryId));
    onTimeEntryDeleted?.(entryId);
    
    toast({
      title: "Entry Deleted",
      description: "Time entry has been deleted",
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const totalTimeToday = timeEntries
    .filter(entry => entry.date === new Date().toISOString().split('T')[0])
    .reduce((sum, entry) => sum + entry.duration, 0);

  const totalTimeThisWeek = timeEntries
    .filter(entry => {
      const entryDate = new Date(entry.date);
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      return entryDate >= weekStart;
    })
    .reduce((sum, entry) => sum + entry.duration, 0);

  if (!job) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Time Tracker
          </SheetTitle>
          <SheetDescription>
            Track time spent on "{job.title}"
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Current Timer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Session</CardTitle>
              <CardDescription>
                Track time in real-time for this job
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!currentEntry ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="description">What are you working on?</Label>
                    <Input
                      id="description"
                      placeholder="Describe your current task..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <Button onClick={startTimer} className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Timer
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-4xl font-mono font-bold text-blue-600">
                    {formatDuration(elapsedTime)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentEntry.description}
                  </p>
                  <div className="flex gap-2">
                    {currentEntry.isRunning ? (
                      <Button onClick={pauseTimer} variant="outline" className="flex-1">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button onClick={resumeTimer} variant="outline" className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button onClick={stopTimer} className="flex-1">
                      <Square className="h-4 w-4 mr-2" />
                      Stop & Save
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-lg font-bold">{formatDuration(totalTimeToday)}</div>
                    <div className="text-xs text-muted-foreground">Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-lg font-bold">{formatDuration(totalTimeThisWeek)}</div>
                    <div className="text-xs text-muted-foreground">This Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-lg font-bold">{job.estimatedHours}h</div>
                    <div className="text-xs text-muted-foreground">Estimated</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manual Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Manual Entry</CardTitle>
              <CardDescription>
                Add time that was worked offline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manualHours">Hours</Label>
                  <Input
                    id="manualHours"
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="2.5"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manualDescription">Description</Label>
                  <Input
                    id="manualDescription"
                    placeholder="What did you work on?"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={addManualEntry} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </CardContent>
          </Card>

          {/* Time Entries History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Entries</CardTitle>
              <CardDescription>
                History of all tracked time for this job
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No time entries yet. Start tracking time to see entries here.
                  </p>
                ) : (
                  timeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {formatDuration(entry.duration)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(entry.date), "MMM dd, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{entry.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteEntry(entry.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}