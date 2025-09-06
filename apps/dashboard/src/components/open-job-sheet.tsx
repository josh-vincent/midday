"use client";

import { useJobParams } from "@/hooks/use-job-params";
import { Button } from "@midday/ui/button";
import { Plus } from "lucide-react";

export function OpenJobSheet() {
  const { setParams } = useJobParams();

  return (
    <Button onClick={() => setParams({ createJob: true })}>
      <Plus className="mr-2 h-4 w-4" />
      New Job
    </Button>
  );
}
