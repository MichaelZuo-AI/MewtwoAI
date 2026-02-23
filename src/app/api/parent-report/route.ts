import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const REPORT_MODEL = 'gemini-2.0-flash';
const MAX_VOCABULARY_ITEMS = 500;
const MAX_SESSION_ITEMS = 50;

const REPORT_PROMPT = `You are an educational analyst writing a brief progress report for a parent about their child's English learning. The child (Damian, 5 years old) practices English by talking with AI characters.

Write the report in **Simplified Chinese** (the parent reads Chinese). Keep it warm, encouraging, and under 300 words.

Include these sections:
## 📚 词汇进展
- Total words encountered, breakdown by mastery level (new/learning/reviewing/mastered)
- Recent growth highlights

## 🗣️ 最近会话
- Summarize the last few sessions (which character, what was learned)

## 💪 强项
- What Damian does well (based on mastered words, correct uses, etc.)

## 💡 建议
- 2-3 actionable next steps for parents to support learning

VOCABULARY DATA:
{vocabulary}

SESSION HISTORY:
{sessions}

KNOWN FACTS ABOUT DAMIAN:
{facts}

Write the report now (Simplified Chinese, markdown format):`;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not set' },
      { status: 500 }
    );
  }

  if (request.headers.get('X-App-Source') !== 'ai-dream-buddies') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const vocabulary = Array.isArray(body.vocabulary) ? body.vocabulary.slice(0, MAX_VOCABULARY_ITEMS) : [];
    const sessions = Array.isArray(body.sessions) ? body.sessions.slice(0, MAX_SESSION_ITEMS) : [];
    const facts = Array.isArray(body.facts) ? body.facts.slice(0, 50) : [];

    if (vocabulary.length === 0 && sessions.length === 0) {
      return NextResponse.json(
        { error: 'No learning data available' },
        { status: 400 }
      );
    }

    const vocabSummary = vocabulary.map((v: { word: string; status: string; correctUses: number; struggles: number }) =>
      `${v.word} (${v.status}, ${v.correctUses} correct, ${v.struggles} struggles)`
    ).join('\n');

    const sessionSummary = sessions.slice(-5).map((s: { date: string; characterId: string; newWords: string[]; reviewedWords: string[]; struggles: string[]; topicsCovered: string[] }) =>
      `${s.date} with ${s.characterId}: new=[${s.newWords.join(',')}] reviewed=[${s.reviewedWords.join(',')}] struggles=[${s.struggles.join(',')}] topics=[${s.topicsCovered.join(',')}]`
    ).join('\n');

    const factsSummary = facts.length > 0 ? facts.join('\n') : '(none)';

    const prompt = REPORT_PROMPT
      .replace('{vocabulary}', vocabSummary || '(no vocabulary data yet)')
      .replace('{sessions}', sessionSummary || '(no sessions yet)')
      .replace('{facts}', factsSummary);

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: REPORT_MODEL,
      contents: prompt,
    });

    const report = result.text?.trim() || '';
    if (!report) {
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Failed to generate parent report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
