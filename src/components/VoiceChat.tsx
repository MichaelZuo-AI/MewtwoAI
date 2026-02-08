'use client';

import { useEffect, useRef } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import MewtwoCharacter from './MewtwoCharacter';
import ChatBubble from './ChatBubble';
import StoryTimeButton from './StoryTimeButton';

export default function VoiceChat() {
  const {
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
  } = useGeminiLive();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  const handleToggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
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
              <p className="text-lg">
                {isConnected
                  ? 'Start talking! Mewtwo is listening...'
                  : 'Press the connect button to start talking with Mewtwo!'}
              </p>
            </div>
          ) : (
            messages.map((message) => <ChatBubble key={message.id} message={message} />)
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        {/* Connection Status */}
        {connectionState === 'error' && error && (
          <div className="mb-3 px-4 py-2 bg-red-50 rounded-lg text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Voice State Indicator */}
        {isConnected && (
          <div className="mb-3 text-center">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                voiceState === 'listening'
                  ? 'bg-green-100 text-green-700'
                  : voiceState === 'speaking'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {voiceState === 'listening'
                ? 'Listening...'
                : voiceState === 'speaking'
                  ? 'Mewtwo is speaking...'
                  : 'Connected'}
            </span>
          </div>
        )}

        {/* Button Controls */}
        <div className="flex justify-center items-center space-x-4">
          {/* Connect / Disconnect Button */}
          <button
            onClick={handleToggleConnection}
            disabled={!isSupported || isConnecting}
            className={`
              w-20 h-20 md:w-24 md:h-24 rounded-full
              flex items-center justify-center
              text-3xl md:text-4xl
              transition-all duration-200
              shadow-xl
              ${
                isConnecting
                  ? 'bg-yellow-500 animate-pulse'
                  : isConnected
                    ? 'bg-red-500 hover:bg-red-600 scale-110'
                    : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
              }
              ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isConnecting ? '...' : isConnected ? '🛑' : '🎤'}
          </button>
        </div>

        {/* Browser Support Warning */}
        {!isSupported && (
          <div className="mt-3 text-center text-red-600 text-sm">
            Microphone is not supported in your browser. Try Chrome or Safari.
          </div>
        )}
      </div>

      {/* Story Time Button */}
      <StoryTimeButton onToggle={switchStoryMode} isStoryMode={isStoryMode} />
    </div>
  );
}
