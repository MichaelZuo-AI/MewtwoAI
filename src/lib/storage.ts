import { Conversation, Message } from '@/types/chat';

const STORAGE_KEY = 'mewtwo-conversations';
const CURRENT_CONVERSATION_KEY = 'mewtwo-current-conversation';
const CHARACTER_MEMORY_KEY = 'character-memory';
const CHARACTER_FACTS_KEY = 'character-facts';
const PENDING_EXTRACTION_KEY = 'pending-extraction';
const SESSION_TRANSCRIPT_KEY = 'session-transcript';
const MAX_MESSAGES = 100; // Limit stored messages per conversation
const MAX_MEMORY_MESSAGES = 10; // Last N messages saved per character
const MAX_FACTS = 50;
const MAX_PENDING_SIZE = 200000; // ~200KB cap to prevent unbounded growth

export const storage = {
  // Get all conversations
  getConversations: (): Conversation[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading conversations:', error);
      return [];
    }
  },

  // Get current active conversation
  getCurrentConversation: (): Conversation | null => {
    if (typeof window === 'undefined') return null;
    try {
      const id = localStorage.getItem(CURRENT_CONVERSATION_KEY);
      if (!id) return null;
      const conversations = storage.getConversations();
      return conversations.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Error reading current conversation:', error);
      return null;
    }
  },

  // Create a new conversation
  createConversation: (): Conversation => {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const conversations = storage.getConversations();
    conversations.push(conversation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    localStorage.setItem(CURRENT_CONVERSATION_KEY, conversation.id);

    return conversation;
  },

  // Add a message to the current conversation
  addMessage: (message: Omit<Message, 'id'>): Message => {
    const id = localStorage.getItem(CURRENT_CONVERSATION_KEY);
    // Single atomic read-modify-write: read conversations once, modify, write back
    const conversations = storage.getConversations();
    let conversation = id ? conversations.find(c => c.id === id) : null;

    if (!conversation) {
      conversation = {
        id: crypto.randomUUID(),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      conversations.push(conversation);
      localStorage.setItem(CURRENT_CONVERSATION_KEY, conversation.id);
    }

    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
    };

    conversation.messages.push(newMessage);
    conversation.updatedAt = Date.now();

    // Limit number of stored messages
    if (conversation.messages.length > MAX_MESSAGES) {
      conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    return newMessage;
  },

  // Update a conversation
  updateConversation: (updatedConversation: Conversation): void => {
    const conversations = storage.getConversations();
    const index = conversations.findIndex(c => c.id === updatedConversation.id);

    if (index !== -1) {
      conversations[index] = updatedConversation;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  },

  // Clear all conversations and memory
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_CONVERSATION_KEY);
    localStorage.removeItem(CHARACTER_MEMORY_KEY);
    localStorage.removeItem(CHARACTER_FACTS_KEY);
    localStorage.removeItem(PENDING_EXTRACTION_KEY);
    localStorage.removeItem(SESSION_TRANSCRIPT_KEY);
  },

  // Get messages for context (last N messages)
  getContextMessages: (limit: number = 10): Message[] => {
    const conversation = storage.getCurrentConversation();
    if (!conversation) return [];
    return conversation.messages.slice(-limit);
  },

  // Save recent messages as memory for a specific character
  saveCharacterMemory: (characterId: string, messages: Message[]): void => {
    if (typeof window === 'undefined') return;
    try {
      const memories = JSON.parse(localStorage.getItem(CHARACTER_MEMORY_KEY) || '{}');
      memories[characterId] = messages.slice(-MAX_MEMORY_MESSAGES);
      localStorage.setItem(CHARACTER_MEMORY_KEY, JSON.stringify(memories));
    } catch {
      // Silently fail on storage errors
    }
  },

  // Load previous session messages for a specific character
  getCharacterMemory: (characterId: string): Message[] => {
    if (typeof window === 'undefined') return [];
    try {
      const memories = JSON.parse(localStorage.getItem(CHARACTER_MEMORY_KEY) || '{}');
      return memories[characterId] || [];
    } catch {
      return [];
    }
  },

  // Get shared character facts (accumulated across sessions)
  getCharacterFacts: (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(CHARACTER_FACTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Save shared character facts (capped at MAX_FACTS)
  saveCharacterFacts: (facts: string[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CHARACTER_FACTS_KEY, JSON.stringify(facts.slice(-MAX_FACTS)));
    } catch {
      // Silently fail on storage errors
    }
  },

  // Clear all character facts
  clearCharacterFacts: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CHARACTER_FACTS_KEY);
  },

  // Append transcript for pending fact extraction (append, not overwrite — handles rapid character switching)
  setPendingExtraction: (transcript: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const existing = localStorage.getItem(PENDING_EXTRACTION_KEY) || '';
      const separator = existing ? '\n---\n' : '';
      let combined = existing + separator + transcript;
      // Cap size to prevent unbounded growth if extraction repeatedly fails
      if (combined.length > MAX_PENDING_SIZE) {
        combined = combined.slice(-MAX_PENDING_SIZE);
      }
      localStorage.setItem(PENDING_EXTRACTION_KEY, combined);
    } catch {
      // Silently fail on storage errors
    }
  },

  // Get pending transcript for extraction
  getPendingExtraction: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(PENDING_EXTRACTION_KEY) || null;
  },

  // Clear pending extraction after successful processing
  clearPendingExtraction: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PENDING_EXTRACTION_KEY);
  },

  // Save current session transcript checkpoint (overwrite — safety net for crashes)
  setSessionTranscript: (transcript: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SESSION_TRANSCRIPT_KEY, transcript);
    } catch {
      // Silently fail on storage errors
    }
  },

  // Get session transcript checkpoint
  getSessionTranscript: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(SESSION_TRANSCRIPT_KEY) || null;
  },

  // Clear session transcript (after moving to pending extraction)
  clearSessionTranscript: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_TRANSCRIPT_KEY);
  },
};
