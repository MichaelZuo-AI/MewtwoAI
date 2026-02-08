'use client';

import Image from 'next/image';
import { VoiceState, LiveConnectionState } from '@/types/chat';

interface MewtwoCharacterProps {
  state: VoiceState;
  connectionState?: LiveConnectionState;
}

export default function MewtwoCharacter({ state, connectionState }: MewtwoCharacterProps) {
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

  const getRingColor = () => {
    switch (state) {
      case 'listening':
        return 'bg-green-400';
      case 'speaking':
        return 'bg-purple-400';
      case 'processing':
        return 'bg-yellow-400';
      default:
        return 'bg-purple-400/50';
    }
  };

  const isActive = connectionState === 'connected' && state !== 'idle';

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Character container with aura */}
      <div className="relative">
        {/* Psychic aura glow — larger for immersive feel */}
        <div
          className={`absolute -inset-8 rounded-full blur-3xl transition-all duration-700 ${
            state === 'speaking' ? 'mewtwo-aura-speaking' :
            state === 'listening' ? 'mewtwo-aura-listening' :
            state === 'processing' ? 'mewtwo-aura-processing' :
            'mewtwo-aura-idle'
          }`}
          style={{ background: getAuraColor() }}
        />

        {/* Mewtwo image — hero-sized */}
        <div
          className={`relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 ${
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

      {/* Voice state ring indicator (replaces text labels) */}
      {isActive && (
        <div className="relative mt-4 flex items-center justify-center" data-testid="voice-ring">
          {/* Expanding ring */}
          <div
            className={`absolute w-8 h-8 rounded-full ${getRingColor()} ${
              state === 'speaking' ? 'voice-ring-fast' : 'voice-ring'
            }`}
          />
          {/* Solid center dot */}
          <div className={`w-3 h-3 rounded-full ${getRingColor()}`} />
        </div>
      )}
    </div>
  );
}
