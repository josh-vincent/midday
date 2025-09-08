"use client";

import { JobsSearchFilter } from "@/components/jobs-search-filter";
import { JobsColumnVisibility } from "@/components/jobs-column-visibility";
import { JobsCSVImporter } from "@/components/import/jobs-csv-importer";
import { OpenJobSheet } from "@/components/open-job-sheet";
import { Button } from "@midday/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";

export function JobsHeader() {
  const [showImporter, setShowImporter] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <JobsSearchFilter />

        <div className="hidden sm:flex space-x-2">
          <Button variant="outline" onClick={() => setShowImporter(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <JobsColumnVisibility />
          <OpenJobSheet />
        </div>
      </div>
      
      <JobsCSVImporter open={showImporter} onOpenChange={setShowImporter} />
    </>
  );
}