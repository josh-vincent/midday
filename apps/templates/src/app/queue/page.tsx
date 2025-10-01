"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { QueueStatsCards } from "@/components/queue-stats-cards";
import { QueueJobsHeader } from "@/components/queue-jobs-header";
import { WorkersHeader } from "@/components/workers-header";
import { QueueJobsDataTable } from "@/components/tables/queue-jobs/data-table";
import { WorkersDataTable } from "@/components/tables/workers/data-table";
import { QueueOverview } from "@/components/queue/queue-overview";
import { QueueMetrics } from "@/components/queue/queue-metrics";
import { DeadLetterQueue } from "@/components/queue/dead-letter-queue";
import { JobDetailsSheet } from "@/components/sheets/job-details-sheet";
import { CreateJobSheet } from "@/components/sheets/create-job-sheet";
import { WorkerSheet } from "@/components/sheets/worker-sheet";

export default function QueuePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedQueue, setSelectedQueue] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedWorkerStatus, setSelectedWorkerStatus] = useState("all");

  const handleRefreshJobs = () => {
    window.location.reload();
  };

  const handleRefreshWorkers = () => {
    window.location.reload();
  };

  const handleCreateJob = () => {
    // Handled by the CreateJobSheet component
  };

  const handleAddWorker = () => {
    // Handled by worker management
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Queue Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage background job processing with Bull queue system
        </p>
      </div>

      {/* Stats Cards */}
      <QueueStatsCards />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="dlq">Dead Letter</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <QueueOverview />
        </TabsContent>

        <TabsContent value="jobs" className="mt-6 space-y-6">
          <QueueJobsHeader
            onQueueChange={setSelectedQueue}
            onStatusChange={setSelectedStatus}
            onRefresh={handleRefreshJobs}
            onCreateJob={handleCreateJob}
            selectedQueue={selectedQueue}
            selectedStatus={selectedStatus}
          />
          <QueueJobsDataTable
            queueFilter={selectedQueue === "all" ? undefined : selectedQueue}
            statusFilter={selectedStatus === "all" ? undefined : selectedStatus}
          />
        </TabsContent>

        <TabsContent value="workers" className="mt-6 space-y-6">
          <WorkersHeader
            onStatusChange={setSelectedWorkerStatus}
            onRefresh={handleRefreshWorkers}
            onAddWorker={handleAddWorker}
            selectedStatus={selectedWorkerStatus}
          />
          <WorkersDataTable
            statusFilter={selectedWorkerStatus === "all" ? undefined : selectedWorkerStatus}
          />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <QueueMetrics />
        </TabsContent>

        <TabsContent value="dlq" className="mt-6">
          <DeadLetterQueue />
        </TabsContent>
      </Tabs>

      {/* Sheet Components */}
      <JobDetailsSheet />
      <CreateJobSheet />
      <WorkerSheet />
    </div>
  );
}