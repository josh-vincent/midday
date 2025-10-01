"use client";

import { forwardRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@midday/ui/cn";
import { Button } from "@midday/ui/button";
import type { ModalProps } from "../types";
import { 
  useFocusTrap, 
  useBodyScroll, 
  useEscapeKey, 
  useStackedOverlays 
} from "../hooks";
import { 
  generateOverlayId, 
  getAnimationConfig, 
  mergeAnimationConfig,
  Z_INDEX 
} from "../utils";

export interface BaseModalProps extends ModalProps {
  /** Modal title for accessibility */
  title?: string;
  /** Modal description for accessibility */
  description?: string;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Custom header content */
  header?: React.ReactNode;
  /** Custom footer content */
  footer?: React.ReactNode;
  /** Whether modal is dismissible by clicking backdrop */
  dismissible?: boolean;
}

/**
 * Extensible modal/dialog component with animations and advanced features
 * 
 * Features:
 * - Multiple size options (sm, md, lg, xl, full)
 * - Smooth animations with framer-motion
 * - Focus trap and keyboard navigation
 * - Centered or custom positioning
 * - Nested modal support
 * - Responsive behavior
 * 
 * @example
 * ```tsx
 * function CreateCustomerModal() {
 *   const [open, setOpen] = useState(false);
 *   
 *   return (
 *     <BaseModal
 *       open={open}
 *       onOpenChange={setOpen}
 *       title="Create Customer"
 *       size="lg"
 *       centered
 *     >
 *       <div>Modal content here</div>
 *     </BaseModal>
 *   );
 * }
 * ```
 */
export const BaseModal = forwardRef<HTMLDivElement, BaseModalProps>(
  (
    {
      open = false,
      onOpenChange,
      size = "md",
      centered = true,
      resizable = false,
      title,
      description,
      showCloseButton = true,
      header,
      footer,
      dismissible = true,
      animation = { preset: "scale" },
      backdrop = { show: true, blur: true, dismissible: true },
      focusTrap = { enabled: true, restoreFocus: true },
      closeOnEscape = true,
      lockScroll = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Generate unique ID for this modal instance
    const modalId = useMemo(() => generateOverlayId("modal"), []);
    
    // Stack management for nested modals
    const stack = useStackedOverlays(modalId);
    
    // Register/unregister with stack
    useEffect(() => {
      if (open) {
        stack.register(modalId);
      } else {
        stack.unregister(modalId);
      }
    }, [open, modalId, stack]);

    // Focus trap
    const containerRef = useFocusTrap(open, focusTrap);
    
    // Body scroll lock
    useBodyScroll(open && lockScroll);
    
    // Escape key handling
    useEscapeKey(() => {
      if (closeOnEscape && stack.isTopmost(modalId)) {
        onOpenChange?.(false);
      }
    }, open);

    // Animation configuration
    const animationConfig = useMemo(() => {
      const baseConfig = getAnimationConfig(animation.preset || "scale");
      return mergeAnimationConfig(baseConfig, animation);
    }, [animation]);

    const zIndex = stack.getZIndex(modalId);

    // Backdrop click handler
    const handleBackdropClick = (e: React.MouseEvent) => {
      if (
        dismissible && 
        backdrop.dismissible && 
        stack.isTopmost(modalId) &&
        e.target === e.currentTarget
      ) {
        onOpenChange?.(false);
      }
    };

    // Size-specific classes
    const sizeClasses = {
      sm: "max-w-sm",
      md: "max-w-md", 
      lg: "max-w-lg",
      xl: "max-w-xl",
      full: "max-w-[95vw] max-h-[95vh]",
    };

    return (
      <AnimatePresence>
        {open && (
          <div
            style={{ zIndex }}
            className="fixed inset-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? `${modalId}-title` : undefined}
            aria-describedby={description ? `${modalId}-description` : undefined}
          >
            {/* Backdrop */}
            {backdrop.show && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: backdrop.opacity || 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: animationConfig.duration! / 1000 }}
                className={cn(
                  "absolute inset-0 bg-black/60",
                  backdrop.blur && "backdrop-blur-sm"
                )}
                onClick={handleBackdropClick}
              />
            )}

            {/* Modal Container */}
            <div
              className={cn(
                "fixed inset-0 z-10 overflow-y-auto",
                centered && "flex items-center justify-center p-4"
              )}
              onClick={handleBackdropClick}
            >
              <motion.div
                ref={ref}
                className={cn(
                  "relative bg-background border border-border shadow-lg rounded-lg w-full",
                  sizeClasses[size],
                  centered && "mx-auto",
                  resizable && "resize overflow-auto",
                  className
                )}
                initial={
                  animation.preset === "scale"
                    ? { opacity: 0, scale: 0.95 }
                    : animation.preset === "fade"
                    ? { opacity: 0 }
                    : { opacity: 0, y: -50 }
                }
                animate={
                  animation.preset === "scale"
                    ? { opacity: 1, scale: 1 }
                    : animation.preset === "fade"
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0 }
                }
                exit={
                  animation.preset === "scale"
                    ? { opacity: 0, scale: 0.95 }
                    : animation.preset === "fade"
                    ? { opacity: 0 }
                    : { opacity: 0, y: -50 }
                }
                transition={{
                  duration: animationConfig.duration! / 1000,
                  ease: animationConfig.easing,
                }}
                onClick={(e) => e.stopPropagation()}
                {...props}
              >
                {/* Modal Content */}
                <div
                  ref={containerRef}
                  className="flex flex-col max-h-[90vh]"
                >
                  {/* Header */}
                  {(title || header || showCloseButton) && (
                    <div className="flex-shrink-0 px-6 py-4 border-b border-border">
                      {header ? (
                        header
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            {title && (
                              <h2
                                id={`${modalId}-title`}
                                className="text-lg font-semibold text-foreground"
                              >
                                {title}
                              </h2>
                            )}
                            {description && (
                              <p
                                id={`${modalId}-description`}
                                className="text-sm text-muted-foreground mt-1"
                              >
                                {description}
                              </p>
                            )}
                          </div>
                          {showCloseButton && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onOpenChange?.(false)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Close</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {children}
                  </div>

                  {/* Footer */}
                  {footer && (
                    <div className="flex-shrink-0 px-6 py-4 border-t border-border">
                      {footer}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    );
  }
);

BaseModal.displayName = "BaseModal";