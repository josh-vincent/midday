"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { 
  Plus, 
  RefreshCw, 
  Search,
  Filter,
  Download
} from "lucide-react";

interface QueueJobsHeaderProps {
  onQueueChange: (queue: string) => void;
  onStatusChange: (status: string) => void;
  onRefresh: () => void;
  onCreateJob: () => void;
  selectedQueue?: string;
  selectedStatus?: string;
}

export function QueueJobsHeader({
  onQueueChange,
  onStatusChange,
  onRefresh,
  onCreateJob,
  selectedQueue = "all",
  selectedStatus = "all",
}: QueueJobsHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateJob = () => {
    const event = new CustomEvent('open-create-job');
    window.dispatchEvent(event);
    onCreateJob();
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Jobs</h2>
          <p className="text-muted-foreground">
            Monitor and manage background job processing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleCreateJob}>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Queue Filter */}
            <div className="min-w-[160px]">
              <Select value={selectedQueue} onValueChange={onQueueChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Queues" />
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
            </div>

            {/* Status Filter */}
            <div className="min-w-[160px]">
              <Select value={selectedStatus} onValueChange={onStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
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
            </div>

            {/* Export */}
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}