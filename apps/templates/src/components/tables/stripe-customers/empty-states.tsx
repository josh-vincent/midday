"use client";

import { Button } from "@midday/ui/button";
import { Users, Filter } from "lucide-react";

interface EmptyStateProps {
  onCreateCustomer?: () => void;
}

export function EmptyState({ onCreateCustomer }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-medium text-lg">No customers</h2>
          <p className="text-[#606060] text-sm">
            You haven't added any customers yet. <br />
            Go ahead and add your first one.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={onCreateCustomer}
        >
          <Users className="w-4 h-4 mr-2" />
          Add customer
        </Button>
      </div>
    </div>
  );
}

interface NoResultsProps {
  onClearFilters?: () => void;
}

export function NoResults({ onClearFilters }: NoResultsProps) {
  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="text-center mb-6 space-y-2">
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">
            Try another search, or adjusting the filters
          </p>
        </div>

        <Button variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}