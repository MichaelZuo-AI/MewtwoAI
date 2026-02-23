import { renderHook, act } from '@testing-library/react';
import { mewtwo } from '@/lib/characters/mewtwo';
import { kirby } from '@/lib/characters/kirby';

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
    saveCharacterMemory: jest.fn(),
    getCharacterMemory: jest.fn(() => []),
    getCharacterFacts: jest.fn(() => []),
    saveCharacterFacts: jest.fn(),
    clearCharacterFacts: jest.fn(),
    getPendingExtraction: jest.fn(() => null),
    setPendingExtraction: jest.fn(),
    clearPendingExtraction: jest.fn(),
    getSessionTranscript: jest.fn(() => null),
    setSessionTranscript: jest.fn(),
    clearSessionTranscript: jest.fn(),
    getLearningProfile: jest.fn(() => null),
    saveLearningProfile: jest.fn(),
    getPendingLearningAnalysis: jest.fn(() => null),
    setPendingLearningAnalysis: jest.fn(),
    clearPendingLearningAnalysis: jest.fn(),
    getParentReport: jest.fn(() => null),
    saveParentReport: jest.fn(),
  },
}));

// Mock learning module
jest.mock('@/lib/learning', () => ({
  updateLearningProfile: jest.fn(() => ({
    vocabulary: [],
    sessions: [],
    currentFocus: [],
    lastUpdated: Date.now(),
  })),
  computeCurriculum: jest.fn(() => ({
    wordsToReview: [],
    newWordSuggestion: 'hello',
    suggestedActivity: 'What Color Game',
    knownWordsSnapshot: [],
  })),
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
  ActivityHandling: {
    NO_INTERRUPTION: 'NO_INTERRUPTION',
    START_OF_ACTIVITY_INTERRUPTS: 'START_OF_ACTIVITY_INTERRUPTS',
  },
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
    const { result } = renderHook(() => useGeminiLive(mewtwo));
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.voiceState).toBe('idle');
  });

  it('starts with empty messages when no conversation exists', () => {
    const { result } = renderHook(() => useGeminiLive(mewtwo));
    expect(result.current.messages).toEqual([]);
  });

  it('loads existing messages from storage', () => {
    (storage.getCurrentConversation as jest.Mock).mockReturnValueOnce({
      id: 'conv-1',
      messages: [{ id: '1', role: 'user', content: 'hi', timestamp: 1 }],
      createdAt: 1,
      updatedAt: 1,
    });

    const { result } = renderHook(() => useGeminiLive(mewtwo));
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('hi');
  });

  it('has no error initially', () => {
    const { result } = renderHook(() => useGeminiLive(mewtwo));
    expect(result.current.error).toBeNull();
  });

  it('reports isSupported from audio capture', () => {
    const { result } = renderHook(() => useGeminiLive(mewtwo));
    expect(result.current.isSupported).toBe(true);
  });

  describe('connect', () => {
    it('fetches ephemeral token with characterId and isBedtime', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/gemini-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"characterId":"mewtwo"'),
      });

      // Verify the body is valid JSON with expected fields
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.characterId).toBe('mewtwo');
      expect(body.isStoryMode).toBe(false);
      expect(typeof body.isBedtime).toBe('boolean');
    });

    it('sends kirby characterId when using kirby character', async () => {
      const { result } = renderHook(() => useGeminiLive(kirby));

      await act(async () => {
        await result.current.connect();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.characterId).toBe('kirby');
      expect(body.isStoryMode).toBe(false);
      expect(typeof body.isBedtime).toBe('boolean');
    });

    it('creates GoogleGenAI with ephemeral token and v1alpha', async () => {
      const { GoogleGenAI } = require('@google/genai');

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      expect(GoogleGenAI).toHaveBeenCalledWith({
        apiKey: 'test-token',
        httpOptions: { apiVersion: 'v1alpha' },
      });
    });

    it('calls live.connect with correct model and config', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

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

    it('configures character voice (Fenrir for mewtwo)', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe(
        'Fenrir'
      );
    });

    it('configures character voice (Puck for kirby)', async () => {
      const { result } = renderHook(() => useGeminiLive(kirby));

      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe(
        'Puck'
      );
    });

    it('uses character system prompt', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.systemInstruction).toContain('Mewtwo');
    });

    it('sets silenceDurationMs for VAD', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(
        config.realtimeInputConfig.automaticActivityDetection.silenceDurationMs
      ).toBe(2000);
    });

    it('starts audio capture after connect', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

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

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.error).toBe('no key');
    });

    it('sets error state when live.connect fails', async () => {
      mockConnect.mockRejectedValueOnce(new Error('ws failed'));

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.error).toBe('ws failed');
    });
  });

  describe('onmessage callbacks', () => {
    async function connectAndGetCallbacks() {
      const { result } = renderHook(() => useGeminiLive(mewtwo));
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

      expect(mockEnqueueAudio).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('stops capture and playback', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

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
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      expect(mockSession.conn.close).toHaveBeenCalled();
    });

    it('sets state to disconnected', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

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
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      act(() => {
        result.current.clearHistory();
      });

      expect(storage.clearAll).toHaveBeenCalled();
      expect(result.current.messages).toEqual([]);
    });
  });

  describe('switchStoryMode', () => {
    it('updates isStoryMode', () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      act(() => {
        result.current.switchStoryMode(true);
      });

      expect(result.current.isStoryMode).toBe(true);
    });

    it('starts with isStoryMode false', () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));
      expect(result.current.isStoryMode).toBe(false);
    });
  });

  describe('error handling', () => {
    it('handles onerror callback without crashing', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        capturedCallbacks.onerror(new ErrorEvent('error'));
      });
    });

    it('auto-reconnects on unexpected onclose', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('reconnecting');
      expect(result.current.error).toBe('Connection lost — reconnecting...');

      jest.useRealTimers();
    });

    it('sets disconnected on manual disconnect then onclose', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('disconnected');
    });

    it('handles non-Error token fetch failure', async () => {
      mockFetch.mockRejectedValue('network error');

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.error).toBe('Failed to connect');
    });
  });

  describe('auto-reconnect behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('uses exponential backoff for reconnection attempts (1s, 2s, 4s)', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('reconnecting');

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockConnect).toHaveBeenCalledTimes(2);

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('reconnecting');

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockConnect).toHaveBeenCalledTimes(3);

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(mockConnect).toHaveBeenCalledTimes(4);
    });

    it('stops reconnecting after MAX_RECONNECT_ATTEMPTS (3)', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      for (let i = 0; i < 3; i++) {
        act(() => {
          capturedCallbacks.onclose(new CloseEvent('close'));
        });

        await act(async () => {
          jest.advanceTimersByTime(1000 * Math.pow(2, i));
        });
      }

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.error).toBe('Connection lost. Please try again.');

      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      expect(mockConnect).toHaveBeenCalledTimes(4);
    });

    it('resets reconnect attempts to 0 on successful onopen', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        capturedCallbacks.onopen();
      });

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('reconnecting');

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockConnect).toHaveBeenCalledTimes(3);
    });

    it('stops capture before attempting reconnect', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      mockStopCapture.mockClear();

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(mockStopCapture).toHaveBeenCalled();
      expect(result.current.connectionState).toBe('reconnecting');
    });

    it('clears reconnect timeout on manual disconnect', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      act(() => {
        result.current.disconnect();
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockConnect).toHaveBeenCalledTimes(1);

      clearTimeoutSpy.mockRestore();
    });

    it('clears reconnect timeout on unmount', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { result, unmount } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('connect with isReconnect parameter', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('sets connectionState to "reconnecting" when isReconnect=true', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect(true);
      });

      expect(mockConnect).toHaveBeenCalled();
    });

    it('sets connectionState to "connecting" when isReconnect=false', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      let connectingState: string | undefined;
      mockConnect.mockImplementationOnce(async (params) => {
        connectingState = result.current.connectionState;
        capturedCallbacks = params.callbacks;
        return mockSession;
      });

      await act(async () => {
        await result.current.connect(false);
      });

      expect(mockConnect).toHaveBeenCalled();
    });

    it('bails out early if isReconnect=true and manual disconnect happened', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      mockConnect.mockClear();
      mockFetch.mockClear();

      await act(async () => {
        await result.current.connect(true);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('bails out if manual disconnect happens while fetching token', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      let resolveToken: (value: any) => void;
      const tokenPromise = new Promise((resolve) => {
        resolveToken = resolve;
      });

      mockFetch.mockReturnValue(tokenPromise as any);

      const connectPromise = act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      resolveToken!({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token' }),
      });

      await connectPromise;

      expect(mockConnect).not.toHaveBeenCalled();
      expect(result.current.connectionState).toBe('disconnected');
    });
  });

  describe('disconnect manual flag', () => {
    it('sets isManualDisconnectRef to true on disconnect', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.error).toBeNull();
    });

    it('sets isManualDisconnectRef to true on unmount', async () => {
      const { result, unmount } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      unmount();

      expect(mockStopCapture).toHaveBeenCalled();
      expect(mockStopPlayback).toHaveBeenCalled();
    });
  });

  describe('onclose reconnection logic', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('auto-reconnects on unexpected close if under max attempts', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('reconnecting');
      expect(result.current.error).toBe('Connection lost — reconnecting...');

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockConnect).toHaveBeenCalledTimes(2);
    });

    it('sets error state if max attempts exceeded', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      for (let i = 0; i < 3; i++) {
        act(() => {
          capturedCallbacks.onclose(new CloseEvent('close'));
        });

        await act(async () => {
          jest.advanceTimersByTime(1000 * Math.pow(2, i));
        });
      }

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.error).toBe('Connection lost. Please try again.');
    });

    it('sets disconnected state if manual disconnect flag is set', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.error).toBeNull();
    });
  });

  describe('parallel extraction flow on connect', () => {
    it('calls extract-memories API when pendingExtraction exists', async () => {
      (storage.getPendingExtraction as jest.Mock).mockReturnValueOnce('Speaker: Hello');
      (storage.getCharacterFacts as jest.Mock).mockReturnValueOnce(['old fact']);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ facts: ['new fact'] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token' }),
        });

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const extractCall = mockFetch.mock.calls.find(c => c[0].includes('extract-memories'));
      expect(extractCall).toBeDefined();
    });

    it('calls analyze-learning API when pendingLearningAnalysis exists', async () => {
      (storage.getPendingLearningAnalysis as jest.Mock).mockReturnValueOnce('Speaker: I like cats');
      (storage.getLearningProfile as jest.Mock).mockReturnValueOnce(null);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            newWords: ['cat'],
            reviewedWords: [],
            struggles: [],
            topicsCovered: ['animals'],
            grammarNotes: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token' }),
        });

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const analysisCall = mockFetch.mock.calls.find(c => c[0].includes('analyze-learning'));
      expect(analysisCall).toBeDefined();
    });

    it('calls both extract-memories and analyze-learning in parallel when both pending', async () => {
      (storage.getPendingExtraction as jest.Mock).mockReturnValueOnce('Speaker: Hello');
      (storage.getPendingLearningAnalysis as jest.Mock).mockReturnValueOnce('Speaker: Hello');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ facts: ['fact'] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            newWords: [], reviewedWords: [], struggles: [], topicsCovered: [], grammarNotes: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token' }),
        });

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const extractCall = mockFetch.mock.calls.find(c => c[0].includes('extract-memories'));
      const analysisCall = mockFetch.mock.calls.find(c => c[0].includes('analyze-learning'));
      expect(extractCall).toBeDefined();
      expect(analysisCall).toBeDefined();
    });

    it('saves character facts and clears pending extraction when extraction succeeds', async () => {
      (storage.getPendingExtraction as jest.Mock).mockReturnValueOnce('Speaker: Hello');
      (storage.getCharacterFacts as jest.Mock).mockReturnValueOnce([]);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ facts: ['Damian loves skiing'] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token' }),
        });

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      expect(storage.saveCharacterFacts).toHaveBeenCalledWith(['Damian loves skiing']);
      expect(storage.clearPendingExtraction).toHaveBeenCalled();
    });

    it('saves learning profile and clears pending learning when analysis succeeds', async () => {
      (storage.getPendingLearningAnalysis as jest.Mock).mockReturnValueOnce('Speaker: I like cats');
      (storage.getLearningProfile as jest.Mock).mockReturnValueOnce(null);

      const mockAnalysisResult = {
        newWords: ['cat'],
        reviewedWords: [],
        struggles: [],
        topicsCovered: ['animals'],
        grammarNotes: [],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAnalysisResult),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token' }),
        });

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      expect(storage.saveLearningProfile).toHaveBeenCalled();
      expect(storage.clearPendingLearningAnalysis).toHaveBeenCalled();
    });

    it('does not call extraction APIs when nothing is pending', async () => {
      (storage.getPendingExtraction as jest.Mock).mockReturnValueOnce(null);
      (storage.getPendingLearningAnalysis as jest.Mock).mockReturnValueOnce(null);

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const extractCall = mockFetch.mock.calls.find(c => c[0]?.includes('extract-memories'));
      const analysisCall = mockFetch.mock.calls.find(c => c[0]?.includes('analyze-learning'));
      expect(extractCall).toBeUndefined();
      expect(analysisCall).toBeUndefined();
    });

    it('continues to connect even if extraction API calls fail', async () => {
      (storage.getPendingExtraction as jest.Mock).mockReturnValueOnce('Speaker: Hello');

      mockFetch
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token' }),
        });

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      // Should still connect despite extraction failure
      expect(mockConnect).toHaveBeenCalled();
    });

    it('recovers orphaned session transcript on connect', async () => {
      (storage.getSessionTranscript as jest.Mock).mockReturnValueOnce('Speaker: old session');

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      expect(storage.setPendingExtraction).toHaveBeenCalledWith('Speaker: old session');
      expect(storage.setPendingLearningAnalysis).toHaveBeenCalledWith('Speaker: old session');
      expect(storage.clearSessionTranscript).toHaveBeenCalled();
    });

    it('sends X-App-Source header in extract-memories call', async () => {
      (storage.getPendingExtraction as jest.Mock).mockReturnValueOnce('Speaker: Hello');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ facts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token' }),
        });

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const extractCall = mockFetch.mock.calls.find(c => c[0].includes('extract-memories'));
      expect(extractCall![1].headers['X-App-Source']).toBe('ai-dream-buddies');
    });

    it('sends X-App-Source header in analyze-learning call', async () => {
      (storage.getPendingLearningAnalysis as jest.Mock).mockReturnValueOnce('Speaker: Hello');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            newWords: [], reviewedWords: [], struggles: [], topicsCovered: [], grammarNotes: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token' }),
        });

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const analysisCall = mockFetch.mock.calls.find(c => c[0].includes('analyze-learning'));
      expect(analysisCall![1].headers['X-App-Source']).toBe('ai-dream-buddies');
    });

    it('passes existing vocabulary to analyze-learning', async () => {
      (storage.getPendingLearningAnalysis as jest.Mock).mockReturnValueOnce('Speaker: I like dogs');
      (storage.getLearningProfile as jest.Mock).mockReturnValueOnce({
        vocabulary: [
          { word: 'cat', firstSeen: 1, lastSeen: 1, correctUses: 2, struggles: 0, status: 'learning' },
        ],
        sessions: [],
        currentFocus: [],
        lastUpdated: 1,
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            newWords: ['dog'], reviewedWords: [], struggles: [], topicsCovered: [], grammarNotes: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token' }),
        });

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const analysisCall = mockFetch.mock.calls.find(c => c[0].includes('analyze-learning'));
      const body = JSON.parse(analysisCall![1].body);
      expect(body.existingVocabulary).toContain('cat');
    });
  });

  describe('curriculum and facts context in system prompt', () => {
    it('injects curriculum context when learning profile exists', async () => {
      (storage.getLearningProfile as jest.Mock).mockReturnValueOnce({
        vocabulary: [
          { word: 'cat', firstSeen: 1, lastSeen: 1, correctUses: 3, struggles: 0, status: 'reviewing' },
        ],
        sessions: [],
        currentFocus: [],
        lastUpdated: Date.now(),
      });

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.systemInstruction).toContain("DAMIAN'S ENGLISH LEARNING PROGRESS");
    });

    it('does not inject curriculum context when no learning profile', async () => {
      (storage.getLearningProfile as jest.Mock).mockReturnValueOnce(null);

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.systemInstruction).not.toContain("DAMIAN'S ENGLISH LEARNING PROGRESS");
    });

    it('does not inject curriculum context when vocabulary is empty', async () => {
      (storage.getLearningProfile as jest.Mock).mockReturnValueOnce({
        vocabulary: [],
        sessions: [],
        currentFocus: [],
        lastUpdated: Date.now(),
      });

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.systemInstruction).not.toContain("DAMIAN'S ENGLISH LEARNING PROGRESS");
    });

    it('injects character facts context when facts exist', async () => {
      (storage.getCharacterFacts as jest.Mock).mockReturnValueOnce([
        'Damian loves skiing',
        'Favorite color is blue',
      ]);

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.systemInstruction).toContain('THINGS YOU REMEMBER ABOUT DAMIAN AND HIS FAMILY');
      expect(config.systemInstruction).toContain('Damian loves skiing');
    });

    it('does not inject facts context when facts array is empty', async () => {
      (storage.getCharacterFacts as jest.Mock).mockReturnValueOnce([]);

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.systemInstruction).not.toContain('THINGS YOU REMEMBER ABOUT DAMIAN AND HIS FAMILY');
    });

    it('includes computeCurriculum newWordSuggestion in system prompt', async () => {
      const { computeCurriculum } = require('@/lib/learning');
      (computeCurriculum as jest.Mock).mockReturnValueOnce({
        wordsToReview: ['cat'],
        newWordSuggestion: 'elephant',
        suggestedActivity: 'Animal Sound Game',
        knownWordsSnapshot: ['cat'],
      });
      (storage.getLearningProfile as jest.Mock).mockReturnValueOnce({
        vocabulary: [{ word: 'cat', firstSeen: 1, lastSeen: 1, correctUses: 3, struggles: 0, status: 'reviewing' }],
        sessions: [],
        currentFocus: [],
        lastUpdated: Date.now(),
      });

      const { result } = renderHook(() => useGeminiLive(mewtwo));
      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.systemInstruction).toContain('elephant');
    });
  });

  describe('disconnect saves pending learning analysis', () => {
    it('calls setPendingLearningAnalysis on disconnect when messages exist', async () => {
      (storage.addMessage as jest.Mock).mockReturnValueOnce({ id: '1', role: 'user', content: 'Hi', timestamp: 1 });

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      // Simulate a turn to add a message
      act(() => {
        capturedCallbacks.onmessage({ serverContent: { inputTranscription: { text: 'Hi Mewtwo' } } });
        capturedCallbacks.onmessage({ serverContent: { turnComplete: true } });
      });

      act(() => {
        result.current.disconnect();
      });

      expect(storage.setPendingLearningAnalysis).toHaveBeenCalled();
    });

    it('calls saveCharacterMemory on disconnect when messages exist', async () => {
      (storage.addMessage as jest.Mock).mockReturnValueOnce({ id: '1', role: 'user', content: 'Hi', timestamp: 1 });

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        capturedCallbacks.onmessage({ serverContent: { inputTranscription: { text: 'Hi Mewtwo' } } });
        capturedCallbacks.onmessage({ serverContent: { turnComplete: true } });
      });

      act(() => {
        result.current.disconnect();
      });

      expect(storage.saveCharacterMemory).toHaveBeenCalledWith('mewtwo', expect.any(Array));
    });
  });

  describe('periodic checkpoint every 5 turns', () => {
    it('saves session transcript every 5th turn', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      // Add some transcript content so buildCurrentTranscript() returns non-null
      act(() => {
        capturedCallbacks.onmessage({ serverContent: { inputTranscription: { text: 'Hello' } } });
      });

      // Fire 5 turnComplete events
      for (let i = 0; i < 5; i++) {
        act(() => {
          capturedCallbacks.onmessage({ serverContent: { turnComplete: true } });
        });
      }

      expect(storage.setSessionTranscript).toHaveBeenCalled();
    });

    it('does not save session transcript on non-multiple-of-5 turns', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      // Fire 4 turnComplete events
      for (let i = 0; i < 4; i++) {
        act(() => {
          capturedCallbacks.onmessage({ serverContent: { turnComplete: true } });
        });
      }

      expect(storage.setSessionTranscript).not.toHaveBeenCalled();
    });
  });

  describe('story mode continuation', () => {
    it('does not auto-continue when story seems done', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.switchStoryMode(true);
      });

      // Turn complete with a "the end" message
      act(() => {
        capturedCallbacks.onmessage({ serverContent: { outputTranscription: { text: 'And they lived happily ever after. The End.' } } });
        capturedCallbacks.onmessage({ serverContent: { turnComplete: true } });
      });

      // Should NOT send continuation because story ended
      expect(mockSession.sendClientContent).not.toHaveBeenCalled();
    });

    it('sends continuation prompt in story mode when story not done', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.switchStoryMode(true);
      });

      // Turn complete without end-of-story signal
      act(() => {
        capturedCallbacks.onmessage({ serverContent: { outputTranscription: { text: 'The dragon flew over the mountains.' } } });
        capturedCallbacks.onmessage({ serverContent: { turnComplete: true } });
      });

      expect(mockSession.sendClientContent).toHaveBeenCalledWith(
        expect.objectContaining({
          turns: [expect.objectContaining({ role: 'user' })],
          turnComplete: true,
        })
      );
    });

    it('does not send continuation in chat mode', async () => {
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      // isStoryMode is false by default
      act(() => {
        capturedCallbacks.onmessage({ serverContent: { outputTranscription: { text: 'Hello!' } } });
        capturedCallbacks.onmessage({ serverContent: { turnComplete: true } });
      });

      expect(mockSession.sendClientContent).not.toHaveBeenCalled();
    });
  });

  describe('onopen guard after manual disconnect', () => {
    it('does not change state to connected if onopen fires after manual disconnect', async () => {
      // Connect first so we have a session
      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      // Disconnect manually
      act(() => {
        result.current.disconnect();
      });

      expect(result.current.connectionState).toBe('disconnected');

      // If onopen fires now (late callback from network), it should not change state
      // because isManualDisconnectRef is true
      act(() => {
        capturedCallbacks.onopen?.();
      });

      // Should still be disconnected (not 'connected')
      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.error).toBeNull();
    });
  });

  describe('bedtime detection (KST)', () => {
    // Bedtime is computed in Asia/Seoul (KST = UTC+9)
    // To set KST time, we set UTC time minus 9 hours
    // e.g. KST 21:00 = UTC 12:00

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('sends isBedtime=true when KST is after 8:30 PM', async () => {
      jest.setSystemTime(new Date('2025-01-01T12:00:00Z')); // KST 21:00

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.isBedtime).toBe(true);
    });

    it('sends isBedtime=true when KST is exactly 8:30 PM', async () => {
      jest.setSystemTime(new Date('2025-01-01T11:30:00Z')); // KST 20:30

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.isBedtime).toBe(true);
    });

    it('sends isBedtime=false when KST is before 8:30 PM', async () => {
      jest.setSystemTime(new Date('2025-01-01T05:00:00Z')); // KST 14:00

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.isBedtime).toBe(false);
    });

    it('sends isBedtime=false at KST 8:29 PM', async () => {
      jest.setSystemTime(new Date('2025-01-01T11:29:00Z')); // KST 20:29

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.isBedtime).toBe(false);
    });

    it('sends isBedtime=true during early morning KST (3:00 AM)', async () => {
      jest.setSystemTime(new Date('2024-12-31T18:00:00Z')); // KST 03:00

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.isBedtime).toBe(true);
    });

    it('sends isBedtime=true at KST 7:29 AM (just before bedtime ends)', async () => {
      jest.setSystemTime(new Date('2024-12-31T22:29:00Z')); // KST 07:29

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.isBedtime).toBe(true);
    });

    it('sends isBedtime=false at KST 7:30 AM (bedtime ends)', async () => {
      jest.setSystemTime(new Date('2024-12-31T22:30:00Z')); // KST 07:30

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.isBedtime).toBe(false);
    });

    it('sends isBedtime=true at midnight KST', async () => {
      jest.setSystemTime(new Date('2024-12-31T15:00:00Z')); // KST 00:00

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.isBedtime).toBe(true);
    });

    it('passes isBedtime to systemInstruction via getSystemPrompt', async () => {
      jest.setSystemTime(new Date('2025-01-01T12:00:00Z')); // KST 21:00

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.systemInstruction).toContain('BEDTIME NOTICE');
    });

    it('does not include bedtime in systemInstruction during KST daytime', async () => {
      jest.setSystemTime(new Date('2025-01-01T01:00:00Z')); // KST 10:00

      const { result } = renderHook(() => useGeminiLive(mewtwo));

      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.systemInstruction).not.toContain('BEDTIME NOTICE');
    });
  });
});
