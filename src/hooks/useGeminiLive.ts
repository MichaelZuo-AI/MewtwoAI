'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, Session, ActivityHandling } from '@google/genai';
import type { LiveServerMessage } from '@google/genai';
import { useAudioCapture } from './useAudioCapture';
import { useAudioPlayback } from './useAudioPlayback';
import { storage } from '@/lib/storage';
import { Message, VoiceState, LiveConnectionState } from '@/types/chat';
import { CharacterConfig } from '@/types/character';

const MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const MAX_RECONNECT_ATTEMPTS = 3;

export function useGeminiLive(character: CharacterConfig) {
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

  // Keep messages accessible from event handlers (beforeunload, visibilitychange)
  const messagesRef = useRef<Message[]>([]);

  // Auto-reconnect refs
  const isManualDisconnectRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const connectRef = useRef<(isReconnect?: boolean) => Promise<void>>();

  // C2 fix: guard against concurrent connect() calls
  const isConnectingRef = useRef(false);

  // Story mode auto-continue: track how many continuations we've sent
  const storyContinuationCountRef = useRef(0);
  const MAX_STORY_CONTINUATIONS = 10;

  // C1 fix: track switchStoryMode timeout
  const storyModeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Track turn count for periodic transcript checkpoints
  const turnCountRef = useRef(0);

  // Keep refs in sync
  useEffect(() => {
    isStoryModeRef.current = isStoryMode;
  }, [isStoryMode]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Helper: build transcript string from current messages + unflushed text
  const buildCurrentTranscript = useCallback(() => {
    const allMessages = [...messagesRef.current];
    const pu = userTranscriptRef.current.trim();
    if (pu) allMessages.push({ id: 'tmp', role: 'user', content: pu, timestamp: Date.now() });
    const pa = assistantTranscriptRef.current.trim();
    if (pa) allMessages.push({ id: 'tmp', role: 'assistant', content: pa, timestamp: Date.now() });
    if (allMessages.length === 0) return null;
    return allMessages.map(m =>
      `${m.role === 'user' ? 'Speaker' : character.name}: ${m.content}`
    ).join('\n');
  }, [character.name]);

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

  const connect = useCallback(async (isReconnect = false) => {
    // C2 fix: prevent concurrent connect calls
    if (isConnectingRef.current) return;

    // Skip if user manually disconnected during reconnect delay
    if (isReconnect && isManualDisconnectRef.current) return;

    isConnectingRef.current = true;

    if (!isReconnect) {
      isManualDisconnectRef.current = false;
      reconnectAttemptsRef.current = 0;
      storyContinuationCountRef.current = 0;
    }
    setError(null);
    setConnectionState(isReconnect ? 'reconnecting' : 'connecting');

    try {
      // Recover any orphaned session transcript (from crash/force-kill)
      const orphanedTranscript = storage.getSessionTranscript();
      if (orphanedTranscript) {
        storage.setPendingExtraction(orphanedTranscript);
        storage.clearSessionTranscript();
      }

      // Extract pending facts from previous session (lazy extraction)
      const pendingTranscript = storage.getPendingExtraction();
      if (pendingTranscript) {
        try {
          const existingFacts = storage.getCharacterFacts();
          const extractRes = await fetch('/api/extract-memories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: pendingTranscript, existingFacts }),
          });
          if (extractRes.ok) {
            const { facts } = await extractRes.json();
            if (Array.isArray(facts)) {
              storage.saveCharacterFacts(facts);
            }
            storage.clearPendingExtraction();
          }
        } catch {
          // Extraction failed — pending transcript stays for next attempt
        }
      }

      // Compute bedtime in Korean time (KST, UTC+9) — 8:30 PM to 7:30 AM
      const kstParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }).formatToParts(new Date());
      const hour = parseInt(kstParts.find(p => p.type === 'hour')!.value, 10);
      const minutes = parseInt(kstParts.find(p => p.type === 'minute')!.value, 10);
      const isBedtime = hour > 20 || (hour === 20 && minutes >= 30) || hour < 7 || (hour === 7 && minutes < 30);
      const kstTimeString = `${hour}:${String(minutes).padStart(2, '0')}`;

      // Load accumulated facts about Damian and family
      const characterFacts = storage.getCharacterFacts();
      let factsContext = '';
      if (characterFacts.length > 0) {
        factsContext = `\n\nTHINGS YOU REMEMBER ABOUT DAMIAN AND HIS FAMILY (use these naturally in conversation — don't list them, just know them):\n${characterFacts.map(f => `- ${f}`).join('\n')}`;
      }

      // 1. Get ephemeral token from our server
      // Load conversation memory: prefer current session (pause/resume), fall back to localStorage (app restart)
      const currentSessionMessages = messagesRef.current;
      const previousMemory = currentSessionMessages.length > 0
        ? currentSessionMessages
        : storage.getCharacterMemory(character.id);
      let memoryContext = '';
      if (previousMemory.length > 0) {
        const lines = previousMemory.slice(-10).map(m =>
          `${m.role === 'user' ? 'Speaker' : character.name}: ${m.content}`
        ).join('\n');
        memoryContext = `\n\nPREVIOUS CONVERSATION (remember who was speaking and what was discussed — use voice pitch to identify the same speaker):\n${lines}`;
      }

      const res = await fetch('/api/gemini-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id, isStoryMode: isStoryModeRef.current, isBedtime, kstTimeString }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to get token');
      }
      const { token } = await res.json();

      // Bail out if user disconnected while fetching token
      if (isManualDisconnectRef.current) {
        isConnectingRef.current = false;
        return;
      }

      // 2. Connect to Gemini Live via SDK using ephemeral token
      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: 'v1alpha' },
      });

      const session = await ai.live.connect({
        model: MODEL,
        callbacks: {
          onopen: () => {
            // S5 fix: guard against onopen firing after manual disconnect
            if (isManualDisconnectRef.current) return;
            setConnectionState('connected');
            setError(null);
            reconnectAttemptsRef.current = 0;
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
              // Capture transcript before flushing (flush clears the ref)
              const lastAssistantText = assistantTranscriptRef.current.trim();

              flushUserTranscript();
              flushAssistantTranscript();

              // Periodic checkpoint: save session transcript every 5 turns (crash safety net)
              turnCountRef.current++;
              if (turnCountRef.current % 5 === 0) {
                const transcript = buildCurrentTranscript();
                if (transcript) {
                  storage.setSessionTranscript(transcript);
                }
              }

              // Story mode auto-continue: the model hits its turn length limit
              // mid-story, so we send a continuation prompt to keep it going
              if (
                isStoryModeRef.current &&
                sessionRef.current &&
                storyContinuationCountRef.current < MAX_STORY_CONTINUATIONS
              ) {
                // Stop continuing if the story seems finished
                const seemsDone = /the end|goodnight|sweet dreams|sleep well|close your eyes/i.test(lastAssistantText);
                if (!seemsDone) {
                  storyContinuationCountRef.current++;
                  try {
                    sessionRef.current.sendClientContent({
                      turns: [
                        {
                          role: 'user',
                          parts: [{ text: 'Keep going, tell me what happens next!' }],
                        },
                      ],
                      turnComplete: true,
                    });
                  } catch {
                    // Session closed between check and send — ignore
                  }
                }
              }
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live API error:', e);
            // onclose will fire next and handle reconnection
          },
          onclose: () => {
            sessionRef.current = null;
            stopCapture();

            // I1 fix: clear stale audio from old session
            clearQueue();

            // Save session transcript checkpoint before flushing (for unexpected drops)
            if (!isManualDisconnectRef.current) {
              const transcript = buildCurrentTranscript();
              if (transcript) {
                storage.setSessionTranscript(transcript);
              }
            }

            // I2 fix: flush pending transcripts before reconnecting
            flushUserTranscript();
            flushAssistantTranscript();

            // Auto-reconnect on unexpected disconnect
            if (!isManualDisconnectRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
              setConnectionState('reconnecting');
              setError('Connection lost — reconnecting...');
              const delay = 1000 * Math.pow(2, reconnectAttemptsRef.current);
              reconnectAttemptsRef.current++;
              reconnectTimeoutRef.current = setTimeout(() => {
                connectRef.current?.(true);
              }, delay);
            } else if (isManualDisconnectRef.current) {
              setConnectionState('disconnected');
            } else {
              setConnectionState('error');
              setError('Connection lost. Please try again.');
              reconnectAttemptsRef.current = 0;
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: character.voice },
            },
          },
          systemInstruction: character.getSystemPrompt(isStoryModeRef.current, isBedtime, kstTimeString) + factsContext + memoryContext,
          realtimeInputConfig: {
            activityHandling: isStoryModeRef.current ? ActivityHandling.NO_INTERRUPTION : ActivityHandling.START_OF_ACTIVITY_INTERRUPTS,
            automaticActivityDetection: {
              silenceDurationMs: isStoryModeRef.current ? 5000 : 2000,
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

      // I3 fix: retry on reconnect failures instead of giving up immediately
      if (isReconnect && !isManualDisconnectRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        setConnectionState('reconnecting');
        setError('Connection failed — retrying...');
        const delay = 1000 * Math.pow(2, reconnectAttemptsRef.current);
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current?.(true);
        }, delay);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to connect');
        setConnectionState('error');
        reconnectAttemptsRef.current = 0;
      }
    } finally {
      isConnectingRef.current = false;
    }
  }, [
    character,
    startCapture,
    stopCapture,
    enqueueAudio,
    clearQueue,
    flushUserTranscript,
    flushAssistantTranscript,
    buildCurrentTranscript,
  ]);

  // Keep connect ref in sync for reconnection callbacks
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    // Mark as intentional to prevent auto-reconnect
    isManualDisconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    // C1 fix: cancel any pending story mode reconnect
    if (storyModeTimeoutRef.current) {
      clearTimeout(storyModeTimeoutRef.current);
      storyModeTimeoutRef.current = undefined;
    }

    // Flush any pending transcripts
    flushUserTranscript();
    flushAssistantTranscript();

    // Save conversation memory synchronously using ref + any unflushed text
    // (can't rely on setMessages callback — React batches it, may not execute yet)
    const memoryToSave = [...messagesRef.current];
    const pendingUser = userTranscriptRef.current.trim();
    if (pendingUser) {
      memoryToSave.push({ id: `pending-u-${Date.now()}`, role: 'user', content: pendingUser, timestamp: Date.now() });
    }
    const pendingAssistant = assistantTranscriptRef.current.trim();
    if (pendingAssistant) {
      memoryToSave.push({ id: `pending-a-${Date.now()}`, role: 'assistant', content: pendingAssistant, timestamp: Date.now() });
    }
    if (memoryToSave.length > 0) {
      storage.saveCharacterMemory(character.id, memoryToSave);
      // Save transcript for lazy fact extraction on next connect
      const transcript = memoryToSave.map(m =>
        `${m.role === 'user' ? 'Speaker' : character.name}: ${m.content}`
      ).join('\n');
      storage.setPendingExtraction(transcript);
    }

    // Clear session checkpoint — full transcript is now in pending-extraction
    storage.clearSessionTranscript();
    turnCountRef.current = 0;

    stopCapture();
    stopPlayback();

    if (sessionRef.current) {
      sessionRef.current.conn.close();
      sessionRef.current = null;
    }
    setConnectionState('disconnected');
    setError(null);
  }, [character.id, stopCapture, stopPlayback, flushUserTranscript, flushAssistantTranscript]);

  const clearHistory = useCallback(() => {
    storage.clearAll();
    setMessages([]);
  }, []);

  // C1 fix: use ref-tracked timeout, handle reconnecting state, guard against double-tap
  const switchStoryMode = useCallback(
    (storyMode: boolean) => {
      setIsStoryMode(storyMode);
      // Sync ref immediately so any reconnect uses the correct value
      isStoryModeRef.current = storyMode;

      // Clear any pending story mode switch
      if (storyModeTimeoutRef.current) {
        clearTimeout(storyModeTimeoutRef.current);
        storyModeTimeoutRef.current = undefined;
      }

      // Reconnect with new system instruction if currently connected or reconnecting
      if (connectionState === 'connected' || connectionState === 'reconnecting') {
        disconnect();
        // Small delay to let the disconnect complete
        storyModeTimeoutRef.current = setTimeout(() => {
          connect();
        }, 500);
      }
    },
    [connectionState, disconnect, connect]
  );

  // Save memory when app is backgrounded or closed
  useEffect(() => {
    const saveMemory = () => {
      const memoryToSave = [...messagesRef.current];
      const pendingUser = userTranscriptRef.current.trim();
      if (pendingUser) {
        memoryToSave.push({ id: `pending-u-${Date.now()}`, role: 'user', content: pendingUser, timestamp: Date.now() });
      }
      const pendingAssistant = assistantTranscriptRef.current.trim();
      if (pendingAssistant) {
        memoryToSave.push({ id: `pending-a-${Date.now()}`, role: 'assistant', content: pendingAssistant, timestamp: Date.now() });
      }
      if (memoryToSave.length > 0) {
        storage.saveCharacterMemory(character.id, memoryToSave);
        // Save transcript for lazy fact extraction on next connect
        const transcript = memoryToSave.map(m =>
          `${m.role === 'user' ? 'Speaker' : character.name}: ${m.content}`
        ).join('\n');
        storage.setPendingExtraction(transcript);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveMemory();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', saveMemory);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', saveMemory);
    };
  }, [character.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Save memory before unmount (include any unflushed transcripts)
      const memoryToSave = [...messagesRef.current];
      const pu = userTranscriptRef.current.trim();
      if (pu) memoryToSave.push({ id: `pending-u-${Date.now()}`, role: 'user', content: pu, timestamp: Date.now() });
      const pa = assistantTranscriptRef.current.trim();
      if (pa) memoryToSave.push({ id: `pending-a-${Date.now()}`, role: 'assistant', content: pa, timestamp: Date.now() });
      if (memoryToSave.length > 0) {
        storage.saveCharacterMemory(character.id, memoryToSave);
        // Save transcript for lazy fact extraction on next connect
        const transcript = memoryToSave.map(m =>
          `${m.role === 'user' ? 'Speaker' : character.name}: ${m.content}`
        ).join('\n');
        storage.setPendingExtraction(transcript);
      }

      isManualDisconnectRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (storyModeTimeoutRef.current) {
        clearTimeout(storyModeTimeoutRef.current);
      }
      stopCapture();
      stopPlayback();
      if (sessionRef.current) {
        sessionRef.current.conn.close();
        sessionRef.current = null;
      }
    };
  }, [character.id, stopCapture, stopPlayback]);

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
