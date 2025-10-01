"use client";

import { forwardRef, createContext, useContext, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@midday/ui/cn";
import { Button } from "@midday/ui/button";
import { BaseSheet, BaseSheetProps } from "./base-sheet";

// Context for nested sheet state
interface NestedSheetContextValue {
  level: number;
  canGoBack: boolean;
  onBack?: () => void;
}

const NestedSheetContext = createContext<NestedSheetContextValue>({
  level: 0,
  canGoBack: false,
});

export interface NestedSheetProps extends BaseSheetProps {
  /** Whether this sheet can navigate back to a parent */
  canGoBack?: boolean;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Nesting level (automatically managed by provider) */
  level?: number;
}

/**
 * Provider for managing nested sheet context
 */
export function NestedSheetProvider({ children }: { children: ReactNode }) {
  return (
    <NestedSheetContext.Provider value={{ level: 0, canGoBack: false }}>
      {children}
    </NestedSheetContext.Provider>
  );
}

/**
 * Hook to use nested sheet context
 */
export function useNestedSheet() {
  return useContext(NestedSheetContext);
}

/**
 * Sheet component with support for nested/stacked behavior
 * 
 * Features:
 * - Automatic stacking with proper z-index management
 * - Back navigation with breadcrumb-style header
 * - Nested animation offsets for depth perception
 * - Automatic backdrop handling for nested sheets
 * - Level-aware focus management
 * 
 * @example
 * ```tsx
 * function CustomerDetailsSheet() {
 *   const [open, setOpen] = useState(false);
 *   const [editOpen, setEditOpen] = useState(false);
 *   
 *   return (
 *     <>
 *       <NestedSheet
 *         open={open}
 *         onOpenChange={setOpen}
 *         title="Customer Details"
 *       >
 *         <div>
 *           <button onClick={() => setEditOpen(true)}>
 *             Edit Customer
 *           </button>
 *         </div>
 *       </NestedSheet>
 *       
 *       <NestedSheet
 *         open={editOpen}
 *         onOpenChange={setEditOpen}
 *         title="Edit Customer"
 *         canGoBack
 *         onBack={() => setEditOpen(false)}
 *       >
 *         <div>Edit form content</div>
 *       </NestedSheet>
 *     </>
 *   );
 * }
 * ```
 */
export const NestedSheet = forwardRef<HTMLDivElement, NestedSheetProps>(
  (
    {
      open = false,
      onOpenChange,
      title,
      header,
      canGoBack = false,
      onBack,
      level: propLevel,
      showCloseButton = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const context = useNestedSheet();
    
    // Determine nesting level
    const level = propLevel ?? (open ? context.level + 1 : context.level);
    const isNested = level > 0;
    
    // Handle back navigation
    const handleBack = () => {
      if (onBack) {
        onBack();
      } else {
        onOpenChange?.(false);
      }
    };

    // Calculate offset for nested sheets
    const offset = level * 20; // 20px offset per level
    
    // Custom header with back navigation
    const nestedHeader = (canGoBack || context.canGoBack) ? (
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Go back</span>
        </Button>
        
        <div className="flex-1">
          {title && (
            <h2 className="text-lg font-semibold text-foreground">
              {title}
            </h2>
          )}
        </div>
        
        {showCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange?.(false)}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
    ) : header;

    // Provide context for nested children
    const contextValue: NestedSheetContextValue = {
      level,
      canGoBack: canGoBack || context.canGoBack,
      onBack: onBack || context.onBack,
    };

    return (
      <NestedSheetContext.Provider value={contextValue}>
        <BaseSheet
          ref={ref}
          open={open}
          onOpenChange={onOpenChange}
          title={!canGoBack && !context.canGoBack ? title : undefined}
          header={nestedHeader}
          showCloseButton={!canGoBack && !context.canGoBack && showCloseButton}
          nested={isNested}
          backdrop={{
            show: !isNested, // Only show backdrop for top-level sheet
            blur: true,
            dismissible: true,
          }}
          className={cn(
            // Add offset for nested sheets
            isNested && `translate-x-[-${offset}px]`,
            // Reduce width slightly for nested sheets
            isNested && "max-w-[calc(520px-40px)]",
            className
          )}
          style={{
            transform: isNested ? `translateX(-${offset}px)` : undefined,
            ...(props.style || {}),
          }}
          {...props}
        >
          {children}
        </BaseSheet>
      </NestedSheetContext.Provider>
    );
  }
);

NestedSheet.displayName = "NestedSheet";

/**
 * Utility component for creating breadcrumb-style navigation in nested sheets
 */
export interface SheetBreadcrumbProps {
  items: Array<{
    label: string;
    onClick?: () => void;
  }>;
  className?: string;
}

export function SheetBreadcrumb({ items, className }: SheetBreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronLeft className="h-3 w-3 mx-1 rotate-180 text-muted-foreground" />
          )}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}