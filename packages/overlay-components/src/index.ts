// Core Components
export { BaseSheet } from "./components/base-sheet";
export type { BaseSheetProps } from "./components/base-sheet";

export { BaseModal } from "./components/base-modal";
export type { BaseModalProps } from "./components/base-modal";

export { ConfirmDialog } from "./components/confirm-dialog";
export type { ConfirmDialogProps } from "./components/confirm-dialog";

export { CommandPalette } from "./components/command-palette";
export type { CommandPaletteProps } from "./components/command-palette";

export { 
  NestedSheet, 
  NestedSheetProvider, 
  SheetBreadcrumb,
  useNestedSheet 
} from "./components/nested-sheet";
export type { 
  NestedSheetProps, 
  SheetBreadcrumbProps 
} from "./components/nested-sheet";

export { Drawer } from "./components/drawer";
export type { DrawerProps } from "./components/drawer";

export { Popover, PopoverMenu } from "./components/popover";
export type { PopoverProps, PopoverMenuProps } from "./components/popover";

export { 
  Tooltip, 
  SimpleTooltip, 
  RichTooltip, 
  HelpTooltip 
} from "./components/tooltip";
export type { 
  TooltipProps, 
  SimpleTooltipProps, 
  RichTooltipProps, 
  HelpTooltipProps 
} from "./components/tooltip";

// Hooks
export {
  useOverlayState,
  useStackedOverlays,
  useOverlayStack,
  StackedOverlaysProvider,
  useFocusTrap,
  useBodyScroll,
  useEscapeKey,
  useResponsiveOverlay,
  useIsMobile,
  useViewportSize,
} from "./hooks";

// Utilities
export {
  Z_INDEX,
  ANIMATION_PRESETS,
  generateOverlayId,
  getAnimationConfig,
  mergeAnimationConfig,
  getResponsiveBreakpoint,
  isMobile,
  isDesktop,
  calculateZIndex,
  throttle,
  debounce,
  focusUtils,
  scrollUtils,
  keyboardUtils,
} from "./utils";

// Types
export type {
  AnimationPreset,
  Side,
  ResponsiveBehavior,
  StackContext,
  OverlayState,
  FocusTrapConfig,
  AnimationConfig,
  BackdropConfig,
  BaseOverlayProps,
  SheetProps,
  ModalProps,
  ConfirmAction,
  CommandItem,
  CommandGroup,
  TooltipPlacement,
  PopoverPlacement,
} from "./types";