"use client";

import { JobsActions } from "@/components/jobs-actions";
import { JobsCSVImporter } from "@/components/import/jobs-csv-importer";
import { JobsGroupedView } from "@/components/jobs-grouped-view";
import { JobsMonthlyVolume } from "@/components/jobs-monthly-volume";
import { JobsPending } from "@/components/jobs-pending";
import { JobsSearchFilter } from "@/components/jobs-search-filter";
import { JobsToday } from "@/components/jobs-today";
import { JobsWeekSummary } from "@/components/jobs-week-summary";
import { JobCreateSheet } from "@/components/sheets/job-create-sheet";
import { JobsTable } from "@/components/tables/jobs-table";
import { Button } from "@midday/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@midday/ui/toggle-group";
import { LayoutGrid, List, Upload } from "lucide-react";
import { useState } from "react";

type Job = {
  id: string;
  jobNumber: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  rego?: string | null;
  loadNumber?: number | null;
  companyName?: string | null;
  addressSite?: string | null;
  equipmentType?: string | null;
  materialType?: string | null;
  pricePerUnit?: number | null;
  cubicMetreCapacity?: number | null;
  jobDate?: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  totalAmount?: number | null;
  customerId?: string | null;
  createdAt: string;
  customer?: {
    id: string;
    name: string | null;
  };
};

type Summary = {
  today: {
    total: number;
    completed: number;
  };
  week: {
    revenue: number;
    jobCount: number;
  };
  pending: {
    count: number;
    potentialRevenue: number;
  };
  month: {
    volume: number;
    deliveries: number;
  };
};

interface JobsPageClientProps {
  initialJobs: Job[];
  initialSummary: Summary;
}

export function JobsPageClient({
  initialJobs,
  initialSummary,
}: JobsPageClientProps) {
  const [viewMode, setViewMode] = useState<"table" | "grouped">("table");
  const [showImporter, setShowImporter] = useState(false);
  const [jobs] = useState(initialJobs);
  const [summary] = useState(initialSummary);

  // Transform jobs to include customer name for compatibility
  const transformedJobs = jobs.map((job) => ({
    ...job,
    customerName: job.customer?.name || job.companyName || "Unknown",
    // Convert numeric values if needed
    pricePerUnit: Number(job.pricePerUnit) || 0,
    cubicMetreCapacity: Number(job.cubicMetreCapacity) || 0,
    totalAmount: Number(job.totalAmount) || 0,
    loadNumber: Number(job.loadNumber) || 1,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
        <JobsToday summary={summary.today} />
        <JobsWeekSummary summary={summary.week} />
        <JobsPending summary={summary.pending} />
        <JobsMonthlyVolume summary={summary.month} />
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <JobsSearchFilter />
          <Button variant="outline" onClick={() => setShowImporter(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) =>
              value && setViewMode(value as "table" | "grouped")
            }
          >
            <ToggleGroupItem value="table" aria-label="Table view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grouped" aria-label="Grouped view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <JobsActions jobs={transformedJobs} />
      </div>

      {/* Table or Grouped View */}
      {viewMode === "table" ? (
        <JobsTable jobs={transformedJobs} />
      ) : (
        <JobsGroupedView jobs={transformedJobs} />
      )}

      <JobCreateSheet />
      <JobsCSVImporter open={showImporter} onOpenChange={setShowImporter} />
    </div>
  );
}
