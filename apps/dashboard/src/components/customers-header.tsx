"use client";

import { Button } from "@midday/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";
import { CustomersCSVImporter } from "./import/customers-csv-importer";
import { OpenCustomerSheet } from "./open-customer-sheet";
import { SearchField } from "./search-field";

export function CustomersHeader() {
  const [showImporter, setShowImporter] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <SearchField placeholder="Search customers" />

        <div className="hidden sm:flex sm:gap-2">
          <Button variant="outline" onClick={() => setShowImporter(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import from CSV
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
