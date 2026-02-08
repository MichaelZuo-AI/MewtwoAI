'use client';

import { Message } from '@/types/chat';
import { ChevronUpIcon } from './Icons';

interface ChatPeekProps {
  messages: Message[];
  onOpen: () => void;
  characterName?: string;
}

export default function ChatPeek({ messages, onOpen, characterName = 'Mewtwo' }: ChatPeekProps) {
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage) return null;

  const prefix = lastMessage.role === 'user' ? 'You: ' : `${characterName}: `;

  return (
    <button
      onClick={onOpen}
      aria-label="Open chat history"
      className="
        w-full mx-4 max-w-md
        flex items-center gap-3
        px-4 py-3 rounded-2xl
        bg-white/10 backdrop-blur-sm
        text-white/80 text-sm
        transition-all active:bg-white/15
      "
    >
      <span className="flex-1 truncate text-left">
        {prefix}{lastMessage.content}
      </span>
      <ChevronUpIcon className="w-5 h-5 text-white/50 flex-shrink-0" />
    </button>
  );
}
