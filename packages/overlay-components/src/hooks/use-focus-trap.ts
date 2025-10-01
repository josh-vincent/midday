import { useEffect, useRef } from "react";
import type { FocusTrapConfig } from "../types";
import { focusUtils, keyboardUtils } from "../utils";

/**
 * Hook for managing focus trap within an overlay
 * 
 * @param isActive - Whether the focus trap should be active
 * @param config - Focus trap configuration
 * @returns Ref to attach to the container element
 * 
 * @example
 * ```tsx
 * function Modal({ open }: { open: boolean }) {
 *   const containerRef = useFocusTrap(open, {
 *     restoreFocus: true,
 *     initialFocus: '[data-autofocus]'
 *   });
 *   
 *   return (
 *     <div ref={containerRef}>
 *       <input data-autofocus />
 *       <button>Close</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap(
  isActive: boolean,
  config: FocusTrapConfig = {}
) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const {
    enabled = true,
    restoreFocus = true,
    initialFocus,
    exclude = [],
  } = config;

  useEffect(() => {
    if (!enabled || !isActive || !containerRef.current) return;

    const container = containerRef.current;
    
    // Store the previously focused element
    if (restoreFocus) {
      previousFocusRef.current = focusUtils.storeFocus();
    }

    // Set initial focus
    const setInitialFocus = () => {
      let initialElement: HTMLElement | null = null;

      if (initialFocus) {
        initialElement = container.querySelector(initialFocus);
      }

      if (!initialElement) {
        initialElement = focusUtils.getFirstFocusableElement(container);
      }

      if (initialElement) {
        initialElement.focus();
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!keyboardUtils.isTab(event)) return;

      const focusableElements = focusUtils
        .getFocusableElements(container)
        .filter((el) => !exclude.some((selector) => el.matches(selector)));

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab (backwards)
        if (activeElement === firstElement || !focusableElements.includes(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (forwards)
        if (activeElement === lastElement || !focusableElements.includes(activeElement)) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Prevent focus from leaving the container
    const handleFocusOut = (event: FocusEvent) => {
      const relatedTarget = event.relatedTarget as HTMLElement;
      
      if (relatedTarget && !container.contains(relatedTarget)) {
        event.preventDefault();
        
        const focusableElements = focusUtils
          .getFocusableElements(container)
          .filter((el) => !exclude.some((selector) => el.matches(selector)));
          
        const firstElement = focusableElements[0];
        if (firstElement) {
          firstElement.focus();
        }
      }
    };

    // Set up event listeners
    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("focusout", handleFocusOut);
    
    // Set initial focus after a brief delay to ensure DOM is ready
    setTimeout(setInitialFocus, 0);

    // Cleanup
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("focusout", handleFocusOut);
    };
  }, [isActive, enabled, initialFocus, exclude, restoreFocus]);

  // Restore focus when component unmounts or becomes inactive
  useEffect(() => {
    return () => {
      if (restoreFocus && previousFocusRef.current) {
        focusUtils.restoreFocus(previousFocusRef.current);
      }
    };
  }, [isActive, restoreFocus]);

  return containerRef;
}