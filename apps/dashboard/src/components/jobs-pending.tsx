"use client";

import { useJobsFilterParams } from "@/hooks/use-jobs-filter-params";
import { useJobsStore } from "@/store/jobs";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Clock } from "lucide-react";

export function JobsPending() {
  const jobs = useJobsStore((state) => state.jobs);
  const { setFilter } = useJobsFilterParams();

  // Filter pending and in-progress jobs
  const pendingJobs = jobs.filter(
    (job) => job.status === "pending" || job.status === "in_progress",
  );

  // Calculate total pending value
  const pendingValue = pendingJobs.reduce((total, job) => {
    const amount = (job.pricePerUnit || 0) * (job.cubicMetreCapacity || 0);
    return total + amount;
  }, 0);

  return (
    <button
      type="button"
      onClick={() =>
        setFilter({
          status: ["pending", "in_progress"],
        })
      }
      className="hidden sm:block text-left"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-mono font-medium text-2xl flex items-center gap-2">
            {pendingCount}
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-2">
            <div>Pending Jobs</div>
            <div className="text-sm text-muted-foreground">
              ${pendingValue.toFixed(0)} potential revenue
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
