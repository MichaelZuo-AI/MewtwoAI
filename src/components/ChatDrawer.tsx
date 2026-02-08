'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import ChatBubble from './ChatBubble';
import { CloseIcon } from './Icons';

interface ChatDrawerProps {
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  bgColor?: string;
}

export default function ChatDrawer({ messages, isOpen, onClose, onClearHistory, bgColor }: ChatDrawerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div className="relative h-[70dvh] backdrop-blur-lg rounded-t-3xl animate-slide-up flex flex-col" style={bgColor ? { background: `${bgColor}f2` } : undefined}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <button
            onClick={onClearHistory}
            aria-label="Clear chat history"
            className="text-white/40 text-sm hover:text-white/70 transition-colors"
          >
            Clear
          </button>

          <button
            onClick={onClose}
            aria-label="Close chat"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/30 text-sm">No messages yet</p>
            </div>
          ) : (
            messages.map((message) => <ChatBubble key={message.id} message={message} />)
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
