"use client";

import { useCallback, useRef, useEffect } from "react";

/**
 * Configuration options for the infinite scroll hook
 */
export interface UseInfiniteScrollOptions {
  /** Distance from bottom to trigger loading (in pixels) */
  threshold?: number;
  /** Whether the hook is enabled */
  enabled?: boolean;
  /** Root element for intersection observer (defaults to viewport) */
  root?: Element | null;
  /** Root margin for intersection observer */
  rootMargin?: string;
}

/**
 * Return type for the useInfiniteScroll hook
 */
export interface UseInfiniteScrollReturn {
  /** Ref to attach to the sentinel element at the bottom of the list */
  sentinelRef: React.RefObject<HTMLDivElement>;
  /** Whether intersection is currently observed */
  isIntersecting: boolean;
}

/**
 * Custom hook for implementing infinite scroll functionality using Intersection Observer
 * 
 * @param onLoadMore - Callback function called when more data should be loaded
 * @param options - Configuration options for the hook
 * @returns Object containing sentinelRef and isIntersecting state
 * 
 * @example
 * ```tsx
 * const { sentinelRef, isIntersecting } = useInfiniteScroll(
 *   () => {
 *     if (!isFetching && hasNextPage) {
 *       fetchNextPage();
 *     }
 *   },
 *   {
 *     threshold: 100,
 *     enabled: !isFetching && hasNextPage
 *   }
 * );
 * 
 * return (
 *   <div>
 *     {data.map(item => <ItemComponent key={item.id} item={item} />)}
 *     <div ref={sentinelRef} />
 *     {isIntersecting && <LoadingSpinner />}
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const {
    threshold = 100,
    enabled = true,
    root = null,
    rootMargin = `0px 0px ${threshold}px 0px`,
  } = options;

  const sentinelRef = useRef<HTMLDivElement>(null);
  const isIntersectingRef = useRef(false);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      const isIntersecting = entry.isIntersecting;
      
      isIntersectingRef.current = isIntersecting;

      if (isIntersecting && enabled) {
        onLoadMore();
      }
    },
    [onLoadMore, enabled]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root,
      rootMargin,
      threshold: 0.1,
    });

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [handleIntersection, root, rootMargin, enabled]);

  return {
    sentinelRef,
    isIntersecting: isIntersectingRef.current,
  };
}