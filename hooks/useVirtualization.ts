import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVirtualizationOptions {
  totalItems: number;
  itemHeight: number;
  overscan?: number;
}

export function useVirtualization({
  totalItems,
  itemHeight,
  overscan = 5,
}: UseVirtualizationOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  // Measure container height with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setContainerHeight(el.clientHeight || 400);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Handle scroll with rAF throttling for 60fps performance
  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
  }, []);

  const totalHeight = totalItems * itemHeight;

  // Calculate visible range
  const rawStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  const startIndex = Math.max(0, rawStartIndex - overscan);
  const endIndex = Math.min(totalItems - 1, rawStartIndex + visibleCount + overscan);

  const offsetY = startIndex * itemHeight;

  return {
    containerRef,
    totalHeight,
    startIndex,
    endIndex,
    offsetY,
    onScroll,
  };
}
