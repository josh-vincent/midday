import { createContext, useContext, useCallback, useState, ReactNode } from "react";
import type { StackContext } from "../types";
import { calculateZIndex, Z_INDEX } from "../utils";

/**
 * Context for managing stacked overlays
 */
const StackedOverlaysContext = createContext<StackContext | null>(null);

/**
 * Provider component for stacked overlays context
 */
export function StackedOverlaysProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<string[]>([]);

  const register = useCallback((id: string) => {
    setStack((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setStack((prev) => prev.filter((item) => item !== id));
  }, []);

  const getZIndex = useCallback((id: string) => {
    const index = stack.indexOf(id);
    if (index === -1) return Z_INDEX.MODAL;
    return calculateZIndex(Z_INDEX.MODAL, index);
  }, [stack]);

  const isTopmost = useCallback((id: string) => {
    return stack[stack.length - 1] === id;
  }, [stack]);

  const contextValue: StackContext = {
    stack,
    register,
    unregister,
    getZIndex,
    isTopmost,
  };

  return (
    <StackedOverlaysContext.Provider value={contextValue}>
      {children}
    </StackedOverlaysContext.Provider>
  );
}

/**
 * Hook for managing stacked overlays
 * 
 * @param id - Unique identifier for the overlay
 * @returns Stack context utilities
 * 
 * @example
 * ```tsx
 * function MyModal({ id }: { id: string }) {
 *   const stack = useStackedOverlays(id);
 *   
 *   useEffect(() => {
 *     if (open) {
 *       stack.register(id);
 *     } else {
 *       stack.unregister(id);
 *     }
 *   }, [open, id, stack]);
 *   
 *   return (
 *     <div style={{ zIndex: stack.getZIndex(id) }}>
 *       Modal content
 *     </div>
 *   );
 * }
 * ```
 */
export function useStackedOverlays(id: string) {
  const context = useContext(StackedOverlaysContext);
  
  if (!context) {
    // Fallback for when provider is not available
    return {
      stack: [id],
      register: () => {},
      unregister: () => {},
      getZIndex: () => Z_INDEX.MODAL,
      isTopmost: () => true,
    };
  }
  
  return context;
}

/**
 * Hook to get the current overlay stack
 */
export function useOverlayStack() {
  const context = useContext(StackedOverlaysContext);
  return context?.stack || [];
}