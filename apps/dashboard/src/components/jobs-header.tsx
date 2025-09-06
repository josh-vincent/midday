"use client";

import { JobsActions } from "@/components/jobs-actions";
import { JobsSearchFilter } from "@/components/jobs-search-filter";
import { JobsColumnVisibility } from "@/components/jobs-column-visibility";
import { OpenJobSheet } from "@/components/open-job-sheet";
import { useJobsStore } from "@/store/jobs";

export function JobsHeader() {
  const { rowSelection, jobs } = useJobsStore();
  const hasSelectedRows = Object.keys(rowSelection).length > 0;

  return (
    <div className="flex items-center justify-between">
      <JobsSearchFilter />

      <div className="hidden sm:flex space-x-2">
        {hasSelectedRows ? (
          <JobsActions jobs={jobs} />
        ) : (
          <>
            <JobsColumnVisibility />
            <OpenJobSheet />
          </>
        )}
      </div>
    </div>
  );
}