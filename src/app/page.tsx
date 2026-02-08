'use client';

import { useState, useEffect } from 'react';
import { getCharacter } from '@/lib/characters';
import VoiceChat from '@/components/VoiceChat';
import CharacterSelect from '@/components/CharacterSelect';

const SELECTED_CHARACTER_KEY = 'selected-character-id';

export default function Home() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

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

  // Avoid hydration mismatch — show nothing until client-side state loads
  if (!hydrated) {
    return <main className="h-[100dvh] bg-gray-950" />;
  }

  const character = selectedCharacterId ? getCharacter(selectedCharacterId) : null;

  return (
    <main>
      {character ? (
        <VoiceChat character={character} onBack={handleBack} />
      ) : (
        <CharacterSelect onSelect={handleSelect} />
      )}
    </main>
  );
}
