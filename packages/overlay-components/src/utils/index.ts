import type { AnimationConfig, AnimationPreset } from "../types";

/**
 * Default z-index values for different overlay types
 */
export const Z_INDEX = {
  MODAL: 1000,
  SHEET: 1000,
  DRAWER: 1000,
  POPOVER: 1050,
  TOOLTIP: 1100,
  COMMAND_PALETTE: 1200,
} as const;

/**
 * Animation presets for overlays
 */
export const ANIMATION_PRESETS: Record<AnimationPreset, AnimationConfig> = {
  slide: {
    duration: 300,
    easing: "ease-out",
    enter: {
      opacity: [0, 1],
      x: [300, 0],
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: [1, 0],
      x: [0, 300],
      transition: { duration: 0.2, ease: "easeIn" },
    },
  },
  fade: {
    duration: 200,
    easing: "ease-in-out",
    enter: {
      opacity: [0, 1],
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: [1, 0],
      transition: { duration: 0.15 },
    },
  },
  scale: {
    duration: 200,
    easing: "ease-out",
    enter: {
      opacity: [0, 1],
      scale: [0.95, 1],
      transition: { duration: 0.2, ease: "easeOut" },
    },
    exit: {
      opacity: [1, 0],
      scale: [1, 0.95],
      transition: { duration: 0.15, ease: "easeIn" },
    },
  },
  none: {
    duration: 0,
    easing: "linear",
  },
};

/**
 * Generate a unique ID for overlay instances
 */
export function generateOverlayId(prefix = "overlay"): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the animation configuration for a preset
 */
export function getAnimationConfig(preset: AnimationPreset): AnimationConfig {
  return ANIMATION_PRESETS[preset];
}

/**
 * Merge animation configurations
 */
export function mergeAnimationConfig(
  base: AnimationConfig,
  override: Partial<AnimationConfig>
): AnimationConfig {
  return {
    ...base,
    ...override,
    enter: { ...base.enter, ...override.enter },
    exit: { ...base.exit, ...override.exit },
  };
}

/**
 * Get responsive breakpoint for mobile/desktop detection
 */
export function getResponsiveBreakpoint(): number {
  return 768; // md breakpoint
}

/**
 * Check if current viewport is mobile
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < getResponsiveBreakpoint();
}

/**
 * Check if current viewport is desktop
 */
export function isDesktop(): boolean {
  return !isMobile();
}

/**
 * Calculate z-index based on stack position
 */
export function calculateZIndex(baseZIndex: number, stackIndex: number): number {
  return baseZIndex + stackIndex * 10;
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(',');
    
    return Array.from(container.querySelectorAll(focusableSelectors));
  },

  /**
   * Get the first focusable element in a container
   */
  getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements[0] || null;
  },

  /**
   * Get the last focusable element in a container
   */
  getLastFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements[focusableElements.length - 1] || null;
  },

  /**
   * Check if an element is focusable
   */
  isFocusable(element: HTMLElement): boolean {
    return this.getFocusableElements(element.parentElement || document.body).includes(element);
  },

  /**
   * Store the currently focused element
   */
  storeFocus(): HTMLElement | null {
    return document.activeElement as HTMLElement | null;
  },

  /**
   * Restore focus to a previously stored element
   */
  restoreFocus(element: HTMLElement | null): void {
    if (element && element.focus) {
      element.focus();
    }
  },
};

/**
 * Scroll utilities
 */
export const scrollUtils = {
  /**
   * Get current scroll position
   */
  getScrollPosition(): { x: number; y: number } {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop,
    };
  },

  /**
   * Lock body scroll
   */
  lockBodyScroll(): () => void {
    if (typeof document === "undefined") return () => {};
    
    const scrollY = this.getScrollPosition().y;
    const body = document.body;
    const documentElement = document.documentElement;
    
    // Store original styles
    const originalStyles = {
      body: {
        position: body.style.position,
        top: body.style.top,
        width: body.style.width,
        height: body.style.height,
        overflow: body.style.overflow,
      },
      documentElement: {
        scrollBehavior: documentElement.style.scrollBehavior,
      },
    };
    
    // Apply lock styles
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.height = "100%";
    body.style.overflow = "hidden";
    documentElement.style.scrollBehavior = "auto";
    
    // Return unlock function
    return () => {
      // Restore original styles
      Object.assign(body.style, originalStyles.body);
      Object.assign(documentElement.style, originalStyles.documentElement);
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  },
};

/**
 * Keyboard utilities
 */
export const keyboardUtils = {
  /**
   * Check if key event is escape
   */
  isEscape(event: KeyboardEvent): boolean {
    return event.key === "Escape" || event.keyCode === 27;
  },

  /**
   * Check if key event is enter
   */
  isEnter(event: KeyboardEvent): boolean {
    return event.key === "Enter" || event.keyCode === 13;
  },

  /**
   * Check if key event is tab
   */
  isTab(event: KeyboardEvent): boolean {
    return event.key === "Tab" || event.keyCode === 9;
  },

  /**
   * Check if key event is arrow key
   */
  isArrowKey(event: KeyboardEvent): boolean {
    return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key);
  },

  /**
   * Format keyboard shortcut for display
   */
  formatShortcut(keys: string[]): string {
    const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");
    
    return keys
      .map((key) => {
        switch (key.toLowerCase()) {
          case "cmd":
          case "meta":
            return isMac ? "⌘" : "Ctrl";
          case "ctrl":
            return isMac ? "⌃" : "Ctrl";
          case "alt":
            return isMac ? "⌥" : "Alt";
          case "shift":
            return isMac ? "⇧" : "Shift";
          case "enter":
            return "↵";
          case "backspace":
            return "⌫";
          case "delete":
            return "⌦";
          case "tab":
            return "⇥";
          case "esc":
          case "escape":
            return "⎋";
          case "space":
            return "Space";
          default:
            return key.toUpperCase();
        }
      })
      .join(isMac ? "" : "+");
  },
};