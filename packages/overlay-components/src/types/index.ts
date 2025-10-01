import type { ReactNode } from "react";

/**
 * Animation preset types for overlay components
 */
export type AnimationPreset = "slide" | "fade" | "scale" | "none";

/**
 * Side positions for sheets and drawers
 */
export type Side = "left" | "right" | "top" | "bottom";

/**
 * Responsive behavior types
 */
export type ResponsiveBehavior = "modal" | "sheet" | "auto";

/**
 * Stack context for managing multiple overlays
 */
export interface StackContext {
  /** Array of open overlay IDs in order */
  stack: string[];
  /** Register a new overlay */
  register: (id: string) => void;
  /** Unregister an overlay */
  unregister: (id: string) => void;
  /** Get the z-index for an overlay */
  getZIndex: (id: string) => number;
  /** Check if overlay is at the top of the stack */
  isTopmost: (id: string) => boolean;
}

/**
 * Base overlay state
 */
export interface OverlayState {
  /** Whether the overlay is open */
  isOpen: boolean;
  /** Function to open the overlay */
  open: () => void;
  /** Function to close the overlay */
  close: () => void;
  /** Function to toggle the overlay */
  toggle: () => void;
  /** Function to set the open state */
  setOpen: (open: boolean) => void;
}

/**
 * Focus trap configuration
 */
export interface FocusTrapConfig {
  /** Whether to enable focus trap */
  enabled?: boolean;
  /** Whether to restore focus when closed */
  restoreFocus?: boolean;
  /** Initial focus target selector */
  initialFocus?: string;
  /** Elements to exclude from focus trap */
  exclude?: string[];
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Animation preset */
  preset?: AnimationPreset;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Animation easing function */
  easing?: string;
  /** Custom enter animation */
  enter?: object;
  /** Custom exit animation */
  exit?: object;
}

/**
 * Backdrop configuration
 */
export interface BackdropConfig {
  /** Whether to show backdrop */
  show?: boolean;
  /** Whether backdrop is blurred */
  blur?: boolean;
  /** Backdrop opacity (0-1) */
  opacity?: number;
  /** Whether clicking backdrop closes overlay */
  dismissible?: boolean;
}

/**
 * Base overlay props that all components share
 */
export interface BaseOverlayProps {
  /** Whether the overlay is open */
  open?: boolean;
  /** Function called when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Animation configuration */
  animation?: AnimationConfig;
  /** Backdrop configuration */
  backdrop?: BackdropConfig;
  /** Focus trap configuration */
  focusTrap?: FocusTrapConfig;
  /** Whether to close on escape key */
  closeOnEscape?: boolean;
  /** Whether to lock body scroll when open */
  lockScroll?: boolean;
  /** Custom z-index */
  zIndex?: number;
  /** Custom className */
  className?: string;
  /** Children content */
  children?: ReactNode;
}

/**
 * Sheet-specific props
 */
export interface SheetProps extends BaseOverlayProps {
  /** Side to slide in from */
  side?: Side;
  /** Whether sheet can be nested */
  nested?: boolean;
  /** Whether to show swipe indicator on mobile */
  swipeIndicator?: boolean;
  /** Threshold for swipe to dismiss (0-1) */
  swipeThreshold?: number;
}

/**
 * Modal-specific props  
 */
export interface ModalProps extends BaseOverlayProps {
  /** Modal size */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Whether modal is centered */
  centered?: boolean;
  /** Whether modal can be resized */
  resizable?: boolean;
}

/**
 * Confirm dialog action
 */
export interface ConfirmAction {
  /** Action label */
  label: string;
  /** Action variant */
  variant?: "default" | "destructive" | "outline" | "secondary";
  /** Whether action is loading */
  loading?: boolean;
  /** Function called when action is clicked */
  onClick: () => void | Promise<void>;
}

/**
 * Command palette item
 */
export interface CommandItem {
  /** Unique item ID */
  id: string;
  /** Item label */
  label: string;
  /** Item description */
  description?: string;
  /** Item icon */
  icon?: ReactNode;
  /** Keyboard shortcut */
  shortcut?: string[];
  /** Item category */
  category?: string;
  /** Whether item is disabled */
  disabled?: boolean;
  /** Function called when item is selected */
  onSelect: () => void;
}

/**
 * Command palette group
 */
export interface CommandGroup {
  /** Group label */
  label: string;
  /** Group items */
  items: CommandItem[];
}

/**
 * Tooltip placement options
 */
export type TooltipPlacement = 
  | "top" 
  | "top-start" 
  | "top-end"
  | "right" 
  | "right-start" 
  | "right-end"
  | "bottom" 
  | "bottom-start" 
  | "bottom-end"
  | "left" 
  | "left-start" 
  | "left-end";

/**
 * Popover placement options (same as tooltip)
 */
export type PopoverPlacement = TooltipPlacement;