"use client";

import { useJobParams } from "@/hooks/use-job-params";
import { Button } from "@midday/ui/button";
import { Plus } from "lucide-react";

interface OpenJobSheetProps {
  className?: string;
}

export function OpenJobSheet({ className }: OpenJobSheetProps) {
  const { params, setParams } = useJobParams();

  return (
    <Button 
      onClick={() => setParams({ createJob: true })}
      className={className}
    >
      <Plus className="h-4 w-4 mr-2" />
       New Job
    </Button>
  );
}
