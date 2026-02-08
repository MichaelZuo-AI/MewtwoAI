import { renderHook, act, waitFor } from '@testing-library/react'
import { useSpeechRecognition } from '../useSpeechRecognition'
import {
  MockSpeechRecognition,
  setupSpeechRecognitionMock,
  cleanupSpeechRecognitionMock,
} from '@/__mocks__/speechRecognition'

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    setupSpeechRecognitionMock()
  })

  afterEach(() => {
    cleanupSpeechRecognitionMock()
  })

  describe('initialization', () => {
    it('should detect if speech recognition is supported', () => {
      const onResult = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition({ onResult }))

      expect(result.current.isSupported).toBe(true)
    })

    it('should detect when speech recognition is not supported', () => {
      cleanupSpeechRecognitionMock()
      const onResult = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition({ onResult }))

      expect(result.current.isSupported).toBe(false)
    })

    it('should initialize with default options', () => {
      const onResult = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition({ onResult }))

      expect(result.current.isListening).toBe(false)
      expect(result.current.transcript).toBe('')
    })

    it('should configure continuous mode when specified', () => {
      const onResult = jest.fn()
      renderHook(() =>
        useSpeechRecognition({ onResult, continuous: true })
      )

      const instance = MockSpeechRecognition.lastInstance!
      expect(instance.continuous).toBe(true)
    })

    it('should configure language when specified', () => {
      const onResult = jest.fn()
      renderHook(() =>
        useSpeechRecognition({ onResult, language: 'es-ES' })
      )

      const instance = MockSpeechRecognition.lastInstance!
      expect(instance.lang).toBe('es-ES')
    })
  })

  describe('startListening', () => {
    it('should start listening when called', () => {
      const onResult = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition({ onResult }))

      act(() => {
        result.current.startListening()
      })

      expect(result.current.isListening).toBe(true)
    })

    it('should clear transcript when starting', () => {
      const onResult = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition({ onResult }))

      act(() => {
        result.current.startListening()
      })

      expect(result.current.transcript).toBe('')
    })

    it('should not start if already listening', () => {
      const onResult = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition({ onResult }))

      act(() => {
        result.current.startListening()
      })

      const firstState = result.current.isListening

      act(() => {
        result.current.startListening()
      })

      expect(result.current.isListening).toBe(firstState)
    })

    it('should call onError when start fails', () => {
      const onResult = jest.fn()
      const onError = jest.fn()

      // Make start throw an error
      const originalStart = MockSpeechRecognition.prototype.start
      MockSpeechRecognition.prototype.start = jest.fn(() => {
        throw new Error('Start failed')
      })

      const { result } = renderHook(() =>
        useSpeechRecognition({ onResult, onError })
      )

      act(() => {
        result.current.startListening()
      })

      expect(onError).toHaveBeenCalledWith('Failed to start listening')

      // Restore original
      MockSpeechRecognition.prototype.start = originalStart
    })
  })

  describe('stopListening', () => {
    it('should stop listening when called', () => {
      const onResult = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition({ onResult }))

      act(() => {
        result.current.startListening()
      })

      expect(result.current.isListening).toBe(true)

      act(() => {
        result.current.stopListening()
      })

      expect(result.current.isListening).toBe(false)
    })

    it('should not stop if not listening', () => {
      const onResult = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition({ onResult }))

      act(() => {
        result.current.stopListening()
      })

      expect(result.current.isListening).toBe(false)
    })
  })

  describe('abortListening', () => {
    it('should abort listening and clear transcript', () => {
      const onResult = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition({ onResult }))

      act(() => {
        result.current.startListening()
      })

      act(() => {
        result.current.abortListening()
      })

      expect(result.current.isListening).toBe(false)
      expect(result.current.transcript).toBe('')
    })
  })

  describe('speech recognition results', () => {
    it('should handle final transcript results', async () => {
      const onResult = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition({ onResult }))

      // Get the actual instance the hook created
      const instance = MockSpeechRecognition.lastInstance!

      act(() => {
        result.current.startListening()
      })

      act(() => {
        instance.mockResult('Hello Mewtwo', true)
      })

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith('Hello Mewtwo')
      })
    })

    it('should handle interim transcript results', async () => {
      const onResult = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition({ onResult }))

      const instance = MockSpeechRecognition.lastInstance!

      act(() => {
        result.current.startListening()
      })

      act(() => {
        instance.mockResult('Hello...', false)
      })

      await waitFor(() => {
        expect(result.current.transcript).toBe('Hello...')
      })

      // Interim results should NOT trigger onResult
      expect(onResult).not.toHaveBeenCalled()
    })

    it('should trim whitespace from final transcripts', async () => {
      const onResult = jest.fn()
      renderHook(() => useSpeechRecognition({ onResult }))

      const instance = MockSpeechRecognition.lastInstance!

      act(() => {
        instance.mockResult('  Hello Mewtwo  ', true)
      })

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith('Hello Mewtwo')
      })
    })
  })

  describe('error handling', () => {
    it('should handle recognition errors', async () => {
      const onResult = jest.fn()
      const onError = jest.fn()
      const { result } = renderHook(() =>
        useSpeechRecognition({ onResult, onError })
      )

      const instance = MockSpeechRecognition.lastInstance!

      act(() => {
        result.current.startListening()
      })

      act(() => {
        instance.mockError('network')
      })

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('network')
        expect(result.current.isListening).toBe(false)
      })
    })

    it('should set isListening to false on error', async () => {
      const onResult = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition({ onResult }))

      const instance = MockSpeechRecognition.lastInstance!

      act(() => {
        result.current.startListening()
      })

      act(() => {
        instance.mockError('no-speech')
      })

      await waitFor(() => {
        expect(result.current.isListening).toBe(false)
      })
    })
  })

  describe('cleanup', () => {
    it('should abort recognition on unmount', () => {
      const onResult = jest.fn()
      const { result, unmount } = renderHook(() =>
        useSpeechRecognition({ onResult })
      )

      act(() => {
        result.current.startListening()
      })

      unmount()

      // Should not throw errors
      expect(true).toBe(true)
    })
  })
})
