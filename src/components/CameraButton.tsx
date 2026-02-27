'use client';

import { CameraIcon } from './Icons';

interface CameraButtonProps {
  onCapture: () => void;
  disabled: boolean;
}

export default function CameraButton({ onCapture, disabled }: CameraButtonProps) {
  return (
    <button
      onClick={onCapture}
      disabled={disabled}
      aria-label="Scan Pokemon card"
      className={`
        w-12 h-12 rounded-full
        flex items-center justify-center
        transition-all duration-300
        transform active:scale-90
        ${
          disabled
            ? 'bg-white/10 text-white/30 cursor-not-allowed'
            : 'bg-white/10 text-white/70 hover:bg-white/20'
        }
      `}
    >
      <CameraIcon className="w-6 h-6" />
    </button>
  );
}
