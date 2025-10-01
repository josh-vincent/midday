"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Progress } from "@midday/ui/progress";
import { useToast } from "@midday/ui/use-toast";
import { 
  RefreshCw, 
  X, 
  Eye,
  RotateCcw,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { queueAPI, type MockJob } from "@/lib/mock/queue-mock";

export function JobsList() {
  const [jobs, setJobs] = useState<MockJob[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadJobs();
  }, [selectedQueue, selectedStatus]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const queue = selectedQueue === "all" ? undefined : selectedQueue;
      const status = selectedStatus === "all" ? undefined : selectedStatus;
      const data = await queueAPI.getJobs(queue, status);
      setJobs(data);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    await queueAPI.retryJob(jobId);
    toast({
      title: "Job Retried",
      description: `Job ${jobId} has been queued for retry`,
    });
    loadJobs();
  };

  const handleCancel = async (jobId: string) => {
    await queueAPI.cancelJob(jobId);
    toast({
      title: "Job Cancelled",
      description: `Job ${jobId} has been cancelled`,
    });
    loadJobs();
  };

  const getStatusIcon = (status: MockJob["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "retrying":
        return <RotateCcw className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatTime = (date: Date) => {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      Math.floor((date.getTime() - Date.now()) / 60000),
      "minute"
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Job Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Select value={selectedQueue} onValueChange={setSelectedQueue}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Queues</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="sync">Sync</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="retrying">Retrying</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadJobs} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>
            Showing {jobs.length} jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {getStatusIcon(job.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <p className="font-medium">{job.id}</p>
                      <Badge variant="outline" className="capitalize">
                        {job.queue}
                      </Badge>
                      <Badge variant="outline">
                        {job.type}
                      </Badge>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      <span>Priority: {job.priority}</span>
                      <span>Attempts: {job.attempts}/{job.maxAttempts}</span>
                      <span>Created: {formatTime(job.createdAt)}</span>
                    </div>
                    {job.error && (
                      <p className="text-sm text-red-500 mt-1">{job.error}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {job.status === "processing" && (
                    <div className="w-24">
                      <Progress value={job.progress} className="h-2" />
                      <span className="text-xs text-muted-foreground">{job.progress}%</span>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Job Details: {job.id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Job Data</h4>
                            <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-60">
                              {JSON.stringify(job.data, null, 2)}
                            </pre>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Queue:</span>
                              <p className="font-medium">{job.queue}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Type:</span>
                              <p className="font-medium">{job.type}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status:</span>
                              <p className="font-medium">{job.status}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Priority:</span>
                              <p className="font-medium">{job.priority}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Created:</span>
                              <p className="font-medium">{job.createdAt.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Updated:</span>
                              <p className="font-medium">{job.updatedAt.toLocaleString()}</p>
                            </div>
                          </div>
                          {job.error && (
                            <div>
                              <h4 className="font-medium mb-2 text-red-500">Error</h4>
                              <p className="bg-red-50 dark:bg-red-950 p-3 rounded text-sm">
                                {job.error}
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {(job.status === "failed" || job.status === "retrying") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetry(job.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}

                    {(job.status === "pending" || job.status === "processing") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(job.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}