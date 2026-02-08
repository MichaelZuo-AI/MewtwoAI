'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, Session } from '@google/genai';
import type { LiveServerMessage } from '@google/genai';
import { useAudioCapture } from './useAudioCapture';
import { useAudioPlayback } from './useAudioPlayback';
import { getSystemPrompt } from '@/lib/mewtwo-prompts';
import { storage } from '@/lib/storage';
import { Message, VoiceState, LiveConnectionState } from '@/types/chat';

const MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

export function useGeminiLive() {
  const [connectionState, setConnectionState] = useState<LiveConnectionState>('disconnected');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);

  // Load persisted messages after hydration
  useEffect(() => {
    const conv = storage.getCurrentConversation();
    if (conv?.messages?.length) {
      setMessages(conv.messages);
    }
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [isStoryMode, setIsStoryMode] = useState(false);

  const sessionRef = useRef<Session | null>(null);
  const userTranscriptRef = useRef('');
  const assistantTranscriptRef = useRef('');
  const isStoryModeRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    isStoryModeRef.current = isStoryMode;
  }, [isStoryMode]);

  const { isPlaying, enqueueAudio, clearQueue, stopPlayback } = useAudioPlayback();

  const handleAudioData = useCallback((base64Pcm: string) => {
    if (sessionRef.current) {
      sessionRef.current.sendRealtimeInput({
        audio: {
          data: base64Pcm,
          mimeType: 'audio/pcm;rate=16000',
        },
      });
    }
  }, []);

  const { isCapturing, isSupported, startCapture, stopCapture } = useAudioCapture({
    onAudioData: handleAudioData,
  });

  // Derive voiceState from connection + capture + playback state
  useEffect(() => {
    if (connectionState !== 'connected') {
      setVoiceState('idle');
    } else if (isPlaying) {
      setVoiceState('speaking');
    } else if (isCapturing) {
      setVoiceState('listening');
    } else {
      setVoiceState('idle');
    }
  }, [connectionState, isPlaying, isCapturing]);

  const flushUserTranscript = useCallback(() => {
    const text = userTranscriptRef.current.trim();
    if (text) {
      const msg = storage.addMessage({
        role: 'user',
        content: text,
        timestamp: Date.now(),
      });
      setMessages((prev) => [...prev, msg]);
      userTranscriptRef.current = '';
    }
  }, []);

  const flushAssistantTranscript = useCallback(() => {
    const text = assistantTranscriptRef.current.trim();
    if (text) {
      const msg = storage.addMessage({
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
      });
      setMessages((prev) => [...prev, msg]);
      assistantTranscriptRef.current = '';
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setConnectionState('connecting');

    try {
      // 1. Get ephemeral token from our server (include system instruction server-side)
      const res = await fetch('/api/gemini-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStoryMode: isStoryModeRef.current }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to get token');
      }
      const { token } = await res.json();

      // 2. Connect to Gemini Live via SDK using ephemeral token
      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: 'v1alpha' },
      });

      const session = await ai.live.connect({
        model: MODEL,
        callbacks: {
          onopen: () => {
            setConnectionState('connected');
          },
          onmessage: (msg: LiveServerMessage) => {
            const sc = msg.serverContent;
            if (!sc) return;

            // Audio data from model
            if (sc.modelTurn?.parts) {
              for (const part of sc.modelTurn.parts) {
                if (part.inlineData?.data) {
                  enqueueAudio(part.inlineData.data);
                }
              }
            }

            // Input transcription (what user said)
            if (sc.inputTranscription?.text) {
              userTranscriptRef.current += sc.inputTranscription.text;
            }

            // Output transcription (what Mewtwo said)
            if (sc.outputTranscription?.text) {
              assistantTranscriptRef.current += sc.outputTranscription.text;
            }

            // Interrupted — clear audio queue
            if (sc.interrupted) {
              clearQueue();
              // Flush partial assistant transcript
              flushAssistantTranscript();
            }

            // Turn complete — flush transcripts to storage
            if (sc.turnComplete) {
              flushUserTranscript();
              flushAssistantTranscript();
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live API error:', e);
            setError('Connection error occurred');
            setConnectionState('error');
          },
          onclose: () => {
            setConnectionState('disconnected');
            sessionRef.current = null;
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
          systemInstruction: getSystemPrompt(isStoryModeRef.current),
          realtimeInputConfig: {
            automaticActivityDetection: {
              silenceDurationMs: 2000,
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });

      sessionRef.current = session;

      // Start capturing microphone
      await startCapture();
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionState('error');
    }
  }, [
    startCapture,
    enqueueAudio,
    clearQueue,
    flushUserTranscript,
    flushAssistantTranscript,
  ]);

  const disconnect = useCallback(() => {
    // Flush any pending transcripts
    flushUserTranscript();
    flushAssistantTranscript();

    stopCapture();
    stopPlayback();

    if (sessionRef.current) {
      sessionRef.current.conn.close();
      sessionRef.current = null;
    }
    setConnectionState('disconnected');
  }, [stopCapture, stopPlayback, flushUserTranscript, flushAssistantTranscript]);

  const clearHistory = useCallback(() => {
    storage.clearAll();
    setMessages([]);
  }, []);

  const switchStoryMode = useCallback(
    (storyMode: boolean) => {
      setIsStoryMode(storyMode);
      // Reconnect with new system instruction if currently connected
      if (connectionState === 'connected') {
        disconnect();
        // Small delay to let the disconnect complete
        setTimeout(() => {
          isStoryModeRef.current = storyMode;
          connect();
        }, 500);
      }
    },
    [connectionState, disconnect, connect]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
      stopPlayback();
      if (sessionRef.current) {
        sessionRef.current.conn.close();
        sessionRef.current = null;
      }
    };
  }, [stopCapture, stopPlayback]);

  return {
    voiceState,
    connectionState,
    messages,
    error,
    isSupported,
    isStoryMode,
    connect,
    disconnect,
    clearHistory,
    switchStoryMode,
  };
}
