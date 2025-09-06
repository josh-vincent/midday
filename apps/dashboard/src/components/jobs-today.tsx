"use client";

import { useJobsStore } from "@/store/jobs";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { format } from "date-fns";
import { Plus, Truck } from "lucide-react";

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
      className="hidden sm:block text-left hover:scale-[1.01] transition-transform"
    >
      <Card className="relative overflow-hidden">
        <div className="absolute top-4 right-4 p-2 bg-primary/10 rounded-full">
          <Plus className="h-4 w-4 text-primary" />
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="font-mono font-medium text-2xl flex items-center gap-2">
            {todaysJobs}
            <Truck className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="font-medium">Today's Jobs</div>
            <div className="text-sm text-muted-foreground">
              {todaysCompleted} completed, {todaysJobs - todaysCompleted}{" "}
              pending
            </div>
            <div className="text-xs text-primary mt-1">
              Click to create new job →
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
