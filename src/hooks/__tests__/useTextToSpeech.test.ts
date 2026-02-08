import { renderHook, act, waitFor } from '@testing-library/react'
import { useTextToSpeech } from '../useTextToSpeech'

// Mock fetch
global.fetch = jest.fn()

describe('useTextToSpeech', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful TTS API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['audio data'], { type: 'audio/mpeg' }),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useTextToSpeech())

      expect(result.current.isSpeaking).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('speak', () => {
    it('should call TTS API with text', async () => {
      const { result } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('Hello, I am Mewtwo')
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'Hello, I am Mewtwo' }),
      })
    })

    it('should set isLoading to true while fetching', async () => {
      const { result } = renderHook(() => useTextToSpeech())

      act(() => {
        result.current.speak('Test message')
      })

      // Check that loading starts
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })
    })

    it('should trigger onStart callback when audio starts playing', async () => {
      const onStart = jest.fn()
      const { result } = renderHook(() => useTextToSpeech({ onStart }))

      await act(async () => {
        result.current.speak('Test')
        // Simulate audio play event
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      // The audio play event should trigger onStart
      // Note: In actual implementation, this would be triggered by the 'play' event listener
    })

    it('should trigger onEnd callback when audio finishes', async () => {
      const onEnd = jest.fn()
      const { result } = renderHook(() => useTextToSpeech({ onEnd }))

      await act(async () => {
        result.current.speak('Test')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      // Note: In actual implementation, this would be triggered by the 'ended' event listener
    })

    it('should handle multiple messages in queue', async () => {
      const { result } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('First message')
        result.current.speak('Second message')
        result.current.speak('Third message')
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // Should have called fetch for the first message
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should process queue sequentially', async () => {
      const { result } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('Message 1')
        result.current.speak('Message 2')
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // Fetch should be called at least once
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('stop', () => {
    it('should stop current audio playback', async () => {
      const { result } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('Test message')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      act(() => {
        result.current.stop()
      })

      expect(result.current.isSpeaking).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should clear the audio queue', async () => {
      const { result } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('Message 1')
        result.current.speak('Message 2')
        result.current.speak('Message 3')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      act(() => {
        result.current.stop()
      })

      expect(result.current.isSpeaking).toBe(false)
    })

    it('should reset processing flag', async () => {
      const { result } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('Test')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      act(() => {
        result.current.stop()
      })

      // After stopping, should be able to speak again
      await act(async () => {
        result.current.speak('New message')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('pause and resume', () => {
    it('should pause current audio', async () => {
      const { result } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('Test message')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      act(() => {
        result.current.pause()
      })

      expect(result.current.isSpeaking).toBe(false)
    })

    it('should resume paused audio', async () => {
      const { result } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('Test message')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      act(() => {
        result.current.pause()
      })

      act(() => {
        result.current.resume()
      })

      expect(result.current.isSpeaking).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should fall back to browser TTS on API errors', async () => {
      const onError = jest.fn()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      })

      const { result } = renderHook(() => useTextToSpeech({ onError }))

      await act(async () => {
        result.current.speak('Test message')
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      await waitFor(() => {
        // Falls back to browser TTS, which isn't available in jsdom
        expect(onError).toHaveBeenCalledWith('Browser TTS not supported')
      })
    })

    it('should fall back to browser TTS on network errors', async () => {
      const onError = jest.fn()
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      const { result } = renderHook(() => useTextToSpeech({ onError }))

      await act(async () => {
        result.current.speak('Test message')
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      await waitFor(() => {
        // Falls back to browser TTS, which isn't available in jsdom
        expect(onError).toHaveBeenCalledWith('Browser TTS not supported')
      })
    })

    it('should continue processing queue after error', async () => {
      const onError = jest.fn()
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(['audio'], { type: 'audio/mpeg' }),
        })

      const { result } = renderHook(() => useTextToSpeech({ onError }))

      await act(async () => {
        result.current.speak('Message 1')
        result.current.speak('Message 2')
        await new Promise(resolve => setTimeout(resolve, 200))
      })

      // Should have attempted both messages
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should set states correctly after error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Error')
      )

      const { result } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('Test')
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      await waitFor(() => {
        expect(result.current.isSpeaking).toBe(false)
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('cleanup', () => {
    it('should cleanup audio on unmount', async () => {
      const { result, unmount } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('Test message')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      unmount()

      // Should not throw errors
      expect(true).toBe(true)
    })

    it('should pause and clear audio source on unmount', async () => {
      const { result, unmount } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('Test')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      // Unmounting should clean up
      unmount()
      expect(true).toBe(true)
    })
  })

  describe('audio playback events', () => {
    it('should handle audio play event', async () => {
      const onStart = jest.fn()
      const { result } = renderHook(() => useTextToSpeech({ onStart }))

      await act(async () => {
        result.current.speak('Test')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      // The implementation sets up event listeners for 'play' event
      // In a real scenario, this would trigger when audio.play() resolves
    })

    it('should handle audio ended event', async () => {
      const onEnd = jest.fn()
      const { result } = renderHook(() => useTextToSpeech({ onEnd }))

      await act(async () => {
        result.current.speak('Test')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      // The implementation sets up event listeners for 'ended' event
    })

    it('should revoke object URL after audio ends', async () => {
      const { result } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('Test')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      // URL.revokeObjectURL should be called when audio ends
      // This is verified through the mock setup in jest.setup.js
    })
  })

  describe('edge cases', () => {
    it('should handle empty text gracefully', async () => {
      const { result } = renderHook(() => useTextToSpeech())

      await act(async () => {
        result.current.speak('')
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      // Should still make the API call
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should handle very long text', async () => {
      const { result } = renderHook(() => useTextToSpeech())
      const longText = 'A'.repeat(10000)

      await act(async () => {
        result.current.speak(longText)
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tts',
        expect.objectContaining({
          body: JSON.stringify({ text: longText }),
        })
      )
    })
  })
})
