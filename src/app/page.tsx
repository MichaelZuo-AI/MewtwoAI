'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCharacter, getNextCharacter, getPreviousCharacter, getAllCharacters } from '@/lib/characters';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import VoiceChat from '@/components/VoiceChat';
import CharacterSelect from '@/components/CharacterSelect';
import CharacterDisplay from '@/components/CharacterDisplay';
import CharacterDots from '@/components/CharacterDots';

const SELECTED_CHARACTER_KEY = 'selected-character-id';

function CharacterPreview({ characterId, side }: { characterId: string; side: 'left' | 'right' }) {
  const char = getCharacter(characterId);
  if (!char) return null;

  return (
    <div
      className="absolute top-0 w-screen h-[100dvh] flex flex-col items-center justify-center"
      style={{
        // left side: right edge touches container's left edge
        // right side: left edge touches container's right edge
        ...(side === 'left' ? { right: '100%' } : { left: '100%' }),
        background: `linear-gradient(to bottom, ${char.theme.bgDeep}, ${char.theme.bgMid})`,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex-1 flex items-center justify-center min-h-0">
        <CharacterDisplay character={char} state="idle" />
      </div>
      <div className="flex justify-center mb-6">
        <CharacterDots characters={getAllCharacters()} activeId={char.id} />
      </div>
      <div className="text-white/60 text-lg font-medium mb-8">{char.name}</div>
    </div>
  );
}

export default function Home() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);
  const [skipTransition, setSkipTransition] = useState(false);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(SELECTED_CHARACTER_KEY);
    if (stored && getCharacter(stored)) {
      setSelectedCharacterId(stored);
    }
    setHydrated(true);
  }, []);

  const handleSelect = (id: string) => {
    setSelectedCharacterId(id);
    localStorage.setItem(SELECTED_CHARACTER_KEY, id);
  };

  const handleBack = () => {
    setSelectedCharacterId(null);
    localStorage.removeItem(SELECTED_CHARACTER_KEY);
  };

  const switchCharacter = useCallback((direction: 'left' | 'right') => {
    if (isTransitioningRef.current || !selectedCharacterId) return;
    isTransitioningRef.current = true;

    // Animate container to full slide position
    const target = direction === 'left' ? -window.innerWidth : window.innerWidth;
    setSlideOffset(target);

    // After slide animation completes, swap character and snap to center
    setTimeout(() => {
      const next = direction === 'left'
        ? getNextCharacter(selectedCharacterId)
        : getPreviousCharacter(selectedCharacterId);

      setSkipTransition(true);
      handleSelect(next.id);
      setSlideOffset(0);

      requestAnimationFrame(() => {
        setSkipTransition(false);
        isTransitioningRef.current = false;
      });
    }, 250);
  }, [selectedCharacterId]);

  const handleSwipeLeft = useCallback(() => switchCharacter('left'), [switchCharacter]);
  const handleSwipeRight = useCallback(() => switchCharacter('right'), [switchCharacter]);

  const { handlers, offsetX, isSwiping } = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 80,
    enabled: !!selectedCharacterId,
  });

  if (!hydrated) {
    return <main className="h-[100dvh] bg-gray-950" />;
  }

  const character = selectedCharacterId ? getCharacter(selectedCharacterId) : null;
  const prevChar = selectedCharacterId ? getPreviousCharacter(selectedCharacterId) : null;
  const nextChar = selectedCharacterId ? getNextCharacter(selectedCharacterId) : null;

  // Determine current transform
  const currentOffset = isSwiping ? offsetX : slideOffset;
  const style = skipTransition
    ? { transform: 'translateX(0)', transition: 'none' }
    : isSwiping
      ? { transform: `translateX(${currentOffset}px)`, transition: 'none' }
      : { transform: `translateX(${slideOffset}px)`, transition: 'transform 250ms ease-out' };

  return (
    <main className="bg-gray-950 min-h-[100dvh] overflow-hidden">
      {character ? (
        <div className="relative" style={style} {...handlers}>
          {/* Previous character preview — off-screen left */}
          {prevChar && <CharacterPreview characterId={prevChar.id} side="left" />}

          {/* Current character — full VoiceChat */}
          <VoiceChat key={selectedCharacterId} character={character} onBack={handleBack} />

          {/* Next character preview — off-screen right */}
          {nextChar && <CharacterPreview characterId={nextChar.id} side="right" />}
        </div>
      ) : (
        <CharacterSelect onSelect={handleSelect} />
      )}
    </main>
  );
}
