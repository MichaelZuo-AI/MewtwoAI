'use client';

import { useState } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useEffect } from 'react';
import { CharacterConfig } from '@/types/character';
import CharacterDisplay from './CharacterDisplay';
import MicButton from './MicButton';
import ChatPeek from './ChatPeek';
import ChatDrawer from './ChatDrawer';
import SettingsMenu from './SettingsMenu';
import StoryTimeButton from './StoryTimeButton';
import { ArrowLeftIcon } from './Icons';

interface VoiceChatProps {
  character: CharacterConfig;
  onBack: () => void;
}

export default function VoiceChat({ character, onBack }: VoiceChatProps) {
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
  } = useGeminiLive(character);

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
    <div className="flex flex-col h-[100dvh]" style={{ background: `linear-gradient(to bottom, ${character.theme.bgDeep}, ${character.theme.bgMid})`, paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Top bar — icon-only */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            aria-label="Back to character select"
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <SettingsMenu onClearHistory={clearHistory} bgColor={character.theme.bgMid} />
        </div>
        <StoryTimeButton onToggle={switchStoryMode} isStoryMode={isStoryMode} />
      </div>

      {/* Hero zone — character takes ~60% of screen */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <CharacterDisplay character={character} state={voiceState} connectionState={connectionState} />
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
        <ChatPeek messages={messages} onOpen={() => setChatOpen(true)} characterName={character.name} />
      </div>

      {/* Mic button */}
      <div className="flex justify-center pb-4">
        <MicButton
          connectionState={connectionState}
          isSupported={isSupported}
          onToggle={handleToggleConnection}
          micGradient={character.theme.micGradient}
        />
      </div>

      {/* Chat drawer */}
      <ChatDrawer
        messages={messages}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onClearHistory={clearHistory}
        bgColor={character.theme.bgDeep}
      />
    </div>
  );
}
