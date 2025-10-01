"use client";

import { useState, useEffect } from "react";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { useToast } from "@midday/ui/use-toast";
import { 
  Pause, 
  Play, 
  RotateCcw, 
  Copy,
  CheckCircle, 
  AlertCircle, 
  Activity,
  Cpu,
  HardDrive,
  Clock,
  Zap
} from "lucide-react";
import type { MockWorker } from "@/lib/mock/queue-mock";
import { formatDistanceToNow } from "date-fns";

export function WorkerSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [worker, setWorker] = useState<MockWorker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOpenWorkerDetails = (event: CustomEvent) => {
      setWorker(event.detail);
      setIsOpen(true);
    };

    window.addEventListener('open-worker-details', handleOpenWorkerDetails as EventListener);
    return () => {
      window.removeEventListener('open-worker-details', handleOpenWorkerDetails as EventListener);
    };
  }, []);

  const handlePause = async () => {
    if (!worker) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Worker Paused",
        description: `Worker ${worker.name} has been paused`,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause worker",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    if (!worker) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Worker Resumed",
        description: `Worker ${worker.name} has been resumed`,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resume worker",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!worker) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Worker Restarted",
        description: `Worker ${worker.name} has been restarted`,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restart worker",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = () => {
    if (worker) {
      navigator.clipboard.writeText(worker.id);
      toast({
        title: "Copied",
        description: "Worker ID copied to clipboard",
      });
    }
  };

  const getStatusIcon = (status: MockWorker["status"]) => {
    switch (status) {
      case "busy":
        return <Activity className="h-5 w-5 text-blue-500" />;
      case "idle":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "offline":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: MockWorker["status"]) => {
    const variants = {
      busy: "secondary" as const,
      idle: "default" as const,
      offline: "destructive" as const,
    };
    return <Badge variant={variants[status]} className="capitalize">{status}</Badge>;
  };

  if (!worker) return null;

  const canPause = worker.status === "busy" || worker.status === "idle";
  const canResume = worker.status === "offline";
  const successRate = worker.processedJobs > 0 ? 
    ((worker.processedJobs - worker.failedJobs) / worker.processedJobs * 100).toFixed(1) : "0";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon(worker.status)}
            <div>
              <SheetTitle>Worker Details</SheetTitle>
              <SheetDescription>
                View and manage worker configuration and status
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <Button variant="outline" size="sm" onClick={handleCopyId}>
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Worker Name</label>
                <p className="font-medium">{worker.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(worker.status)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Worker ID</label>
                <p className="font-mono text-sm">{worker.id}</p>
              </div>
              {worker.currentJob && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Job</label>
                  <p className="font-mono text-sm">{worker.currentJob}</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Jobs Processed</span>
                </div>
                <p className="text-2xl font-bold">{worker.processedJobs.toLocaleString()}</p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Failed Jobs</span>
                </div>
                <p className="text-2xl font-bold text-red-500">{worker.failedJobs}</p>
              </div>
              <div className="bg-muted rounded-lg p-4 col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Success Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-500">{successRate}%</p>
              </div>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resource Usage</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">CPU Usage</span>
                  </div>
                  <span className="text-sm font-mono">{worker.cpu}%</span>
                </div>
                <Progress value={worker.cpu} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Memory Usage</span>
                  </div>
                  <span className="text-sm font-mono">{worker.memory}%</span>
                </div>
                <Progress value={worker.memory} className="h-2" />
              </div>
            </div>
          </div>

          {/* Last Activity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Activity</h3>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Last Active</p>
                <p className="text-sm text-muted-foreground">
                  {worker.lastActive.toLocaleString()} ({formatDistanceToNow(worker.lastActive, { addSuffix: true })})
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {canPause && (
              <Button 
                onClick={handlePause} 
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {canResume && (
              <Button 
                onClick={handleResume} 
                disabled={isLoading}
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            <Button 
              onClick={handleRestart} 
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restart
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}