"use client";

import { TableRow, TableCell } from "@midday/ui/table";
import { Badge } from "@midday/ui/badge";
import type { Row } from "@tanstack/react-table";
import { Layers, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

/**
 * Interface for grouped data that extends the base data type
 */
export interface GroupedData {
  /** Unique identifier for the group */
  id: string;
  /** Indicates if this row represents a group */
  isGrouped: boolean;
  /** Number of items in the group */
  itemCount: number;
  /** Array of IDs belonging to this group */
  groupItemIds?: string[];
  /** The field(s) this group is grouped by */
  groupBy?: string[];
  /** Aggregated data for the group */
  aggregatedData?: Record<string, any>;
}

/**
 * Props for the GroupedTableRow component
 */
export interface GroupedTableRowProps<T extends GroupedData> {
  /** The tanstack table row object */
  row: Row<T>;
  /** Callback when row is clicked */
  onRowClick?: (data: T) => void;
  /** Callback when group is expanded/collapsed */
  onToggleExpanded?: (groupId: string, isExpanded: boolean) => void;
  /** Whether the group is currently expanded */
  isExpanded?: boolean;
  /** Custom renderer for group summary */
  renderGroupSummary?: (data: T) => React.ReactNode;
  /** Custom renderer for aggregated values */
  renderAggregatedValue?: (columnId: string, value: any, data: T) => React.ReactNode;
  /** Columns that should show aggregated data */
  aggregatedColumns?: string[];
}

/**
 * A table row component for displaying grouped data with aggregation and expansion controls
 * 
 * @example
 * ```tsx
 * <GroupedTableRow
 *   row={row}
 *   isExpanded={expandedGroups[row.original.id]}
 *   onToggleExpanded={handleToggleExpanded}
 *   aggregatedColumns={['amount', 'quantity']}
 *   renderAggregatedValue={(columnId, value) => {
 *     if (columnId === 'amount') return `$${value.toFixed(2)}`;
 *     return value;
 *   }}
 * />
 * ```
 */
export function GroupedTableRow<T extends GroupedData>({
  row,
  onRowClick,
  onToggleExpanded,
  isExpanded = false,
  renderGroupSummary,
  renderAggregatedValue,
  aggregatedColumns = [],
}: GroupedTableRowProps<T>) {
  const data = row.original;

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('[role="checkbox"]') ||
      target.closest('[data-action-menu]') ||
      target.closest('button')
    ) {
      return;
    }
    
    onRowClick?.(data);
  };

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpanded?.(data.id, !isExpanded);
  };

  if (!data.isGrouped) {
    // Render normal row if not grouped
    return (
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={handleRowClick}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {cell.column.columnDef.cell?.(cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  }

  // Render grouped row
  return (
    <TableRow
      className="group cursor-pointer bg-muted/20 hover:bg-muted/40 border-b-2 border-border"
      onClick={handleRowClick}
    >
      {row.getVisibleCells().map((cell) => {
        const columnId = cell.column.id;
        
        // First column gets the group indicator
        if (cell.column.getIndex() === 0) {
          return (
            <TableCell
              key={cell.id}
              className="font-medium"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleExpanded}
                  className="p-1 hover:bg-background rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <Layers className="h-4 w-4 text-muted-foreground" />
                {renderGroupSummary ? (
                  renderGroupSummary(data)
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {data.itemCount} items
                    </span>
                    {data.groupBy && data.groupBy.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {data.groupBy.join(", ")}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </TableCell>
          );
        }
        
        // Show aggregated values for specified columns
        if (aggregatedColumns.includes(columnId) && data.aggregatedData?.[columnId] !== undefined) {
          const aggregatedValue = data.aggregatedData[columnId];
          return (
            <TableCell
              key={cell.id}
              className="font-medium text-foreground"
            >
              {renderAggregatedValue 
                ? renderAggregatedValue(columnId, aggregatedValue, data)
                : aggregatedValue
              }
            </TableCell>
          );
        }
        
        // Empty cell for non-aggregated columns
        return (
          <TableCell key={cell.id} className="text-muted-foreground">
            -
          </TableCell>
        );
      })}
    </TableRow>
  );
}