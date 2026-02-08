'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCharacter, getNextCharacter, getPreviousCharacter } from '@/lib/characters';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import VoiceChat from '@/components/VoiceChat';
import CharacterSelect from '@/components/CharacterSelect';

const SELECTED_CHARACTER_KEY = 'selected-character-id';

export default function Home() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [enterAnimation, setEnterAnimation] = useState<string>('');
  const isTransitioningRef = useRef(false);

  // Load persisted selection after hydration
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

    const next = direction === 'left'
      ? getNextCharacter(selectedCharacterId)
      : getPreviousCharacter(selectedCharacterId);

    // Entrance animation: if swiped left (next), new char enters from right, and vice versa
    setEnterAnimation(direction === 'left' ? 'slide-enter-from-right' : 'slide-enter-from-left');
    handleSelect(next.id);

    // Clear animation class after it completes
    setTimeout(() => {
      setEnterAnimation('');
      isTransitioningRef.current = false;
    }, 300);
  }, [selectedCharacterId]);

  const handleSwipeLeft = useCallback(() => switchCharacter('left'), [switchCharacter]);
  const handleSwipeRight = useCallback(() => switchCharacter('right'), [switchCharacter]);

  const { handlers, offsetX, isSwiping } = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 80,
    enabled: !!selectedCharacterId,
  });

  // Avoid hydration mismatch — show nothing until client-side state loads
  if (!hydrated) {
    return <main className="h-[100dvh] bg-gray-950" />;
  }

  const character = selectedCharacterId ? getCharacter(selectedCharacterId) : null;

  return (
    <main>
      {character ? (
        <div
          key={selectedCharacterId}
          className={`${enterAnimation}`}
          style={isSwiping ? { transform: `translateX(${offsetX}px)`, transition: 'none' } : { transition: 'transform 200ms ease-out' }}
          {...handlers}
        >
          <VoiceChat character={character} onBack={handleBack} />
        </div>
      ) : (
        <CharacterSelect onSelect={handleSelect} />
      )}
    </main>
  );
}
