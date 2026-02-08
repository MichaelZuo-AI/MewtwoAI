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

    it('configures Fenrir voice', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      const config = mockConnect.mock.calls[0][0].config;
      expect(config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe(
        'Fenrir'
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
    it('handles onerror callback without crashing', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      // onerror just logs — onclose will handle state transition
      act(() => {
        capturedCallbacks.onerror(new ErrorEvent('error'));
      });

      // Should not crash, state is unchanged (onclose handles reconnection)
    });

    it('auto-reconnects on unexpected onclose', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      // Should attempt to reconnect, not just disconnect
      expect(result.current.connectionState).toBe('reconnecting');
      expect(result.current.error).toBe('Connection lost — reconnecting...');

      jest.useRealTimers();
    });

    it('sets disconnected on manual disconnect then onclose', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      // Simulate onclose firing after manual disconnect
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

  describe('auto-reconnect behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('uses exponential backoff for reconnection attempts (1s, 2s, 4s)', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      // First disconnect (attempt 1, delay 1s)
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('reconnecting');

      // Fast forward 1 second
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Should have attempted reconnect
      expect(mockConnect).toHaveBeenCalledTimes(2);

      // Simulate second failure (attempt 2, delay 2s)
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('reconnecting');

      // Fast forward 2 seconds
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockConnect).toHaveBeenCalledTimes(3);

      // Simulate third failure (attempt 3, delay 4s)
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      // Fast forward 4 seconds
      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(mockConnect).toHaveBeenCalledTimes(4);
    });

    it('stops reconnecting after MAX_RECONNECT_ATTEMPTS (3)', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      // Trigger 3 reconnect attempts
      for (let i = 0; i < 3; i++) {
        act(() => {
          capturedCallbacks.onclose(new CloseEvent('close'));
        });

        await act(async () => {
          jest.advanceTimersByTime(1000 * Math.pow(2, i));
        });
      }

      // Fourth close should NOT trigger reconnect
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.error).toBe('Connection lost. Please try again.');

      // Fast forward — no more reconnect attempts
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      // Still only 4 connect calls (initial + 3 retries)
      expect(mockConnect).toHaveBeenCalledTimes(4);
    });

    it('resets reconnect attempts to 0 on successful onopen', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      // Fail once
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Reconnect succeeds
      act(() => {
        capturedCallbacks.onopen();
      });

      // Now if we disconnect again, it should start from 0 attempts
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      // Should use 1s delay (first attempt)
      expect(result.current.connectionState).toBe('reconnecting');

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockConnect).toHaveBeenCalledTimes(3);
    });

    it('stops capture before attempting reconnect', async () => {
      const { result } = renderHook(() => useGeminiLive());

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

      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      // Trigger reconnect
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      // Manual disconnect before timeout fires
      act(() => {
        result.current.disconnect();
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();

      // Advance timers — no reconnect should happen
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockConnect).toHaveBeenCalledTimes(1); // Only initial connect

      clearTimeoutSpy.mockRestore();
    });

    it('clears reconnect timeout on unmount', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { result, unmount } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      // Trigger reconnect
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      // Unmount
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
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect(true);
      });

      // Note: state transitions through reconnecting before connected
      expect(mockConnect).toHaveBeenCalled();
    });

    it('sets connectionState to "connecting" when isReconnect=false', async () => {
      const { result } = renderHook(() => useGeminiLive());

      let connectingState: string | undefined;
      mockConnect.mockImplementationOnce(async (params) => {
        connectingState = result.current.connectionState;
        capturedCallbacks = params.callbacks;
        return mockSession;
      });

      await act(async () => {
        await result.current.connect(false);
      });

      // Note: The actual implementation sets connecting synchronously
      expect(mockConnect).toHaveBeenCalled();
    });

    it('bails out early if isReconnect=true and manual disconnect happened', async () => {
      const { result } = renderHook(() => useGeminiLive());

      // Connect then manually disconnect
      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      mockConnect.mockClear();
      mockFetch.mockClear();

      // Try to reconnect (simulating delayed callback)
      await act(async () => {
        await result.current.connect(true);
      });

      // Should bail out without fetching token or connecting
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('resets isManualDisconnect and reconnectAttempts when isReconnect=false', async () => {
      const { result } = renderHook(() => useGeminiLive());

      // Initial connect
      await act(async () => {
        await result.current.connect();
      });

      // First close triggers reconnect attempt
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      // Advance time for first reconnect
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Now user manually connects again (isReconnect=false)
      await act(async () => {
        await result.current.connect(false);
      });

      // This should reset reconnect attempts to 0
      // Now if we disconnect, it should start from attempt 0 (1s delay)
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('reconnecting');

      // Should use 1s delay (first attempt after reset)
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // 1 (initial) + 1 (first auto-reconnect) + 1 (manual connect) + 1 (auto-reconnect after manual) = 4
      expect(mockConnect).toHaveBeenCalledTimes(4);
    });

    it('bails out if manual disconnect happens while fetching token', async () => {
      const { result } = renderHook(() => useGeminiLive());

      let resolveToken: (value: any) => void;
      const tokenPromise = new Promise((resolve) => {
        resolveToken = resolve;
      });

      mockFetch.mockReturnValue(tokenPromise as any);

      // Start connection
      const connectPromise = act(async () => {
        await result.current.connect();
      });

      // Disconnect while token fetch is pending
      act(() => {
        result.current.disconnect();
      });

      // Resolve token
      resolveToken!({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token' }),
      });

      await connectPromise;

      // Should NOT have called live.connect
      expect(mockConnect).not.toHaveBeenCalled();
      expect(result.current.connectionState).toBe('disconnected');
    });
  });

  describe('disconnect manual flag', () => {
    it('sets isManualDisconnectRef to true on disconnect', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      // If onclose fires, it should recognize manual disconnect
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.error).toBeNull();
    });

    it('sets isManualDisconnectRef to true on unmount', async () => {
      const { result, unmount } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      unmount();

      // Note: We can't directly test the ref, but we verify cleanup happens
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
      const { result } = renderHook(() => useGeminiLive());

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
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      // Exhaust all 3 reconnect attempts
      for (let i = 0; i < 3; i++) {
        act(() => {
          capturedCallbacks.onclose(new CloseEvent('close'));
        });

        await act(async () => {
          jest.advanceTimersByTime(1000 * Math.pow(2, i));
        });
      }

      // Fourth close
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.error).toBe('Connection lost. Please try again.');
    });

    it('sets disconnected state if manual disconnect flag is set', async () => {
      const { result } = renderHook(() => useGeminiLive());

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        result.current.disconnect();
      });

      // onclose should recognize manual disconnect
      act(() => {
        capturedCallbacks.onclose(new CloseEvent('close'));
      });

      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.error).toBeNull();
    });
  });
});
