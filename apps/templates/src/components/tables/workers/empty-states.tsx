"use client";

import { Button } from "@midday/ui/button";
import { Card, CardContent } from "@midday/ui/card";
import { Users, Plus, Search } from "lucide-react";

export function EmptyState() {
  const handleAddWorker = () => {
    const event = new CustomEvent('open-add-worker');
    window.dispatchEvent(event);
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No workers found</h3>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
          You haven't configured any workers yet. Add workers to start processing jobs in your queues.
        </p>
        <Button onClick={handleAddWorker} className="mt-6">
          <Plus className="mr-2 h-4 w-4" />
          Add Worker
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
          No workers match your current filters. Try adjusting your search criteria or clear the filters.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );
}