"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import type { Header } from "@tanstack/react-table";
import { cn } from "@midday/ui/cn";

/**
 * Props for the ResizableColumn component
 */
export interface ResizableColumnProps<T> {
  /** The tanstack table header object */
  header: Header<T, unknown>;
  /** Custom CSS classes */
  className?: string;
  /** Children to render inside the header */
  children?: React.ReactNode;
  /** Whether this column is sticky */
  isSticky?: boolean;
  /** Sticky position (left offset in pixels) */
  stickyLeft?: number;
  /** Minimum column width */
  minWidth?: number;
  /** Maximum column width */
  maxWidth?: number;
  /** Whether to show resize handle */
  showResizeHandle?: boolean;
}

/**
 * A resizable table header component with optional sticky positioning
 * 
 * @example
 * ```tsx
 * <ResizableColumn
 *   header={header}
 *   isSticky={columnIndex === 0}
 *   stickyLeft={0}
 *   minWidth={100}
 *   maxWidth={400}
 *   className="bg-background"
 * >
 *   {header.isPlaceholder
 *     ? null
 *     : flexRender(header.column.columnDef.header, header.getContext())
 *   }
 * </ResizableColumn>
 * ```
 */
export function ResizableColumn<T>({
  header,
  className,
  children,
  isSticky = false,
  stickyLeft = 0,
  minWidth = 50,
  maxWidth = 500,
  showResizeHandle = true,
}: ResizableColumnProps<T>) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const column = header.column;
  const canResize = column.getCanResize();
  const currentWidth = column.getSize();

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canResize) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [canResize, currentWidth]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !canResize) return;
    
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.min(
      Math.max(startWidthRef.current + deltaX, minWidth),
      maxWidth
    );
    
    column.setSize(newWidth);
  }, [isResizing, canResize, column, minWidth, maxWidth]);

  // Handle mouse up to end resize
  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;
    
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isResizing]);

  // Add/remove global event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Double click to auto-resize
  const handleDoubleClick = useCallback(() => {
    if (canResize) {
      column.resetSize();
    }
  }, [canResize, column]);

  const stickyStyles = isSticky ? {
    position: 'sticky' as const,
    left: stickyLeft,
    zIndex: 20,
  } : {};

  return (
    <th
      className={cn(
        "relative border-r border-border bg-background text-left font-medium",
        isSticky && "shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]",
        className
      )}
      style={{
        width: currentWidth,
        minWidth: currentWidth,
        maxWidth: currentWidth,
        ...stickyStyles,
      }}
    >
      <div className="px-3 py-2 h-full">
        {children}
      </div>
      
      {canResize && showResizeHandle && (
        <div
          ref={resizeRef}
          className={cn(
            "absolute top-0 right-0 w-1 h-full cursor-col-resize group",
            "hover:bg-border active:bg-border",
            isResizing && "bg-border"
          )}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          <div 
            className={cn(
              "absolute right-0 top-0 w-[3px] h-full transition-colors",
              "group-hover:bg-primary/50",
              isResizing && "bg-primary"
            )}
          />
        </div>
      )}
    </th>
  );
}

/**
 * Hook to calculate sticky column positions
 */
export function useStickyColumns<T>(
  headers: Header<T, unknown>[],
  stickyColumnIds: string[] = []
): Record<string, number> {
  return headers.reduce((acc, header, index) => {
    const columnId = header.column.id;
    
    if (stickyColumnIds.includes(columnId)) {
      // Calculate left position by summing widths of previous sticky columns
      const leftPosition = headers
        .slice(0, index)
        .filter(h => stickyColumnIds.includes(h.column.id))
        .reduce((sum, h) => sum + h.column.getSize(), 0);
      
      acc[columnId] = leftPosition;
    }
    
    return acc;
  }, {} as Record<string, number>);
}