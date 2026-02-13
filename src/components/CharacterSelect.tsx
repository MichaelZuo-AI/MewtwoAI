'use client';

import Image from 'next/image';
import { getAllCharacters } from '@/lib/characters';
import { resolveImage } from './CharacterDisplay';

interface CharacterSelectProps {
  onSelect: (id: string) => void;
}

export default function CharacterSelect({ onSelect }: CharacterSelectProps) {
  const characters = getAllCharacters();

  return (
    <div className="min-h-[100dvh] bg-gray-950 flex flex-col items-center justify-center overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <h1 className="text-white text-2xl font-bold mb-6">Who do you want to talk to?</h1>
      <div className="grid grid-cols-2 gap-4 px-6">
        {characters.map((char) => (
          <button
            key={char.id}
            onClick={() => onSelect(char.id)}
            className="flex flex-col items-center gap-2 transition-transform active:scale-95"
            aria-label={`Talk to ${char.name}`}
          >
            <div
              className="w-24 h-24 rounded-full overflow-hidden relative"
              style={{ boxShadow: `0 0 24px ${char.theme.accent}` }}
            >
              <Image src={resolveImage(char.image, 'idle')} alt={char.name} fill className="object-contain" />
            </div>
            <span className="text-white text-base font-medium">{char.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
