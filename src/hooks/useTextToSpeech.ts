'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTextToSpeechOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export const useTextToSpeech = ({ onStart, onEnd, onError }: UseTextToSpeechOptions = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);
  const onErrorRef = useRef(onError);

  // Keep refs in sync with latest callbacks
  useEffect(() => { onStartRef.current = onStart; }, [onStart]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speakWithBrowserTTS = useCallback((text: string, onDone: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onErrorRef.current?.('Browser TTS not supported');
      isProcessingRef.current = false;
      onDone();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8;

    utterance.onstart = () => {
      setIsSpeaking(true);
      onStartRef.current?.();
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      onEndRef.current?.();
      isProcessingRef.current = false;
      onDone();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onErrorRef.current?.('Browser TTS failed');
      isProcessingRef.current = false;
      onDone();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const text = audioQueueRef.current.shift()!;

    try {
      setIsLoading(true);

      // Call the TTS API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      // Fall back to browser TTS if API unavailable
      if (!response.ok) {
        setIsLoading(false);
        speakWithBrowserTTS(text, () => processQueue());
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play the audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener('play', () => {
        setIsLoading(false);
        setIsSpeaking(true);
        onStartRef.current?.();
      });

      audio.addEventListener('ended', () => {
        setIsSpeaking(false);
        onEndRef.current?.();
        URL.revokeObjectURL(audioUrl);
        isProcessingRef.current = false;
        // Process next item in queue
        processQueue();
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        setIsLoading(false);
        onErrorRef.current?.('Audio playback failed');
        isProcessingRef.current = false;
        processQueue();
      });

      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsLoading(false);
      // Fall back to browser TTS on any error
      speakWithBrowserTTS(text, () => processQueue());
    }
  }, [speakWithBrowserTTS]);

  const speak = useCallback(
    (text: string) => {
      audioQueueRef.current.push(text);
      processQueue();
    },
    [processQueue]
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis?.cancel();
    audioQueueRef.current = [];
    setIsSpeaking(false);
    setIsLoading(false);
    isProcessingRef.current = false;
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsSpeaking(true);
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isLoading,
  };
};
