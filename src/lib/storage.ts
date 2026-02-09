import { Conversation, Message } from '@/types/chat';

const STORAGE_KEY = 'mewtwo-conversations';
const CURRENT_CONVERSATION_KEY = 'mewtwo-current-conversation';
const CHARACTER_MEMORY_KEY = 'character-memory';
const MAX_MESSAGES = 100; // Limit stored messages per conversation
const MAX_MEMORY_MESSAGES = 10; // Last N messages saved per character

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

  // Clear all conversations
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_CONVERSATION_KEY);
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
};
