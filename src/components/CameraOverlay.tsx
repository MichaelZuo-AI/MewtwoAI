'use client';

import { useEffect, useRef } from 'react';
import { CameraIcon } from './Icons';

interface CameraOverlayProps {
  onCapture: () => void;
  onDismiss: () => void;
  autoHideMs?: number;
}

export default function CameraOverlay({ onCapture, onDismiss, autoHideMs = 8000 }: CameraOverlayProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, autoHideMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss, autoHideMs]);

  const handleCapture = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onCapture();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 camera-overlay-fade-in"
      data-testid="camera-overlay"
    >
      <button
        onClick={handleCapture}
        className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center camera-overlay-pulse"
        aria-label="Tap to take a photo"
        data-testid="camera-overlay-capture"
      >
        <CameraIcon className="w-20 h-20 text-white" />
      </button>

      <p className="text-white text-2xl font-bold mt-6 camera-overlay-bounce" data-testid="camera-overlay-text">
        Tap to take a photo!
      </p>

      <button
        onClick={onDismiss}
        className="mt-8 text-white/50 text-sm underline"
        data-testid="camera-overlay-dismiss"
      >
        Maybe later
      </button>
    </div>
  );
}
