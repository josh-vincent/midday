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
import { Search, Filter, RefreshCw, Plus, Database } from "lucide-react";
import { useState } from "react";

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh?: () => void;
  onAddTable?: () => void;
  onSQLQuery?: () => void;
  schemaFilter?: string;
  onSchemaFilterChange?: (schema: string) => void;
  totalTables?: number;
  isRefreshing?: boolean;
};

export function DatabaseTablesHeader({
  searchQuery,
  onSearchChange,
  onRefresh,
  onAddTable,
  onSQLQuery,
  schemaFilter,
  onSchemaFilterChange,
  totalTables = 0,
  isRefreshing = false,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);

  const schemas = ["public", "auth", "storage", "supabase_functions"];

  return (
    <div className="space-y-4">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Tables</h2>
          <p className="text-muted-foreground">
            {totalTables} {totalTables === 1 ? "table" : "tables"} in your database
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSQLQuery}
          >
            <Database className="h-4 w-4 mr-2" />
            SQL Query
          </Button>

          <Button size="sm" onClick={onAddTable}>
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {showFilters && (
          <div className="flex items-center space-x-2">
            <Select
              value={schemaFilter || "all"}
              onValueChange={(value) => onSchemaFilterChange?.(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All schemas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schemas</SelectItem>
                {schemas.map((schema) => (
                  <SelectItem key={schema} value={schema}>
                    {schema}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}