"use client";

import { useTRPC } from "../../context/dependencies-context";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Checkbox } from "@midday/ui/checkbox";
import { Calendar } from "@midday/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@midday/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@midday/ui/command";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

// Helper functions for date calculations
const subDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

const startOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day;
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() + (6 - day);
  result.setDate(diff);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
};

interface BulkJobSelectorProps {
  onJobsSelected: (jobs: SelectedJob[], markAsInvoiced?: boolean) => void;
}

interface SelectedJob {
  id: string;
  name: string;
  companyName: string | null;
  price: number;
  quantity: number;
  unit?: string;
}

interface Job {
  id: string;
  jobNumber?: string | null;
  companyName?: string | null;
  addressSite?: string | null;
  status?: string | null;
  totalAmount?: number | null;
  estimatedCost?: number | null;
  materialType?: string | null;
  jobDate?: string | null;
  unit?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
}

interface FilterState {
  customerId?: string;
  dateRange?: DateRange;
  status?: string;
  datePreset?: string;
}

const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "last7days" },
  { label: "This week", value: "thisweek" },
  { label: "Last week", value: "lastweek" },
  { label: "This month", value: "thismonth" },
  { label: "Last month", value: "lastmonth" },
  { label: "Last 30 days", value: "last30days" },
  { label: "Last 90 days", value: "last90days" },
  { label: "Custom range", value: "custom" },
];

// Internal component with the selector UI
function BulkJobSelectorUI({
  onJobsSelected,
  onClose,
  expandedView = false,
  onExpand,
}: {
  onJobsSelected: (jobs: SelectedJob[], markAsInvoiced?: boolean) => void;
  onClose?: () => void;
  expandedView?: boolean;
  onExpand?: () => void;
}) {
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    datePreset: "last7days",
  });
  const [showFilters, setShowFilters] = useState(true);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [markAsInvoiced, setMarkAsInvoiced] = useState(true);

  const trpc = useTRPC();
  const { watch } = useFormContext();
  const currency = watch("template.currency");

  // Apply date preset
  const getDateRangeFromPreset = (preset: string): DateRange | undefined => {
    const today = new Date();
    switch (preset) {
      case "today":
        return { from: today, to: today };
      case "yesterday":
        const yesterday = subDays(today, 1);
        return { from: yesterday, to: yesterday };
      case "last7days":
        return { from: subDays(today, 7), to: today };
      case "thisweek":
        return { from: startOfWeek(today), to: endOfWeek(today) };
      case "lastweek":
        const lastWeekStart = startOfWeek(subDays(today, 7));
        const lastWeekEnd = endOfWeek(subDays(today, 7));
        return { from: lastWeekStart, to: lastWeekEnd };
      case "thismonth":
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case "lastmonth":
        const lastMonthStart = startOfMonth(subDays(today, 30));
        const lastMonthEnd = endOfMonth(subDays(today, 30));
        return { from: lastMonthStart, to: lastMonthEnd };
      case "last30days":
        return { from: subDays(today, 30), to: today };
      case "last90days":
        return { from: subDays(today, 90), to: today };
      default:
        return undefined;
    }
  };

  const effectiveDateRange = filters.datePreset === "custom"
    ? filters.dateRange
    : getDateRangeFromPreset(filters.datePreset || "last7days");

  // Fetch customers for filter
  const { data: customersResponse } = useQuery(
    trpc.customers.get.queryOptions(
      { q: customerSearchQuery, limit: 50 },
      { enabled: customerSearchOpen, staleTime: 5 * 60 * 1000 }
    )
  );

  const customers = customersResponse?.data || [];

  // Fetch jobs based on filters
  const { data: jobsData, isLoading } = useQuery(
    trpc.job.list.queryOptions(
      {
        customerId: filters.customerId || null,
        status: filters.status || null,
        start: effectiveDateRange?.from ? format(effectiveDateRange.from, "yyyy-MM-dd") : null,
        end: effectiveDateRange?.to ? format(effectiveDateRange.to, "yyyy-MM-dd") : null,
        limit: 100,
      },
      {
        staleTime: 30 * 1000,
      }
    )
  );

  const jobs: Job[] = jobsData?.data || [];

  // Get selected customer name
  const selectedCustomer = customers.find((c) => c.id === filters.customerId);

  // Calculate totals
  const selectedJobs = useMemo(() => {
    return jobs.filter((job) => selectedJobIds.has(job.id));
  }, [jobs, selectedJobIds]);

  const totalAmount = useMemo(() => {
    return selectedJobs.reduce((sum, job) => sum + (job.totalAmount || job.estimatedCost || 0), 0);
  }, [selectedJobs]);

  const handleToggleJob = (jobId: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedJobIds.size === jobs.length) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(jobs.map((j) => j.id)));
    }
  };

  const handleAddToInvoice = () => {
    const selected: SelectedJob[] = selectedJobs.map((job) => ({
      id: job.id,
      name: job.jobNumber || `Job - ${job.companyName}` || "Untitled Job",
      companyName: job.companyName,
      price: job.totalAmount || job.estimatedCost || 0,
      quantity: 1,
      unit: job.unit || undefined,
    }));

    onJobsSelected(selected, markAsInvoiced);
    setSelectedJobIds(new Set());
    if (onClose) onClose();
  };

  const handleClearFilters = () => {
    setFilters({ datePreset: "last7days" });
    setSelectedJobIds(new Set());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  // Get active filter count
  const activeFilterCount = [
    filters.customerId,
    filters.status && filters.status !== "all",
    filters.datePreset !== "last7days",
  ].filter(Boolean).length;

  // Get filter display text
  const getDatePresetLabel = () => {
    const preset = DATE_PRESETS.find(p => p.value === filters.datePreset);
    return preset?.label || "Last 7 days";
  };

  return (
    <div className={`flex flex-col ${expandedView ? "h-full max-h-full overflow-auto" : "max-h-[500px]"}`}>
      {/* Header - Fixed */}
      <div className="border-b flex-shrink-0">
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${expandedView ? "text-base" : "text-sm"}`}>
              Select Jobs to Add to Invoice
            </h3>

            {/* Filter Badges - Show when filters are collapsed */}
            {!showFilters && activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCustomer && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    Customer: {selectedCustomer.name}
                  </Badge>
                )}
                {filters.status && filters.status !== "all" && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    Status: {filters.status}
                  </Badge>
                )}
                {filters.datePreset !== "last7days" && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    {getDatePresetLabel()}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 ml-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Icons.Settings className="h-4 w-4 mr-1" />
              {showFilters ? "Hide" : "Filters"}
              {!showFilters && activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {!expandedView && onExpand && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onExpand}
              >
                <Icons.ExpandContent className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 pb-4 space-y-2">
            {/* Customer Filter */}
            <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between text-xs h-8"
                >
                  {selectedCustomer?.name || "All Customers"}
                  <Icons.ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search customers..."
                    value={customerSearchQuery}
                    onValueChange={setCustomerSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No customers found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setFilters((prev) => ({ ...prev, customerId: undefined }));
                          setCustomerSearchOpen(false);
                        }}
                      >
                        All Customers
                      </CommandItem>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          onSelect={() => {
                            setFilters((prev) => ({ ...prev, customerId: customer.id }));
                            setCustomerSearchOpen(false);
                          }}
                        >
                          {customer.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Date Range Filter */}
            <div className="flex gap-2">
              <Select
                value={filters.datePreset || "last7days"}
                onValueChange={(value) => {
                  setFilters((prev) => ({ ...prev, datePreset: value }));
                }}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value} className="text-xs">
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filters.datePreset === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="text-xs h-8 flex-1">
                      {effectiveDateRange?.from ? (
                        effectiveDateRange.to ? (
                          <>
                            {format(effectiveDateRange.from, "LLL dd")} -{" "}
                            {format(effectiveDateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(effectiveDateRange.from, "LLL dd, y")
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
                      defaultMonth={effectiveDateRange?.from}
                      selected={effectiveDateRange}
                      onSelect={(range) => {
                        setFilters((prev) => ({ ...prev, dateRange: range }));
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => {
                setFilters((prev) => ({ ...prev, status: value === "all" ? undefined : value }));
              }}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="w-full text-xs h-7"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Select All - Sticky */}
      {!isLoading && jobs.length > 0 && (
        <div className="border-b px-4 py-2 flex-shrink-0">
          <div className="flex items-center">
            <Checkbox
              checked={selectedJobIds.size === jobs.length}
              onCheckedChange={handleSelectAll}
              className="mr-2"
            />
            <span className="text-xs font-semibold">
              Select All ({jobs.length} jobs)
            </span>
          </div>
        </div>
      )}

      {/* Jobs List - Scrollable */}
      <div className="overflow-y-auto px-2 flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No jobs found with current filters
          </div>
        ) : (
          <div className="space-y-1 py-2">
            {/* Job Items */}
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`flex items-center p-2 rounded hover:bg-accent cursor-pointer ${
                  expandedView ? "gap-3" : ""
                }`}
                onClick={() => handleToggleJob(job.id)}
              >
                <Checkbox
                  checked={selectedJobIds.has(job.id)}
                  onCheckedChange={() => handleToggleJob(job.id)}
                  className="mr-2"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium truncate ${expandedView ? "text-sm" : "text-xs"}`}>
                      {job.jobNumber || job.companyName || "Untitled Job"}
                    </span>
                    {job.status && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {job.status}
                      </Badge>
                    )}
                  </div>
                  {job.companyName && job.jobNumber && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {job.companyName}
                    </div>
                  )}
                  {job.addressSite && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {job.addressSite}
                    </div>
                  )}
                  {expandedView && (
                    <>
                      {job.materialType && (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Material: {job.materialType}
                        </div>
                      )}
                      {job.jobDate && (
                        <div className="text-[10px] text-muted-foreground">
                          Date: {format(new Date(job.jobDate), "MMM dd, yyyy")}
                        </div>
                      )}
                      {job.contactPerson && (
                        <div className="text-[10px] text-muted-foreground">
                          Contact: {job.contactPerson}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className={`font-mono ${expandedView ? "text-sm" : "text-xs"}`}>
                  {formatCurrency(job.totalAmount || job.estimatedCost || 0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Fixed */}
      <div className="border-t p-4 space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {selectedJobIds.size} job{selectedJobIds.size !== 1 ? "s" : ""} selected
          </span>
          <span className="font-mono font-semibold">
            Total: {formatCurrency(totalAmount)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="mark-as-invoiced"
            checked={markAsInvoiced}
            onCheckedChange={(checked) => setMarkAsInvoiced(checked === true)}
          />
          <label
            htmlFor="mark-as-invoiced"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            Link jobs to this invoice (mark as invoiced)
          </label>
        </div>
        <Button
          type="button"
          onClick={handleAddToInvoice}
          disabled={selectedJobIds.size === 0}
          className="w-full"
        >
          Add {selectedJobIds.size} Job{selectedJobIds.size !== 1 ? "s" : ""} to Invoice
        </Button>
      </div>
    </div>
  );
}

// Main export component with both popover and modal
export function BulkJobSelector({ onJobsSelected }: BulkJobSelectorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Popover Version */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="text-xs text-[#878787] font-mono h-auto py-1 px-2"
          >
            <Icons.Add className="h-3 w-3 mr-1" />
            <span className="text-[11px]">Add multiple jobs</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start" sideOffset={5}>
          <BulkJobSelectorUI
            onJobsSelected={onJobsSelected}
            onClose={() => setPopoverOpen(false)}
            expandedView={false}
            onExpand={() => {
              setPopoverOpen(false);
              setModalOpen(true);
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Modal Version */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Select Jobs to Add to Invoice</DialogTitle>
          <BulkJobSelectorUI
            onJobsSelected={onJobsSelected}
            onClose={() => setModalOpen(false)}
            expandedView={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}