"use client";

import { useInvoicesStore } from "@/store/invoices";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Filter, Search, X } from "lucide-react";
import { useState } from "react";

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export function InvoicesSearchFilter() {
  const { filters, setFilters } = useInvoicesStore();
  const [searchValue, setSearchValue] = useState(filters.search);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setFilters({ ...filters, search: value });
  };

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    setFilters({ ...filters, status: newStatus });
  };

  const clearFilters = () => {
    setFilters({ search: "", status: [] });
    setSearchValue("");
  };

  const hasFilters = filters.search || filters.status.length > 0;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8 w-[200px] md:w-[300px]"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            {filters.status.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                {filters.status.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-3" align="start">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">Status</p>
              <div className="space-y-1">
                {statusOptions.map((option) => (
                  <div key={option.value}>
                    <Button
                      variant={filters.status.includes(option.value) ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => toggleStatus(option.value)}
                    >
                      {option.label}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}

      {filters.status.length > 0 && (
        <div className="flex gap-1">
          {filters.status.map((status) => (
            <Badge key={status} variant="secondary">
              {status}
              <button
                onClick={() => toggleStatus(status)}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}