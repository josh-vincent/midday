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
  RotateCcw, 
  X, 
  Copy,
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  Clock,
  Calendar,
  Activity
} from "lucide-react";
import { queueAPI, type MockJob } from "@/lib/mock/queue-mock";
import { formatDistanceToNow } from "date-fns";

export function JobDetailsSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [job, setJob] = useState<MockJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOpenJobDetails = (event: CustomEvent) => {
      setJob(event.detail);
      setIsOpen(true);
    };

    window.addEventListener('open-job-details', handleOpenJobDetails as EventListener);
    return () => {
      window.removeEventListener('open-job-details', handleOpenJobDetails as EventListener);
    };
  }, []);

  const handleRetry = async () => {
    if (!job) return;
    
    setIsLoading(true);
    try {
      await queueAPI.retryJob(job.id);
      toast({
        title: "Job Retried",
        description: `Job ${job.id} has been queued for retry`,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry job",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!job) return;
    
    setIsLoading(true);
    try {
      await queueAPI.cancelJob(job.id);
      toast({
        title: "Job Cancelled",
        description: `Job ${job.id} has been cancelled`,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel job",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = () => {
    if (job) {
      navigator.clipboard.writeText(job.id);
      toast({
        title: "Copied",
        description: "Job ID copied to clipboard",
      });
    }
  };

  const getStatusIcon = (status: MockJob["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "retrying":
        return <RotateCcw className="h-5 w-5 text-yellow-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-gray-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: MockJob["status"]) => {
    const variants = {
      completed: "default" as const,
      processing: "secondary" as const,
      failed: "destructive" as const,
      retrying: "outline" as const,
      pending: "outline" as const,
    };
    return <Badge variant={variants[status]} className="capitalize">{status}</Badge>;
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 1) {
      return <Badge variant="destructive">High</Badge>;
    } else if (priority === 2) {
      return <Badge variant="secondary">Medium</Badge>;
    } else {
      return <Badge variant="outline">Low</Badge>;
    }
  };

  if (!job) return null;

  const canRetry = job.status === "failed" || job.status === "retrying";
  const canCancel = job.status === "pending" || job.status === "processing";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon(job.status)}
            <div>
              <SheetTitle>Job Details</SheetTitle>
              <SheetDescription>
                View and manage job execution details
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
                <label className="text-sm font-medium text-muted-foreground">Job ID</label>
                <p className="font-mono text-sm">{job.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(job.status)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Queue</label>
                <p className="capitalize">{job.queue}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p>{job.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                <div className="mt-1">
                  {getPriorityBadge(job.priority)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Attempts</label>
                <p>{job.attempts}/{job.maxAttempts}</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          {job.status === "processing" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Progress</label>
              <div className="space-y-2">
                <Progress value={job.progress} className="h-3" />
                <p className="text-sm text-muted-foreground">{job.progress}% complete</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {job.createdAt.toLocaleString()} ({formatDistanceToNow(job.createdAt, { addSuffix: true })})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {job.updatedAt.toLocaleString()} ({formatDistanceToNow(job.updatedAt, { addSuffix: true })})
                  </p>
                </div>
              </div>
              {job.processedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Processed</p>
                    <p className="text-sm text-muted-foreground">
                      {job.processedAt.toLocaleString()} ({formatDistanceToNow(job.processedAt, { addSuffix: true })})
                    </p>
                  </div>
                </div>
              )}
              {job.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-sm text-muted-foreground">
                      {job.completedAt.toLocaleString()} ({formatDistanceToNow(job.completedAt, { addSuffix: true })})
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Job Data */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Job Data</h3>
            <div className="bg-muted rounded-lg p-4">
              <pre className="text-sm overflow-auto max-h-40">
                {JSON.stringify(job.data, null, 2)}
              </pre>
            </div>
          </div>

          {/* Error */}
          {job.error && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-500">Error Details</h3>
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300">{job.error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {canRetry && (
              <Button 
                onClick={handleRetry} 
                disabled={isLoading}
                className="flex-1"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Job
              </Button>
            )}
            {canCancel && (
              <Button 
                onClick={handleCancel} 
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Job
              </Button>
            )}
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