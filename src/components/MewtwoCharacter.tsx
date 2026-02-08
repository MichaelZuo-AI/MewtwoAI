'use client';

import Image from 'next/image';
import { VoiceState } from '@/types/chat';

interface MewtwoCharacterProps {
  state: VoiceState;
}

export default function MewtwoCharacter({ state }: MewtwoCharacterProps) {
  const getStateText = () => {
    switch (state) {
      case 'idle':
        return 'Mewtwo is ready';
      case 'listening':
        return 'Mewtwo is listening...';
      case 'speaking':
        return 'Mewtwo is speaking...';
      case 'processing':
        return 'Mewtwo is thinking...';
      default:
        return 'Mewtwo is ready';
    }
  };

  const getAuraColor = () => {
    switch (state) {
      case 'listening':
        return 'rgba(59, 130, 246, 0.4)';
      case 'speaking':
        return 'rgba(139, 92, 246, 0.5)';
      case 'processing':
        return 'rgba(234, 179, 8, 0.4)';
      default:
        return 'rgba(160, 64, 160, 0.3)';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Character container with aura */}
      <div className="relative">
        {/* Psychic aura glow */}
        <div
          className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${
            state === 'speaking' ? 'mewtwo-aura-speaking' :
            state === 'listening' ? 'mewtwo-aura-listening' :
            state === 'processing' ? 'mewtwo-aura-processing' :
            'mewtwo-aura-idle'
          }`}
          style={{ background: getAuraColor() }}
        />

        {/* Mewtwo image */}
        <div
          className={`relative w-48 h-48 md:w-64 md:h-64 ${
            state === 'idle' ? 'mewtwo-float' :
            state === 'listening' ? 'mewtwo-listen' :
            state === 'speaking' ? 'mewtwo-speak' :
            'mewtwo-think'
          }`}
        >
          <Image
            src="/mewtwo/mewtwo.png"
            alt="Mewtwo"
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
        </div>
      </div>

      {/* State indicator */}
      <div className="mt-4 text-center">
        <p className="text-lg md:text-xl font-semibold text-mewtwo-purple">
          {getStateText()}
        </p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        @keyframes listen-pulse {
          0%, 100% { transform: scale(1) translateY(-4px); }
          50% { transform: scale(1.05) translateY(-8px); }
        }

        @keyframes speak-bounce {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-16px) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(0deg); }
          75% { transform: translateY(-14px) rotate(2deg); }
        }

        @keyframes think-sway {
          0%, 100% { transform: translateY(-4px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-8px) rotate(3deg); }
        }

        @keyframes aura-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }

        @keyframes aura-intense {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }

        .mewtwo-float {
          animation: float 3s ease-in-out infinite;
        }

        .mewtwo-listen {
          animation: listen-pulse 2s ease-in-out infinite;
        }

        .mewtwo-speak {
          animation: speak-bounce 1.2s ease-in-out infinite;
        }

        .mewtwo-think {
          animation: think-sway 2.5s ease-in-out infinite;
        }

        .mewtwo-aura-idle {
          animation: aura-pulse 4s ease-in-out infinite;
        }

        .mewtwo-aura-listening {
          animation: aura-pulse 2s ease-in-out infinite;
        }

        .mewtwo-aura-speaking {
          animation: aura-intense 0.8s ease-in-out infinite;
        }

        .mewtwo-aura-processing {
          animation: aura-pulse 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
