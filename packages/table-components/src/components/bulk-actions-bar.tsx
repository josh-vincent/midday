"use client";

import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { X, Download, Trash2, Edit3, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Interface for a bulk action
 */
export interface BulkAction {
  /** Unique identifier for the action */
  id: string;
  /** Display label for the action */
  label: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Action handler function */
  onClick: (selectedIds: string[]) => void;
  /** Button variant */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Whether action is disabled */
  disabled?: boolean;
  /** Whether to show a confirmation dialog */
  requiresConfirmation?: boolean;
  /** Custom confirmation message */
  confirmationMessage?: string;
}

/**
 * Props for the BulkActionsBar component
 */
export interface BulkActionsBarProps {
  /** Array of selected item IDs */
  selectedIds: string[];
  /** Array of available bulk actions */
  actions: BulkAction[];
  /** Callback to clear selection */
  onClearSelection: () => void;
  /** Optional custom content to show alongside actions */
  children?: React.ReactNode;
  /** Whether to show the selected count */
  showCount?: boolean;
  /** Custom label for selected items */
  selectedLabel?: string;
  /** Position of the bar */
  position?: "top" | "bottom" | "sticky-top" | "sticky-bottom";
  /** Additional CSS classes */
  className?: string;
}

/**
 * A bulk actions bar that appears when items are selected in a table
 * 
 * @example
 * ```tsx
 * const bulkActions: BulkAction[] = [
 *   {
 *     id: 'delete',
 *     label: 'Delete',
 *     icon: Trash2,
 *     variant: 'destructive',
 *     onClick: (ids) => handleDelete(ids),
 *     requiresConfirmation: true,
 *     confirmationMessage: 'Are you sure you want to delete the selected items?'
 *   },
 *   {
 *     id: 'export',
 *     label: 'Export',
 *     icon: Download,
 *     onClick: (ids) => handleExport(ids)
 *   }
 * ];
 * 
 * <BulkActionsBar
 *   selectedIds={selectedItemIds}
 *   actions={bulkActions}
 *   onClearSelection={() => setSelectedItemIds([])}
 *   position="sticky-bottom"
 * />
 * ```
 */
export function BulkActionsBar({
  selectedIds,
  actions,
  onClearSelection,
  children,
  showCount = true,
  selectedLabel = "selected",
  position = "sticky-bottom",
  className = "",
}: BulkActionsBarProps) {
  const isVisible = selectedIds.length > 0;

  const handleActionClick = async (action: BulkAction) => {
    if (action.disabled) return;

    if (action.requiresConfirmation) {
      const message = action.confirmationMessage || 
        `Are you sure you want to ${action.label.toLowerCase()} ${selectedIds.length} item${selectedIds.length > 1 ? 's' : ''}?`;
      
      if (!window.confirm(message)) {
        return;
      }
    }

    action.onClick(selectedIds);
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "top-0";
      case "bottom":
        return "bottom-0";
      case "sticky-top":
        return "sticky top-0 z-40";
      case "sticky-bottom":
        return "sticky bottom-0 z-40";
      default:
        return "sticky bottom-0 z-40";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position.includes("bottom") ? 20 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position.includes("bottom") ? 20 : -20 }}
          transition={{ duration: 0.2 }}
          className={`
            ${getPositionClasses()}
            left-0 right-0 bg-background/95 backdrop-blur-sm border-t 
            border-border shadow-lg px-4 py-3 flex items-center gap-4
            ${className}
          `}
        >
          <div className="flex items-center gap-2">
            {showCount && (
              <Badge variant="secondary" className="font-medium">
                {selectedIds.length} {selectedLabel}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear selection</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-1">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className="h-8"
                >
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  {action.label}
                </Button>
              );
            })}
          </div>

          {children && (
            <div className="flex items-center gap-2">
              {children}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Common bulk actions that can be used across different tables
 */
export const commonBulkActions = {
  delete: (onDelete: (ids: string[]) => void): BulkAction => ({
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'destructive' as const,
    onClick: onDelete,
    requiresConfirmation: true,
  }),

  export: (onExport: (ids: string[]) => void): BulkAction => ({
    id: 'export',
    label: 'Export',
    icon: Download,
    variant: 'outline' as const,
    onClick: onExport,
  }),

  edit: (onEdit: (ids: string[]) => void): BulkAction => ({
    id: 'edit',
    label: 'Edit',
    icon: Edit3,
    variant: 'outline' as const,
    onClick: onEdit,
  }),

  archive: (onArchive: (ids: string[]) => void): BulkAction => ({
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    variant: 'outline' as const,
    onClick: onArchive,
    requiresConfirmation: true,
  }),
};