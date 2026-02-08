export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type VoiceState = 'idle' | 'listening' | 'speaking' | 'processing';

export type LiveConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface VoiceChatState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
}
