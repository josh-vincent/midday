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
  Settings,
  Power
} from "lucide-react";

interface WorkersHeaderProps {
  onStatusChange: (status: string) => void;
  onRefresh: () => void;
  onAddWorker: () => void;
  selectedStatus?: string;
}

export function WorkersHeader({
  onStatusChange,
  onRefresh,
  onAddWorker,
  selectedStatus = "all",
}: WorkersHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddWorker = () => {
    const event = new CustomEvent('open-add-worker');
    window.dispatchEvent(event);
    onAddWorker();
  };

  const handleConfigureWorkers = () => {
    // Open workers configuration dialog
    console.log("Configure workers");
  };

  const handleManageWorkers = () => {
    // Open bulk worker management
    console.log("Manage workers");
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workers</h2>
          <p className="text-muted-foreground">
            Monitor and manage queue processing workers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleConfigureWorkers}>
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
          <Button onClick={handleAddWorker}>
            <Plus className="mr-2 h-4 w-4" />
            Add Worker
          </Button>
        </div>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="min-w-[160px]">
              <Select value={selectedStatus} onValueChange={onStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            <Button variant="outline" onClick={handleManageWorkers}>
              <Power className="mr-2 h-4 w-4" />
              Bulk Actions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}