import { Button } from "@midday/ui/button";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Plus className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Get started by creating your first job. Track work, manage progress, and convert to invoices.
      </p>
      <Button asChild>
        <Link href="/jobs/new">
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Link>
      </Button>
    </div>
  );
}

export function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Try adjusting your filters or search criteria to find what you're looking for.
      </p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Clear filters
      </Button>
    </div>
  );
}