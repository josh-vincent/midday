"use client";

import { useJobParams } from "@/hooks/use-job-params";
import { useJobsStore } from "@/store/jobs";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { JobForm } from "../forms/job-form";

export function JobCreateSheet() {
  const { params, setParams } = useJobParams();
  const { openJobSheet, setOpenJobSheet } = useJobsStore();
  const trpc = useTRPC();

  const isOpen = Boolean(params.createJob) || Boolean(params.jobId) || openJobSheet;
  const isEditMode = Boolean(params.jobId);

  // Fetch job data when editing
  const { data: jobData } = useQuery({
    ...trpc.job.getById.queryOptions({ id: params.jobId! }),
    enabled: isEditMode && !!params.jobId,
  });

  const handleClose = () => {
    setParams({ createJob: null, jobId: null, customerId: null });
    setOpenJobSheet(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent stack className="flex flex-col h-full max-h-screen">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row flex-shrink-0">
          <h2 className="text-xl">{isEditMode ? "Edit Job" : "Create Job"}</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClose}
            className="p-0 m-0 size-auto hover:bg-transparent"
          >
            <Icons.Close className="size-5" />
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <JobForm job={isEditMode ? jobData : undefined} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
