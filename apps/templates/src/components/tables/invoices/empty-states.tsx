"use client";

import { Button } from "@midday/ui/button";
import { FileText, Search, Plus, Receipt } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        Start by creating your first invoice or import existing invoices from your accounting system
      </p>
      <div className="flex space-x-2">
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
        <Button size="sm" variant="outline">
          Import Invoices
        </Button>
      </div>
    </div>
  );
}

export function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Search className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No invoices found</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        Try adjusting your search or filter criteria to find what you're looking for
      </p>
      <Button size="sm" variant="outline">
        Clear filters
      </Button>
    </div>
  );
}