import { renderHook, act } from '@testing-library/react';
import { useAudioPlayback } from '../useAudioPlayback';

describe('useAudioPlayback', () => {
  let mockAudioContext: any;
  let mockBufferSource: any;
  let mockBuffer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBufferSource = {
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      onended: null,
    };

    mockBuffer = {
      duration: 0.1,
      getChannelData: jest.fn(() => new Float32Array(1024)),
    };

    mockAudioContext = {
      sampleRate: 24000,
      currentTime: 0,
      state: 'running',
      destination: {},
      createBufferSource: jest.fn(() => ({ ...mockBufferSource })),
      createBuffer: jest.fn(() => ({ ...mockBuffer })),
      close: jest.fn(),
      resume: jest.fn().mockResolvedValue(undefined),
    };

    (global.AudioContext as jest.Mock).mockImplementation(() => mockAudioContext);
  });

  // Helper: create a simple base64 PCM chunk (4 bytes = 2 int16 samples)
  function makeBase64Pcm(): string {
    const int16 = new Int16Array([1000, -1000]);
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  it('starts with isPlaying false', () => {
    const { result } = renderHook(() => useAudioPlayback());
    expect(result.current.isPlaying).toBe(false);
  });

  it('sets isPlaying true when audio is enqueued', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    expect(result.current.isPlaying).toBe(true);
  });

  it('creates AudioContext at 24kHz', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    expect(global.AudioContext).toHaveBeenCalledWith({ sampleRate: 24000 });
  });

  it('creates an AudioBuffer from decoded data', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 2, 24000);
  });

  it('connects buffer source to destination', async () => {
    const { result } = renderHook(() => useAudioPlayback());
    const source = { ...mockBufferSource };
    mockAudioContext.createBufferSource.mockReturnValue(source);

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    expect(source.connect).toHaveBeenCalledWith(mockAudioContext.destination);
  });

  it('starts the buffer source', async () => {
    const { result } = renderHook(() => useAudioPlayback());
    const source = { ...mockBufferSource };
    mockAudioContext.createBufferSource.mockReturnValue(source);

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    expect(source.start).toHaveBeenCalled();
  });

  it('sets isPlaying false when source ends', async () => {
    const { result } = renderHook(() => useAudioPlayback());
    const source = { ...mockBufferSource };
    mockAudioContext.createBufferSource.mockReturnValue(source);

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      source.onended();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('clearQueue stops all active sources', async () => {
    const { result } = renderHook(() => useAudioPlayback());
    const sources: any[] = [];
    mockAudioContext.createBufferSource.mockImplementation(() => {
      const s = { ...mockBufferSource };
      sources.push(s);
      return s;
    });

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    act(() => {
      result.current.clearQueue();
    });

    for (const s of sources) {
      expect(s.stop).toHaveBeenCalled();
    }
    expect(result.current.isPlaying).toBe(false);
  });

  it('stopPlayback closes AudioContext', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    act(() => {
      result.current.stopPlayback();
    });

    expect(mockAudioContext.close).toHaveBeenCalled();
  });

  it('stopPlayback sets isPlaying false', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    act(() => {
      result.current.stopPlayback();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('creates new AudioContext if previous was closed', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    act(() => {
      result.current.stopPlayback();
    });

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    // Called twice: once for first enqueue, once for after stop
    expect(global.AudioContext).toHaveBeenCalledTimes(2);
  });

  it('queues audio sequentially (start times increase)', async () => {
    const { result } = renderHook(() => useAudioPlayback());
    const startTimes: number[] = [];

    mockAudioContext.createBufferSource.mockImplementation(() => {
      const s = {
        ...mockBufferSource,
        start: jest.fn((t: number) => startTimes.push(t)),
      };
      return s;
    });

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
      await result.current.enqueueAudio(makeBase64Pcm());
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    // Each chunk should start at or after the previous ends
    for (let i = 1; i < startTimes.length; i++) {
      expect(startTimes[i]).toBeGreaterThanOrEqual(startTimes[i - 1]);
    }
  });

  it('clearQueue is safe to call when no audio playing', () => {
    const { result } = renderHook(() => useAudioPlayback());

    act(() => {
      result.current.clearQueue();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('stopPlayback is safe to call when not initialized', () => {
    const { result } = renderHook(() => useAudioPlayback());

    act(() => {
      result.current.stopPlayback();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('handles stop errors gracefully on clearQueue', async () => {
    const { result } = renderHook(() => useAudioPlayback());
    mockAudioContext.createBufferSource.mockReturnValue({
      ...mockBufferSource,
      stop: jest.fn(() => {
        throw new Error('already stopped');
      }),
    });

    await act(async () => {
      await result.current.enqueueAudio(makeBase64Pcm());
    });

    // Should not throw
    act(() => {
      result.current.clearQueue();
    });

    expect(result.current.isPlaying).toBe(false);
  });
});
