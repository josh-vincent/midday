"use client";

import { forwardRef, useState } from "react";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@midday/ui/cn";
import { Button } from "@midday/ui/button";
import { BaseModal } from "./base-modal";
import type { BaseOverlayProps, ConfirmAction } from "../types";

export interface ConfirmDialogProps extends Omit<BaseOverlayProps, "children"> {
  /** Dialog title */
  title?: string;
  /** Dialog message/description */
  message?: string;
  /** Dialog type affects icon and styling */
  type?: "default" | "warning" | "danger" | "info" | "success";
  /** Primary action configuration */
  confirmAction?: ConfirmAction;
  /** Secondary action configuration */
  cancelAction?: ConfirmAction;
  /** Whether to show icon */
  showIcon?: boolean;
  /** Custom icon element */
  icon?: React.ReactNode;
  /** Custom content */
  children?: React.ReactNode;
}

/**
 * Confirmation dialog with customizable actions and styling
 * 
 * Features:
 * - Multiple dialog types (warning, danger, info, success)
 * - Customizable confirm/cancel actions
 * - Loading states for async actions
 * - Flexible content with custom children
 * - Accessible keyboard navigation
 * 
 * @example
 * ```tsx
 * function DeleteCustomerDialog() {
 *   const [open, setOpen] = useState(false);
 *   
 *   return (
 *     <ConfirmDialog
 *       open={open}
 *       onOpenChange={setOpen}
 *       type="danger"
 *       title="Delete Customer"
 *       message="Are you sure you want to delete this customer? This action cannot be undone."
 *       confirmAction={{
 *         label: "Delete",
 *         variant: "destructive",
 *         onClick: async () => {
 *           await deleteCustomer();
 *           setOpen(false);
 *         }
 *       }}
 *       cancelAction={{
 *         label: "Cancel",
 *         onClick: () => setOpen(false)
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(
  (
    {
      open = false,
      onOpenChange,
      type = "default",
      title,
      message,
      confirmAction,
      cancelAction,
      showIcon = true,
      icon,
      children,
      animation = { preset: "scale" },
      ...props
    },
    ref
  ) => {
    const [isConfirmLoading, setIsConfirmLoading] = useState(false);
    const [isCancelLoading, setIsCancelLoading] = useState(false);

    // Type-specific configurations
    const typeConfig = {
      default: {
        icon: Info,
        iconColor: "text-blue-500",
        iconBg: "bg-blue-50",
      },
      warning: {
        icon: AlertTriangle,
        iconColor: "text-yellow-500",
        iconBg: "bg-yellow-50",
      },
      danger: {
        icon: XCircle,
        iconColor: "text-red-500", 
        iconBg: "bg-red-50",
      },
      info: {
        icon: Info,
        iconColor: "text-blue-500",
        iconBg: "bg-blue-50",
      },
      success: {
        icon: CheckCircle,
        iconColor: "text-green-500",
        iconBg: "bg-green-50",
      },
    };

    const config = typeConfig[type];
    const IconComponent = icon || config.icon;

    // Default actions based on type
    const defaultConfirmAction: ConfirmAction = {
      label: type === "danger" ? "Delete" : "Confirm",
      variant: type === "danger" ? "destructive" : "default",
      onClick: () => onOpenChange?.(false),
    };

    const defaultCancelAction: ConfirmAction = {
      label: "Cancel",
      variant: "outline",
      onClick: () => onOpenChange?.(false),
    };

    const finalConfirmAction = confirmAction || defaultConfirmAction;
    const finalCancelAction = cancelAction || defaultCancelAction;

    // Handle confirm action
    const handleConfirm = async () => {
      if (finalConfirmAction.loading || isConfirmLoading) return;
      
      setIsConfirmLoading(true);
      try {
        await finalConfirmAction.onClick();
      } catch (error) {
        console.error("Confirm action failed:", error);
      } finally {
        setIsConfirmLoading(false);
      }
    };

    // Handle cancel action
    const handleCancel = async () => {
      if (finalCancelAction.loading || isCancelLoading) return;
      
      setIsCancelLoading(true);
      try {
        await finalCancelAction.onClick();
      } catch (error) {
        console.error("Cancel action failed:", error);
      } finally {
        setIsCancelLoading(false);
      }
    };

    return (
      <BaseModal
        ref={ref}
        open={open}
        onOpenChange={onOpenChange}
        size="sm"
        centered
        showCloseButton={false}
        animation={animation}
        {...props}
      >
        <div className="text-center">
          {/* Icon */}
          {showIcon && IconComponent && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                config.iconBg
              )}>
                <IconComponent className={cn("h-6 w-6", config.iconColor)} />
              </div>
            </div>
          )}

          {/* Title */}
          {title && (
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {title}
            </h3>
          )}

          {/* Message */}
          {message && (
            <p className="mb-6 text-sm text-muted-foreground">
              {message}
            </p>
          )}

          {/* Custom Content */}
          {children && (
            <div className="mb-6">
              {children}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button
              variant={finalCancelAction.variant || "outline"}
              onClick={handleCancel}
              disabled={finalCancelAction.loading || isCancelLoading || isConfirmLoading}
              className="w-full sm:w-auto"
            >
              {(finalCancelAction.loading || isCancelLoading) && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {finalCancelAction.label}
            </Button>
            
            <Button
              variant={finalConfirmAction.variant || "default"}
              onClick={handleConfirm}
              disabled={finalConfirmAction.loading || isConfirmLoading || isCancelLoading}
              className="w-full sm:w-auto"
            >
              {(finalConfirmAction.loading || isConfirmLoading) && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {finalConfirmAction.label}
            </Button>
          </div>
        </div>
      </BaseModal>
    );
  }
);

ConfirmDialog.displayName = "ConfirmDialog";