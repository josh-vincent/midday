"use client";

import { useCallback, useRef } from "react";

interface UseRowTouchActionsOptions {
  /**
   * Callback to trigger when long press is detected
   */
  onLongPress: (event: React.TouchEvent | React.MouseEvent) => void;

  /**
   * Duration in milliseconds to consider a touch as a long press
   * @default 500
   */
  longPressDuration?: number;

  /**
   * Whether the feature is enabled
   * @default true
   */
  enabled?: boolean;
}

interface UseRowTouchActionsReturn {
  /**
   * Props to spread on the table row element
   */
  touchProps: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
  };
}

/**
 * Hook to enable touch-and-hold gesture for accessing row actions menu.
 *
 * Features:
 * - Detects long press (default 500ms)
 * - Prevents conflicts with checkboxes, buttons, and links
 * - Provides haptic feedback on supported devices
 * - Also enables right-click context menu on desktop
 *
 * @example
 * ```tsx
 * const { touchProps } = useRowTouchActions({
 *   onLongPress: () => setShowActionsMenu(true)
 * });
 *
 * return <TableRow {...touchProps}>...</TableRow>
 * ```
 */
export function useRowTouchActions({
  onLongPress,
  longPressDuration = 500,
  enabled = true,
}: UseRowTouchActionsOptions): UseRowTouchActionsReturn {
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearTouchTimer = useCallback(() => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      // Don't trigger on interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest('[role="checkbox"]') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-action-menu]') ||
        target.closest('input') ||
        target.closest('select')
      ) {
        return;
      }

      // Reset state
      longPressTriggeredRef.current = false;

      // Store touch position to detect movement
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

      // Start timer for long press
      touchTimerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true;

        // Trigger haptic feedback on supported devices
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        onLongPress(e);
      }, longPressDuration);
    },
    [enabled, longPressDuration, onLongPress]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !touchStartPosRef.current) return;

      // Cancel if user moves finger too much (not a stationary press)
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);

      // If moved more than 10px, cancel the long press
      if (deltaX > 10 || deltaY > 10) {
        clearTouchTimer();
        touchStartPosRef.current = null;
      }
    },
    [enabled, clearTouchTimer]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      clearTouchTimer();
      touchStartPosRef.current = null;

      // Prevent click event if long press was triggered
      if (longPressTriggeredRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [enabled, clearTouchTimer]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;

      // Don't trigger on interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest('[role="checkbox"]') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-action-menu]') ||
        target.closest('input') ||
        target.closest('select')
      ) {
        return;
      }

      // Prevent default context menu and trigger our action menu instead
      e.preventDefault();
      onLongPress(e);
    },
    [enabled, onLongPress]
  );

  return {
    touchProps: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
      onContextMenu: handleContextMenu,
    },
  };
}
