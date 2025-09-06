"use client";

import { useJobsStore } from "@/store/jobs";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useEffect } from "react";
import { FilterList } from "./filter-list";

type StatusFilter = "pending" | "in_progress" | "completed" | "cancelled";

interface FilterItem {
  id: StatusFilter;
  name: string;
}

const statusFilters: FilterItem[] = [
  { id: "pending", name: "Pending" },
  { id: "in_progress", name: "In Progress" },
  { id: "completed", name: "Completed" },
  { id: "cancelled", name: "Cancelled" },
];

export function JobsSearchFilter() {
  const { filters, setFilters } = useJobsStore();

  const handleSearchChange = (value: string) => {
    setFilters({
      ...filters,
      search: value,
    });
  };

  const handleStatusToggle = (status: StatusFilter) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];

    setFilters({
      ...filters,
      status: newStatuses,
    });
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: [],
    });
  };

  const activeFilters = [
    ...filters.status.map((status) => ({
      id: status,
      name: statusFilters.find((s) => s.id === status)?.name || status,
      type: "status" as const,
    })),
  ];

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="relative flex-1 max-w-sm">
        <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search jobs..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Icons.Filter className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {statusFilters.map((status) => (
            <DropdownMenuCheckboxItem
              key={status.id}
              checked={filters.status.includes(status.id)}
              onCheckedChange={() => handleStatusToggle(status.id)}
            >
              {status.name}
            </DropdownMenuCheckboxItem>
          ))}

          {activeFilters.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClearFilters}>
                Clear filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeFilters.length > 0 && (
        <FilterList
          filters={activeFilters}
          onRemove={(filter) => {
            if (filter.type === "status") {
              handleStatusToggle(filter.id as StatusFilter);
            }
          }}
        />
      )}
    </div>
  );
}
