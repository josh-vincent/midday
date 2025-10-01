"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@midday/ui/input";
import { Button } from "@midday/ui/button";
import { Label } from "@midday/ui/label";
import { cn } from "@midday/ui/cn";
import { DollarSign, X } from "lucide-react";
import type { AmountRange } from "../types";
import { validateAmountRange, formatAmountRange } from "../utils";

interface AmountRangeFilterProps {
  /** Current amount range value */
  value?: AmountRange;
  /** Callback when range changes */
  onChange?: (range: AmountRange | undefined) => void;
  /** Currency symbol to display */
  currency?: string;
  /** Placeholder for min input */
  minPlaceholder?: string;
  /** Placeholder for max input */
  maxPlaceholder?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether to show clear button */
  clearable?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Amount range filter with min/max inputs and validation
 * 
 * @example
 * ```tsx
 * <AmountRangeFilter
 *   value={amountRange}
 *   onChange={setAmountRange}
 *   currency="$"
 *   minPlaceholder="Min amount"
 *   maxPlaceholder="Max amount"
 *   clearable
 * />
 * ```
 */
export function AmountRangeFilter({
  value,
  onChange,
  currency = "$",
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  disabled,
  clearable = true,
  className,
}: AmountRangeFilterProps) {
  const [minValue, setMinValue] = useState(value?.min?.toString() || "");
  const [maxValue, setMaxValue] = useState(value?.max?.toString() || "");
  const [hasError, setHasError] = useState(false);

  // Sync with external value changes
  useEffect(() => {
    setMinValue(value?.min?.toString() || "");
    setMaxValue(value?.max?.toString() || "");
  }, [value]);

  const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMinValue(inputValue);

    const min = inputValue ? parseFloat(inputValue) : undefined;
    const max = maxValue ? parseFloat(maxValue) : undefined;
    
    const newRange = { min, max };
    const isValid = validateAmountRange(newRange);
    
    setHasError(!isValid);
    
    if (isValid || (!min && !max)) {
      onChange?.(min !== undefined || max !== undefined ? newRange : undefined);
    }
  }, [maxValue, onChange]);

  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMaxValue(inputValue);

    const min = minValue ? parseFloat(minValue) : undefined;
    const max = inputValue ? parseFloat(inputValue) : undefined;
    
    const newRange = { min, max };
    const isValid = validateAmountRange(newRange);
    
    setHasError(!isValid);
    
    if (isValid || (!min && !max)) {
      onChange?.(min !== undefined || max !== undefined ? newRange : undefined);
    }
  }, [minValue, onChange]);

  const handleClear = useCallback(() => {
    setMinValue("");
    setMaxValue("");
    setHasError(false);
    onChange?.(undefined);
  }, [onChange]);

  const hasValue = !!(value?.min !== undefined || value?.max !== undefined);
  const displayValue = hasValue ? formatAmountRange(value!) : "";

  return (
    <div className={cn("space-y-2", className)}>
      {/* Display current range */}
      {hasValue && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Range: {displayValue}</span>
          {clearable && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Input fields */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="amount-min" className="text-xs text-muted-foreground">
            Minimum
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {currency === "$" ? (
                <DollarSign className="h-4 w-4" />
              ) : (
                <span className="text-sm">{currency}</span>
              )}
            </div>
            <Input
              id="amount-min"
              type="number"
              value={minValue}
              onChange={handleMinChange}
              placeholder={minPlaceholder}
              disabled={disabled}
              min={0}
              step="0.01"
              className={cn(
                "pl-8",
                hasError && "border-red-500 focus-visible:ring-red-500"
              )}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="amount-max" className="text-xs text-muted-foreground">
            Maximum
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {currency === "$" ? (
                <DollarSign className="h-4 w-4" />
              ) : (
                <span className="text-sm">{currency}</span>
              )}
            </div>
            <Input
              id="amount-max"
              type="number"
              value={maxValue}
              onChange={handleMaxChange}
              placeholder={maxPlaceholder}
              disabled={disabled}
              min={0}
              step="0.01"
              className={cn(
                "pl-8",
                hasError && "border-red-500 focus-visible:ring-red-500"
              )}
            />
          </div>
        </div>
      </div>

      {/* Error message */}
      {hasError && (
        <p className="text-xs text-red-500">
          Minimum amount must be less than maximum amount
        </p>
      )}
    </div>
  );
}