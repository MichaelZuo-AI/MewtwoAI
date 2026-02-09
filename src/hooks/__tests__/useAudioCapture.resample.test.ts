import { renderHook, act } from '@testing-library/react';
import { useAudioCapture } from '../useAudioCapture';

describe('useAudioCapture — resampling path', () => {
  let mockGetUserMedia: jest.Mock;
  let mockAudioContext: any;
  let mockProcessor: any;
  let mockSource: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProcessor = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      onaudioprocess: null,
    };

    mockSource = {
      connect: jest.fn(),
    };

    // Simulate a 48kHz native sample rate (typical browser AudioContext)
    mockAudioContext = {
      sampleRate: 48000,
      currentTime: 0,
      state: 'running',
      destination: {},
      createScriptProcessor: jest.fn(() => mockProcessor),
      createMediaStreamSource: jest.fn(() => mockSource),
      close: jest.fn(),
    };

    (global.AudioContext as jest.Mock).mockImplementation(() => mockAudioContext);

    mockGetUserMedia = navigator.mediaDevices.getUserMedia as jest.Mock;
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
  });

  it('downsamples from 48kHz to 16kHz', async () => {
    const onAudioData = jest.fn();
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    // 48000/16000 = 3 ratio, so 12 samples at 48kHz become 4 samples at 16kHz
    const input = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.5, 0.0]);
    const mockEvent = {
      inputBuffer: {
        getChannelData: () => input,
      },
    };

    act(() => {
      mockProcessor.onaudioprocess(mockEvent);
    });

    expect(onAudioData).toHaveBeenCalledTimes(1);

    // Verify the output is valid base64 and shorter than it would be without resampling
    const base64 = onAudioData.mock.calls[0][0];
    expect(() => atob(base64)).not.toThrow();

    // 4 int16 samples = 8 bytes -> base64 is ceil(8/3)*4 = 12 chars
    // Without resampling: 12 int16 samples = 24 bytes -> 32 chars
    expect(base64.length).toBeLessThan(32);
  });

  it('passes through unchanged when sampleRate is already 16kHz', async () => {
    mockAudioContext.sampleRate = 16000;

    const onAudioData = jest.fn();
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    const input = new Float32Array([0.5, -0.5, 0.0, 1.0]);
    const mockEvent = {
      inputBuffer: {
        getChannelData: () => input,
      },
    };

    act(() => {
      mockProcessor.onaudioprocess(mockEvent);
    });

    const base64 = onAudioData.mock.calls[0][0];
    // 4 int16 samples = 8 bytes -> 12 base64 chars
    expect(base64.length).toBe(12);
  });

  it('handles suspended audio context by calling resume', async () => {
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it('cleans up on startCapture failure after stream acquired', async () => {
    const mockStop = jest.fn();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: mockStop }],
    });

    // Fail when creating AudioContext
    (global.AudioContext as jest.Mock).mockImplementation(() => {
      throw new Error('AudioContext failed');
    });

    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    let caughtError: Error | undefined;
    try {
      await act(async () => {
        await result.current.startCapture();
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError?.message).toBe('AudioContext failed');
    // Stream tracks should have been stopped in cleanup
    expect(mockStop).toHaveBeenCalled();
  });

  it('guards against concurrent startCapture calls', async () => {
    // Make getUserMedia slow
    let resolveMedia: (value: any) => void;
    mockGetUserMedia.mockImplementation(() => new Promise((resolve) => {
      resolveMedia = resolve;
    }));

    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    // Start two concurrent captures
    const first = act(async () => {
      await result.current.startCapture();
    });

    // Second call should be a no-op due to isStartingRef guard
    await act(async () => {
      await result.current.startCapture();
    });

    // Resolve the first
    resolveMedia!({
      getTracks: () => [{ stop: jest.fn() }],
    });

    await first;

    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
  });
});
