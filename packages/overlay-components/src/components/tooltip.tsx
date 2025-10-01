"use client";

import { forwardRef, useMemo } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@midday/ui/cn";
import type { TooltipPlacement, AnimationConfig } from "../types";
import { getAnimationConfig, mergeAnimationConfig, Z_INDEX, keyboardUtils } from "../utils";

export interface TooltipProps {
  /** Tooltip content */
  content?: React.ReactNode;
  /** Tooltip placement */
  placement?: TooltipPlacement;
  /** Delay before showing tooltip (ms) */
  delayDuration?: number;
  /** Whether to skip delay when moving between tooltips */
  skipDelayDuration?: number;
  /** Whether to show arrow */
  showArrow?: boolean;
  /** Offset from the trigger */
  offset?: number;
  /** Animation configuration */
  animation?: Partial<AnimationConfig>;
  /** Custom z-index */
  zIndex?: number;
  /** Whether tooltip is disabled */
  disabled?: boolean;
  /** Custom className for content */
  className?: string;
  /** Trigger element */
  children?: React.ReactNode;
  /** Keyboard shortcut to display */
  shortcut?: string[];
  /** Whether to show on focus */
  showOnFocus?: boolean;
  /** Custom trigger props */
  triggerProps?: React.ComponentProps<typeof TooltipPrimitive.Trigger>;
  /** Custom content props */
  contentProps?: React.ComponentProps<typeof TooltipPrimitive.Content>;
}

/**
 * Enhanced tooltip component with animations and keyboard shortcuts
 * 
 * Features:
 * - Multiple placement options with collision detection
 * - Smooth entrance/exit animations
 * - Optional arrow indicator
 * - Keyboard shortcut display
 * - Configurable delays and timing
 * - Touch device support
 * - Focus management
 * 
 * @example
 * ```tsx
 * function ActionButton() {
 *   return (
 *     <Tooltip 
 *       content="Save changes"
 *       placement="top"
 *       shortcut={["cmd", "s"]}
 *       showArrow
 *     >
 *       <button>
 *         <Save className="h-4 w-4" />
 *       </button>
 *     </Tooltip>
 *   );
 * }
 * ```
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      placement = "top",
      delayDuration = 500,
      skipDelayDuration = 100,
      showArrow = false,
      offset = 4,
      animation = { preset: "fade" },
      zIndex = Z_INDEX.TOOLTIP,
      disabled = false,
      className,
      children,
      shortcut,
      showOnFocus = true,
      triggerProps,
      contentProps,
      ...props
    },
    ref
  ) => {
    // Animation configuration
    const animationConfig = useMemo(() => {
      const baseConfig = getAnimationConfig(animation.preset || "fade");
      return mergeAnimationConfig(baseConfig, animation);
    }, [animation]);

    // Convert placement to Radix-compatible side and align
    const getRadixPlacement = (placement: TooltipPlacement) => {
      const [side, align] = placement.split("-") as [string, string?];
      return {
        side: side as "top" | "right" | "bottom" | "left",
        align: (align || "center") as "start" | "center" | "end",
      };
    };

    const { side, align } = getRadixPlacement(placement);

    // Don't render if disabled or no content
    if (disabled || !content) {
      return <>{children}</>;
    }

    return (
      <TooltipPrimitive.Provider
        delayDuration={delayDuration}
        skipDelayDuration={skipDelayDuration}
      >
        <TooltipPrimitive.Root>
          {/* Trigger */}
          <TooltipPrimitive.Trigger 
            asChild
            onFocus={showOnFocus ? undefined : (e) => e.preventDefault()}
            {...triggerProps}
          >
            {children}
          </TooltipPrimitive.Trigger>

          {/* Portal and Content */}
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              ref={ref}
              side={side}
              align={align}
              sideOffset={offset}
              asChild
              {...contentProps}
              {...props}
            >
              <motion.div
                initial={
                  animation.preset === "scale"
                    ? { opacity: 0, scale: 0.95 }
                    : animation.preset === "slide"
                    ? { 
                        opacity: 0, 
                        y: side === "top" ? 8 : side === "bottom" ? -8 : 0,
                        x: side === "left" ? 8 : side === "right" ? -8 : 0
                      }
                    : { opacity: 0 }
                }
                animate={
                  animation.preset === "scale"
                    ? { opacity: 1, scale: 1 }
                    : animation.preset === "slide"
                    ? { opacity: 1, y: 0, x: 0 }
                    : { opacity: 1 }
                }
                exit={
                  animation.preset === "scale"
                    ? { opacity: 0, scale: 0.95 }
                    : animation.preset === "slide"
                    ? { 
                        opacity: 0, 
                        y: side === "top" ? 8 : side === "bottom" ? -8 : 0,
                        x: side === "left" ? 8 : side === "right" ? -8 : 0
                      }
                    : { opacity: 0 }
                }
                transition={{
                  duration: animationConfig.duration! / 1000,
                  ease: animationConfig.easing,
                }}
                style={{ zIndex }}
                className={cn(
                  "bg-primary text-primary-foreground px-3 py-1.5 text-xs rounded-md shadow-lg",
                  "select-none animate-in fade-in-0 zoom-in-95",
                  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                  "data-[side=bottom]:slide-in-from-top-2",
                  "data-[side=left]:slide-in-from-right-2", 
                  "data-[side=right]:slide-in-from-left-2",
                  "data-[side=top]:slide-in-from-bottom-2",
                  className
                )}
              >
                <div className="flex items-center gap-2">
                  {/* Content */}
                  <span>{content}</span>
                  
                  {/* Keyboard Shortcut */}
                  {shortcut && shortcut.length > 0 && (
                    <div className="flex items-center gap-1">
                      {shortcut.map((key, index) => (
                        <kbd
                          key={index}
                          className="inline-flex h-4 select-none items-center gap-1 rounded bg-primary-foreground/20 px-1 font-mono text-[10px] font-medium text-primary-foreground"
                        >
                          {keyboardUtils.formatShortcut([key])}
                        </kbd>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Arrow */}
                {showArrow && (
                  <TooltipPrimitive.Arrow 
                    className="fill-primary" 
                    width={8} 
                    height={4}
                  />
                )}
              </motion.div>
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    );
  }
);

Tooltip.displayName = "Tooltip";

/**
 * Simple tooltip wrapper for text content
 */
export interface SimpleTooltipProps extends Omit<TooltipProps, "content"> {
  /** Tooltip text */
  text: string;
}

export function SimpleTooltip({ text, children, ...props }: SimpleTooltipProps) {
  return (
    <Tooltip content={text} {...props}>
      {children}
    </Tooltip>
  );
}

/**
 * Rich tooltip with title and description
 */
export interface RichTooltipProps extends Omit<TooltipProps, "content"> {
  /** Tooltip title */
  title: string;
  /** Tooltip description */
  description?: string;
  /** Optional icon */
  icon?: React.ReactNode;
}

export function RichTooltip({ 
  title, 
  description, 
  icon, 
  children, 
  className,
  ...props 
}: RichTooltipProps) {
  return (
    <Tooltip
      content={
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="flex h-4 w-4 items-center justify-center">
                {icon}
              </span>
            )}
            <span className="font-medium">{title}</span>
          </div>
          {description && (
            <div className="text-xs opacity-80">
              {description}
            </div>
          )}
        </div>
      }
      className={cn("max-w-xs", className)}
      {...props}
    >
      {children}
    </Tooltip>
  );
}

/**
 * Help tooltip with question mark trigger
 */
export interface HelpTooltipProps extends Omit<TooltipProps, "children"> {
  /** Help text or content */
  help: React.ReactNode;
  /** Size of the help icon */
  size?: "sm" | "md" | "lg";
}

export function HelpTooltip({ 
  help, 
  size = "sm", 
  placement = "top",
  ...props 
}: HelpTooltipProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5",
  };

  return (
    <Tooltip content={help} placement={placement} {...props}>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          className={cn(sizeClasses[size])}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="17" r="1" />
        </svg>
        <span className="sr-only">Help</span>
      </button>
    </Tooltip>
  );
}