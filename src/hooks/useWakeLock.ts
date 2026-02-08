'use client';

import { useRef, useCallback, useEffect } from 'react';

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const wantLockRef = useRef(false);

  const acquire = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    if (wakeLockRef.current) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch {
      // Wake lock request failed (e.g. low battery, page not visible)
    }
  }, []);

  const request = useCallback(() => {
    wantLockRef.current = true;
    acquire();
  }, [acquire]);

  const release = useCallback(() => {
    wantLockRef.current = false;
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  }, []);

  // Re-acquire wake lock when page becomes visible again after screen unlock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wantLockRef.current) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      release();
    };
  }, [acquire, release]);

  return { request, release };
}
