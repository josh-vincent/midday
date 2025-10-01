"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { cn } from "@midday/ui/cn";
import type { BaseOverlayProps, Side } from "../types";
import { 
  useFocusTrap, 
  useBodyScroll, 
  useEscapeKey, 
  useStackedOverlays,
  useIsMobile
} from "../hooks";
import { generateOverlayId, Z_INDEX } from "../utils";

export interface DrawerProps extends BaseOverlayProps {
  /** Drawer title for accessibility */
  title?: string;
  /** Drawer description for accessibility */
  description?: string;
  /** Side to slide in from */
  side?: Extract<Side, "bottom" | "top" | "left" | "right">;
  /** Whether to show drag handle */
  showHandle?: boolean;
  /** Snap points as percentages (0-1) */
  snapPoints?: number[];
  /** Initial snap point index */
  defaultSnapPoint?: number;
  /** Threshold for swipe to dismiss (0-1) */
  dismissThreshold?: number;
  /** Custom header content */
  header?: React.ReactNode;
  /** Custom footer content */
  footer?: React.ReactNode;
  /** Maximum height for bottom/top drawers */
  maxHeight?: string;
  /** Maximum width for left/right drawers */
  maxWidth?: string;
  /** Whether drawer is dismissible by swiping */
  swipeDismiss?: boolean;
  /** Callback when snap point changes */
  onSnapPointChange?: (index: number) => void;
}

/**
 * Mobile-friendly drawer component with swipe gestures
 * 
 * Features:
 * - Swipe to dismiss on mobile
 * - Multiple snap points for different heights
 * - Touch-friendly drag handle
 * - Smooth spring animations
 * - Responsive behavior (fallback to sheet on desktop)
 * - Optimized for mobile performance
 * 
 * @example
 * ```tsx
 * function MobileFilterDrawer() {
 *   const [open, setOpen] = useState(false);
 *   
 *   return (
 *     <Drawer
 *       open={open}
 *       onOpenChange={setOpen}
 *       title="Filter Options"
 *       side="bottom"
 *       snapPoints={[0.3, 0.6, 0.9]}
 *       defaultSnapPoint={1}
 *       showHandle
 *       swipeDismiss
 *     >
 *       <div>Filter content here</div>
 *     </Drawer>
 *   );
 * }
 * ```
 */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
  (
    {
      open = false,
      onOpenChange,
      side = "bottom",
      title,
      description,
      showHandle = true,
      snapPoints = [0.5],
      defaultSnapPoint = 0,
      dismissThreshold = 0.3,
      header,
      footer,
      maxHeight = "90vh",
      maxWidth = "90vw",
      swipeDismiss = true,
      onSnapPointChange,
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
    const isMobile = useIsMobile();
    const drawerId = generateOverlayId("drawer");
    const stack = useStackedOverlays(drawerId);
    
    // State for current snap point
    const [currentSnapPoint, setCurrentSnapPoint] = useState(defaultSnapPoint);
    
    // Motion values for drag gestures
    const y = useMotionValue(0);
    const x = useMotionValue(0);
    
    // Transform values based on side
    const isVertical = side === "bottom" || side === "top";
    const dragValue = isVertical ? y : x;
    
    // Register/unregister with stack
    useEffect(() => {
      if (open) {
        stack.register(drawerId);
      } else {
        stack.unregister(drawerId);
      }
    }, [open, drawerId, stack]);

    // Focus trap
    const containerRef = useFocusTrap(open, focusTrap);
    
    // Body scroll lock
    useBodyScroll(open && lockScroll);
    
    // Escape key handling
    useEscapeKey(() => {
      if (closeOnEscape && stack.isTopmost(drawerId)) {
        onOpenChange?.(false);
      }
    }, open);

    const zIndex = stack.getZIndex(drawerId);

    // Get snap point value
    const getSnapPointValue = (index: number) => {
      const point = snapPoints[index] || snapPoints[0];
      return isVertical 
        ? `${(1 - point) * 100}%`
        : `${(1 - point) * 100}%`;
    };

    // Handle drag end
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const velocity = isVertical ? info.velocity.y : info.velocity.x;
      const offset = isVertical ? info.offset.y : info.offset.x;
      
      // Determine direction based on side
      const isDismissDirection = 
        (side === "bottom" && offset > 0) ||
        (side === "top" && offset < 0) ||
        (side === "left" && offset < 0) ||
        (side === "right" && offset > 0);
      
      // Check for dismiss gesture
      if (swipeDismiss && isDismissDirection) {
        const containerSize = isVertical 
          ? window.innerHeight 
          : window.innerWidth;
        const dismissDistance = containerSize * dismissThreshold;
        
        if (Math.abs(offset) > dismissDistance || Math.abs(velocity) > 500) {
          onOpenChange?.(false);
          return;
        }
      }
      
      // Snap to nearest point
      if (snapPoints.length > 1) {
        const containerSize = isVertical 
          ? window.innerHeight 
          : window.innerWidth;
        const currentPosition = Math.abs(offset) / containerSize;
        
        // Find closest snap point
        let closestIndex = 0;
        let closestDistance = Math.abs(snapPoints[0] - currentPosition);
        
        snapPoints.forEach((point, index) => {
          const distance = Math.abs(point - currentPosition);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        
        if (closestIndex !== currentSnapPoint) {
          setCurrentSnapPoint(closestIndex);
          onSnapPointChange?.(closestIndex);
        }
      }
      
      // Reset drag value
      dragValue.set(0);
    };

    // Backdrop click handler
    const handleBackdropClick = () => {
      if (backdrop.dismissible && stack.isTopmost(drawerId)) {
        onOpenChange?.(false);
      }
    };

    // Position classes based on side
    const positionClasses = {
      bottom: "inset-x-0 bottom-0",
      top: "inset-x-0 top-0",
      left: "inset-y-0 left-0",
      right: "inset-y-0 right-0",
    };

    // Drag constraints
    const dragConstraints = isVertical 
      ? { top: side === "bottom" ? 0 : undefined, bottom: side === "top" ? 0 : undefined }
      : { left: side === "right" ? 0 : undefined, right: side === "left" ? 0 : undefined };

    // Animation variants
    const variants = {
      bottom: {
        initial: { y: "100%" },
        animate: { y: getSnapPointValue(currentSnapPoint) },
        exit: { y: "100%" },
      },
      top: {
        initial: { y: "-100%" },
        animate: { y: getSnapPointValue(currentSnapPoint) },
        exit: { y: "-100%" },
      },
      left: {
        initial: { x: "-100%" },
        animate: { x: getSnapPointValue(currentSnapPoint) },
        exit: { x: "-100%" },
      },
      right: {
        initial: { x: "100%" },
        animate: { x: getSnapPointValue(currentSnapPoint) },
        exit: { x: "100%" },
      },
    };

    return (
      <AnimatePresence>
        {open && (
          <div
            style={{ zIndex }}
            className="fixed inset-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? `${drawerId}-title` : undefined}
            aria-describedby={description ? `${drawerId}-description` : undefined}
          >
            {/* Backdrop */}
            {backdrop.show && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: backdrop.opacity || 0.4 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "absolute inset-0 bg-black/40",
                  backdrop.blur && "backdrop-blur-sm"
                )}
                onClick={handleBackdropClick}
              />
            )}

            {/* Drawer Container */}
            <motion.div
              ref={ref}
              className={cn(
                "fixed z-10 flex flex-col",
                positionClasses[side],
                isVertical ? `max-h-[${maxHeight}]` : `max-w-[${maxWidth}]`,
                isVertical ? "w-full" : "h-full"
              )}
              initial={variants[side].initial}
              animate={variants[side].animate}
              exit={variants[side].exit}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
              }}
              drag={isMobile ? (isVertical ? "y" : "x") : false}
              dragConstraints={dragConstraints}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              style={{ 
                [isVertical ? "y" : "x"]: dragValue,
                maxHeight: isVertical ? maxHeight : undefined,
                maxWidth: !isVertical ? maxWidth : undefined,
              }}
              {...props}
            >
              {/* Drawer Content */}
              <div
                ref={containerRef}
                className={cn(
                  "flex h-full w-full flex-col bg-background border border-border shadow-lg",
                  side === "bottom" && "rounded-t-lg",
                  side === "top" && "rounded-b-lg",
                  side === "left" && "rounded-r-lg",
                  side === "right" && "rounded-l-lg",
                  className
                )}
              >
                {/* Drag Handle */}
                {showHandle && (
                  <div className={cn(
                    "flex justify-center py-2",
                    (side === "left" || side === "right") && "flex-col items-center px-2 py-4"
                  )}>
                    <div className={cn(
                      "bg-muted-foreground/30 rounded-full",
                      (side === "bottom" || side === "top") ? "h-1 w-8" : "h-8 w-1"
                    )} />
                  </div>
                )}

                {/* Header */}
                {(title || header) && (
                  <div className="flex-shrink-0 px-4 py-3 border-b border-border">
                    {header || (
                      <div>
                        {title && (
                          <h2
                            id={`${drawerId}-title`}
                            className="text-lg font-semibold text-foreground"
                          >
                            {title}
                          </h2>
                        )}
                        {description && (
                          <p
                            id={`${drawerId}-description`}
                            className="text-sm text-muted-foreground mt-1"
                          >
                            {description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="flex-shrink-0 px-4 py-3 border-t border-border">
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

Drawer.displayName = "Drawer";