"use client";

import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@midday/ui/select";
import { Calendar } from "@midday/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import {
  Search,
  Calendar as CalendarIcon,
  Play,
  Plus,
  Download,
  RefreshCw,
  Filter,
  Clock,
  DollarSign,
  Users,
  Building,
  X
} from "lucide-react";

type Props = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  projectFilter: string;
  onProjectFilterChange: (value: string) => void;
  clientFilter: string;
  onClientFilterChange: (value: string) => void;
  billableFilter: string;
  onBillableFilterChange: (value: string) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  onStartTimer: () => void;
  onQuickEntry: () => void;
  onExport: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  totalEntries: number;
};

export function TimeHeader({
  searchQuery,
  onSearchChange,
  projectFilter,
  onProjectFilterChange,
  clientFilter,
  onClientFilterChange,
  billableFilter,
  onBillableFilterChange,
  dateRange,
  onDateRangeChange,
  onStartTimer,
  onQuickEntry,
  onExport,
  onRefresh,
  isRefreshing = false,
  totalEntries,
}: Props) {
  const hasFilters = searchQuery || projectFilter || clientFilter || billableFilter;

  const clearFilters = () => {
    onSearchChange("");
    onProjectFilterChange("");
    onClientFilterChange("");
    onBillableFilterChange("");
  };

  return (
    <div className="space-y-4">
      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">
            {totalEntries} time {totalEntries === 1 ? 'entry' : 'entries'}
            {hasFilters && ' (filtered)'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={onRefresh} variant="outline" size="sm" disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button onClick={onQuickEntry} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
          
          <Button onClick={onStartTimer} size="sm">
            <Play className="h-4 w-4 mr-2" />
            Start Timer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search time entries..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
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
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onDateRangeChange({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Project Filter */}
        <Select value={projectFilter} onValueChange={onProjectFilterChange}>
          <SelectTrigger className="w-[150px]">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <SelectValue placeholder="Project" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Projects</SelectItem>
            <SelectItem value="proj_1">Website Redesign</SelectItem>
            <SelectItem value="proj_2">Mobile App</SelectItem>
            <SelectItem value="proj_3">Marketing Campaign</SelectItem>
            <SelectItem value="proj_4">E-commerce Platform</SelectItem>
            <SelectItem value="proj_5">CRM Implementation</SelectItem>
          </SelectContent>
        </Select>

        {/* Client Filter */}
        <Select value={clientFilter} onValueChange={onClientFilterChange}>
          <SelectTrigger className="w-[150px]">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <SelectValue placeholder="Client" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Clients</SelectItem>
            <SelectItem value="client_1">Acme Corporation</SelectItem>
            <SelectItem value="client_2">TechStart Inc</SelectItem>
            <SelectItem value="client_3">Global Services Ltd</SelectItem>
            <SelectItem value="client_4">Digital Agency Co</SelectItem>
            <SelectItem value="client_5">Enterprise Solutions</SelectItem>
          </SelectContent>
        </Select>

        {/* Billable Filter */}
        <Select value={billableFilter} onValueChange={onBillableFilterChange}>
          <SelectTrigger className="w-[140px]">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <SelectValue placeholder="Billing" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Entries</SelectItem>
            <SelectItem value="billable">Billable</SelectItem>
            <SelectItem value="non-billable">Non-billable</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              <Search className="h-3 w-3" />
              Search: {searchQuery}
              <button onClick={() => onSearchChange("")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {projectFilter && (
            <Badge variant="secondary" className="gap-1">
              <Building className="h-3 w-3" />
              Project filter
              <button onClick={() => onProjectFilterChange("")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {clientFilter && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              Client filter
              <button onClick={() => onClientFilterChange("")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {billableFilter && (
            <Badge variant="secondary" className="gap-1">
              <DollarSign className="h-3 w-3" />
              {billableFilter === "billable" ? "Billable only" : "Non-billable only"}
              <button onClick={() => onBillableFilterChange("")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}