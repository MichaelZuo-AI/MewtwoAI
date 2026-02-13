import { mewtwo } from './mewtwo';
import { kirby } from './kirby';
import { dragonite } from './dragonite';
import { magolor } from './magolor';
import { minions } from './minions';
import { snorlax } from './snorlax';
import { CharacterConfig } from '@/types/character';

const CHARACTERS: Record<string, CharacterConfig> = {
  mewtwo,
  kirby,
  dragonite,
  magolor,
  minions,
  snorlax,
};

export function getCharacter(id: string): CharacterConfig | undefined {
  return CHARACTERS[id];
}

export function getAllCharacters(): CharacterConfig[] {
  return Object.values(CHARACTERS);
}

export function getNextCharacter(currentId: string): CharacterConfig {
  const chars = getAllCharacters();
  const idx = chars.findIndex(c => c.id === currentId);
  return chars[(idx + 1) % chars.length];
}

export function getPreviousCharacter(currentId: string): CharacterConfig {
  const chars = getAllCharacters();
  const idx = chars.findIndex(c => c.id === currentId);
  return chars[(idx - 1 + chars.length) % chars.length];
}

export { CHARACTERS };
