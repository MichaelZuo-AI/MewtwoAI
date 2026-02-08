import { mewtwo } from './mewtwo';
import { kirby } from './kirby';
import { CharacterConfig } from '@/types/character';

const CHARACTERS: Record<string, CharacterConfig> = {
  mewtwo,
  kirby,
};

export function getCharacter(id: string): CharacterConfig | undefined {
  return CHARACTERS[id];
}

export function getAllCharacters(): CharacterConfig[] {
  return Object.values(CHARACTERS);
}

export { CHARACTERS };
