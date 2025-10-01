"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@midday/ui/alert";
import { useToast } from "@midday/ui/use-toast";
import { 
  AlertCircle, 
  RotateCcw, 
  Trash2, 
  Eye,
  Archive,
  ChevronRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";

export function DeadLetterQueue() {
  const { toast } = useToast();

  const deadLetterJobs = [
    {
      id: "dlq_1",
      originalId: "job_101",
      queue: "email",
      type: "send",
      failedAt: new Date(Date.now() - 86400000),
      attempts: 5,
      error: "SMTP connection failed: Unable to connect to mail server",
      data: { to: "user@example.com", subject: "Important Update" },
    },
    {
      id: "dlq_2",
      originalId: "job_245",
      queue: "webhook",
      type: "delivery",
      failedAt: new Date(Date.now() - 172800000),
      attempts: 5,
      error: "HTTP 404: Webhook endpoint not found",
      data: { url: "https://api.client.com/old-webhook", event: "payment.completed" },
    },
    {
      id: "dlq_3",
      originalId: "job_367",
      queue: "sync",
      type: "full-sync",
      failedAt: new Date(Date.now() - 259200000),
      attempts: 3,
      error: "Rate limit exceeded: Too many requests to external API",
      data: { provider: "stripe", accountId: "acc_456" },
    },
  ];

  const handleRetryAll = () => {
    toast({
      title: "Retrying All Jobs",
      description: `${deadLetterJobs.length} jobs queued for retry`,
    });
  };

  const handlePurgeAll = () => {
    toast({
      title: "Dead Letter Queue Purged",
      description: "All failed jobs have been removed",
      variant: "destructive",
    });
  };

  const handleRetryJob = (jobId: string) => {
    toast({
      title: "Job Retried",
      description: `Job ${jobId} has been requeued`,
    });
  };

  const handleDeleteJob = (jobId: string) => {
    toast({
      title: "Job Deleted",
      description: `Job ${jobId} has been permanently removed`,
      variant: "destructive",
    });
  };

  const formatAge = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Dead Letter Queue</AlertTitle>
        <AlertDescription>
          These jobs have failed multiple times and require manual intervention.
          Review the errors and either retry or remove them.
        </AlertDescription>
      </Alert>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{deadLetterJobs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Oldest Job</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">3 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Most Failed Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Email</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">4.3</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>
            Apply actions to all jobs in the dead letter queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={handleRetryAll}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry All Jobs
            </Button>
            <Button variant="outline" onClick={() => toast({ title: "Exporting jobs..." })}>
              <Archive className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
            <Button variant="destructive" onClick={handlePurgeAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              Purge All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Failed Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Failed Jobs</CardTitle>
          <CardDescription>
            Jobs that have exceeded their retry limit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deadLetterJobs.map((job) => (
              <div key={job.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{job.originalId}</p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="capitalize">
                          {job.queue}
                        </Badge>
                        <Badge variant="outline">
                          {job.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Failed {formatAge(job.failedAt)} • {job.attempts} attempts
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Failed Job Details</DialogTitle>
                          <DialogDescription>
                            {job.originalId}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Error Message</h4>
                            <p className="bg-red-50 dark:bg-red-950 p-3 rounded text-sm">
                              {job.error}
                            </p>
                          </div>
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
                              <span className="text-muted-foreground">Failed At:</span>
                              <p className="font-medium">{job.failedAt.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Attempts:</span>
                              <p className="font-medium">{job.attempts}</p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetryJob(job.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {job.error}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}