import { VoiceState } from './chat';

export interface CharacterTheme {
  bgDeep: string;
  bgMid: string;
  accent: string;
  aura: Record<VoiceState, string>;
  ring: Record<VoiceState, string>;
  micGradient: string;
}

export interface CharacterConfig {
  id: string;
  name: string;
  image: string;
  voice: string;
  theme: CharacterTheme;
  getSystemPrompt: (isStoryMode: boolean) => string;
}
