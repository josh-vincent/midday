"use client";

import { InvoiceSearchFilter } from "@/components/invoice-search-filter";
import { InvoicesBulkActions } from "@/components/invoices-bulk-actions";
import { Button } from "@midday/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";

export function InvoiceHeader() {
  return (
    <div className="flex items-center justify-between">
      <InvoiceSearchFilter />

      <div className="hidden sm:flex items-center space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/settings/invoice" title="Invoice Template Settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
        <InvoicesBulkActions />
      </div>
    </div>
  );
}
