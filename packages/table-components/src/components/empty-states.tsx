"use client";

import { Button } from "@midday/ui/button";
import { Search } from "lucide-react";
import type { EmptyStateProps } from "../types/table.types";

export function EmptyState({ 
  title = "No data yet",
  description = "Get started by adding your first item",
  action,
  icon: Icon
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {Icon && <Icon className="h-12 w-12 text-muted-foreground mb-4" />}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        {description}
      </p>
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function NoResults({ 
  onClearFilters 
}: { 
  onClearFilters?: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Search className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No results found</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        Try adjusting your search or filter criteria to find what you're looking for
      </p>
      {onClearFilters && (
        <Button size="sm" variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}