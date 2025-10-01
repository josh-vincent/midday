"use client";

import { Button } from "@midday/ui/button";
import { Plus } from "lucide-react";
import { SearchField } from "../search-field";
import { OpenJobSheet } from "../open-job-sheet";

export function GatekeeperHeader() {
  return (
    <div className="flex items-center justify-between">
      <SearchField placeholder="Search by customer name, rego..." />

      <div className="hidden sm:flex sm:gap-2">
        <OpenJobSheet>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </OpenJobSheet>
      </div>
    </div>
  );
}