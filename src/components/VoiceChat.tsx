'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useConversation } from '@/hooks/useConversation';
import MewtwoCharacter from './MewtwoCharacter';
import ChatBubble from './ChatBubble';
import { VoiceState } from '@/types/chat';

interface VoiceChatProps {
  isStoryMode?: boolean;
}

export default function VoiceChat({ isStoryMode = false }: VoiceChatProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [autoMode, setAutoMode] = useState(false);
  const { messages, isLoading, sendMessage, clearHistory } = useConversation();
  const speakRef = useRef<(text: string) => void>(() => {});

  const handleSpeechResult = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) return;

      setVoiceState('processing');

      // Send message and get response
      const response = await sendMessage(transcript, isStoryMode);

      // Speak the response
      if (response) {
        speakRef.current(response);
      }
    },
    [sendMessage, isStoryMode]
  );

  const speech = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: (error) => {
      console.error('Speech recognition error:', error);
      setVoiceState('idle');
    },
    continuous: autoMode,
  });

  const tts = useTextToSpeech({
    onStart: () => setVoiceState('speaking'),
    onEnd: () => {
      setVoiceState('idle');
      // Auto-listen again if in auto mode
      if (autoMode) {
        setTimeout(() => speech.startListening(), 1000);
      }
    },
    onError: (error) => {
      console.error('TTS error:', error);
      setVoiceState('idle');
    },
  });

  // Keep speakRef in sync so handleSpeechResult always uses latest tts.speak
  useEffect(() => { speakRef.current = tts.speak; }, [tts.speak]);

  useEffect(() => {
    if (speech.isListening) {
      setVoiceState('listening');
    } else if (!tts.isSpeaking && !isLoading) {
      setVoiceState('idle');
    }
  }, [speech.isListening, tts.isSpeaking, isLoading]);

  const handlePushToTalk = () => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      tts.stop(); // Stop any current speech
      speech.startListening();
    }
  };

  const handleToggleAutoMode = () => {
    if (autoMode) {
      setAutoMode(false);
      speech.stopListening();
      tts.stop();
    } else {
      setAutoMode(true);
      speech.startListening();
    }
  };

  const handleStopAll = () => {
    speech.abortListening();
    tts.stop();
    setVoiceState('idle');
    setAutoMode(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-purple-100 to-blue-100">
      {/* Header */}
      <header className="bg-mewtwo-purple text-white py-4 px-6 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold">Talk with Mewtwo</h1>
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-mewtwo-dark rounded-lg hover:bg-opacity-80 transition-all"
          >
            Clear History
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Character */}
        <MewtwoCharacter state={voiceState} />

        {/* Chat Messages */}
        <div className="pb-32">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8 px-4">
              <p className="text-lg">Press the microphone button to start talking with Mewtwo!</p>
            </div>
          ) : (
            messages.map((message) => <ChatBubble key={message.id} message={message} />)
          )}
          {isLoading && (
            <div className="flex justify-start mb-4 px-4">
              <div className="bg-mewtwo-light rounded-2xl px-4 py-3 rounded-bl-none">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-mewtwo-purple rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-mewtwo-purple rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-mewtwo-purple rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        {/* Live Transcript */}
        {speech.transcript && (
          <div className="mb-3 px-4 py-2 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">You're saying:</p>
            <p className="text-base font-medium text-gray-800">{speech.transcript}</p>
          </div>
        )}

        {/* Button Controls */}
        <div className="flex justify-center items-center space-x-4">
          {/* Push-to-Talk Button */}
          <button
            onClick={handlePushToTalk}
            disabled={!speech.isSupported || autoMode}
            className={`
              w-20 h-20 md:w-24 md:h-24 rounded-full
              flex items-center justify-center
              text-3xl md:text-4xl
              transition-all duration-200
              shadow-xl
              ${
                speech.isListening
                  ? 'bg-red-500 hover:bg-red-600 scale-110'
                  : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
              }
              ${!speech.isSupported || autoMode ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {speech.isListening ? '🛑' : '🎤'}
          </button>

          {/* Auto Mode Toggle */}
          <button
            onClick={handleToggleAutoMode}
            disabled={!speech.isSupported}
            className={`
              px-6 py-3 rounded-full font-semibold
              transition-all duration-200
              ${
                autoMode
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }
              ${!speech.isSupported ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {autoMode ? '🔄 Auto ON' : '🔄 Auto OFF'}
          </button>

          {/* Stop Button */}
          <button
            onClick={handleStopAll}
            className="px-6 py-3 rounded-full font-semibold bg-red-500 hover:bg-red-600 text-white transition-all"
          >
            ⏹️ Stop
          </button>
        </div>

        {/* Browser Support Warning */}
        {!speech.isSupported && (
          <div className="mt-3 text-center text-red-600 text-sm">
            ⚠️ Speech recognition is not supported in your browser
          </div>
        )}
      </div>
    </div>
  );
}
