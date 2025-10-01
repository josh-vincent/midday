import { useState, useEffect } from "react";
import type { ResponsiveBehavior } from "../types";
import { isMobile, getResponsiveBreakpoint } from "../utils";

/**
 * Hook for responsive overlay behavior
 * 
 * @param behavior - Responsive behavior setting
 * @returns Current overlay type based on screen size
 * 
 * @example
 * ```tsx
 * function ResponsiveOverlay() {
 *   const overlayType = useResponsiveOverlay("auto");
 *   
 *   return overlayType === "sheet" ? (
 *     <BaseSheet>Content</BaseSheet>
 *   ) : (
 *     <BaseModal>Content</BaseModal>
 *   );
 * }
 * ```
 */
export function useResponsiveOverlay(
  behavior: ResponsiveBehavior = "auto"
): "modal" | "sheet" {
  const [overlayType, setOverlayType] = useState<"modal" | "sheet">(() => {
    if (behavior !== "auto") return behavior;
    return isMobile() ? "sheet" : "modal";
  });

  useEffect(() => {
    if (behavior !== "auto") {
      setOverlayType(behavior);
      return;
    }

    const handleResize = () => {
      setOverlayType(isMobile() ? "sheet" : "modal");
    };

    // Set initial value
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [behavior]);

  return overlayType;
}

/**
 * Hook to detect if current viewport is mobile
 */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => isMobile());

  useEffect(() => {
    const handleResize = () => {
      setMobile(window.innerWidth < getResponsiveBreakpoint());
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return mobile;
}

/**
 * Hook to get current viewport size
 */
export function useViewportSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return size;
}