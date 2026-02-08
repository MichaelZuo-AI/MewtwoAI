'use client';

import { useRef, useState, useCallback } from 'react';

interface UseSwipeGestureOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
  enabled?: boolean;
}

interface UseSwipeGestureReturn {
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  offsetX: number;
  isSwiping: boolean;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  enabled = true,
}: UseSwipeGestureOptions): UseSwipeGestureReturn {
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const directionRef = useRef<'horizontal' | 'vertical' | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    directionRef.current = null;
    setIsSwiping(false);
    setOffsetX(0);
  }, [enabled]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;

    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    // Lock direction on first significant movement
    if (directionRef.current === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      directionRef.current = Math.abs(dy) > Math.abs(dx) ? 'vertical' : 'horizontal';
    }

    if (directionRef.current !== 'horizontal') return;

    // Prevent vertical scrolling while swiping horizontally
    e.preventDefault();
    setIsSwiping(true);

    // Apply resistance past threshold
    const absDx = Math.abs(dx);
    const sign = dx > 0 ? 1 : -1;
    const dampened = absDx > threshold
      ? threshold + (absDx - threshold) * 0.3
      : absDx;
    setOffsetX(dampened * sign);
  }, [enabled, threshold]);

  const onTouchEnd = useCallback(() => {
    if (!enabled || directionRef.current !== 'horizontal') {
      setOffsetX(0);
      setIsSwiping(false);
      directionRef.current = null;
      return;
    }

    if (Math.abs(offsetX) >= threshold) {
      if (offsetX < 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }

    setOffsetX(0);
    setIsSwiping(false);
    directionRef.current = null;
  }, [enabled, offsetX, threshold, onSwipeLeft, onSwipeRight]);

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    offsetX,
    isSwiping,
  };
}
