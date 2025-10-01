"use client";

import { forwardRef, useEffect, useMemo } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@midday/ui/cn";
import type { PopoverPlacement, AnimationConfig } from "../types";
import { getAnimationConfig, mergeAnimationConfig, Z_INDEX } from "../utils";

export interface PopoverProps {
  /** Whether the popover is open */
  open?: boolean;
  /** Function called when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Popover placement */
  placement?: PopoverPlacement;
  /** Whether to show arrow */
  showArrow?: boolean;
  /** Offset from the trigger */
  offset?: number;
  /** Animation configuration */
  animation?: Partial<AnimationConfig>;
  /** Custom z-index */
  zIndex?: number;
  /** Whether to close on outside click */
  closeOnOutsideClick?: boolean;
  /** Whether to close on escape key */
  closeOnEscape?: boolean;
  /** Custom className for content */
  className?: string;
  /** Popover content */
  children?: React.ReactNode;
  /** Trigger element */
  trigger?: React.ReactNode;
  /** Custom trigger props */
  triggerProps?: React.ComponentProps<typeof PopoverPrimitive.Trigger>;
  /** Custom content props */
  contentProps?: React.ComponentProps<typeof PopoverPrimitive.Content>;
}

/**
 * Enhanced popover component with positioning and animations
 * 
 * Features:
 * - Multiple placement options with automatic adjustment
 * - Smooth entrance/exit animations
 * - Optional arrow indicator
 * - Keyboard navigation support
 * - Click outside to close
 * - Collision detection and boundary awareness
 * 
 * @example
 * ```tsx
 * function UserMenu() {
 *   const [open, setOpen] = useState(false);
 *   
 *   return (
 *     <Popover
 *       open={open}
 *       onOpenChange={setOpen}
 *       placement="bottom-start"
 *       showArrow
 *       trigger={
 *         <button>
 *           <Avatar />
 *         </button>
 *       }
 *     >
 *       <div className="p-4 space-y-2">
 *         <div>Profile</div>
 *         <div>Settings</div>
 *         <div>Logout</div>
 *       </div>
 *     </Popover>
 *   );
 * }
 * ```
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      open,
      onOpenChange,
      placement = "bottom",
      showArrow = false,
      offset = 4,
      animation = { preset: "scale" },
      zIndex = Z_INDEX.POPOVER,
      closeOnOutsideClick = true,
      closeOnEscape = true,
      className,
      children,
      trigger,
      triggerProps,
      contentProps,
      ...props
    },
    ref
  ) => {
    // Animation configuration
    const animationConfig = useMemo(() => {
      const baseConfig = getAnimationConfig(animation.preset || "scale");
      return mergeAnimationConfig(baseConfig, animation);
    }, [animation]);

    // Convert placement to Radix-compatible side and align
    const getRadixPlacement = (placement: PopoverPlacement) => {
      const [side, align] = placement.split("-") as [string, string?];
      return {
        side: side as "top" | "right" | "bottom" | "left",
        align: (align || "center") as "start" | "center" | "end",
      };
    };

    const { side, align } = getRadixPlacement(placement);

    return (
      <PopoverPrimitive.Root 
        open={open} 
        onOpenChange={onOpenChange}
      >
        {/* Trigger */}
        {trigger && (
          <PopoverPrimitive.Trigger 
            asChild 
            {...triggerProps}
          >
            {trigger}
          </PopoverPrimitive.Trigger>
        )}

        {/* Portal and Content */}
        <AnimatePresence>
          {open && (
            <PopoverPrimitive.Portal forceMount>
              <PopoverPrimitive.Content
                ref={ref}
                side={side}
                align={align}
                sideOffset={offset}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
                onPointerDownOutside={closeOnOutsideClick ? undefined : (e) => e.preventDefault()}
                asChild
                {...contentProps}
                {...props}
              >
                <motion.div
                  initial={
                    animation.preset === "scale"
                      ? { opacity: 0, scale: 0.95 }
                      : animation.preset === "fade"
                      ? { opacity: 0 }
                      : { opacity: 0, y: -10 }
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
                      : { opacity: 0, y: -10 }
                  }
                  transition={{
                    duration: animationConfig.duration! / 1000,
                    ease: animationConfig.easing,
                  }}
                  style={{ zIndex }}
                  className={cn(
                    "bg-background border border-border rounded-md shadow-lg outline-none",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    "data-[side=bottom]:slide-in-from-top-2",
                    "data-[side=left]:slide-in-from-right-2",
                    "data-[side=right]:slide-in-from-left-2",
                    "data-[side=top]:slide-in-from-bottom-2",
                    className
                  )}
                >
                  {children}
                  
                  {/* Arrow */}
                  {showArrow && (
                    <PopoverPrimitive.Arrow 
                      className="fill-background stroke-border stroke-1" 
                      width={12} 
                      height={6}
                    />
                  )}
                </motion.div>
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          )}
        </AnimatePresence>
      </PopoverPrimitive.Root>
    );
  }
);

Popover.displayName = "Popover";

/**
 * Utility component for creating popover menus
 */
export interface PopoverMenuProps extends Omit<PopoverProps, "children"> {
  /** Menu items */
  items: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
  }>;
  /** Menu width */
  width?: number;
}

export function PopoverMenu({ 
  items, 
  width = 200, 
  className,
  ...props 
}: PopoverMenuProps) {
  return (
    <Popover
      className={cn("p-1", className)}
      style={{ width }}
      {...props}
    >
      <div className="space-y-1">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            disabled={item.disabled}
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:bg-accent focus:text-accent-foreground focus:outline-none",
              "disabled:pointer-events-none disabled:opacity-50",
              item.destructive && "text-destructive hover:bg-destructive hover:text-destructive-foreground"
            )}
          >
            {item.icon && (
              <span className="flex h-4 w-4 items-center justify-center">
                {item.icon}
              </span>
            )}
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        ))}
      </div>
    </Popover>
  );
}