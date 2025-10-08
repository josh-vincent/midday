"use client";

import { Button } from "@midday/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";
import { CustomerSearchFilter } from "./customer-search-filter";
import { CustomersCSVImporter } from "./import/customers-csv-importer";
import { OpenCustomerSheet } from "./open-customer-sheet";

export function CustomersHeader() {
  const [showImporter, setShowImporter] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <CustomerSearchFilter />

        <div className="hidden sm:flex sm:gap-2">
          <Button variant="outline" onClick={() => setShowImporter(true)}>
            <Upload className="h-4 w-4" />
          </Button>
          <OpenCustomerSheet />
        </div>
      </div>

      <CustomersCSVImporter
        open={showImporter}
        onOpenChange={setShowImporter}
      />
    </>
  );
}
