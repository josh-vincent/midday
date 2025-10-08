import { ReportsPageClient } from "@/components/reports-page-client";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { Skeleton } from "@midday/ui/skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reports | ToCLD",
};

function ReportsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}

export default async function ReportsPage() {
  const queryClient = getQueryClient();

  // Fetch initial data on the server
  const [jobs, jobSummary, invoices, invoiceSummary, paymentStatus] =
    await Promise.all([
      queryClient.fetchQuery(trpc.job.list.queryOptions()),
      queryClient.fetchQuery(trpc.job.summary.queryOptions()),
      queryClient.fetchQuery(
        trpc.invoice.get.queryOptions({
          pageSize: 100,
          statuses: [
            "draft",
            "unpaid",
            "paid",
            "overdue",
            "partially_paid",
            "scheduled",
            "canceled",
          ],
        }),
      ),
      queryClient.fetchQuery(trpc.invoice.invoiceSummary.queryOptions()),
      queryClient.fetchQuery(trpc.invoice.paymentStatus.queryOptions()),
    ]);

  return (
    <HydrateClient>
      <Suspense fallback={<ReportsPageSkeleton />}>
        <ReportsPageClient
          initialJobs={jobs}
          initialSummary={jobSummary}
          initialInvoices={invoices?.data || []}
          initialInvoiceSummary={invoiceSummary}
          initialPaymentStatus={paymentStatus}
        />
      </Suspense>
    </HydrateClient>
  );
}
