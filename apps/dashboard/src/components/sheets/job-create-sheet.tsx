"use client";

import { useJobParams } from "@/hooks/use-job-params";
import { useJobsStore } from "@/store/jobs";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import React from "react";
import { JobForm } from "../forms/job-form";

export function JobCreateSheet() {
  const { setParams, createJob } = useJobParams();
  const { openJobSheet, setOpenJobSheet } = useJobsStore();

  const isOpen = Boolean(createJob) || openJobSheet;

  const handleClose = () => {
    setParams(null);
    setOpenJobSheet(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent stack className="flex flex-col h-full max-h-screen">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row flex-shrink-0">
          <h2 className="text-xl">Create Job</h2>
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
          <JobForm />
        </div>
      </SheetContent>
    </Sheet>
  );
}
