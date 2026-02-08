'use client';

import { Message } from '@/types/chat';

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
      <div
        className={`
          max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3
          ${
            isUser
              ? 'bg-purple-500/30 text-white rounded-br-none'
              : 'bg-white/15 text-white/90 rounded-bl-none'
          }
        `}
      >
        <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <p
          className={`
            text-xs mt-2
            ${isUser ? 'text-white/40' : 'text-white/30'}
          `}
        >
          {timestamp}
        </p>
      </div>
    </div>
  );
}
