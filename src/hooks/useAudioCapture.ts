'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/** Gemini Live expects PCM 16-bit mono at 16 kHz. */
const TARGET_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

/** Downsample Float32 audio from source rate to target rate. */
function downsample(input: Float32Array, srcRate: number, destRate: number): Float32Array {
  if (srcRate === destRate) return input;
  const ratio = srcRate / destRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    output[i] = input[Math.floor(i * ratio)];
  }
  return output;
}

function float32ToInt16Base64(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface UseAudioCaptureOptions {
  onAudioData: (base64Pcm: string) => void;
}

export function useAudioCapture({ onAudioData }: UseAudioCaptureOptions) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(!!navigator.mediaDevices?.getUserMedia);
  }, []);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isStartingRef = useRef(false);
  const onAudioDataRef = useRef(onAudioData);
  onAudioDataRef.current = onAudioData;

  const startCapture = useCallback(async () => {
    // Guard against concurrent startCapture() calls
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    let stream: MediaStream | undefined;
    let audioContext: AudioContext | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Use the native sample rate — don't force 16kHz (Safari produces silence if forced)
      audioContext = new AudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const nativeSampleRate = audioContext.sampleRate;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        // Downsample from native rate to 16kHz, then encode
        const resampled = downsample(inputData, nativeSampleRate, TARGET_SAMPLE_RATE);
        const base64 = float32ToInt16Base64(resampled);
        onAudioDataRef.current(base64);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      streamRef.current = stream;
      processorRef.current = processor;
      setIsCapturing(true);
    } catch (error) {
      // Clean up resources that were created before the error
      if (audioContext) {
        audioContext.close().catch(() => {});
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      console.error('Failed to start audio capture:', error);
      setIsSupported(false);
      throw error;
    } finally {
      isStartingRef.current = false;
    }
  }, []);

  const stopCapture = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  return { isCapturing, isSupported, startCapture, stopCapture };
}
