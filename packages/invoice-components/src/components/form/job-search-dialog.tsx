"use client";

import { useTRPC } from "../../context/dependencies-context";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Checkbox } from "@midday/ui/checkbox";
import { Calendar } from "@midday/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@midday/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Badge } from "@midday/ui/badge";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Separator } from "@midday/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@midday/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@midday/ui/collapsible";
import { Input } from "@midday/ui/input";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
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

interface JobSearchDialogProps {
  onJobsSelected: (jobs: SelectedJob[], options?: JobSelectionOptions) => void;
}

interface JobSelectionOptions {
  markAsInvoiced?: boolean;
  updateOnInvoiceCreation?: boolean;
  descriptionFields?: string[];
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

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const DESCRIPTION_FIELD_OPTIONS = [
  { label: "Job Number", value: "jobNumber" },
  { label: "Company Name", value: "companyName" },
  { label: "Address/Site", value: "addressSite" },
  { label: "Material Type", value: "materialType" },
  { label: "Job Date", value: "jobDate" },
  { label: "Contact Person", value: "contactPerson" },
  { label: "Notes", value: "notes" },
];

export function JobSearchDialog({ onJobsSelected }: JobSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    datePreset: "last7days",
  });
  const [markAsInvoiced, setMarkAsInvoiced] = useState(true);
  const [updateOnInvoiceCreation, setUpdateOnInvoiceCreation] = useState(false);
  const [descriptionFields, setDescriptionFields] = useState<string[]>(["jobNumber"]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | undefined>();
  const [customerSearch, setCustomerSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(true);

  const trpc = useTRPC();
  const { watch } = useFormContext();
  const currency = watch("template.currency");
  const invoiceCustomerId = watch("customerId");

  // Set the selected customer when dialog opens if there's a customer on the invoice
  React.useEffect(() => {
    if (open && invoiceCustomerId && !selectedCustomer) {
      setSelectedCustomer(invoiceCustomerId);
    }
  }, [open, invoiceCustomerId]);

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

  // Fetch customers
  const { data: customersResponse } = useQuery(
    trpc.customers.get.queryOptions(
      { limit: 100 },
      { enabled: open, staleTime: 5 * 60 * 1000 }
    )
  );

  const customers = customersResponse?.data || [];

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const search = customerSearch.toLowerCase();
    return customers.filter((customer) =>
      customer.name?.toLowerCase().includes(search)
    );
  }, [customers, customerSearch]);

  // Fetch jobs based on filters
  const { data: jobsData, isLoading } = useQuery(
    trpc.job.list.queryOptions(
      {
        customerId: selectedCustomer || null,
        status: filters.status || null,
        start: effectiveDateRange?.from ? format(effectiveDateRange.from, "yyyy-MM-dd") : null,
        end: effectiveDateRange?.to ? format(effectiveDateRange.to, "yyyy-MM-dd") : null,
        limit: 100,
      },
      {
        enabled: open,
        staleTime: 30 * 1000,
      }
    )
  );

  const jobs: Job[] = jobsData?.data || [];

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

  const buildJobDescription = (job: Job): string => {
    const parts: string[] = [];

    for (const field of descriptionFields) {
      const value = job[field as keyof Job];
      if (value) {
        if (field === "jobDate" && typeof value === "string") {
          parts.push(format(new Date(value), "MMM dd, yyyy"));
        } else {
          parts.push(String(value));
        }
      }
    }

    return parts.join(" - ") || job.jobNumber || `Job - ${job.companyName}` || "Untitled Job";
  };

  const handleAddToInvoice = () => {
    const selected: SelectedJob[] = selectedJobs.map((job) => ({
      id: job.id,
      name: buildJobDescription(job),
      companyName: job.companyName,
      price: job.totalAmount || job.estimatedCost || 0,
      quantity: 1,
      unit: job.unit || undefined,
    }));

    onJobsSelected(selected, {
      markAsInvoiced,
      updateOnInvoiceCreation,
      descriptionFields,
    });
    setSelectedJobIds(new Set());
    setOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="text-xs text-[#878787] font-mono h-auto py-1 px-2"
        >
          <Icons.Add className="h-3 w-3 mr-1" />
          <span className="text-[11px]">Add multiple jobs</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 h-[600px] md:max-w-[900px] lg:max-w-[1000px] flex flex-col">
        <DialogTitle className="sr-only">Select Jobs to Add to Invoice</DialogTitle>
        <DialogDescription className="sr-only">
          Search and select jobs to add as line items to your invoice.
        </DialogDescription>
        <div className="flex flex-1 overflow-hidden">
          <SidebarProvider className="flex flex-1">
            {/* Sidebar - Filters and Customers */}
            <Sidebar collapsible="none" className="hidden md:flex w-[250px] flex-shrink-0">
              <SidebarContent>
              {/* Filters */}
              <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SidebarGroup>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="cursor-pointer hover:bg-accent flex items-center justify-between">
                      <span>Filters</span>
                      <Icons.ChevronDown
                        className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                      />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent className="px-2 space-y-2">
                      {/* Date Range */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Date Range</label>
                        <Select
                          value={filters.datePreset || "last7days"}
                          onValueChange={(value) => {
                            setFilters((prev) => ({ ...prev, datePreset: value }));
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
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
                      </div>

                      {/* Status */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Status</label>
                        <Select
                          value={filters.status || "all"}
                          onValueChange={(value) => {
                            setFilters((prev) => ({ ...prev, status: value === "all" ? undefined : value }));
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-xs">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>

              {/* Description Options */}
              <Collapsible open={descriptionOpen} onOpenChange={setDescriptionOpen}>
                <SidebarGroup>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="cursor-pointer hover:bg-accent flex items-center justify-between">
                      <span>Description Fields</span>
                      <Icons.ChevronDown
                        className={`h-4 w-4 transition-transform ${descriptionOpen ? "rotate-180" : ""}`}
                      />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent className="px-2 space-y-2">
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">
                          Select fields to include in line item description
                        </label>
                        {DESCRIPTION_FIELD_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`desc-${option.value}`}
                              checked={descriptionFields.includes(option.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setDescriptionFields((prev) => [...prev, option.value]);
                                } else {
                                  setDescriptionFields((prev) => prev.filter((f) => f !== option.value));
                                }
                              }}
                            />
                            <label
                              htmlFor={`desc-${option.value}`}
                              className="text-xs cursor-pointer"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>

              {/* Customers List */}
              <Collapsible open={customersOpen} onOpenChange={setCustomersOpen}>
                <SidebarGroup>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="cursor-pointer hover:bg-accent flex items-center justify-between">
                      <span>Customers</span>
                      <Icons.ChevronDown
                        className={`h-4 w-4 transition-transform ${customersOpen ? "rotate-180" : ""}`}
                      />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      {/* Customer Search */}
                      <div className="px-2 pb-2">
                        <Input
                          type="text"
                          placeholder="Search customers..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => setSelectedCustomer(undefined)}
                            isActive={!selectedCustomer}
                          >
                            <Icons.Customers className="h-4 w-4" />
                            <span>All Customers</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        {filteredCustomers.map((customer) => (
                          <SidebarMenuItem key={customer.id}>
                            <SidebarMenuButton
                              onClick={() => setSelectedCustomer(customer.id)}
                              isActive={selectedCustomer === customer.id}
                            >
                              <Icons.Customers className="h-4 w-4" />
                              <span className="truncate">{customer.name}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
              </SidebarContent>
            </Sidebar>

            {/* Main Content - Jobs List */}
            <main className="flex flex-1 flex-col overflow-hidden">
              {/* Header */}
              <header className="flex h-14 flex-shrink-0 items-center justify-between gap-2 border-b px-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">
                  Jobs ({jobs.length})
                </h3>
                {jobs.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <Checkbox
                      checked={selectedJobIds.size === jobs.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <label
                      className="text-xs cursor-pointer"
                      onClick={handleSelectAll}
                    >
                      Select All
                    </label>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedJobIds.size} selected
              </div>
            </header>

              {/* Jobs List - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Loading jobs...
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No jobs found with current filters
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleToggleJob(job.id)}
                    >
                      <Checkbox
                        checked={selectedJobIds.has(job.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {job.jobNumber || job.companyName || "Untitled Job"}
                          </span>
                          {job.status && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {job.status}
                            </Badge>
                          )}
                        </div>
                        {job.companyName && job.jobNumber && (
                          <div className="text-xs text-muted-foreground truncate">
                            {job.companyName}
                          </div>
                        )}
                        {job.addressSite && (
                          <div className="text-xs text-muted-foreground truncate">
                            {job.addressSite}
                          </div>
                        )}
                        <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                          {job.materialType && (
                            <span>Material: {job.materialType}</span>
                          )}
                          {job.jobDate && (
                            <span>Date: {format(new Date(job.jobDate), "MMM dd, yyyy")}</span>
                          )}
                        </div>
                      </div>
                      <div className="font-mono text-sm font-medium">
                        {formatCurrency(job.totalAmount || job.estimatedCost || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>

              {/* Footer */}
              <div className="border-t p-4 space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedJobIds.size} job{selectedJobIds.size !== 1 ? "s" : ""} selected
                </span>
                <span className="font-mono font-semibold">
                  Total: {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="space-y-2">
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="update-on-creation"
                    checked={updateOnInvoiceCreation}
                    onCheckedChange={(checked) => setUpdateOnInvoiceCreation(checked === true)}
                  />
                  <label
                    htmlFor="update-on-creation"
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    Update jobs when invoice is created
                  </label>
                </div>
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
            </main>
          </SidebarProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
