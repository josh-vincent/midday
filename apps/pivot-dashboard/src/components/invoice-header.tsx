import { InvoiceSearchFilter } from "@/components/invoice-search-filter";
import { Button } from "@midday/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";
import { InvoiceColumnVisibility } from "./invoice-column-visibility";
import { OpenInvoiceSheet } from "./open-invoice-sheet";

export function InvoiceHeader() {
  return (
    <div className="flex items-center justify-between">
      <InvoiceSearchFilter />

      <div className="hidden sm:flex space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/settings/invoice" title="Invoice Template Settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
        <InvoiceColumnVisibility />
        <OpenInvoiceSheet />
      </div>
    </div>
  );
}
