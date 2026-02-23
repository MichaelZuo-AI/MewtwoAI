'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';

export default function ParentReportButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    const profile = storage.getLearningProfile();

    if (!profile || (profile.vocabulary.length === 0 && profile.sessions.length === 0)) {
      // No data — go to report page which shows empty state
      router.push('/report');
      return;
    }

    setIsLoading(true);
    try {
      const facts = storage.getCharacterFacts();
      const res = await fetch('/api/parent-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Source': 'ai-dream-buddies',
        },
        body: JSON.stringify({
          vocabulary: profile.vocabulary,
          sessions: profile.sessions,
          facts,
        }),
      });

      if (res.ok) {
        const { report } = await res.json();
        storage.saveParentReport(report);
      }
    } catch {
      // Will show cached report or empty state
    } finally {
      setIsLoading(false);
      router.push('/report');
    }
  }, [router]);

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-10 h-10 rounded-full bg-gray-800/60 flex items-center justify-center transition-opacity hover:bg-gray-700/60"
      aria-label="Learning report"
    >
      {isLoading ? (
        <svg className="w-5 h-5 text-gray-300 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M7 16l4-8 4 4 4-6" />
        </svg>
      )}
    </button>
  );
}
