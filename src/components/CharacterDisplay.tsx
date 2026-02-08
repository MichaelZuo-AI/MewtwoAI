'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { VoiceState, LiveConnectionState } from '@/types/chat';
import { CharacterConfig, CharacterStateImages } from '@/types/character';

export function resolveImage(
  image: string | CharacterStateImages,
  state: VoiceState
): string {
  if (typeof image === 'string') return image;
  return image[state] ?? image.idle;
}

function getAllImages(image: string | CharacterStateImages): string[] {
  if (typeof image === 'string') return [image];
  const urls = new Set<string>();
  urls.add(image.idle);
  if (image.listening) urls.add(image.listening);
  if (image.speaking) urls.add(image.speaking);
  if (image.processing) urls.add(image.processing);
  return Array.from(urls);
}

interface CharacterDisplayProps {
  character: CharacterConfig;
  state: VoiceState;
  connectionState?: LiveConnectionState;
}

export default function CharacterDisplay({ character, state, connectionState }: CharacterDisplayProps) {
  const auraColor = character.theme.aura[state] ?? character.theme.aura.idle;
  const ringColor = character.theme.ring[state] ?? character.theme.ring.idle;

  const isActive = connectionState === 'connected' && state !== 'idle';

  const currentImage = resolveImage(character.image, state);
  const allImages = useMemo(() => getAllImages(character.image), [character.image]);

  // Preload all state images on mount
  useEffect(() => {
    allImages.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [allImages]);

  // Crossfade: track displayed image with a small transition
  const [displayedImage, setDisplayedImage] = useState(currentImage);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (currentImage !== displayedImage) {
      setOpacity(0);
      const timer = setTimeout(() => {
        setDisplayedImage(currentImage);
        setOpacity(1);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentImage, displayedImage]);

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
            src={displayedImage}
            alt={character.name}
            fill
            className="object-contain drop-shadow-2xl transition-opacity duration-150"
            style={{ opacity }}
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
