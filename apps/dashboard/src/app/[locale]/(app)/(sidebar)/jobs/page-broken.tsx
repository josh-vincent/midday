import { JobsPageClient } from "@/components/jobs-page-client";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { Skeleton } from "@midday/ui/skeleton";
import { Suspense } from "react";

function JobsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default async function JobsPage() {
  const queryClient = getQueryClient();

  // Fetch initial data on the server
  const [jobs, summary] = await Promise.all([
    queryClient.fetchQuery(trpc.job.list.queryOptions()),
    queryClient.fetchQuery(trpc.job.summary.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <Suspense fallback={<JobsPageSkeleton />}>
        <JobsPageClient initialJobs={jobs} initialSummary={summary} />
      </Suspense>
    </HydrateClient>
  );
}
