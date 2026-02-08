import { CharacterConfig } from '@/types/character';

interface CharacterDotsProps {
  characters: CharacterConfig[];
  activeId: string;
}

export default function CharacterDots({ characters, activeId }: CharacterDotsProps) {
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label="Characters">
      {characters.map(char => {
        const isActive = char.id === activeId;
        return (
          <div
            key={char.id}
            role="tab"
            aria-selected={isActive}
            aria-label={char.name}
            className="rounded-full transition-all duration-300"
            style={{
              width: isActive ? 12 : 8,
              height: isActive ? 12 : 8,
              backgroundColor: isActive ? char.theme.accent : 'rgba(255,255,255,0.3)',
            }}
          />
        );
      })}
    </div>
  );
}
