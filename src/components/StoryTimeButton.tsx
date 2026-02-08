'use client';

interface StoryTimeButtonProps {
  onToggle: (isStoryMode: boolean) => void;
  isStoryMode: boolean;
}

export default function StoryTimeButton({ onToggle, isStoryMode }: StoryTimeButtonProps) {
  return (
    <button
      onClick={() => onToggle(!isStoryMode)}
      className={`
        fixed top-20 right-4 md:top-24 md:right-6
        px-6 py-3 rounded-full
        font-bold text-lg
        shadow-lg
        transition-all duration-300
        transform hover:scale-105 active:scale-95
        ${
          isStoryMode
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
            : 'bg-gradient-to-r from-purple-400 to-pink-500 text-white'
        }
      `}
    >
      {isStoryMode ? '📖 Story Mode ON' : '📖 Story Time'}
    </button>
  );
}
