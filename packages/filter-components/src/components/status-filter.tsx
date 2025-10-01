"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import { ChevronDown, Check, X } from "lucide-react";
import type { StatusOption } from "../types";

interface StatusFilterProps {
  /** Available status options */
  options: StatusOption[];
  /** Currently selected status values */
  value?: string[];
  /** Callback when selection changes */
  onChange?: (values: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether to allow multiple selection */
  multiple?: boolean;
  /** Whether to show clear button */
  clearable?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Status selection with colored indicators
 * 
 * @example
 * ```tsx
 * <StatusFilter
 *   options={[
 *     { label: "Active", value: "active", color: "#10b981" },
 *     { label: "Inactive", value: "inactive", color: "#ef4444" },
 *     { label: "Pending", value: "pending", color: "#f59e0b" }
 *   ]}
 *   value={selectedStatuses}
 *   onChange={setSelectedStatuses}
 *   multiple
 *   clearable
 * />
 * ```
 */
export function StatusFilter({
  options,
  value = [],
  onChange,
  placeholder = "Select status...",
  disabled,
  multiple = false,
  clearable = true,
  className,
}: StatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOptions = options.filter(option => value.includes(option.value));

  const handleToggleOption = (optionValue: string) => {
    if (disabled) return;

    let newValue: string[];
    
    if (multiple) {
      newValue = value.includes(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...value, optionValue];
    } else {
      newValue = value.includes(optionValue) ? [] : [optionValue];
      setIsOpen(false);
    }
    
    onChange?.(newValue);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange?.([]);
  };

  const handleRemoveOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleToggleOption(optionValue);
  };

  const renderTriggerContent = () => {
    if (selectedOptions.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    if (selectedOptions.length === 1) {
      const option = selectedOptions[0];
      return (
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: option.color }}
          />
          <span>{option.label}</span>
        </div>
      );
    }

    if (multiple && selectedOptions.length <= 3) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map(option => (
            <Badge
              key={option.value}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: option.color }}
              />
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
        <span>{selectedOptions.length} statuses selected</span>
        {clearable && !disabled && (
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal",
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
      
      <PopoverContent className="w-56 p-0" align="start">
        {/* Header */}
        {selectedOptions.length > 0 && clearable && (
          <div className="flex items-center justify-between p-2 border-b border-border">
            <span className="text-sm font-medium">Status</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          </div>
        )}

        {/* Options */}
        <div className="p-1">
          {options.map(option => {
            const isSelected = value.includes(option.value);
            
            return (
              <div
                key={option.value}
                className="flex items-center gap-2 rounded-sm px-2 py-2 hover:bg-accent cursor-pointer"
                onClick={() => handleToggleOption(option.value)}
              >
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: option.color }}
                />
                
                {option.icon && (
                  <span className="h-4 w-4 shrink-0">{option.icon}</span>
                )}
                
                <span className="flex-1 text-sm">{option.label}</span>
                
                {isSelected && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {multiple && selectedOptions.length > 0 && (
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