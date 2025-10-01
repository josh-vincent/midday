"use client";

import { Button } from "@midday/ui/button";
import { Users, Search, Plus, Upload } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No customers yet</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        Start by adding your first customer or import existing contacts from your CRM or CSV file
      </p>
      <div className="flex space-x-2">
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
        <Button size="sm" variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Customers
        </Button>
      </div>
    </div>
  );
}

export function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Search className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No customers found</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
        Try adjusting your search terms or filter criteria to find the customers you're looking for
      </p>
      <Button size="sm" variant="outline">
        Clear filters
      </Button>
    </div>
  );
}