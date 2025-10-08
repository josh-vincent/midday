"use client";

import { useJobsStore } from "@/store/jobs";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { AnimatedNumber } from "./animated-number";

interface JobsTodayProps {
  summary?: {
    total: number;
    completed: number;
  };
}

export function JobsToday({ summary }: JobsTodayProps) {
  const { setOpenJobSheet } = useJobsStore();

  const todaysJobs = summary?.total || 0;
  const todaysCompleted = summary?.completed || 0;

  return (
    <button
      type="button"
      onClick={() => setOpenJobSheet(true)}
      className="hidden sm:block text-left"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-mono font-medium text-2xl">
            <AnimatedNumber
              value={todaysJobs}
              maximumFractionDigits={0}
              minimumFractionDigits={0}
            />
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-2">
            <div>Today's Jobs</div>
            <div className="text-sm text-muted-foreground">
              {todaysCompleted} completed, {todaysJobs - todaysCompleted}{" "}
              pending
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
