import { ErrorFallback } from "@/components/error-fallback";
import { JobsHeader } from "@/components/jobs-header";
import { DataTable } from "@/components/tables/jobs/data-table";
import { JobsSkeleton } from "@/components/tables/jobs/skeleton";
import { loadJobFilterParams } from "@/hooks/use-job-filter-params.server";
import { loadSortParams } from "@/hooks/use-sort-params.server";
import { HydrateClient, batchPrefetch, trpc } from "@/trpc/server";
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
function JobsSummaryCards() {
  // This would fetch from tRPC in a real implementation
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div className="border rounded-lg p-4">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Active Jobs</h3>
        </div>
        <div className="text-2xl font-bold">12</div>
        <p className="text-xs text-muted-foreground">
          +2 from yesterday
        </p>
      </div>
      
      <div className="border rounded-lg p-4">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Pending Value</h3>
        </div>
        <div className="text-2xl font-bold">$45,231</div>
        <p className="text-xs text-muted-foreground">
          Across 8 jobs
        </p>
      </div>
      
      <div className="border rounded-lg p-4">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">This Week</h3>
        </div>
        <div className="text-2xl font-bold">5</div>
        <p className="text-xs text-muted-foreground">
          Jobs completed
        </p>
      </div>
      
      <div className="border rounded-lg p-4">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Monthly Volume</h3>
        </div>
        <div className="text-2xl font-bold">324 m³</div>
        <p className="text-xs text-muted-foreground">
          +12% from last month
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
    </HydrateClient>
  );
}