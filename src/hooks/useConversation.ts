'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/chat';
import { storage } from '@/lib/storage';

export const useConversation = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load messages from storage on mount
  useEffect(() => {
    const conversation = storage.getCurrentConversation();
    if (conversation) {
      setMessages(conversation.messages);
    } else {
      storage.createConversation();
    }
  }, []);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message = storage.addMessage({
      role,
      content,
      timestamp: Date.now(),
    });
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  const sendMessage = useCallback(
    async (content: string, isStoryMode: boolean = false) => {
      // Add user message
      addMessage('user', content);
      setIsLoading(true);

      try {
        // Get context messages for the API
        const contextMessages = storage.getContextMessages(10);

        // Call the chat API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: contextMessages,
            isStoryMode,
          }),
        });

        if (!response.ok) {
          throw new Error('Chat API request failed');
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            // Keep the last potentially incomplete line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content || '';
                  assistantMessage += content;
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }
        }

        // Add assistant message to storage and state
        if (assistantMessage) {
          addMessage('assistant', assistantMessage);
          return assistantMessage;
        }
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = 'I apologize, but I encountered an error. Please try again.';
        addMessage('assistant', errorMessage);
        return errorMessage;
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage]
  );

  const clearHistory = useCallback(() => {
    storage.clearAll();
    storage.createConversation();
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearHistory,
  };
};
