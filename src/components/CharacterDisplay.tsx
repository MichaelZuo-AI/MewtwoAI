'use client';

import Image from 'next/image';
import { VoiceState, LiveConnectionState } from '@/types/chat';
import { CharacterConfig } from '@/types/character';

interface CharacterDisplayProps {
  character: CharacterConfig;
  state: VoiceState;
  connectionState?: LiveConnectionState;
}

export default function CharacterDisplay({ character, state, connectionState }: CharacterDisplayProps) {
  const auraColor = character.theme.aura[state] ?? character.theme.aura.idle;
  const ringColor = character.theme.ring[state] ?? character.theme.ring.idle;

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
          style={{ background: auraColor }}
        />

        {/* Character image — hero-sized */}
        <div
          className={`relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 ${
            state === 'idle' ? 'mewtwo-float' :
            state === 'listening' ? 'mewtwo-listen' :
            state === 'speaking' ? 'mewtwo-speak' :
            'mewtwo-think'
          }`}
        >
          <Image
            src={character.image}
            alt={character.name}
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
            className={`absolute w-8 h-8 rounded-full ${ringColor} ${
              state === 'speaking' ? 'voice-ring-fast' : 'voice-ring'
            }`}
          />
          {/* Solid center dot */}
          <div className={`w-3 h-3 rounded-full ${ringColor}`} />
        </div>
      )}
    </div>
  );
}
