"use client";

import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { cn } from "@midday/ui/cn";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Slider } from "@midday/ui/slider";
import { format } from "date-fns";
import {
  CalendarIcon,
  Download,
  Filter,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";

export interface FilterConfig {
  key: string;
  label: string;
  type:
    | "text"
    | "select"
    | "date"
    | "daterange"
    | "number"
    | "numberrange"
    | "boolean";
  placeholder?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  icon?: React.ReactNode;
}

export interface FilterValue {
  [key: string]: any;
}

interface TableFiltersProps {
  filters: FilterConfig[];
  values: FilterValue;
  onChange: (filters: FilterValue) => void;
  onSearch?: (search: string) => void;
  onExport?: () => void;
  onImport?: () => void;
  searchPlaceholder?: string;
  className?: string;
  showSearch?: boolean;
  showAdvanced?: boolean;
}

export function TableFilters({
  filters,
  values,
  onChange,
  onSearch,
  onExport,
  onImport,
  searchPlaceholder = "Search...",
  className,
  showSearch = true,
  showAdvanced = true,
}: TableFiltersProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterValue>(values);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setTempFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const applyFilters = useCallback(() => {
    onChange(tempFilters);
    setShowFilters(false);
  }, [tempFilters, onChange]);

  const clearFilters = useCallback(() => {
    const cleared = filters.reduce((acc, filter) => {
      acc[filter.key] = undefined;
      return acc;
    }, {} as FilterValue);
    setTempFilters(cleared);
    onChange(cleared);
  }, [filters, onChange]);

  const activeFiltersCount = Object.values(values).filter(
    (v) => v !== undefined && v !== "",
  ).length;

  const renderFilterInput = (filter: FilterConfig) => {
    const value = tempFilters[filter.key];

    switch (filter.type) {
      case "text":
        return (
          <Input
            placeholder={filter.placeholder}
            value={value || ""}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="w-full"
          />
        );

      case "select":
        return (
          <Select
            value={value || ""}
            onValueChange={(v) => handleFilterChange(filter.key, v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={filter.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value
                  ? format(new Date(value), "PPP")
                  : filter.placeholder || "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) =>
                  handleFilterChange(filter.key, date?.toISOString())
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case "daterange":
        const range = value as DateRange | undefined;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !range && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {range?.from ? (
                  range.to ? (
                    <>
                      {format(range.from, "LLL dd, y")} -{" "}
                      {format(range.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(range.from, "LLL dd, y")
                  )
                ) : (
                  filter.placeholder || "Pick a date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={range}
                onSelect={(r) => handleFilterChange(filter.key, r)}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder={filter.placeholder}
            value={value || ""}
            onChange={(e) =>
              handleFilterChange(
                filter.key,
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            min={filter.min}
            max={filter.max}
            step={filter.step}
            className="w-full"
          />
        );

      case "numberrange":
        const [min, max] = value || [filter.min || 0, filter.max || 100];
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{min}</span>
              <span>{max}</span>
            </div>
            <Slider
              value={[min, max]}
              onValueChange={(v) => handleFilterChange(filter.key, v)}
              min={filter.min || 0}
              max={filter.max || 100}
              step={filter.step || 1}
              className="w-full"
            />
          </div>
        );

      case "boolean":
        return (
          <Select
            value={value === undefined ? "" : value.toString()}
            onValueChange={(v) =>
              handleFilterChange(
                filter.key,
                v === "" ? undefined : v === "true",
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={filter.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        {showSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4"
            />
          </div>
        )}

        {showAdvanced && (
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-2"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {filters.map((filter) => (
                    <div key={filter.key} className="space-y-1">
                      <Label className="text-sm font-medium">
                        {filter.icon && (
                          <span className="mr-1">{filter.icon}</span>
                        )}
                        {filter.label}
                      </Label>
                      {renderFilterInput(filter)}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={applyFilters} className="flex-1">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {onExport && (
          <Button variant="outline" size="icon" onClick={onExport}>
            <Download className="h-4 w-4" />
          </Button>
        )}

        {onImport && (
          <Button variant="outline" size="icon" onClick={onImport}>
            <Upload className="h-4 w-4" />
          </Button>
        )}
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(values).map(([key, value]) => {
            if (!value) return null;
            const filter = filters.find((f) => f.key === key);
            if (!filter) return null;

            let displayValue = value;
            if (filter.type === "select") {
              const option = filter.options?.find((o) => o.value === value);
              displayValue = option?.label || value;
            } else if (filter.type === "date") {
              displayValue = format(new Date(value), "PP");
            } else if (filter.type === "daterange" && value.from) {
              displayValue = `${format(value.from, "PP")} - ${value.to ? format(value.to, "PP") : "..."}`;
            } else if (filter.type === "numberrange") {
              displayValue = `${value[0]} - ${value[1]}`;
            } else if (filter.type === "boolean") {
              displayValue = value ? "Yes" : "No";
            }

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                <span className="font-medium">{filter.label}:</span>
                <span>{displayValue}</span>
                <button
                  onClick={() => {
                    const updated = { ...values };
                    delete updated[key];
                    onChange(updated);
                  }}
                  className="ml-1 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
