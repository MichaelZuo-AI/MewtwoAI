import { renderHook, act } from '@testing-library/react';
import { useSwipeGesture } from '../useSwipeGesture';

describe('useSwipeGesture', () => {
  let onSwipeLeft: jest.Mock;
  let onSwipeRight: jest.Mock;

  // Helper to create mock touch events
  const mockTouchEvent = (clientX: number, clientY: number, preventDefault = jest.fn()) => ({
    touches: [{ clientX, clientY }],
    preventDefault,
  } as unknown as React.TouchEvent);

  beforeEach(() => {
    jest.clearAllMocks();
    onSwipeLeft = jest.fn();
    onSwipeRight = jest.fn();
  });

  it('returns handlers, offsetX=0, and isSwiping=false initially', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight })
    );

    expect(result.current.handlers).toBeDefined();
    expect(result.current.handlers.onTouchStart).toBeInstanceOf(Function);
    expect(result.current.handlers.onTouchMove).toBeInstanceOf(Function);
    expect(result.current.handlers.onTouchEnd).toBeInstanceOf(Function);
    expect(result.current.offsetX).toBe(0);
    expect(result.current.isSwiping).toBe(false);
  });

  it('fires onSwipeLeft when swiped left past threshold', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(200, 100));
    });

    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(110, 100));
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('fires onSwipeRight when swiped right past threshold', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(190, 100));
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('does NOT fire callback when swipe is below threshold', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    // Swipe left 50px (below 80px threshold)
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(50, 100));
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('does NOT fire callback when vertical drag (|dy| > |dx|)', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    // Vertical drag: dy=100, dx=20
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(120, 200));
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('offsetX tracks during horizontal drag', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    expect(result.current.offsetX).toBe(0);

    // Horizontal drag: dx=50, dy=5
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(150, 105));
    });

    expect(result.current.offsetX).toBe(50);

    // Continue dragging
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(130, 105));
    });

    expect(result.current.offsetX).toBe(30);
  });

  it('isSwiping becomes true during horizontal drag', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    expect(result.current.isSwiping).toBe(false);

    // Horizontal drag
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(150, 105));
    });

    expect(result.current.isSwiping).toBe(true);
  });

  it('does nothing when enabled=false', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80, enabled: false })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(0, 100));
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(result.current.offsetX).toBe(0);
    expect(result.current.isSwiping).toBe(false);
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('resets offsetX and isSwiping after touch end', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(150, 105));
    });

    expect(result.current.offsetX).toBe(50);
    expect(result.current.isSwiping).toBe(true);

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(result.current.offsetX).toBe(0);
    expect(result.current.isSwiping).toBe(false);
  });

  it('applies resistance (dampening) past threshold', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(200, 100));
    });

    // Swipe 100px to the right (20px past threshold)
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(300, 100));
    });

    // Expected: 80 + (100 - 80) * 0.3 = 80 + 6 = 86
    expect(result.current.offsetX).toBe(86);
  });

  it('prevents default during horizontal drag', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    const preventDefault = jest.fn();

    // Horizontal drag
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(150, 105, preventDefault));
    });

    expect(preventDefault).toHaveBeenCalled();
  });

  it('does NOT prevent default during vertical drag', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    const preventDefault = jest.fn();

    // Vertical drag: dy=100, dx=20
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(120, 200, preventDefault));
    });

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('handles negative offsetX correctly for left swipes', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(200, 100));
    });

    // Swipe left 50px
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(150, 100));
    });

    expect(result.current.offsetX).toBe(-50);
  });

  it('applies dampening for negative values (left swipes past threshold)', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(200, 100));
    });

    // Swipe left 100px (20px past threshold)
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(100, 100));
    });

    // Expected: -(80 + (100 - 80) * 0.3) = -(80 + 6) = -86
    expect(result.current.offsetX).toBe(-86);
  });

  it('resets on touch end even without horizontal swipe', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    // Vertical drag
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(105, 200));
    });

    expect(result.current.offsetX).toBe(0);

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(result.current.offsetX).toBe(0);
    expect(result.current.isSwiping).toBe(false);
  });

  it('allows custom threshold', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 50 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    // Swipe 60px to the right (past 50px threshold)
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(160, 100));
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it('handles multiple touch sequences correctly', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    // First swipe right
    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(190, 100));
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(result.current.offsetX).toBe(0);

    // Second swipe left
    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(200, 100));
    });

    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(110, 100));
    });

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(result.current.offsetX).toBe(0);
  });

  it('determines direction only after movement exceeds 10px', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    const preventDefault = jest.fn();

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    // Small movement (less than 10px)
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(105, 102, preventDefault));
    });

    // Direction not determined yet, no preventDefault
    expect(preventDefault).not.toHaveBeenCalled();
    expect(result.current.isSwiping).toBe(false);

    // Larger horizontal movement
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(120, 102, preventDefault));
    });

    // Now direction is horizontal, preventDefault called
    expect(preventDefault).toHaveBeenCalled();
    expect(result.current.isSwiping).toBe(true);
  });

  it('maintains horizontal direction once determined', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    // Establish horizontal direction
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(120, 105));
    });

    expect(result.current.offsetX).toBe(20);

    // Even if next move is more vertical, direction stays horizontal
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(125, 150));
    });

    expect(result.current.offsetX).toBe(25);
  });

  it('does not update offsetX for vertical swipes', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80 })
    );

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    // Establish vertical direction
    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(105, 150));
    });

    expect(result.current.offsetX).toBe(0);
    expect(result.current.isSwiping).toBe(false);
  });

  it('can be toggled with enabled prop', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 80, enabled }),
      { initialProps: { enabled: true } }
    );

    // Initially enabled
    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(150, 100));
    });

    expect(result.current.offsetX).toBe(50);

    act(() => {
      result.current.handlers.onTouchEnd();
    });

    // Now disable
    rerender({ enabled: false });

    act(() => {
      result.current.handlers.onTouchStart(mockTouchEvent(100, 100));
    });

    act(() => {
      result.current.handlers.onTouchMove(mockTouchEvent(150, 100));
    });

    expect(result.current.offsetX).toBe(0);
  });
});
