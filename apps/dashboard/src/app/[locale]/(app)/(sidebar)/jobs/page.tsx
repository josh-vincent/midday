import { ErrorFallback } from "@/components/error-fallback";
import { JobsHeader } from "@/components/jobs-header";
import { JobsBulkActionsPopup } from "@/components/jobs-bulk-actions-popup";
import { JobsMonthlyVolume } from "@/components/jobs-monthly-volume";
import { JobsPending } from "@/components/jobs-pending";
import { JobsToday } from "@/components/jobs-today";
import { JobsWeekSummary } from "@/components/jobs-week-summary";
import { CustomerCreateSheet } from "@/components/sheets/customer-create-sheet";
import { JobCreateSheet } from "@/components/sheets/job-create-sheet";
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
      <JobsToday summary={summary.today} />
      <JobsWeekSummary summary={summary.week} />
      <JobsPending summary={summary.pending} />
      <JobsMonthlyVolume summary={summary.month} />
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
      <JobCreateSheet />
      
      {/* Customer Create Sheet for linking companies */}
      <CustomerCreateSheet />
      
      {/* Bulk Actions Popup */}
      <JobsBulkActionsPopup />
    </HydrateClient>
  );
}