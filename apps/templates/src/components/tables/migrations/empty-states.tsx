"use client";

import { Button } from "@midday/ui/button";

export function EmptyState() {
  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No migrations found</h2>
          <p className="text-[#606060] text-sm">
            No database migrations are available. <br />
            Create your first migration to get started.
          </p>
        </div>

        <Button variant="outline">
          Create migration
        </Button>
      </div>
    </div>
  );
}

export function NoResults() {
  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">
            Try another search, or adjusting the filters
          </p>
        </div>

        <Button variant="outline">
          Clear filters
        </Button>
      </div>
    </div>
  );
}