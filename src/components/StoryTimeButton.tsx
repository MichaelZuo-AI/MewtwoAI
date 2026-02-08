'use client';

import { BookIcon } from './Icons';

interface StoryTimeButtonProps {
  onToggle: (isStoryMode: boolean) => void;
  isStoryMode: boolean;
}

export default function StoryTimeButton({ onToggle, isStoryMode }: StoryTimeButtonProps) {
  return (
    <button
      onClick={() => onToggle(!isStoryMode)}
      aria-label={isStoryMode ? 'Exit story mode' : 'Start story mode'}
      className={`
        w-12 h-12 rounded-full
        flex items-center justify-center
        transition-all duration-300
        transform active:scale-90
        ${
          isStoryMode
            ? 'bg-yellow-500/30 text-yellow-300 shadow-[0_0_16px_4px_rgba(234,179,8,0.3)]'
            : 'bg-white/10 text-white/70 hover:bg-white/20'
        }
      `}
    >
      <BookIcon className="w-6 h-6" />
    </button>
  );
}
