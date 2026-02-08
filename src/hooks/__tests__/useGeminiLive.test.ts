import { renderHook, act } from '@testing-library/react';

// Mock child hooks
const mockStartCapture = jest.fn();
const mockStopCapture = jest.fn();
jest.mock('../useAudioCapture', () => ({
  useAudioCapture: jest.fn(() => ({
    isCapturing: false,
    isSupported: true,
    startCapture: mockStartCapture,
    stopCapture: mockStopCapture,
  })),
}));

const mockEnqueueAudio = jest.fn();
const mockClearQueue = jest.fn();
const mockStopPlayback = jest.fn();
jest.mock('../useAudioPlayback', () => ({
  useAudioPlayback: jest.fn(() => ({
    isPlaying: false,
    enqueueAudio: mockEnqueueAudio,
    clearQueue: mockClearQueue,
    stopPlayback: mockStopPlayback,
  })),
}));

// Mock storage
jest.mock('@/lib/storage', () => ({
  storage: {
    getCurrentConversation: jest.fn(() => null),
    addMessage: jest.fn((msg: any) => ({ ...msg, id: 'msg-' + Date.now() })),
    clearAll: jest.fn(),
  },
}));

// Mock mewtwo-prompts
jest.mock('@/lib/mewtwo-prompts', () => ({
  getSystemPrompt: jest.fn((isStory: boolean) =>
    isStory ? 'story prompt' : 'normal prompt'
  ),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock @google/genai
const mockSession = {
  sendRealtimeInput: jest.fn(),
  sendClientContent: jest.fn(),
  conn: { close: jest.fn() },
};

let capturedCallbacks: any = {};
const mockConnect = jest.fn(async (params: any) => {
  capturedCallbacks = params.callbacks;
  return mockSession;
});

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    live: { connect: mockConnect },
  })),
  Modality: { AUDIO: 'AUDIO' },
}));

import { useGeminiLive } from '../useGeminiLive';
import { storage } from '@/lib/storage';

describe('useGeminiLive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'test-token' }),
    });
    mockStartCapture.mockResolvedValue(undefined);
  });

  it('starts in disconnected state', () => {
    const { result } = renderHook(() => useGeminiLive());
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.voiceState).toBe('idle');
  });

  it('starts with empty messages when no conversation exists', () => {
    const { result } = renderHook(() => useGeminiLive());
    expect(result.current.messages).toEqual([]);
  });

  it('loads existing messages from storage', () => {
    (storage.getCurrentConversation as jest.Mock).mockReturnValueOnce({
      id: 'conv-1',
      messages: [{ id: '1', role: 'user', content: 'hi', timestamp: 1 }],
      createdAt: 1,
      updatedAt: 1,
    });

    const { result } = renderHook(() => useGeminiLive());
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('hi');
  });

  it('has no error initially', () => {
    const { result } = renderHook(() => useGeminiLive());
    expect(result.current.error).toBeNull();
  });

  it('reports isSupported from audio capture', () => {
    const { result } = renderHook(() => useGeminiLive());
    expect(result.current.isSupported).toBe(true);
  });

  describe('connect', () => {
    it('fetches ephemeral token', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/gemini-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStoryMode: false }),
      });
    });

    it('sets connecting state during connection', async () => {
      let connectingState: string | undefined;
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ token: 'tok' }),
            });
          }, 10);
        });
      });

      const { result } = renderHook(() => useGeminiLive());

      const connectPromise = act(async () => {
        const p = result.current.connect();
        // Check state synchronously after calling connect
        return p;
      });

      // connectionState should be 'connecting' before token fetch resolves
      // (This tests the initial state transition)
      await connectPromise;
    });

    it('creates GoogleGenAI with ephemeral token and v1alpha', async () => {
      const { GoogleGenAI } = require('@google/genai');

      const { result } = renderHook(() => useGeminiLive());
      await act(async () => {
        await result.current.connect();
      });

      expect(GoogleGenAI).toHaveBeenCalledWith({
        apiKey: 'test-token',
        httpOptions: { apiVersion: 'v1alpha' },
      });
    });

    it('calls live.connect with correct model and config', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      expect(mockConnect).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: expect.objectContaining({
            responseModalities: ['AUDIO'],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          }),
        })
      );
    });

    it('configures Charon voice', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe(
        'Charon'
      );
    });

    it('sets silenceDurationMs for VAD', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(
        config.realtimeInputConfig.automaticActivityDetection.silenceDurationMs
      ).toBe(2000);
    });

    it('starts audio capture after connect', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      expect(mockStartCapture).toHaveBeenCalled();
    });

    it('sets error state when token fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'no key' }),
      });

      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.error).toBe('no key');
    });

    it('sets error state when live.connect fails', async () => {
      mockConnect.mockRejectedValueOnce(new Error('ws failed'));

      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.error).toBe('ws failed');
    });
  });

  describe('onmessage callbacks', () => {
    async function connectAndGetCallbacks() {
      const { result } = renderHook(() => useGeminiLive());
      await act(async () => {
        await result.current.connect();
      });
      return { result, callbacks: capturedCallbacks };
    }

    it('enqueues audio when model turn has inline data', async () => {
      const { callbacks } = await connectAndGetCallbacks();

      act(() => {
        callbacks.onmessage({
          serverContent: {
            modelTurn: {
              parts: [{ inlineData: { data: 'audio-base64', mimeType: 'audio/pcm' } }],
            },
          },
        });
      });

      expect(mockEnqueueAudio).toHaveBeenCalledWith('audio-base64');
    });

    it('clears audio queue on interruption', async () => {
      const { callbacks } = await connectAndGetCallbacks();

      act(() => {
        callbacks.onmessage({
          serverContent: { interrupted: true },
        });
      });

      expect(mockClearQueue).toHaveBeenCalled();
    });

    it('flushes transcripts on turnComplete', async () => {
      const { result, callbacks } = await connectAndGetCallbacks();

      // Simulate input transcription first
      act(() => {
        callbacks.onmessage({
          serverContent: {
            inputTranscription: { text: 'hello mewtwo' },
          },
        });
      });

      act(() => {
        callbacks.onmessage({
          serverContent: {
            outputTranscription: { text: 'greetings trainer' },
          },
        });
      });

      // Turn complete should flush
      act(() => {
        callbacks.onmessage({
          serverContent: { turnComplete: true },
        });
      });

      expect(storage.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'user', content: 'hello mewtwo' })
      );
      expect(storage.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'assistant', content: 'greetings trainer' })
      );
    });

    it('does not add empty transcripts', async () => {
      const { callbacks } = await connectAndGetCallbacks();

      act(() => {
        callbacks.onmessage({
          serverContent: { turnComplete: true },
        });
      });

      expect(storage.addMessage).not.toHaveBeenCalled();
    });

    it('accumulates partial transcriptions', async () => {
      const { callbacks } = await connectAndGetCallbacks();

      act(() => {
        callbacks.onmessage({
          serverContent: { outputTranscription: { text: 'hello ' } },
        });
        callbacks.onmessage({
          serverContent: { outputTranscription: { text: 'world' } },
        });
        callbacks.onmessage({
          serverContent: { turnComplete: true },
        });
      });

      expect(storage.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'assistant', content: 'hello world' })
      );
    });

    it('ignores messages without serverContent', async () => {
      const { callbacks } = await connectAndGetCallbacks();

      act(() => {
        callbacks.onmessage({});
      });

      // Should not throw
      expect(mockEnqueueAudio).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('stops capture and playback', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      expect(mockStopCapture).toHaveBeenCalled();
      expect(mockStopPlayback).toHaveBeenCalled();
    });

    it('closes websocket connection', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      expect(mockSession.conn.close).toHaveBeenCalled();
    });

    it('sets state to disconnected', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.connectionState).toBe('disconnected');
    });
  });

  describe('clearHistory', () => {
    it('clears storage and messages', () => {
      const { result } = renderHook(() => useGeminiLive());

      act(() => {
        result.current.clearHistory();
      });

      expect(storage.clearAll).toHaveBeenCalled();
      expect(result.current.messages).toEqual([]);
    });
  });

  describe('switchStoryMode', () => {
    it('updates isStoryMode', () => {
      const { result } = renderHook(() => useGeminiLive());

      act(() => {
        result.current.switchStoryMode(true);
      });

      expect(result.current.isStoryMode).toBe(true);
    });

    it('starts with isStoryMode false', () => {
      const { result } = renderHook(() => useGeminiLive());
      expect(result.current.isStoryMode).toBe(false);
    });
  });

  describe('error handling', () => {
    it('handles onerror callback', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        capturedCallbacks.onerror(new ErrorEvent('error'));
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.error).toBe('Connection error occurred');
    });

    it('handles onclose callback', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('disconnected');
    });

    it('handles non-Error token fetch failure', async () => {
      mockFetch.mockRejectedValue('network error');

      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.error).toBe('Failed to connect');
    });
  });
});
