"use client";

import { Checkbox } from "@midday/ui/checkbox";
import { forwardRef, useEffect, useRef } from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";

/**
 * Props for the IndeterminateCheckbox component
 */
export interface IndeterminateCheckboxProps {
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Whether the checkbox is in an indeterminate state */
  indeterminate?: boolean;
  /** Callback when checked state changes */
  onCheckedChange?: (checked: CheckedState) => void;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  "aria-label"?: string;
  /** ID for the checkbox */
  id?: string;
}

/**
 * A checkbox component that supports indeterminate state for "select all" functionality
 * 
 * The indeterminate state is used when some but not all items in a group are selected.
 * This is commonly used in table headers for selecting all rows.
 * 
 * @example
 * ```tsx
 * const [selectedItems, setSelectedItems] = useState<string[]>([]);
 * const allItems = ['item1', 'item2', 'item3'];
 * 
 * const isAllSelected = selectedItems.length === allItems.length;
 * const isIndeterminate = selectedItems.length > 0 && !isAllSelected;
 * 
 * <IndeterminateCheckbox
 *   checked={isAllSelected}
 *   indeterminate={isIndeterminate}
 *   onCheckedChange={(checked) => {
 *     if (checked) {
 *       setSelectedItems(allItems);
 *     } else {
 *       setSelectedItems([]);
 *     }
 *   }}
 *   aria-label="Select all items"
 * />
 * ```
 */
export const IndeterminateCheckbox = forwardRef<
  React.ElementRef<typeof Checkbox>,
  IndeterminateCheckboxProps
>(({ 
  checked = false, 
  indeterminate = false, 
  onCheckedChange,
  disabled = false,
  className,
  "aria-label": ariaLabel,
  id,
  ...props 
}, ref) => {
  const checkboxRef = useRef<HTMLButtonElement>(null);

  // Handle the indeterminate state using a ref since it's not a standard HTML attribute
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const getCheckedState = (): CheckedState => {
    if (indeterminate) return "indeterminate";
    return checked;
  };

  const handleCheckedChange = (newChecked: CheckedState) => {
    // When in indeterminate state and clicked, we want to select all
    if (indeterminate && newChecked !== false) {
      onCheckedChange?.(true);
    } else {
      onCheckedChange?.(newChecked);
    }
  };

  return (
    <Checkbox
      ref={checkboxRef}
      checked={getCheckedState()}
      onCheckedChange={handleCheckedChange}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      id={id}
      {...props}
    />
  );
});

IndeterminateCheckbox.displayName = "IndeterminateCheckbox";