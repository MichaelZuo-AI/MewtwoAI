'use client';

import { useState, useRef, useEffect } from 'react';
import { GearIcon } from './Icons';

interface SettingsMenuProps {
  onClearHistory: () => void;
  bgColor?: string;
}

export default function SettingsMenu({ onClearHistory, bgColor }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Settings"
        className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
      >
        <GearIcon className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 backdrop-blur-lg rounded-xl shadow-2xl border border-white/10 py-2 min-w-[160px] z-50" style={bgColor ? { background: `${bgColor}f2` } : undefined}>
          <button
            onClick={() => {
              onClearHistory();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-white/80 text-sm hover:bg-white/10 transition-colors"
          >
            Clear History
          </button>
        </div>
      )}
    </div>
  );
}
