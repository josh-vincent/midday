import { useEffect, useRef } from "react";
import { scrollUtils } from "../utils";

/**
 * Hook for locking/unlocking body scroll
 * 
 * @param shouldLock - Whether to lock the body scroll
 * 
 * @example
 * ```tsx
 * function Modal({ open }: { open: boolean }) {
 *   useBodyScroll(open);
 *   
 *   return open ? <div>Modal content</div> : null;
 * }
 * ```
 */
export function useBodyScroll(shouldLock: boolean) {
  const unlockRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (shouldLock) {
      // Lock the scroll and store the unlock function
      unlockRef.current = scrollUtils.lockBodyScroll();
    } else {
      // Unlock the scroll if we have an unlock function
      if (unlockRef.current) {
        unlockRef.current();
        unlockRef.current = null;
      }
    }

    // Cleanup function to unlock scroll when component unmounts
    return () => {
      if (unlockRef.current) {
        unlockRef.current();
        unlockRef.current = null;
      }
    };
  }, [shouldLock]);

  // Also cleanup on unmount
  useEffect(() => {
    return () => {
      if (unlockRef.current) {
        unlockRef.current();
      }
    };
  }, []);
}