"use client";

import { Button } from "@midday/ui/button";
import { Clock, Search, Plus, Timer, Play } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No time entries yet</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        Start tracking your time by creating a new timer or manually adding time entries
      </p>
      <div className="flex space-x-2">
        <Button size="sm">
          <Play className="h-4 w-4 mr-2" />
          Start Timer
        </Button>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>
    </div>
  );
}

export function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Search className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No time entries found</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        Try adjusting your search, date range, or filter criteria to find the time entries you're looking for
      </p>
      <Button size="sm" variant="outline">
        Clear filters
      </Button>
    </div>
  );
}