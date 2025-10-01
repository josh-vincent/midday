"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { 
  PlayCircle, 
  PauseCircle, 
  StopCircle, 
  Clock,
  Briefcase,
  User
} from "lucide-react";
import { cn } from "@midday/ui/cn";
import type { MockTimer } from "@/lib/mock/time-mock";

type Props = {
  timer: MockTimer;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function calculateCurrentDuration(timer: MockTimer): number {
  const startTime = new Date(timer.startTime);
  const now = new Date();
  const totalMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
  return Math.max(0, totalMinutes - timer.pausedDuration);
}

export function ActiveTimer({ timer, onStop, onPause, onResume }: Props) {
  const [currentDuration, setCurrentDuration] = useState(calculateCurrentDuration(timer));

  useEffect(() => {
    if (timer.isPaused) return;

    const interval = setInterval(() => {
      setCurrentDuration(calculateCurrentDuration(timer));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, timer.isPaused]);

  useEffect(() => {
    setCurrentDuration(calculateCurrentDuration(timer));
  }, [timer]);

  const handleKeyPress = (e: KeyboardEvent) => {
    // Keyboard shortcuts for timer control
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          timer.isPaused ? onResume() : onPause();
          break;
        case 's':
          e.preventDefault();
          onStop();
          break;
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [timer.isPaused]);

  return (
    <Card className={cn(
      "border-2 transition-colors",
      timer.isPaused ? "border-yellow-200 bg-yellow-50/50" : "border-green-200 bg-green-50/50"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Timer Status */}
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                timer.isPaused ? "bg-yellow-400 animate-pulse" : "bg-green-400 animate-pulse"
              )} />
              <Badge 
                variant={timer.isPaused ? "secondary" : "default"}
                className="gap-1"
              >
                <Clock className="h-3 w-3" />
                {timer.isPaused ? "Paused" : "Running"}
              </Badge>
            </div>

            {/* Timer Display */}
            <div className="text-3xl font-mono font-bold text-green-600">
              {formatDuration(currentDuration)}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="font-medium text-lg">{timer.description}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {timer.projectId && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    Project
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Current User
                </div>
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center space-x-2">
            {timer.isPaused ? (
              <Button onClick={onResume} size="sm" className="gap-2">
                <PlayCircle className="h-4 w-4" />
                Resume
              </Button>
            ) : (
              <Button onClick={onPause} size="sm" variant="outline" className="gap-2">
                <PauseCircle className="h-4 w-4" />
                Pause
              </Button>
            )}
            
            <Button onClick={onStop} size="sm" variant="destructive" className="gap-2">
              <StopCircle className="h-4 w-4" />
              Stop
            </Button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Started at {new Date(timer.startTime).toLocaleTimeString()}
              {timer.pausedDuration > 0 && (
                <span className="ml-2">
                  • Paused for {formatDuration(timer.pausedDuration)}
                </span>
              )}
            </div>
            <div className="text-xs">
              Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘/Ctrl + Space</kbd> to pause/resume
              • <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘/Ctrl + S</kbd> to stop
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}