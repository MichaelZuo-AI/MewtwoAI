'use client';

import { useState } from 'react';
import VoiceChat from '@/components/VoiceChat';
import StoryTimeButton from '@/components/StoryTimeButton';

export default function Home() {
  const [isStoryMode, setIsStoryMode] = useState(false);

  return (
    <main>
      <VoiceChat isStoryMode={isStoryMode} />
      <StoryTimeButton onToggle={setIsStoryMode} isStoryMode={isStoryMode} />
    </main>
  );
}
