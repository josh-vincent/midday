import { useEffect } from "react";
import { keyboardUtils } from "../utils";

/**
 * Hook for handling escape key press
 * 
 * @param callback - Function to call when escape is pressed
 * @param enabled - Whether the escape key handler should be enabled
 * 
 * @example
 * ```tsx
 * function Modal({ open, onClose }: { open: boolean; onClose: () => void }) {
 *   useEscapeKey(onClose, open);
 *   
 *   return open ? <div>Modal content</div> : null;
 * }
 * ```
 */
export function useEscapeKey(
  callback: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (keyboardUtils.isEscape(event)) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [callback, enabled]);
}