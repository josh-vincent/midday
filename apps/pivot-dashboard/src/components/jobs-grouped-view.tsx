"use client";

import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@midday/ui/collapsible";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { Calendar, ChevronDown, FileText, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Job {
  id: string;
  jobNumber: string;
  contactPerson?: string;
  contactNumber?: string;
  rego?: string;
  loadNumber?: number;
  companyName?: string;
  addressSite?: string;
  equipmentType?: string;
  materialType?: string;
  pricePerUnit?: number;
  cubicMetreCapacity?: number;
  jobDate?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  totalAmount?: number;
  customerId: string;
  customerName?: string;
  createdAt: string;
  updatedAt?: string;
}

interface GroupedJobs {
  customerId: string;
  customerName: string;
  monthYear: string;
  jobs: Job[];
  totalAmount: number;
  jobCount: number;
}

interface JobsGroupedViewProps {
  jobs: Job[];
}

export function JobsGroupedView({ jobs }: JobsGroupedViewProps) {
  const router = useRouter();
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group jobs by customer and month
  const groupedJobs = jobs.reduce<Record<string, GroupedJobs>>((acc, job) => {
    if (!job.customerId || !job.jobDate) return acc;

    const monthYear = format(parseISO(job.jobDate), "yyyy-MM");
    const groupKey = `${job.customerId}-${monthYear}`;

    if (!acc[groupKey]) {
      acc[groupKey] = {
        customerId: job.customerId,
        customerName: job.customerName || job.companyName || "Unknown Customer",
        monthYear,
        jobs: [],
        totalAmount: 0,
        jobCount: 0,
      };
    }

    acc[groupKey].jobs.push(job);
    const jobAmount = (job.pricePerUnit || 0) * (job.cubicMetreCapacity || 0);
    acc[groupKey].totalAmount += jobAmount;
    acc[groupKey].jobCount += 1;

    return acc;
  }, {});

  const sortedGroups = Object.entries(groupedJobs).sort((a, b) => {
    // Sort by date descending, then by customer name
    const dateCompare = b[1].monthYear.localeCompare(a[1].monthYear);
    if (dateCompare !== 0) return dateCompare;
    return a[1].customerName.localeCompare(b[1].customerName);
  });

  const handleSelectGroup = (groupKey: string, checked: boolean) => {
    const newSelection = new Set(selectedGroups);
    if (checked) {
      newSelection.add(groupKey);
    } else {
      newSelection.delete(groupKey);
    }
    setSelectedGroups(newSelection);
  };

  const handleToggleExpand = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const handleCreateInvoices = () => {
    const selectedGroupData = Array.from(selectedGroups).map((key) => {
      const group = groupedJobs[key];
      return {
        customerId: group.customerId,
        customerName: group.customerName,
        jobIds: group.jobs.map((j) => j.id),
        totalAmount: group.totalAmount,
        monthYear: group.monthYear,
      };
    });

    // Store in sessionStorage for the invoice creation page
    sessionStorage.setItem(
      "bulkInvoiceData",
      JSON.stringify(selectedGroupData),
    );

    // Navigate to invoice page and open creation sheet with bulk data
    router.push("/invoices?type=create&bulk=true");
  };

  const completedJobsOnly = (group: GroupedJobs) =>
    group.jobs.filter((j) => j.status === "completed");

  return (
    <div className="space-y-4">
      {selectedGroups.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedGroups.size} group{selectedGroups.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <Button onClick={handleCreateInvoices}>
            <FileText className="mr-2 h-4 w-4" />
            Create Invoice{selectedGroups.size > 1 ? "s" : ""}
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {sortedGroups.map(([groupKey, group]) => {
          const isExpanded = expandedGroups.has(groupKey);
          const isSelected = selectedGroups.has(groupKey);
          const completedJobs = completedJobsOnly(group);
          const hasCompletedJobs = completedJobs.length > 0;

          return (
            <Card
              key={groupKey}
              className={cn(
                "transition-colors",
                isSelected && "ring-2 ring-primary",
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      disabled={!hasCompletedJobs}
                      onCheckedChange={(checked) =>
                        handleSelectGroup(groupKey, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <CardTitle className="text-base font-medium">
                        {group.customerName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(`${group.monthYear}-01`), "MMMM yyyy")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        ${group.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {completedJobs.length} completed / {group.jobCount}{" "}
                        total
                      </div>
                    </div>
                    <Collapsible open={isExpanded}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleExpand(groupKey)}
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </Collapsible>
                  </div>
                </div>
              </CardHeader>

              <Collapsible open={isExpanded}>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {group.jobs.map((job) => {
                        const jobAmount =
                          (job.pricePerUnit || 0) *
                          (job.cubicMetreCapacity || 0);
                        return (
                          <div
                            key={job.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md",
                              job.status === "completed"
                                ? "bg-muted/30"
                                : "bg-muted/10 opacity-60",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="text-sm font-medium">
                                  #{job.jobNumber}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {job.addressSite || "No address"}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {job.materialType && (
                                <Badge variant="outline" className="text-xs">
                                  <Package className="mr-1 h-3 w-3" />
                                  {job.materialType}
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  job.status === "completed"
                                    ? "success"
                                    : job.status === "in_progress"
                                      ? "default"
                                      : job.status === "cancelled"
                                        ? "destructive"
                                        : "secondary"
                                }
                              >
                                {job.status.replace("_", " ")}
                              </Badge>
                              <div className="text-sm font-medium min-w-[80px] text-right">
                                ${jobAmount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!hasCompletedJobs && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          No completed jobs to invoice in this group
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {sortedGroups.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No jobs available for grouping
          </CardContent>
        </Card>
      )}
    </div>
  );
}
