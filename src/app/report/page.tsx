'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-lg font-bold text-white mt-6 mb-2">{renderInline(line.slice(3))}</h2>;
    }
    if (line.startsWith('# ')) {
      return <h1 key={i} className="text-xl font-bold text-white mt-4 mb-3">{renderInline(line.slice(2))}</h1>;
    }
    if (line.startsWith('- ')) {
      return <li key={i} className="text-gray-300 ml-4 mb-1">{renderInline(line.slice(2))}</li>;
    }
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }
    return <p key={i} className="text-gray-300 mb-1">{renderInline(line)}</p>;
  });
}

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<string | null>(null);
  const [hasLearningData, setHasLearningData] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    const cached = storage.getParentReport();
    setReport(cached);
    const profile = storage.getLearningProfile();
    setHasLearningData(!!(profile && (profile.vocabulary.length > 0 || profile.sessions.length > 0)));
  }, []);

  const handleRegenerate = useCallback(async () => {
    const profile = storage.getLearningProfile();
    if (!profile || (profile.vocabulary.length === 0 && profile.sessions.length === 0)) {
      return;
    }

    setIsRegenerating(true);
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
        const { report: newReport } = await res.json();
        storage.saveParentReport(newReport);
        setReport(newReport);
      }
    } catch {
      // Keep existing report
    } finally {
      setIsRegenerating(false);
    }
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gray-950 text-white" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            aria-label="Back to home"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-sm">Back</span>
          </button>

          {hasLearningData && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {isRegenerating ? 'Generating...' : 'Regenerate'}
            </button>
          )}
        </div>

        {!report && !hasLearningData ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-2">
              还没有学习数据
            </p>
            <p className="text-gray-500 text-sm">
              和角色聊几次天后再来看报告吧！
            </p>
          </div>
        ) : !report ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Generating report...</p>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm">
            {renderMarkdown(report)}
          </div>
        )}
      </div>
    </div>
  );
}
