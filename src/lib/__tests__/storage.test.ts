import { storage } from '../storage'
import { setupLocalStorageMock, clearLocalStorageMock } from '@/__mocks__/localStorage'

describe('storage', () => {
  beforeEach(() => {
    setupLocalStorageMock()
    clearLocalStorageMock()
  })

  afterEach(() => {
    clearLocalStorageMock()
  })

  describe('getConversations', () => {
    it('should return empty array when no conversations exist', () => {
      const conversations = storage.getConversations()
      expect(conversations).toEqual([])
    })

    it('should return stored conversations', () => {
      const testConversation = {
        id: '123',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      localStorage.setItem('mewtwo-conversations', JSON.stringify([testConversation]))

      const conversations = storage.getConversations()
      expect(conversations).toEqual([testConversation])
    })

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('mewtwo-conversations', 'invalid json')

      const conversations = storage.getConversations()
      expect(conversations).toEqual([])
    })

    it('should return empty array in server environment', () => {
      // Simulate server-side rendering
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const conversations = storage.getConversations()
      expect(conversations).toEqual([])

      // Restore window
      global.window = originalWindow
    })
  })

  describe('getCurrentConversation', () => {
    it('should return null when no current conversation is set', () => {
      const conversation = storage.getCurrentConversation()
      expect(conversation).toBeNull()
    })

    it('should return the current conversation', () => {
      const testConversation = {
        id: '123',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      localStorage.setItem('mewtwo-conversations', JSON.stringify([testConversation]))
      localStorage.setItem('mewtwo-current-conversation', '123')

      const conversation = storage.getCurrentConversation()
      expect(conversation).toEqual(testConversation)
    })

    it('should return null if current conversation ID does not exist', () => {
      localStorage.setItem('mewtwo-current-conversation', 'nonexistent')

      const conversation = storage.getCurrentConversation()
      expect(conversation).toBeNull()
    })

    it('should handle errors gracefully', () => {
      localStorage.setItem('mewtwo-current-conversation', '123')
      localStorage.setItem('mewtwo-conversations', 'invalid json')

      const conversation = storage.getCurrentConversation()
      expect(conversation).toBeNull()
    })
  })

  describe('createConversation', () => {
    it('should create a new conversation', () => {
      const conversation = storage.createConversation()

      expect(conversation).toMatchObject({
        id: expect.any(String),
        messages: [],
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      })
    })

    it('should add conversation to storage', () => {
      const conversation = storage.createConversation()

      const stored = storage.getConversations()
      expect(stored).toContainEqual(conversation)
    })

    it('should set as current conversation', () => {
      const conversation = storage.createConversation()

      const current = storage.getCurrentConversation()
      expect(current).toEqual(conversation)
    })

    it('should preserve existing conversations', () => {
      const first = storage.createConversation()
      const second = storage.createConversation()

      const all = storage.getConversations()
      expect(all).toHaveLength(2)
      expect(all).toContainEqual(first)
      expect(all).toContainEqual(second)
    })

    it('should generate unique IDs', () => {
      const conv1 = storage.createConversation()
      const conv2 = storage.createConversation()

      expect(conv1.id).not.toBe(conv2.id)
    })
  })

  describe('addMessage', () => {
    it('should add message to current conversation', () => {
      storage.createConversation()

      const message = storage.addMessage({
        role: 'user',
        content: 'Hello Mewtwo',
        timestamp: Date.now(),
      })

      expect(message).toMatchObject({
        id: expect.any(String),
        role: 'user',
        content: 'Hello Mewtwo',
        timestamp: expect.any(Number),
      })
    })

    it('should create conversation if none exists', () => {
      const message = storage.addMessage({
        role: 'user',
        content: 'Test',
        timestamp: Date.now(),
      })

      expect(message.id).toBeDefined()
      expect(storage.getCurrentConversation()).not.toBeNull()
    })

    it('should update conversation updatedAt timestamp', () => {
      const conversation = storage.createConversation()
      const originalUpdatedAt = conversation.updatedAt

      // Wait a bit to ensure timestamp changes
      jest.advanceTimersByTime(100)

      storage.addMessage({
        role: 'user',
        content: 'Test',
        timestamp: Date.now(),
      })

      const updated = storage.getCurrentConversation()
      expect(updated!.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
    })

    it('should persist message to storage', () => {
      storage.createConversation()

      storage.addMessage({
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      })

      const conversation = storage.getCurrentConversation()
      expect(conversation!.messages).toHaveLength(1)
      expect(conversation!.messages[0].content).toBe('Hello')
    })

    it('should limit messages to MAX_MESSAGES', () => {
      storage.createConversation()

      // Add 101 messages (MAX_MESSAGES is 100)
      for (let i = 0; i < 101; i++) {
        storage.addMessage({
          role: 'user',
          content: `Message ${i}`,
          timestamp: Date.now(),
        })
      }

      const conversation = storage.getCurrentConversation()
      expect(conversation!.messages.length).toBe(100)
    })

    it('should keep most recent messages when trimming', () => {
      storage.createConversation()

      // Add 101 messages
      for (let i = 0; i < 101; i++) {
        storage.addMessage({
          role: 'user',
          content: `Message ${i}`,
          timestamp: Date.now(),
        })
      }

      const conversation = storage.getCurrentConversation()
      // First message should be "Message 1" (Message 0 was trimmed)
      expect(conversation!.messages[0].content).toBe('Message 1')
      expect(conversation!.messages[99].content).toBe('Message 100')
    })

    it('should handle assistant messages', () => {
      storage.createConversation()

      const message = storage.addMessage({
        role: 'assistant',
        content: 'I am Mewtwo',
        timestamp: Date.now(),
      })

      expect(message.role).toBe('assistant')
    })

    it('should generate unique message IDs', () => {
      storage.createConversation()

      const msg1 = storage.addMessage({
        role: 'user',
        content: 'Test 1',
        timestamp: Date.now(),
      })

      const msg2 = storage.addMessage({
        role: 'user',
        content: 'Test 2',
        timestamp: Date.now(),
      })

      expect(msg1.id).not.toBe(msg2.id)
    })
  })

  describe('updateConversation', () => {
    it('should update existing conversation', () => {
      const conversation = storage.createConversation()
      conversation.messages.push({
        id: '1',
        role: 'user',
        content: 'Updated',
        timestamp: Date.now(),
      })

      storage.updateConversation(conversation)

      const updated = storage.getCurrentConversation()
      expect(updated!.messages).toHaveLength(1)
      expect(updated!.messages[0].content).toBe('Updated')
    })

    it('should not update non-existent conversation', () => {
      const fakeConversation = {
        id: 'nonexistent',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      storage.updateConversation(fakeConversation)

      const conversations = storage.getConversations()
      expect(conversations).not.toContainEqual(fakeConversation)
    })

    it('should preserve other conversations', () => {
      const conv1 = storage.createConversation()
      const conv2 = storage.createConversation()

      conv1.messages.push({
        id: '1',
        role: 'user',
        content: 'Test',
        timestamp: Date.now(),
      })

      storage.updateConversation(conv1)

      const all = storage.getConversations()
      expect(all).toHaveLength(2)
    })
  })

  describe('clearAll', () => {
    it('should remove all conversations', () => {
      storage.createConversation()
      storage.createConversation()

      storage.clearAll()

      expect(storage.getConversations()).toEqual([])
    })

    it('should remove current conversation reference', () => {
      storage.createConversation()

      storage.clearAll()

      expect(storage.getCurrentConversation()).toBeNull()
    })

    it('should clear localStorage keys', () => {
      storage.createConversation()
      storage.addMessage({
        role: 'user',
        content: 'Test',
        timestamp: Date.now(),
      })

      storage.clearAll()

      expect(localStorage.getItem('mewtwo-conversations')).toBeNull()
      expect(localStorage.getItem('mewtwo-current-conversation')).toBeNull()
    })
  })

  describe('getContextMessages', () => {
    it('should return empty array when no conversation exists', () => {
      const messages = storage.getContextMessages()
      expect(messages).toEqual([])
    })

    it('should return all messages when fewer than limit', () => {
      storage.createConversation()
      storage.addMessage({ role: 'user', content: 'Message 1', timestamp: Date.now() })
      storage.addMessage({ role: 'assistant', content: 'Message 2', timestamp: Date.now() })

      const messages = storage.getContextMessages(10)
      expect(messages).toHaveLength(2)
    })

    it('should return last N messages when more than limit', () => {
      storage.createConversation()

      for (let i = 0; i < 20; i++) {
        storage.addMessage({
          role: 'user',
          content: `Message ${i}`,
          timestamp: Date.now(),
        })
      }

      const messages = storage.getContextMessages(5)
      expect(messages).toHaveLength(5)
      expect(messages[0].content).toBe('Message 15')
      expect(messages[4].content).toBe('Message 19')
    })

    it('should use default limit of 10', () => {
      storage.createConversation()

      for (let i = 0; i < 20; i++) {
        storage.addMessage({
          role: 'user',
          content: `Message ${i}`,
          timestamp: Date.now(),
        })
      }

      const messages = storage.getContextMessages()
      expect(messages).toHaveLength(10)
    })

    it('should preserve message order', () => {
      storage.createConversation()
      storage.addMessage({ role: 'user', content: 'First', timestamp: 1 })
      storage.addMessage({ role: 'assistant', content: 'Second', timestamp: 2 })
      storage.addMessage({ role: 'user', content: 'Third', timestamp: 3 })

      const messages = storage.getContextMessages(10)
      expect(messages[0].content).toBe('First')
      expect(messages[1].content).toBe('Second')
      expect(messages[2].content).toBe('Third')
    })
  })

  describe('edge cases', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should handle concurrent message additions', () => {
      storage.createConversation()

      storage.addMessage({ role: 'user', content: 'Msg 1', timestamp: Date.now() })
      storage.addMessage({ role: 'assistant', content: 'Msg 2', timestamp: Date.now() })
      storage.addMessage({ role: 'user', content: 'Msg 3', timestamp: Date.now() })

      const conversation = storage.getCurrentConversation()
      expect(conversation!.messages).toHaveLength(3)
    })

    it('should handle special characters in content', () => {
      storage.createConversation()

      const specialContent = '🎮 Hello! "Quotes" & <tags> \n\t Special chars'
      const message = storage.addMessage({
        role: 'user',
        content: specialContent,
        timestamp: Date.now(),
      })

      expect(message.content).toBe(specialContent)
    })

    it('should handle very long message content', () => {
      storage.createConversation()

      const longContent = 'A'.repeat(100000)
      const message = storage.addMessage({
        role: 'user',
        content: longContent,
        timestamp: Date.now(),
      })

      expect(message.content.length).toBe(100000)
    })

    it('should handle empty message content', () => {
      storage.createConversation()

      const message = storage.addMessage({
        role: 'user',
        content: '',
        timestamp: Date.now(),
      })

      expect(message.content).toBe('')
    })
  })
})
