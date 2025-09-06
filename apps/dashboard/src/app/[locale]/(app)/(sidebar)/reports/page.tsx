import type { Metadata } from "next";
import { Suspense } from "react";
import { InvoiceChart } from "@/components/charts/invoice-chart";
import { ExpenseChart } from "@/components/charts/expense-chart";
import { JobsChart } from "@/components/charts/jobs-chart";
import { VolumeChart } from "@/components/charts/volume-chart";
import { Skeleton } from "@midday/ui/skeleton";

export const metadata: Metadata = {
  title: "Reports | ToCLD",
};

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
          <InvoiceChart />
        </Suspense>
        
        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
          <ExpenseChart />
        </Suspense>
        
        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
          <JobsChart />
        </Suspense>
        
        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
          <VolumeChart />
        </Suspense>
      </div>
    </div>
  );
}
