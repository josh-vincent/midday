"use client";

import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Calendar } from "@midday/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@midday/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  Download, 
  Settings,
  Calendar as CalendarIcon,
  Briefcase,
  Users,
  Clock
} from "lucide-react";
import { useState } from "react";

type DateRange = {
  from: Date;
  to: Date;
};

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  priorityFilter?: string;
  onPriorityFilterChange?: (priority: string) => void;
  projectFilter?: string;
  onProjectFilterChange?: (project: string) => void;
  assigneeFilter?: string;
  onAssigneeFilterChange?: (assignee: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onCreateJob?: () => void;
  onManageProjects?: () => void;
  onTimeTracker?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  totalJobs?: number;
  activeJobs?: number;
};

const statuses = [
  { value: "pending", label: "Pending", color: "bg-gray-100 text-gray-700" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
  { value: "on_hold", label: "On Hold", color: "bg-yellow-100 text-yellow-700" },
  { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-100 text-gray-500" },
];

const priorities = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-700" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700" },
];

const projects = [
  { value: "proj_1", label: "Website Redesign" },
  { value: "proj_2", label: "Mobile App Development" },
  { value: "proj_3", label: "Marketing Campaign" },
  { value: "proj_4", label: "E-commerce Platform" },
  { value: "proj_5", label: "CRM Implementation" },
];

export function JobsHeader({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  projectFilter,
  onProjectFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  dateRange,
  onDateRangeChange,
  onCreateJob,
  onManageProjects,
  onTimeTracker,
  onExport,
  onRefresh,
  isRefreshing = false,
  totalJobs = 0,
  activeJobs = 0,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground mt-2">
            Manage your projects and track job progress
          </p>
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

          <Button
            variant="outline"
            size="sm"
            onClick={onTimeTracker}
          >
            <Clock className="h-4 w-4 mr-2" />
            Time Tracker
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onManageProjects}
          >
            <Settings className="h-4 w-4 mr-2" />
            Projects
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button size="sm" onClick={onCreateJob}>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Date Range Picker */}
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[260px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={{
                from: dateRange?.from,
                to: dateRange?.to,
              }}
              onSelect={(range: any) => {
                if (range?.from && range?.to) {
                  onDateRangeChange({ from: range.from, to: range.to });
                  setDatePickerOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {showFilters && (
          <>
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

            <Select
              value={priorityFilter || "all"}
              onValueChange={(value) => onPriorityFilterChange?.(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={projectFilter || "all"}
              onValueChange={(value) => onProjectFilterChange?.(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.value} value={project.value}>
                    {project.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Quick Stats */}
      {totalJobs > 0 && (
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4" />
            <span>{totalJobs} {totalJobs === 1 ? "job" : "jobs"}</span>
          </div>
          {activeJobs > 0 && (
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{activeJobs} active</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}