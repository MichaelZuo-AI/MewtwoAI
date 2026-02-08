'use client';

import { LiveConnectionState } from '@/types/chat';
import { MicrophoneIcon, StopIcon, LoadingDotsIcon } from './Icons';

interface MicButtonProps {
  connectionState: LiveConnectionState;
  isSupported: boolean;
  onToggle: () => void;
  micGradient?: string;
}

export default function MicButton({ connectionState, isSupported, onToggle, micGradient = 'from-purple-500 to-violet-700' }: MicButtonProps) {
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const isReconnecting = connectionState === 'reconnecting';
  const isLoading = isConnecting || isReconnecting;

  const getIcon = () => {
    if (isLoading) return <LoadingDotsIcon className="w-12 h-12" />;
    if (isConnected) return <StopIcon className="w-12 h-12" />;
    return <MicrophoneIcon className="w-12 h-12" />;
  };

  const getLabel = () => {
    if (isLoading) return 'Connecting';
    if (isConnected) return 'Stop talking';
    return 'Start talking';
  };

  return (
    <button
      onClick={onToggle}
      disabled={!isSupported || isConnecting}
      aria-label={getLabel()}
      className={`
        w-28 h-28 md:w-32 md:h-32 rounded-full
        flex items-center justify-center
        text-white
        transition-all duration-200
        shadow-2xl
        ${
          isLoading
            ? 'bg-gradient-to-br from-yellow-500 to-amber-600 animate-pulse'
            : isConnected
              ? 'bg-gradient-to-br from-red-500 to-red-700 active:scale-90'
              : `bg-gradient-to-br ${micGradient} mic-glow active:scale-90`
        }
        ${!isSupported ? 'opacity-30 cursor-not-allowed' : ''}
      `}
    >
      {getIcon()}
    </button>
  );
}
