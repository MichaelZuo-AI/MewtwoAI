import { VoiceState } from './chat';

export interface CharacterTheme {
  bgDeep: string;
  bgMid: string;
  accent: string;
  aura: Record<VoiceState, string>;
  ring: Record<VoiceState, string>;
  micGradient: string;
}

export interface CharacterStateImages {
  idle: string;
  listening?: string;
  speaking?: string;
  processing?: string;
}

export interface CharacterConfig {
  id: string;
  name: string;
  image: string | CharacterStateImages;
  voice: string;
  theme: CharacterTheme;
  getSystemPrompt: (isStoryMode: boolean, isBedtime?: boolean, kstTimeString?: string) => string;
}
