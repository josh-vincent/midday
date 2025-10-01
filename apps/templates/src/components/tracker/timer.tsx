"use client";

import { useState, useEffect } from "react";
import { Button } from "@midday/ui/button";
import { Card } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { StopCircle, Pause, Play } from "lucide-react";
import type { TimeEntry } from "@/lib/mock/tracker-mock";

interface TrackerTimerProps {
  entry: TimeEntry;
  onStop: () => void;
}

export function TrackerTimer({ entry, onStop }: TrackerTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isPaused && entry.status === 'running') {
      const interval = setInterval(() => {
        const start = new Date(entry.startTime);
        const now = new Date();
        setElapsed(Math.floor((now.getTime() - start.getTime()) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [entry, isPaused]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="text-4xl font-mono font-bold text-primary">
          {formatTime(elapsed)}
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{entry.projectName || 'Project'}</Badge>
            <Badge variant="secondary">{entry.jobTitle || 'Job'}</Badge>
          </div>
          {entry.description && (
            <p className="text-sm text-muted-foreground">{entry.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          variant="destructive"
          size="lg"
          onClick={onStop}
        >
          <StopCircle className="h-5 w-5 mr-2" />
          Stop Timer
        </Button>
      </div>
    </div>
  );
}