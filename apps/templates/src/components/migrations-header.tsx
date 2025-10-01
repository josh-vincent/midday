"use client";

import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Badge } from "@midday/ui/badge";
import { Search, Filter, RefreshCw, Plus, Play, History } from "lucide-react";
import { useState } from "react";
import type { MockMigration } from "@/lib/mock/database-mock";

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh?: () => void;
  onCreateMigration?: () => void;
  onRunAllPending?: () => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  migrations?: MockMigration[];
  isRefreshing?: boolean;
};

export function MigrationsHeader({
  searchQuery,
  onSearchChange,
  onRefresh,
  onCreateMigration,
  onRunAllPending,
  statusFilter,
  onStatusFilterChange,
  migrations = [],
  isRefreshing = false,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);

  const statusCounts = {
    applied: migrations.filter(m => m.status === "applied").length,
    pending: migrations.filter(m => m.status === "pending").length,
    failed: migrations.filter(m => m.status === "failed").length,
  };

  const statuses = [
    { value: "applied", label: "Applied", color: "bg-green-100 text-green-700" },
    { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
    { value: "failed", label: "Failed", color: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="space-y-4">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Migrations</h2>
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-muted-foreground">
              {migrations.length} {migrations.length === 1 ? "migration" : "migrations"}
            </p>
            <div className="flex items-center space-x-2">
              {statuses.map((status) => {
                const count = statusCounts[status.value as keyof typeof statusCounts];
                if (count === 0) return null;
                return (
                  <Badge
                    key={status.value}
                    variant="outline"
                    className={`text-xs ${status.color}`}
                  >
                    {count} {status.label.toLowerCase()}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {statusCounts.pending > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRunAllPending}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Pending ({statusCounts.pending})
            </Button>
          )}

          <Button size="sm" onClick={onCreateMigration}>
            <Plus className="h-4 w-4 mr-2" />
            Create Migration
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search migrations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {showFilters && (
          <div className="flex items-center space-x-2">
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => onStatusFilterChange?.(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}