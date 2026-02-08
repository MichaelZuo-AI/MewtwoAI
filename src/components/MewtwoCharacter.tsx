'use client';

import { VoiceState } from '@/types/chat';

interface MewtwoCharacterProps {
  state: VoiceState;
}

export default function MewtwoCharacter({ state }: MewtwoCharacterProps) {
  const getAnimationClass = () => {
    switch (state) {
      case 'listening':
        return 'animate-pulse scale-110';
      case 'speaking':
        return 'animate-bounce';
      case 'processing':
        return 'animate-spin-slow';
      default:
        return 'animate-float';
    }
  };

  const getGlowColor = () => {
    switch (state) {
      case 'listening':
        return 'shadow-blue-500';
      case 'speaking':
        return 'shadow-purple-500';
      case 'processing':
        return 'shadow-yellow-500';
      default:
        return 'shadow-mewtwo-purple';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Mewtwo Character Container */}
      <div
        className={`
          relative w-48 h-48 md:w-64 md:h-64
          rounded-full bg-gradient-to-br from-mewtwo-light to-mewtwo-dark
          flex items-center justify-center
          transition-all duration-500
          ${getAnimationClass()}
          shadow-2xl ${getGlowColor()}
        `}
      >
        {/* Placeholder for actual Mewtwo image/animation */}
        <div className="text-6xl md:text-8xl">🧬</div>

        {/* Psychic aura effect */}
        <div className="absolute inset-0 rounded-full bg-mewtwo-purple opacity-20 blur-xl animate-pulse" />
      </div>

      {/* State indicator */}
      <div className="mt-6 text-center">
        <p className="text-lg md:text-xl font-semibold text-mewtwo-purple">
          {state === 'idle' && 'Mewtwo is ready'}
          {state === 'listening' && 'Mewtwo is listening...'}
          {state === 'speaking' && 'Mewtwo is speaking...'}
          {state === 'processing' && 'Mewtwo is thinking...'}
        </p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
