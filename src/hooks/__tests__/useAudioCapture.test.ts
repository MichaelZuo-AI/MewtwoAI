import { renderHook, act } from '@testing-library/react';
import { useAudioCapture } from '../useAudioCapture';

describe('useAudioCapture', () => {
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

    mockAudioContext = {
      sampleRate: 16000,
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

  it('starts with isCapturing false', () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );
    expect(result.current.isCapturing).toBe(false);
  });

  it('reports isSupported when getUserMedia is available', () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );
    expect(result.current.isSupported).toBe(true);
  });

  it('sets isCapturing true after startCapture', async () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    expect(result.current.isCapturing).toBe(true);
  });

  it('calls getUserMedia with audio constraints', async () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: expect.objectContaining({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }),
    });
  });

  it('creates AudioContext at native sample rate', async () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    // AudioContext is created without forcing sampleRate (uses native rate)
    expect(global.AudioContext).toHaveBeenCalledWith();
  });

  it('connects source to processor to destination', async () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    expect(mockSource.connect).toHaveBeenCalledWith(mockProcessor);
    expect(mockProcessor.connect).toHaveBeenCalledWith(mockAudioContext.destination);
  });

  it('sets onaudioprocess handler', async () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    expect(mockProcessor.onaudioprocess).toBeInstanceOf(Function);
  });

  it('calls onAudioData with base64 string when audio is processed', async () => {
    const onAudioData = jest.fn();
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    const mockEvent = {
      inputBuffer: {
        getChannelData: () => new Float32Array([0.5, -0.5, 0, 1.0]),
      },
    };

    act(() => {
      mockProcessor.onaudioprocess(mockEvent);
    });

    expect(onAudioData).toHaveBeenCalledTimes(1);
    expect(typeof onAudioData.mock.calls[0][0]).toBe('string');
  });

  it('sets isCapturing false after stopCapture', async () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    await act(async () => {
      await result.current.startCapture();
    });
    expect(result.current.isCapturing).toBe(true);

    act(() => {
      result.current.stopCapture();
    });
    expect(result.current.isCapturing).toBe(false);
  });

  it('disconnects processor on stopCapture', async () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    act(() => {
      result.current.stopCapture();
    });

    expect(mockProcessor.disconnect).toHaveBeenCalled();
  });

  it('closes AudioContext on stopCapture', async () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    act(() => {
      result.current.stopCapture();
    });

    expect(mockAudioContext.close).toHaveBeenCalled();
  });

  it('stops media stream tracks on stopCapture', async () => {
    const mockStop = jest.fn();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: mockStop }],
    });

    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    act(() => {
      result.current.stopCapture();
    });

    expect(mockStop).toHaveBeenCalled();
  });

  it('sets isSupported false when getUserMedia fails', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    await act(async () => {
      await expect(result.current.startCapture()).rejects.toThrow('Permission denied');
    });

    expect(result.current.isSupported).toBe(false);
  });

  it('stopCapture is safe to call when not capturing', () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData: jest.fn() })
    );

    act(() => {
      result.current.stopCapture();
    });

    expect(result.current.isCapturing).toBe(false);
  });

  it('produces valid base64 from audio data', async () => {
    const onAudioData = jest.fn();
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioData })
    );

    await act(async () => {
      await result.current.startCapture();
    });

    const mockEvent = {
      inputBuffer: {
        getChannelData: () => new Float32Array([0.1, 0.2]),
      },
    };

    act(() => {
      mockProcessor.onaudioprocess(mockEvent);
    });

    const base64 = onAudioData.mock.calls[0][0];
    // Should not throw when decoded
    expect(() => atob(base64)).not.toThrow();
  });
});
