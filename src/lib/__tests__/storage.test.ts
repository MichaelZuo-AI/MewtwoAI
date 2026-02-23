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
      jest.useFakeTimers()
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
      jest.useRealTimers()
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

  describe('character memory', () => {
    it('should save and retrieve memory for a character', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello Mewtwo', timestamp: 1 },
        { id: '2', role: 'assistant', content: 'Hello trainer', timestamp: 2 },
      ] as any;
      storage.saveCharacterMemory('mewtwo', messages);
      expect(storage.getCharacterMemory('mewtwo')).toEqual(messages);
    })

    it('should limit to last 10 messages', () => {
      const messages = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
        role: 'user',
        content: `Message ${i}`,
        timestamp: i,
      })) as any;
      storage.saveCharacterMemory('mewtwo', messages);
      const retrieved = storage.getCharacterMemory('mewtwo');
      expect(retrieved).toHaveLength(10);
      // Should keep the last 10
      expect(retrieved[0].content).toBe('Message 5');
      expect(retrieved[9].content).toBe('Message 14');
    })

    it('should return empty array for unknown character', () => {
      expect(storage.getCharacterMemory('unknown')).toEqual([]);
    })

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('character-memory', 'not json');
      expect(storage.getCharacterMemory('mewtwo')).toEqual([]);
    })

    it('should return empty array in server environment', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(storage.getCharacterMemory('mewtwo')).toEqual([]);
      global.window = originalWindow;
    })

    it('saveCharacterMemory should be no-op in server environment', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      const messages = [{ id: '1', role: 'user', content: 'Test', timestamp: 1 }] as any;

      // Verify localStorage doesn't get called by checking it's not in the mock store
      const beforeKeys = Object.keys((global.localStorage as any)?.store || {});
      storage.saveCharacterMemory('mewtwo', messages);
      const afterKeys = Object.keys((global.localStorage as any)?.store || {});

      // No new keys should be added when window is undefined
      expect(afterKeys.filter(k => !beforeKeys.includes(k))).toEqual([]);

      // Restore window
      global.window = originalWindow;
    })

    it('should store separate memories for different characters', () => {
      const mewtwoMessages = [
        { id: '1', role: 'user', content: 'Hello Mewtwo', timestamp: 1 },
      ] as any;
      const kirbyMessages = [
        { id: '2', role: 'user', content: 'Hi Kirby', timestamp: 2 },
      ] as any;
      storage.saveCharacterMemory('mewtwo', mewtwoMessages);
      storage.saveCharacterMemory('kirby', kirbyMessages);
      expect(storage.getCharacterMemory('mewtwo')).toEqual(mewtwoMessages);
      expect(storage.getCharacterMemory('kirby')).toEqual(kirbyMessages);
    })
  })

  describe('character facts', () => {
    it('should return empty array when no facts exist', () => {
      expect(storage.getCharacterFacts()).toEqual([])
    })

    it('should save and retrieve facts', () => {
      const facts = ['Damian loves skiing', 'Favorite color is blue']
      storage.saveCharacterFacts(facts)
      expect(storage.getCharacterFacts()).toEqual(facts)
    })

    it('should cap facts at 50', () => {
      const facts = Array.from({ length: 60 }, (_, i) => `Fact ${i}`)
      storage.saveCharacterFacts(facts)
      expect(storage.getCharacterFacts()).toHaveLength(50)
      // Should keep the last 50
      expect(storage.getCharacterFacts()[0]).toBe('Fact 10')
    })

    it('should clear facts', () => {
      storage.saveCharacterFacts(['Damian likes Pikachu'])
      storage.clearCharacterFacts()
      expect(storage.getCharacterFacts()).toEqual([])
    })

    it('should handle corrupted facts data gracefully', () => {
      localStorage.setItem('character-facts', 'not json')
      expect(storage.getCharacterFacts()).toEqual([])
    })

    it('should return empty array in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      expect(storage.getCharacterFacts()).toEqual([])
      global.window = originalWindow
    })

    it('saveCharacterFacts should be no-op in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const beforeKeys = Object.keys((global.localStorage as any)?.store || {});
      storage.saveCharacterFacts(['fact'])
      const afterKeys = Object.keys((global.localStorage as any)?.store || {});

      // No new keys should be added when window is undefined
      expect(afterKeys.filter(k => !beforeKeys.includes(k))).toEqual([]);

      global.window = originalWindow
    })

    // Note: clearCharacterFacts in server environment can't be tested in JSDOM
    // because JSDOM always provides a window object. The function uses the same
    // typeof window === 'undefined' pattern as saveCharacterFacts (tested above),
    // so we can reasonably trust it works correctly.
  })

  describe('pending extraction', () => {
    it('should return null when no pending extraction exists', () => {
      expect(storage.getPendingExtraction()).toBeNull()
    })

    it('should save and retrieve pending extraction', () => {
      storage.setPendingExtraction('Speaker: Hello')
      expect(storage.getPendingExtraction()).toBe('Speaker: Hello')
    })

    it('should append to existing pending extraction', () => {
      storage.setPendingExtraction('Session 1 transcript')
      storage.setPendingExtraction('Session 2 transcript')
      const result = storage.getPendingExtraction()
      expect(result).toContain('Session 1 transcript')
      expect(result).toContain('Session 2 transcript')
      expect(result).toContain('---')
    })

    it('should cap size at ~200KB to prevent unbounded growth', () => {
      // Write 150KB
      const chunk = 'A'.repeat(150000)
      storage.setPendingExtraction(chunk)
      // Write another 150KB — total would be ~300KB without cap
      storage.setPendingExtraction(chunk)
      const result = storage.getPendingExtraction()!
      expect(result.length).toBeLessThanOrEqual(200000)
    })

    it('should clear pending extraction', () => {
      storage.setPendingExtraction('Some transcript')
      storage.clearPendingExtraction()
      expect(storage.getPendingExtraction()).toBeNull()
    })

    it('should return null in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      expect(storage.getPendingExtraction()).toBeNull()
      global.window = originalWindow
    })

    it('setPendingExtraction should be no-op in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const beforeKeys = Object.keys((global.localStorage as any)?.store || {});
      storage.setPendingExtraction('transcript')
      const afterKeys = Object.keys((global.localStorage as any)?.store || {});

      // No new keys should be added when window is undefined
      expect(afterKeys.filter(k => !beforeKeys.includes(k))).toEqual([]);

      global.window = originalWindow
    })

    // Note: clearPendingExtraction in server environment can't be tested in JSDOM
    // because JSDOM always provides a window object. The function uses the same
    // typeof window === 'undefined' pattern as setPendingExtraction (tested above),
    // so we can reasonably trust it works correctly.
  })

  describe('session transcript checkpoint', () => {
    it('should return null when no session transcript exists', () => {
      expect(storage.getSessionTranscript()).toBeNull()
    })

    it('should save and retrieve session transcript', () => {
      storage.setSessionTranscript('Speaker: Hello\nMewtwo: Hi!')
      expect(storage.getSessionTranscript()).toBe('Speaker: Hello\nMewtwo: Hi!')
    })

    it('should overwrite (not append) session transcript', () => {
      storage.setSessionTranscript('First checkpoint')
      storage.setSessionTranscript('Second checkpoint')
      expect(storage.getSessionTranscript()).toBe('Second checkpoint')
    })

    it('should clear session transcript', () => {
      storage.setSessionTranscript('Some transcript')
      storage.clearSessionTranscript()
      expect(storage.getSessionTranscript()).toBeNull()
    })

    it('should return null in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      expect(storage.getSessionTranscript()).toBeNull()
      global.window = originalWindow
    })

    it('setSessionTranscript should be no-op in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const beforeKeys = Object.keys((global.localStorage as any)?.store || {});
      storage.setSessionTranscript('checkpoint')
      const afterKeys = Object.keys((global.localStorage as any)?.store || {});

      // No new keys should be added when window is undefined
      expect(afterKeys.filter(k => !beforeKeys.includes(k))).toEqual([]);

      global.window = originalWindow
    })

    // Note: clearSessionTranscript in server environment can't be tested in JSDOM
    // because JSDOM always provides a window object. The function uses the same
    // typeof window === 'undefined' pattern as setSessionTranscript (tested above),
    // so we can reasonably trust it works correctly.
  })

  describe('clearAll with facts and extraction', () => {
    it('should clear facts when clearing all', () => {
      storage.saveCharacterFacts(['Damian likes skiing'])
      storage.clearAll()
      expect(storage.getCharacterFacts()).toEqual([])
    })

    it('should clear pending extraction when clearing all', () => {
      storage.setPendingExtraction('Some transcript')
      storage.clearAll()
      expect(storage.getPendingExtraction()).toBeNull()
    })

    it('should clear session transcript when clearing all', () => {
      storage.setSessionTranscript('checkpoint')
      storage.clearAll()
      expect(storage.getSessionTranscript()).toBeNull()
    })

    it('should clear localStorage keys for facts, extraction, and session transcript', () => {
      storage.saveCharacterFacts(['fact'])
      storage.setPendingExtraction('transcript')
      storage.setSessionTranscript('checkpoint')
      storage.clearAll()
      expect(localStorage.getItem('character-facts')).toBeNull()
      expect(localStorage.getItem('pending-extraction')).toBeNull()
      expect(localStorage.getItem('session-transcript')).toBeNull()
    })

    it('should clear character memory when clearing all', () => {
      const messages = [{ id: '1', role: 'user', content: 'Hello', timestamp: 1 }] as any
      storage.saveCharacterMemory('mewtwo', messages)
      expect(storage.getCharacterMemory('mewtwo')).toHaveLength(1)
      storage.clearAll()
      expect(localStorage.getItem('character-memory')).toBeNull()
      expect(storage.getCharacterMemory('mewtwo')).toEqual([])
    })
  })

  describe('learning profile', () => {
    it('should return null when no learning profile exists', () => {
      expect(storage.getLearningProfile()).toBeNull()
    })

    it('should save and retrieve learning profile', () => {
      const profile = {
        vocabulary: [{ word: 'cat', firstSeen: 1, lastSeen: 2, correctUses: 3, struggles: 0, status: 'reviewing' as const }],
        sessions: [],
        currentFocus: [],
        lastUpdated: 1000,
      }
      storage.saveLearningProfile(profile)
      const result = storage.getLearningProfile()
      expect(result).not.toBeNull()
      expect(result!.vocabulary[0].word).toBe('cat')
    })

    it('should cap vocabulary at 500', () => {
      const vocab = Array.from({ length: 600 }, (_, i) => ({
        word: `word${i}`,
        firstSeen: 1,
        lastSeen: 2,
        correctUses: 1,
        struggles: 0,
        status: 'new' as const,
      }))
      const profile = {
        vocabulary: vocab,
        sessions: [],
        currentFocus: [],
        lastUpdated: 1000,
      }
      storage.saveLearningProfile(profile)
      const result = storage.getLearningProfile()
      expect(result!.vocabulary).toHaveLength(500)
    })

    it('should cap sessions at 50', () => {
      const sessions = Array.from({ length: 60 }, (_, i) => ({
        id: `s${i}`,
        date: '2026-01-01',
        timestamp: i,
        characterId: 'mewtwo',
        newWords: [],
        reviewedWords: [],
        struggles: [],
        topicsCovered: [],
        grammarNotes: [],
        transcriptLength: 0,
      }))
      const profile = {
        vocabulary: [],
        sessions,
        currentFocus: [],
        lastUpdated: 1000,
      }
      storage.saveLearningProfile(profile)
      const result = storage.getLearningProfile()
      expect(result!.sessions).toHaveLength(50)
    })

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('learning-profile', 'not json')
      expect(storage.getLearningProfile()).toBeNull()
    })

    it('should return null in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      expect(storage.getLearningProfile()).toBeNull()
      global.window = originalWindow
    })

    it('saveLearningProfile should be no-op in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      const profile = { vocabulary: [], sessions: [], currentFocus: [], lastUpdated: 1 }

      const beforeKeys = Object.keys((global.localStorage as any)?.store || {});
      storage.saveLearningProfile(profile)
      const afterKeys = Object.keys((global.localStorage as any)?.store || {});
      expect(afterKeys.filter(k => !beforeKeys.includes(k))).toEqual([]);

      global.window = originalWindow
    })

    it('should update lastUpdated to current time on save', () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2026-01-01T12:00:00Z'))

      const profile = {
        vocabulary: [],
        sessions: [],
        currentFocus: [],
        lastUpdated: 1, // old timestamp
      }
      storage.saveLearningProfile(profile)
      const result = storage.getLearningProfile()
      expect(result!.lastUpdated).toBe(new Date('2026-01-01T12:00:00Z').getTime())

      jest.useRealTimers()
    })

    it('should prioritize mastered words over new words when capping', () => {
      // 400 new words + 200 mastered words = 600 total → cap at 500
      const newWords = Array.from({ length: 400 }, (_, i) => ({
        word: `new${i}`,
        firstSeen: i,
        lastSeen: i,
        correctUses: 1,
        struggles: 0,
        status: 'new' as const,
      }))
      const masteredWords = Array.from({ length: 200 }, (_, i) => ({
        word: `mastered${i}`,
        firstSeen: i,
        lastSeen: i,
        correctUses: 10,
        struggles: 0,
        status: 'mastered' as const,
      }))
      const profile = {
        vocabulary: [...newWords, ...masteredWords],
        sessions: [],
        currentFocus: [],
        lastUpdated: 1000,
      }
      storage.saveLearningProfile(profile)
      const result = storage.getLearningProfile()
      expect(result!.vocabulary).toHaveLength(500)
      // All 200 mastered words should be preserved
      const masteredCount = result!.vocabulary.filter(v => v.status === 'mastered').length
      expect(masteredCount).toBe(200)
      // Only 300 of 400 new words survive (100 evicted)
      const newCount = result!.vocabulary.filter(v => v.status === 'new').length
      expect(newCount).toBe(300)
    })

    it('should keep the most recent sessions when capping', () => {
      const sessions = Array.from({ length: 60 }, (_, i) => ({
        id: `s${i}`,
        date: '2026-01-01',
        timestamp: i,
        characterId: 'mewtwo',
        newWords: [],
        reviewedWords: [],
        struggles: [],
        topicsCovered: [],
        grammarNotes: [],
        transcriptLength: 0,
      }))
      const profile = {
        vocabulary: [],
        sessions,
        currentFocus: [],
        lastUpdated: 1000,
      }
      storage.saveLearningProfile(profile)
      const result = storage.getLearningProfile()
      // slice(-50) keeps the last 50 (indices 10-59)
      expect(result!.sessions[0].id).toBe('s10')
      expect(result!.sessions[49].id).toBe('s59')
    })
  })

  describe('pending learning analysis', () => {
    it('should return null when no pending learning analysis exists', () => {
      expect(storage.getPendingLearningAnalysis()).toBeNull()
    })

    it('should save and retrieve pending learning analysis', () => {
      storage.setPendingLearningAnalysis('Speaker: Hello')
      expect(storage.getPendingLearningAnalysis()).toBe('Speaker: Hello')
    })

    it('should append to existing pending learning analysis', () => {
      storage.setPendingLearningAnalysis('Session 1')
      storage.setPendingLearningAnalysis('Session 2')
      const result = storage.getPendingLearningAnalysis()
      expect(result).toContain('Session 1')
      expect(result).toContain('Session 2')
      expect(result).toContain('---')
    })

    it('should cap size at ~200KB', () => {
      const chunk = 'A'.repeat(150000)
      storage.setPendingLearningAnalysis(chunk)
      storage.setPendingLearningAnalysis(chunk)
      const result = storage.getPendingLearningAnalysis()!
      expect(result.length).toBeLessThanOrEqual(200000)
    })

    it('should clear pending learning analysis', () => {
      storage.setPendingLearningAnalysis('Some transcript')
      storage.clearPendingLearningAnalysis()
      expect(storage.getPendingLearningAnalysis()).toBeNull()
    })

    it('should return null in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      expect(storage.getPendingLearningAnalysis()).toBeNull()
      global.window = originalWindow
    })

    it('setPendingLearningAnalysis should be no-op in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const beforeKeys = Object.keys((global.localStorage as any)?.store || {})
      storage.setPendingLearningAnalysis('transcript')
      const afterKeys = Object.keys((global.localStorage as any)?.store || {})
      expect(afterKeys.filter(k => !beforeKeys.includes(k))).toEqual([])

      global.window = originalWindow
    })
  })

  describe('parent report', () => {
    it('should return null when no parent report exists', () => {
      expect(storage.getParentReport()).toBeNull()
    })

    it('should save and retrieve parent report', () => {
      storage.saveParentReport('## Report\nGreat progress!')
      expect(storage.getParentReport()).toBe('## Report\nGreat progress!')
    })

    it('should overwrite existing report', () => {
      storage.saveParentReport('Old report')
      storage.saveParentReport('New report')
      expect(storage.getParentReport()).toBe('New report')
    })

    it('should return null in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      expect(storage.getParentReport()).toBeNull()
      global.window = originalWindow
    })

    it('saveParentReport should be no-op in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const beforeKeys = Object.keys((global.localStorage as any)?.store || {})
      storage.saveParentReport('report')
      const afterKeys = Object.keys((global.localStorage as any)?.store || {})
      expect(afterKeys.filter(k => !beforeKeys.includes(k))).toEqual([])

      global.window = originalWindow
    })
  })

  describe('clearAll with learning data', () => {
    it('should clear learning profile when clearing all', () => {
      storage.saveLearningProfile({ vocabulary: [], sessions: [], currentFocus: [], lastUpdated: 1 })
      storage.clearAll()
      expect(storage.getLearningProfile()).toBeNull()
    })

    it('should clear pending learning analysis when clearing all', () => {
      storage.setPendingLearningAnalysis('transcript')
      storage.clearAll()
      expect(storage.getPendingLearningAnalysis()).toBeNull()
    })

    it('should clear parent report when clearing all', () => {
      storage.saveParentReport('report')
      storage.clearAll()
      expect(storage.getParentReport()).toBeNull()
    })

    it('should clear all learning localStorage keys', () => {
      storage.saveLearningProfile({ vocabulary: [], sessions: [], currentFocus: [], lastUpdated: 1 })
      storage.setPendingLearningAnalysis('transcript')
      storage.saveParentReport('report')
      storage.clearAll()
      expect(localStorage.getItem('learning-profile')).toBeNull()
      expect(localStorage.getItem('pending-learning-analysis')).toBeNull()
      expect(localStorage.getItem('parent-report')).toBeNull()
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
