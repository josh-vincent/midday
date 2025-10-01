"use client";

import { forwardRef, useCallback, useEffect, useState } from "react";
import { Input } from "@midday/ui/input";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Search, X } from "lucide-react";
import type { SearchFieldConfig } from "../types";
import { useDebounceFilter } from "../hooks/use-debounce-filter";

interface SearchFieldProps {
  /** Current search value */
  value?: string;
  /** Callback when search value changes */
  onChange?: (value: string) => void;
  /** Configuration options */
  config?: SearchFieldConfig;
  /** Additional CSS classes */
  className?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether to show loading state */
  loading?: boolean;
}

/**
 * Debounced search input field with clear button
 * 
 * @example
 * ```tsx
 * <SearchField
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   config={{
 *     placeholder: "Search transactions...",
 *     debounceMs: 300,
 *     clearable: true
 *   }}
 * />
 * ```
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ value = "", onChange, config = {}, className, disabled, loading }, ref) => {
    const {
      placeholder = "Search...",
      debounceMs = 300,
      clearable = true,
      icon = <Search className="h-4 w-4" />,
    } = config;

    const [internalValue, setInternalValue] = useState(value);
    const debouncedValue = useDebounceFilter(internalValue, { delay: debounceMs });

    // Sync with external value changes
    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    // Call onChange when debounced value changes
    useEffect(() => {
      if (debouncedValue !== value && onChange) {
        onChange(debouncedValue);
      }
    }, [debouncedValue, value, onChange]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
    }, []);

    const handleClear = useCallback(() => {
      setInternalValue("");
      if (onChange) {
        onChange("");
      }
    }, [onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        handleClear();
      }
    }, [handleClear]);

    const showClearButton = clearable && internalValue.length > 0;

    return (
      <div className={cn("relative flex items-center", className)}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          ) : (
            icon
          )}
        </div>
        
        <Input
          ref={ref}
          type="text"
          value={internalValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pl-10",
            showClearButton && "pr-10",
            className
          )}
        />
        
        {showClearButton && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }
);

SearchField.displayName = "SearchField";