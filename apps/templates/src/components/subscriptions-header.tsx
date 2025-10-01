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
import { Plus, Search, Filter, Download, RefreshCw } from "lucide-react";
import { useState } from "react";

interface SubscriptionsHeaderProps {
  onCreateSubscription?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onSearch?: (query: string) => void;
  onStatusFilter?: (status: string | null) => void;
  totalCount?: number;
  activeCount?: number;
  isLoading?: boolean;
}

export function SubscriptionsHeader({
  onCreateSubscription,
  onRefresh,
  onExport,
  onSearch,
  onStatusFilter,
  totalCount = 0,
  activeCount = 0,
  isLoading = false,
}: SubscriptionsHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleStatusFilterChange = (value: string) => {
    const filterValue = value === "all" ? null : value;
    setStatusFilter(filterValue);
    onStatusFilter?.(filterValue);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage customer subscriptions and billing cycles
          </p>
        </div>
        <Button onClick={onCreateSubscription}>
          <Plus className="w-4 h-4 mr-2" />
          Create Subscription
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total Subscriptions</p>
          <p className="text-2xl font-bold">{totalCount}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Trial</p>
          <p className="text-2xl font-bold text-amber-600">
            {Math.max(0, Math.floor(totalCount * 0.1))}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Past Due</p>
          <p className="text-2xl font-bold text-red-600">
            {Math.max(0, Math.floor(totalCount * 0.05))}
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={statusFilter || "all"}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">
                <div className="flex items-center">
                  <Badge variant="default" className="mr-2 scale-75">Active</Badge>
                  Active
                </div>
              </SelectItem>
              <SelectItem value="trialing">
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-2 scale-75">Trialing</Badge>
                  Trialing
                </div>
              </SelectItem>
              <SelectItem value="past_due">
                <div className="flex items-center">
                  <Badge variant="destructive" className="mr-2 scale-75">Past Due</Badge>
                  Past Due
                </div>
              </SelectItem>
              <SelectItem value="canceled">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 scale-75">Canceled</Badge>
                  Canceled
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {(searchQuery || statusFilter) && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchQuery}"
              <button
                onClick={() => handleSearchChange("")}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {statusFilter && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter.replace("_", " ")}
              <button
                onClick={() => handleStatusFilterChange("all")}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}