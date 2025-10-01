"use client";

import { Button } from "@midday/ui/button";
import { Briefcase, Search, Plus, FolderOpen } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No jobs yet</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        Start by creating your first job or project to track work and manage your team efficiently
      </p>
      <div className="flex space-x-2">
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
        <Button size="sm" variant="outline">
          <FolderOpen className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>
    </div>
  );
}

export function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Search className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No jobs found</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        Try adjusting your search or filter criteria to find the jobs you're looking for
      </p>
      <Button size="sm" variant="outline">
        Clear filters
      </Button>
    </div>
  );
}