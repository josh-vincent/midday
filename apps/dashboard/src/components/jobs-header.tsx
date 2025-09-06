"use client";

import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";
import { useJobFilterParams } from "@/hooks/use-job-filter-params";
import { useState } from "react";

export function JobsHeader() {
  const { filter, setParams } = useJobFilterParams();
  const [searchValue, setSearchValue] = useState(filter.q || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ q: searchValue || null });
  };

  const handleStatusChange = (value: string) => {
    setParams({ status: value === "all" ? null : value });
  };

  const clearFilters = () => {
    setParams({
      q: null,
      status: null,
      customerId: null,
      start: null,
      end: null,
    });
    setSearchValue("");
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Manage and track all your jobs in one place
        </p>
      </div>
      
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-8 w-full sm:w-[250px]"
          />
        </form>

        {/* Status Filter */}
        <Select
          value={filter.status || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="invoiced">Invoiced</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {(filter.q || filter.status) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        )}

        {/* Create Job Button */}
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Link>
        </Button>
      </div>
    </div>
  );
}