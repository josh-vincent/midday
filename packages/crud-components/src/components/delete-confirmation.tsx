"use client";

import React from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@midday/ui/button";
import { ConfirmDialog } from "@midday/overlay-components/confirm-dialog";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Checkbox } from "@midday/ui/checkbox";
import { toast } from "@midday/ui/use-toast";
import type { BaseEntity, ConfirmationConfig } from "../types";

interface DeleteConfirmationProps<T extends BaseEntity> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity?: T;
  entities?: T[];
  onDelete: (ids: string[]) => Promise<void>;
  getEntityName?: (entity: T) => string;
  title?: string;
  description?: string;
  confirmationConfig?: Partial<ConfirmationConfig>;
  showDetails?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Generic delete confirmation dialog for entities
 * 
 * @param props Configuration props for the delete confirmation
 * @returns Delete confirmation dialog component
 * 
 * @example
 * ```tsx
 * // Single entity deletion
 * <DeleteConfirmation
 *   open={isDeleteOpen}
 *   onOpenChange={setIsDeleteOpen}
 *   entity={customer}
 *   onDelete={async (ids) => await deleteCustomers(ids)}
 *   getEntityName={(customer) => customer.name}
 *   confirmationConfig={{ requireConfirmation: true, confirmationText: "DELETE" }}
 * />
 * 
 * // Bulk deletion
 * <DeleteConfirmation
 *   open={isBulkDeleteOpen}
 *   onOpenChange={setIsBulkDeleteOpen}
 *   entities={selectedCustomers}
 *   onDelete={bulkDeleteCustomers}
 *   title="Delete Multiple Customers"
 * />
 * ```
 */
export function DeleteConfirmation<T extends BaseEntity>({
  open,
  onOpenChange,
  entity,
  entities,
  onDelete,
  getEntityName = (entity: T) => `${entity.id}`,
  title,
  description,
  confirmationConfig = {},
  showDetails = true,
  onSuccess,
  onError,
}: DeleteConfirmationProps<T>) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [confirmationText, setConfirmationText] = React.useState("");
  const [permanentDelete, setPermanentDelete] = React.useState(false);

  const isBulkDelete = !!entities && entities.length > 1;
  const targetEntities = entities || (entity ? [entity] : []);
  const entityCount = targetEntities.length;

  const {
    requireConfirmation = false,
    confirmationText: requiredConfirmationText = "DELETE",
    variant = "destructive",
  } = confirmationConfig;

  const defaultTitle = isBulkDelete
    ? `Delete ${entityCount} Items`
    : `Delete ${entity ? getEntityName(entity) : "Item"}`;

  const defaultDescription = isBulkDelete
    ? `Are you sure you want to delete these ${entityCount} items? This action cannot be undone.`
    : `Are you sure you want to delete ${entity ? getEntityName(entity) : "this item"}? This action cannot be undone.`;

  const canConfirm = !requireConfirmation || 
    confirmationText.toLowerCase() === requiredConfirmationText.toLowerCase();

  const handleDelete = async () => {
    if (!canConfirm) return;

    setIsLoading(true);
    try {
      const idsToDelete = targetEntities.map(e => e.id);
      await onDelete(idsToDelete);
      
      onOpenChange(false);
      onSuccess?.();
      
      toast({
        variant: "success",
        title: "Deleted successfully",
        description: isBulkDelete
          ? `${entityCount} items have been deleted`
          : `${entity ? getEntityName(entity) : "Item"} has been deleted`,
      });
    } catch (error) {
      const err = error as Error;
      onError?.(err);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err.message || "Failed to delete item(s)",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setConfirmationText("");
    setPermanentDelete(false);
    onOpenChange(false);
  };

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setConfirmationText("");
      setPermanentDelete(false);
      setIsLoading(false);
    }
  }, [open]);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title || defaultTitle}
      description={description || defaultDescription}
      variant={variant}
      icon={<AlertTriangle className="h-6 w-6" />}
    >
      <div className="space-y-4">
        {showDetails && targetEntities.length > 0 && (
          <div className="rounded-md border p-3 bg-muted/50">
            <h4 className="text-sm font-medium mb-2">
              {isBulkDelete ? "Items to delete:" : "Item to delete:"}
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {targetEntities.slice(0, 10).map((item) => (
                <div key={item.id} className="text-sm text-muted-foreground flex items-center gap-2">
                  <Trash2 className="h-3 w-3" />
                  {getEntityName(item)}
                </div>
              ))}
              {targetEntities.length > 10 && (
                <div className="text-sm text-muted-foreground italic">
                  ... and {targetEntities.length - 10} more items
                </div>
              )}
            </div>
          </div>
        )}

        {requireConfirmation && (
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type "{requiredConfirmationText}" to confirm deletion:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={requiredConfirmationText}
              autoComplete="off"
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="permanent"
            checked={permanentDelete}
            onCheckedChange={setPermanentDelete}
          />
          <Label
            htmlFor="permanent"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I understand this action is permanent and cannot be undone
          </Label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || !canConfirm || !permanentDelete}
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trash2 className="mr-2 h-4 w-4" />
            {isBulkDelete ? `Delete ${entityCount} Items` : "Delete"}
          </Button>
        </div>
      </div>
    </ConfirmDialog>
  );
}

/**
 * Hook for managing delete confirmation state
 */
export function useDeleteConfirmation<T extends BaseEntity>() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [targetEntity, setTargetEntity] = React.useState<T | undefined>();
  const [targetEntities, setTargetEntities] = React.useState<T[] | undefined>();

  const confirmDelete = React.useCallback((entity: T) => {
    setTargetEntity(entity);
    setTargetEntities(undefined);
    setIsOpen(true);
  }, []);

  const confirmBulkDelete = React.useCallback((entities: T[]) => {
    setTargetEntity(undefined);
    setTargetEntities(entities);
    setIsOpen(true);
  }, []);

  const close = React.useCallback(() => {
    setIsOpen(false);
    setTargetEntity(undefined);
    setTargetEntities(undefined);
  }, []);

  return {
    isOpen,
    targetEntity,
    targetEntities,
    confirmDelete,
    confirmBulkDelete,
    close,
    setIsOpen,
  };
}