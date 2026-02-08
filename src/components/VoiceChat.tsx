'use client';

import { useState } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useEffect } from 'react';
import MewtwoCharacter from './MewtwoCharacter';
import MicButton from './MicButton';
import ChatPeek from './ChatPeek';
import ChatDrawer from './ChatDrawer';
import SettingsMenu from './SettingsMenu';
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

  const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock();
  const [chatOpen, setChatOpen] = useState(false);

  const isConnected = connectionState === 'connected';
  const isReconnecting = connectionState === 'reconnecting';

  // Keep screen awake while connected
  useEffect(() => {
    if (isConnected || isReconnecting) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
  }, [isConnected, isReconnecting, requestWakeLock, releaseWakeLock]);

  const handleToggleConnection = () => {
    if (isConnected || isReconnecting) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gradient-to-b from-mewtwo-bg-deep to-mewtwo-bg-mid" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Top bar — icon-only */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1 z-10">
        <SettingsMenu onClearHistory={clearHistory} />
        <StoryTimeButton onToggle={switchStoryMode} isStoryMode={isStoryMode} />
      </div>

      {/* Hero zone — Mewtwo character takes ~60% of screen */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <MewtwoCharacter state={voiceState} connectionState={connectionState} />
      </div>

      {/* Error banner (subtle, no text wall) */}
      {error && (connectionState === 'error' || isReconnecting) && (
        <div className={`mx-6 mb-2 px-4 py-2 rounded-xl text-center text-sm ${
          isReconnecting ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
        }`}>
          {error}
        </div>
      )}

      {/* Chat peek — last message preview */}
      <div className="flex justify-center mb-3">
        <ChatPeek messages={messages} onOpen={() => setChatOpen(true)} />
      </div>

      {/* Mic button */}
      <div className="flex justify-center pb-4">
        <MicButton
          connectionState={connectionState}
          isSupported={isSupported}
          onToggle={handleToggleConnection}
        />
      </div>

      {/* Chat drawer */}
      <ChatDrawer
        messages={messages}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onClearHistory={clearHistory}
      />
    </div>
  );
}
