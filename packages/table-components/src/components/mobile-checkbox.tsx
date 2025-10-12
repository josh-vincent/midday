"use client";

import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
import * as React from "react";

interface MobileCheckboxProps
  extends React.ComponentPropsWithoutRef<typeof Checkbox> {
  /**
   * Whether this is a header checkbox (select all)
   */
  isHeader?: boolean;
}

/**
 * Mobile-optimized checkbox with larger touch targets for table rows.
 *
 * - Touch target: 44px × 44px (iOS/Android guidelines)
 * - Visual size: 20px × 20px
 * - Responsive: Larger on mobile, standard on desktop
 * - Maintains accessibility with proper ARIA labels
 */
export const MobileCheckbox = React.forwardRef<
  React.ElementRef<typeof Checkbox>,
  MobileCheckboxProps
>(({ className, isHeader = false, ...props }, ref) => {
  return (
    <div
      className={cn(
        // Larger touch target on mobile
        "flex items-center justify-center",
        // Touch target: 44px minimum (WCAG/iOS guidelines)
        "min-w-[44px] min-h-[44px]",
        // Reduce to standard size on desktop
        "md:min-w-[32px] md:min-h-[32px]",
        // Visual feedback on touch
        "active:scale-95 transition-transform",
        className
      )}
      onClick={(e) => {
        // Prevent row click when clicking checkbox area
        e.stopPropagation();
      }}
    >
      <Checkbox
        ref={ref}
        className={cn(
          // Larger checkbox on mobile
          "h-5 w-5",
          // Standard size on desktop
          "md:h-4 md:w-4",
          // Ensure checkbox is always clickable
          "cursor-pointer"
        )}
        {...props}
      />
    </div>
  );
});

MobileCheckbox.displayName = "MobileCheckbox";
