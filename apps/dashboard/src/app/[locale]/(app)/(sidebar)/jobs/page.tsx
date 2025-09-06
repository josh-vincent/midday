import { ErrorFallback } from "@/components/error-fallback";
import { JobsHeader } from "@/components/jobs-header";
import { JobSheet } from "@/components/sheets/job-sheet";
import { DataTable } from "@/components/tables/jobs/data-table";
import { JobsSkeleton } from "@/components/tables/jobs/skeleton";
import { loadJobFilterParams } from "@/hooks/use-job-filter-params.server";
import { loadSortParams } from "@/hooks/use-sort-params.server";
import { HydrateClient, batchPrefetch, trpc, getQueryClient } from "@/trpc/server";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Jobs | ToCLD",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

// Summary card component
async function JobsSummaryCards() {
  const queryClient = getQueryClient();
  const summary = await queryClient.fetchQuery(trpc.job.summary.queryOptions());
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div className="border rounded-lg p-4">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Today's Jobs</h3>
        </div>
        <div className="text-2xl font-bold">{summary.today.total}</div>
        <p className="text-xs text-muted-foreground">
          {summary.today.completed} completed
        </p>
      </div>
      
      <div className="border rounded-lg p-4">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Pending Value</h3>
        </div>
        <div className="text-2xl font-bold">
          ${summary.pending.potentialRevenue.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground">
          Across {summary.pending.count} jobs
        </p>
      </div>
      
      <div className="border rounded-lg p-4">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">This Week</h3>
        </div>
        <div className="text-2xl font-bold">{summary.week.jobCount}</div>
        <p className="text-xs text-muted-foreground">
          ${summary.week.revenue.toLocaleString()} revenue
        </p>
      </div>
      
      <div className="border rounded-lg p-4">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Monthly Volume</h3>
        </div>
        <div className="text-2xl font-bold">{summary.month.volume} m³</div>
        <p className="text-xs text-muted-foreground">
          {summary.month.deliveries} deliveries
        </p>
      </div>
    </div>
  );
}

export default async function JobsPage(props: Props) {
  const searchParams = await props.searchParams;
  
  const filter = loadJobFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);

  // Prefetch job data
  batchPrefetch([
    trpc.job.list.infiniteQueryOptions({
      ...filter,
      sort,
    }),
  ]);

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6 pt-6">
        {/* Summary Cards */}
        <JobsSummaryCards />

        {/* Header with filters and create button */}
        <JobsHeader />

        {/* Data Table */}
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense fallback={<JobsSkeleton />}>
            <DataTable />
          </Suspense>
        </ErrorBoundary>
      </div>
      
      {/* Job Sheet for creating/editing jobs */}
      <JobSheet />
    </HydrateClient>
  );
}