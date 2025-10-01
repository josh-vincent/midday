"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Input } from "@midday/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Checkbox } from "@midday/ui/checkbox";
import { ScrollArea } from "@midday/ui/scroll-area";
import { cn } from "@midday/ui/cn";
import { ChevronDown, Search, X, Check } from "lucide-react";
import type { FilterOption, MultiSelectConfig } from "../types";

interface MultiSelectFilterProps {
  /** Available options to select from */
  options: FilterOption[];
  /** Currently selected values */
  value?: string[];
  /** Callback when selection changes */
  onChange?: (values: string[]) => void;
  /** Configuration options */
  config?: MultiSelectConfig;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Multi-select dropdown with search functionality
 * 
 * @example
 * ```tsx
 * <MultiSelectFilter
 *   options={[
 *     { label: "Active", value: "active" },
 *     { label: "Inactive", value: "inactive" },
 *     { label: "Pending", value: "pending" }
 *   ]}
 *   value={selectedStatuses}
 *   onChange={setSelectedStatuses}
 *   config={{
 *     placeholder: "Select statuses...",
 *     searchable: true,
 *     maxDisplay: 2
 *   }}
 * />
 * ```
 */
export function MultiSelectFilter({
  options,
  value = [],
  onChange,
  config = {},
  disabled,
  className,
}: MultiSelectFilterProps) {
  const {
    placeholder = "Select options...",
    searchPlaceholder = "Search options...",
    maxDisplay = 3,
    clearable = true,
    searchable = true,
  } = config;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOptions = useMemo(
    () => options.filter(option => value.includes(option.value)),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return options;
    }
    
    const query = searchQuery.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(query) ||
      option.value.toLowerCase().includes(query)
    );
  }, [options, searchQuery, searchable]);

  const handleToggleOption = useCallback((optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    
    onChange?.(newValue);
  }, [value, onChange]);

  const handleSelectAll = useCallback(() => {
    const allValues = filteredOptions.map(option => option.value);
    const newValue = value.length === filteredOptions.length 
      ? []
      : [...new Set([...value, ...allValues])];
    
    onChange?.(newValue);
  }, [filteredOptions, value, onChange]);

  const handleClear = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange?.([]);
    setSearchQuery("");
  }, [onChange]);

  const handleRemoveOption = useCallback((optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleToggleOption(optionValue);
  }, [handleToggleOption]);

  const renderTriggerContent = () => {
    if (selectedOptions.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    if (selectedOptions.length <= maxDisplay) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map(option => (
            <Badge
              key={option.value}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {option.icon && <span className="h-3 w-3">{option.icon}</span>}
              <span>{option.label}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveOption(option.value, e)}
                  className="rounded-sm hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span>{selectedOptions.length} selected</span>
        {!disabled && clearable && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-sm opacity-70 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  };

  const isAllSelected = filteredOptions.length > 0 && 
    filteredOptions.every(option => value.includes(option.value));

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal min-h-9",
            selectedOptions.length === 0 && "text-muted-foreground",
            className
          )}
        >
          <div className="flex-1 overflow-hidden">
            {renderTriggerContent()}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="start">
        {/* Search */}
        {searchable && (
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>
        )}

        {/* Header with select all */}
        {filteredOptions.length > 1 && (
          <div className="flex items-center gap-2 p-2 border-b border-border">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium">
              Select all {filteredOptions.length > options.length ? `(${filteredOptions.length})` : ""}
            </span>
            {selectedOptions.length > 0 && clearable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="ml-auto h-6 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        )}

        {/* Options list */}
        <ScrollArea className="max-h-60">
          {filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No options found
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map(option => {
                const isSelected = value.includes(option.value);
                
                return (
                  <div
                    key={option.value}
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                    onClick={() => handleToggleOption(option.value)}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="h-4 w-4"
                    />
                    
                    {option.icon && (
                      <span className="h-4 w-4 shrink-0">{option.icon}</span>
                    )}
                    
                    {option.color && (
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    
                    <span className="flex-1 text-sm">{option.label}</span>
                    
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {selectedOptions.length > 0 && (
          <div className="border-t border-border p-2">
            <p className="text-xs text-muted-foreground">
              {selectedOptions.length} of {options.length} selected
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}