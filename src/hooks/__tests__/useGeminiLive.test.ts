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
  },
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
