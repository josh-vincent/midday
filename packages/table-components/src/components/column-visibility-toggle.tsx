"use client";

import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Badge } from "@midday/ui/badge";
import { Columns3, Eye, EyeOff, RotateCcw } from "lucide-react";
import type { Column } from "@tanstack/react-table";

/**
 * Column definition for visibility control
 */
export interface ColumnVisibilityItem {
  /** Unique identifier for the column */
  id: string;
  /** Display label for the column */
  label: string;
  /** Whether the column is currently visible */
  visible: boolean;
  /** Whether the column can be hidden (some columns like actions might be required) */
  canHide?: boolean;
  /** Optional description for the column */
  description?: string;
}

/**
 * Props for the ColumnVisibilityToggle component
 */
export interface ColumnVisibilityToggleProps {
  /** Array of column visibility items */
  columns: ColumnVisibilityItem[];
  /** Callback when column visibility changes */
  onVisibilityChange: (columnId: string, visible: boolean) => void;
  /** Callback to reset to default visibility */
  onResetToDefault?: () => void;
  /** Button text */
  buttonText?: string;
  /** Whether to show hidden count badge */
  showHiddenCount?: boolean;
  /** Position of the dropdown */
  align?: "start" | "center" | "end";
  /** Additional CSS classes for the trigger button */
  className?: string;
}

/**
 * A dropdown component for managing table column visibility
 * 
 * @example
 * ```tsx
 * const [columnVisibility, setColumnVisibility] = useState({
 *   name: true,
 *   email: true,
 *   phone: false,
 *   actions: true
 * });
 * 
 * const columns: ColumnVisibilityItem[] = [
 *   { id: 'name', label: 'Name', visible: columnVisibility.name },
 *   { id: 'email', label: 'Email', visible: columnVisibility.email },
 *   { id: 'phone', label: 'Phone', visible: columnVisibility.phone },
 *   { id: 'actions', label: 'Actions', visible: columnVisibility.actions, canHide: false }
 * ];
 * 
 * <ColumnVisibilityToggle
 *   columns={columns}
 *   onVisibilityChange={(columnId, visible) => {
 *     setColumnVisibility(prev => ({ ...prev, [columnId]: visible }));
 *   }}
 *   onResetToDefault={() => {
 *     setColumnVisibility({ name: true, email: true, phone: true, actions: true });
 *   }}
 * />
 * ```
 */
export function ColumnVisibilityToggle({
  columns,
  onVisibilityChange,
  onResetToDefault,
  buttonText = "Columns",
  showHiddenCount = true,
  align = "end",
  className = "",
}: ColumnVisibilityToggleProps) {
  const hiddenCount = columns.filter(col => !col.visible && col.canHide !== false).length;
  const visibleCount = columns.filter(col => col.visible).length;
  const totalHideableColumns = columns.filter(col => col.canHide !== false).length;

  const handleToggleAll = (visible: boolean) => {
    columns.forEach(col => {
      if (col.canHide !== false) {
        onVisibilityChange(col.id, visible);
      }
    });
  };

  const canHideAll = visibleCount > 1; // Always keep at least one column visible
  const canShowAll = hiddenCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Columns3 className="h-4 w-4 mr-2" />
          {buttonText}
          {showHiddenCount && hiddenCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {hiddenCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Toggle columns</span>
          <span className="text-xs text-muted-foreground font-normal">
            {visibleCount}/{columns.length}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Quick actions */}
        <div className="flex gap-1 p-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs flex-1"
            onClick={() => handleToggleAll(true)}
            disabled={!canShowAll}
          >
            <Eye className="h-3 w-3 mr-1" />
            Show all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs flex-1"
            onClick={() => handleToggleAll(false)}
            disabled={!canHideAll}
          >
            <EyeOff className="h-3 w-3 mr-1" />
            Hide all
          </Button>
          {onResetToDefault && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onResetToDefault}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {/* Individual column toggles */}
        <div className="max-h-64 overflow-y-auto">
          {columns.map((column) => {
            const canToggle = column.canHide !== false && (column.visible || visibleCount > 1);
            
            return (
              <DropdownMenuItem
                key={column.id}
                className="p-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  if (canToggle) {
                    onVisibilityChange(column.id, !column.visible);
                  }
                }}
              >
                <div className="flex items-center space-x-2 w-full">
                  <Checkbox
                    checked={column.visible}
                    disabled={!canToggle}
                    onCheckedChange={(checked) => {
                      if (canToggle) {
                        onVisibilityChange(column.id, checked as boolean);
                      }
                    }}
                    className="pointer-events-none"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {column.label}
                    </div>
                    {column.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {column.description}
                      </div>
                    )}
                  </div>
                  {column.canHide === false && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Hook to work with react-table column visibility
 */
export function useColumnVisibilityItems<T>(
  columns: Column<T>[],
  visibilityState: Record<string, boolean>,
  columnLabels?: Record<string, string>
): ColumnVisibilityItem[] {
  return columns.map(col => ({
    id: col.id,
    label: columnLabels?.[col.id] || col.id,
    visible: visibilityState[col.id] ?? col.getIsVisible(),
    canHide: col.getCanHide(),
  }));
}