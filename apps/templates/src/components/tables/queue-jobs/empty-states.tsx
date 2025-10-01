"use client";

import { Button } from "@midday/ui/button";
import { Card, CardContent } from "@midday/ui/card";
import { Activity, Plus, Search } from "lucide-react";

export function EmptyState() {
  const handleCreateJob = () => {
    const event = new CustomEvent('open-create-job');
    window.dispatchEvent(event);
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Activity className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No jobs found</h3>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
          You haven't created any jobs yet. Create your first job to get started with queue processing.
        </p>
        <Button onClick={handleCreateJob} className="mt-6">
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </CardContent>
    </Card>
  );
}

export function NoResults() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No results found</h3>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
          No jobs match your current filters. Try adjusting your search criteria or clear the filters.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );
}