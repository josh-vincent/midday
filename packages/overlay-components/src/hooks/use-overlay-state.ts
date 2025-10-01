import { useCallback, useState } from "react";
import type { OverlayState } from "../types";

/**
 * Hook for managing overlay state (open/closed)
 * 
 * @param initialOpen - Initial open state
 * @returns Overlay state object with open/close functions
 * 
 * @example
 * ```tsx
 * const overlay = useOverlayState();
 * 
 * return (
 *   <>
 *     <button onClick={overlay.open}>Open</button>
 *     <BaseModal open={overlay.isOpen} onOpenChange={overlay.setOpen}>
 *       Content
 *     </BaseModal>
 *   </>
 * );
 * ```
 */
export function useOverlayState(initialOpen = false): OverlayState {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setOpen,
  };
}