import { renderHook, act, waitFor } from '@testing-library/react'
import { useConversation } from '../useConversation'
import { storage } from '@/lib/storage'
import { setupLocalStorageMock, clearLocalStorageMock } from '@/__mocks__/localStorage'

// Mock the storage module
jest.mock('@/lib/storage', () => ({
  storage: {
    getCurrentConversation: jest.fn(),
    createConversation: jest.fn(),
    addMessage: jest.fn(),
    getContextMessages: jest.fn(),
    clearAll: jest.fn(),
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('useConversation', () => {
  beforeEach(() => {
    setupLocalStorageMock()
    jest.clearAllMocks()

    // Default mock implementations
    ;(storage.getCurrentConversation as jest.Mock).mockReturnValue({
      id: '123',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    ;(storage.createConversation as jest.Mock).mockReturnValue({
      id: '123',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    ;(storage.addMessage as jest.Mock).mockImplementation((msg) => ({
      ...msg,
      id: Math.random().toString(),
    }))
    ;(storage.getContextMessages as jest.Mock).mockReturnValue([])
  })

  afterEach(() => {
    clearLocalStorageMock()
  })

  describe('initialization', () => {
    it('should load existing conversation on mount', () => {
      const existingMessages = [
        {
          id: '1',
          role: 'user' as const,
          content: 'Hello',
          timestamp: Date.now(),
        },
      ]
      ;(storage.getCurrentConversation as jest.Mock).mockReturnValue({
        id: '123',
        messages: existingMessages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      const { result } = renderHook(() => useConversation())

      expect(result.current.messages).toEqual(existingMessages)
    })

    it('should create new conversation if none exists', () => {
      ;(storage.getCurrentConversation as jest.Mock).mockReturnValue(null)

      renderHook(() => useConversation())

      expect(storage.createConversation).toHaveBeenCalled()
    })

    it('should initialize with empty messages for new conversation', () => {
      ;(storage.getCurrentConversation as jest.Mock).mockReturnValue(null)

      const { result } = renderHook(() => useConversation())

      expect(result.current.messages).toEqual([])
    })

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useConversation())

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('sendMessage', () => {
    beforeEach(() => {
      // Mock successful streaming response
      const mockReader = {
        read: jest
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'
            ),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":" there"}}]}\n\n'
            ),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: [DONE]\n\n'),
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined,
          }),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      })
    })

    it('should add user message to conversation', async () => {
      const { result } = renderHook(() => useConversation())

      await act(async () => {
        await result.current.sendMessage('Hello Mewtwo')
      })

      expect(storage.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: 'Hello Mewtwo',
        })
      )
    })

    it('should set isLoading to true during API call', async () => {
      const { result } = renderHook(() => useConversation())

      act(() => {
        result.current.sendMessage('Test')
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should set isLoading to false after completion', async () => {
      const { result } = renderHook(() => useConversation())

      await act(async () => {
        await result.current.sendMessage('Test')
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('should call chat API with correct parameters', async () => {
      const contextMessages = [
        { role: 'user', content: 'Previous message', timestamp: Date.now() },
      ]
      ;(storage.getContextMessages as jest.Mock).mockReturnValue(contextMessages)

      const { result } = renderHook(() => useConversation())

      await act(async () => {
        await result.current.sendMessage('New message', false)
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: contextMessages,
          isStoryMode: false,
        }),
      })
    })

    it('should handle story mode flag', async () => {
      const { result } = renderHook(() => useConversation())

      await act(async () => {
        await result.current.sendMessage('Tell me a story', true)
      })

      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      expect(callArgs[0]).toBe('/api/chat')
      const body = JSON.parse(callArgs[1].body)
      expect(body.isStoryMode).toBe(true)
    })

    it('should process streaming response', async () => {
      const { result } = renderHook(() => useConversation())

      await act(async () => {
        const response = await result.current.sendMessage('Test')
        expect(response).toBe('Hello there')
      })
    })

    it('should add assistant message to conversation', async () => {
      const { result } = renderHook(() => useConversation())

      await act(async () => {
        await result.current.sendMessage('Test')
      })

      expect(storage.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'assistant',
          content: 'Hello there',
        })
      )
    })

    it('should update messages state with assistant response', async () => {
      const { result } = renderHook(() => useConversation())

      await act(async () => {
        await result.current.sendMessage('Test')
      })

      // Should have both user and assistant messages
      expect(result.current.messages.length).toBeGreaterThan(0)
    })

    it('should return assistant message content', async () => {
      const { result } = renderHook(() => useConversation())

      let response: string | undefined
      await act(async () => {
        response = await result.current.sendMessage('Test')
      })

      expect(response).toBe('Hello there')
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      })

      const { result } = renderHook(() => useConversation())

      await act(async () => {
        const response = await result.current.sendMessage('Test')
        expect(response).toContain('encountered an error')
      })
    })

    it('should add error message to conversation on failure', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useConversation())

      await act(async () => {
        await result.current.sendMessage('Test')
      })

      expect(storage.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'assistant',
          content: expect.stringContaining('encountered an error'),
        })
      )
    })

    it('should set isLoading to false after error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Error'))

      const { result } = renderHook(() => useConversation())

      await act(async () => {
        await result.current.sendMessage('Test')
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('should handle missing response body', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: null,
      })

      const { result } = renderHook(() => useConversation())

      await act(async () => {
        await result.current.sendMessage('Test')
      })

      // Should complete without throwing
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle malformed streaming data', async () => {
      const mockReader = {
        read: jest
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('invalid json data\n\n'),
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined,
          }),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      })

      const { result } = renderHook(() => useConversation())

      await act(async () => {
        await result.current.sendMessage('Test')
      })

      // Should handle gracefully without crashing
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('clearHistory', () => {
    it('should clear all storage', () => {
      const { result } = renderHook(() => useConversation())

      act(() => {
        result.current.clearHistory()
      })

      expect(storage.clearAll).toHaveBeenCalled()
    })

    it('should create new conversation after clearing', () => {
      const { result } = renderHook(() => useConversation())

      act(() => {
        result.current.clearHistory()
      })

      expect(storage.createConversation).toHaveBeenCalled()
    })

    it('should reset messages to empty array', () => {
      const { result } = renderHook(() => useConversation())

      // Add some messages first
      act(() => {
        ;(storage.addMessage as jest.Mock).mockReturnValue({
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: Date.now(),
        })
      })

      act(() => {
        result.current.clearHistory()
      })

      expect(result.current.messages).toEqual([])
    })
  })

  describe('context messages', () => {
    it('should request context messages with limit of 10', async () => {
      const { result } = renderHook(() => useConversation())

      await act(async () => {
        await result.current.sendMessage('Test')
      })

      expect(storage.getContextMessages).toHaveBeenCalledWith(10)
    })
  })

  describe('edge cases', () => {
    it('should handle empty message content', async () => {
      const { result } = renderHook(() => useConversation())

      await act(async () => {
        await result.current.sendMessage('')
      })

      expect(storage.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '',
        })
      )
    })

    it('should handle very long messages', async () => {
      const { result } = renderHook(() => useConversation())
      const longMessage = 'A'.repeat(10000)

      await act(async () => {
        await result.current.sendMessage(longMessage)
      })

      expect(storage.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: longMessage,
        })
      )
    })

    it('should handle rapid successive messages', async () => {
      const { result } = renderHook(() => useConversation())

      await act(async () => {
        result.current.sendMessage('Message 1')
        result.current.sendMessage('Message 2')
        result.current.sendMessage('Message 3')
      })

      // All messages should be added
      expect(storage.addMessage).toHaveBeenCalled()
    })
  })
})
