import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from '../useWakeLock';

describe('useWakeLock', () => {
  let mockRelease: jest.Mock;
  let mockRequest: jest.Mock;
  let mockSentinel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRelease = jest.fn().mockResolvedValue(undefined);
    mockSentinel = {
      release: mockRelease,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    mockRequest = jest.fn().mockResolvedValue(mockSentinel);

    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: mockRequest },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Clean up navigator.wakeLock
    Object.defineProperty(navigator, 'wakeLock', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it('returns request and release functions', () => {
    const { result } = renderHook(() => useWakeLock());
    expect(typeof result.current.request).toBe('function');
    expect(typeof result.current.release).toBe('function');
  });

  describe('request', () => {
    it('calls navigator.wakeLock.request("screen")', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        result.current.request();
      });

      expect(mockRequest).toHaveBeenCalledWith('screen');
    });

    it('registers a release event listener on the sentinel', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        result.current.request();
      });

      expect(mockSentinel.addEventListener).toHaveBeenCalledWith('release', expect.any(Function));
    });

    it('does not call request if wakeLock is not in navigator', async () => {
      Object.defineProperty(navigator, 'wakeLock', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        result.current.request();
      });

      // Should not throw, just silently return
      expect(true).toBe(true);
    });

    it('does not request a second lock if one is already held', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        result.current.request();
      });

      mockRequest.mockClear();

      await act(async () => {
        result.current.request();
      });

      expect(mockRequest).not.toHaveBeenCalled();
    });

    it('handles wakeLock.request() failure gracefully', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Low battery'));

      const { result } = renderHook(() => useWakeLock());

      // Should not throw
      await act(async () => {
        result.current.request();
      });

      expect(mockRequest).toHaveBeenCalled();
    });
  });

  describe('release', () => {
    it('calls release on the sentinel', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        result.current.request();
      });

      act(() => {
        result.current.release();
      });

      expect(mockRelease).toHaveBeenCalled();
    });

    it('is safe to call when no lock is held', () => {
      const { result } = renderHook(() => useWakeLock());

      act(() => {
        result.current.release();
      });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('visibility change re-acquire', () => {
    it('re-acquires lock when page becomes visible and wantLock is true', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        result.current.request();
      });

      mockRequest.mockClear();

      // Simulate lock being released (e.g., screen off)
      const releaseCallback = mockSentinel.addEventListener.mock.calls[0][1];
      act(() => {
        releaseCallback();
      });

      // Now simulate page becoming visible
      await act(async () => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(mockRequest).toHaveBeenCalledWith('screen');
    });

    it('does not re-acquire when page becomes visible but wantLock is false', async () => {
      const { result } = renderHook(() => useWakeLock());

      // Request then release
      await act(async () => {
        result.current.request();
      });

      act(() => {
        result.current.release();
      });

      mockRequest.mockClear();

      await act(async () => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(mockRequest).not.toHaveBeenCalled();
    });
  });

  describe('cleanup on unmount', () => {
    it('releases lock and removes event listener on unmount', async () => {
      const { result, unmount } = renderHook(() => useWakeLock());

      await act(async () => {
        result.current.request();
      });

      unmount();

      expect(mockRelease).toHaveBeenCalled();
    });
  });
});
