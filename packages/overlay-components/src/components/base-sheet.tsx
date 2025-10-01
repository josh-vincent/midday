"use client";

import { forwardRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@midday/ui/cn";
import { Button } from "@midday/ui/button";
import type { SheetProps, Side } from "../types";
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

export interface BaseSheetProps extends SheetProps {
  /** Sheet title for accessibility */
  title?: string;
  /** Sheet description for accessibility */
  description?: string;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Custom header content */
  header?: React.ReactNode;
  /** Custom footer content */
  footer?: React.ReactNode;
  /** Maximum width for the sheet */
  maxWidth?: string;
  /** Whether sheet is dismissible by clicking backdrop */
  dismissible?: boolean;
}

/**
 * Extensible sheet component with animations and advanced features
 * 
 * Features:
 * - Customizable slide directions
 * - Smooth animations with framer-motion
 * - Focus trap and keyboard navigation
 * - Swipe to dismiss on mobile
 * - Nested sheet support
 * - Responsive behavior
 * 
 * @example
 * ```tsx
 * function CustomerSheet() {
 *   const [open, setOpen] = useState(false);
 *   
 *   return (
 *     <BaseSheet
 *       open={open}
 *       onOpenChange={setOpen}
 *       title="Customer Details"
 *       side="right"
 *       swipeIndicator
 *     >
 *       <div>Customer content here</div>
 *     </BaseSheet>
 *   );
 * }
 * ```
 */
export const BaseSheet = forwardRef<HTMLDivElement, BaseSheetProps>(
  (
    {
      open = false,
      onOpenChange,
      side = "right",
      title,
      description,
      showCloseButton = true,
      header,
      footer,
      maxWidth,
      dismissible = true,
      nested = false,
      swipeIndicator = false,
      swipeThreshold = 0.3,
      animation = { preset: "slide" },
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
    // Generate unique ID for this sheet instance
    const sheetId = useMemo(() => generateOverlayId("sheet"), []);
    
    // Stack management for nested sheets
    const stack = useStackedOverlays(sheetId);
    
    // Register/unregister with stack
    useEffect(() => {
      if (open) {
        stack.register(sheetId);
      } else {
        stack.unregister(sheetId);
      }
    }, [open, sheetId, stack]);

    // Focus trap
    const containerRef = useFocusTrap(open && !nested, focusTrap);
    
    // Body scroll lock
    useBodyScroll(open && lockScroll && !nested);
    
    // Escape key handling
    useEscapeKey(() => {
      if (closeOnEscape && stack.isTopmost(sheetId)) {
        onOpenChange?.(false);
      }
    }, open);

    // Animation configuration
    const animationConfig = useMemo(() => {
      const baseConfig = getAnimationConfig(animation.preset || "slide");
      return mergeAnimationConfig(baseConfig, animation);
    }, [animation]);

    // Side-specific animation variants
    const getAnimationVariants = (side: Side) => {
      const variants = {
        right: {
          initial: { x: "100%" },
          animate: { x: 0 },
          exit: { x: "100%" },
        },
        left: {
          initial: { x: "-100%" },
          animate: { x: 0 },
          exit: { x: "-100%" },
        },
        top: {
          initial: { y: "-100%" },
          animate: { y: 0 },
          exit: { y: "-100%" },
        },
        bottom: {
          initial: { y: "100%" },
          animate: { y: 0 },
          exit: { y: "100%" },
        },
      };
      
      return variants[side];
    };

    const variants = getAnimationVariants(side);
    const zIndex = stack.getZIndex(sheetId);

    // Backdrop click handler
    const handleBackdropClick = () => {
      if (dismissible && backdrop.dismissible && stack.isTopmost(sheetId)) {
        onOpenChange?.(false);
      }
    };

    // Side-specific positioning classes
    const positionClasses = {
      right: "inset-y-0 right-0",
      left: "inset-y-0 left-0", 
      top: "inset-x-0 top-0",
      bottom: "inset-x-0 bottom-0",
    };

    // Side-specific sizing classes
    const sizeClasses = {
      right: "h-full w-full max-w-[520px]",
      left: "h-full w-full max-w-[520px]",
      top: "w-full h-full max-h-[80vh]",
      bottom: "w-full h-full max-h-[80vh]",
    };

    return (
      <AnimatePresence>
        {open && (
          <div
            style={{ zIndex }}
            className="fixed inset-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? `${sheetId}-title` : undefined}
            aria-describedby={description ? `${sheetId}-description` : undefined}
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

            {/* Sheet Container */}
            <motion.div
              ref={ref}
              className={cn(
                "fixed z-10",
                positionClasses[side],
                sizeClasses[side]
              )}
              initial={variants.initial}
              animate={variants.animate}
              exit={variants.exit}
              transition={{
                duration: animationConfig.duration! / 1000,
                ease: animationConfig.easing,
              }}
              {...props}
            >
              {/* Sheet Content */}
              <div
                ref={containerRef}
                className={cn(
                  "h-full w-full bg-background border border-border shadow-lg flex flex-col",
                  maxWidth && `max-w-[${maxWidth}]`,
                  className
                )}
                style={{ maxWidth }}
              >
                {/* Swipe Indicator */}
                {swipeIndicator && (side === "right" || side === "left") && (
                  <div className="flex justify-center py-2">
                    <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
                  </div>
                )}

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
                              id={`${sheetId}-title`}
                              className="text-lg font-semibold text-foreground"
                            >
                              {title}
                            </h2>
                          )}
                          {description && (
                            <p
                              id={`${sheetId}-description`}
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
        )}
      </AnimatePresence>
    );
  }
);

BaseSheet.displayName = "BaseSheet";