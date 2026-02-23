import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const EXTRACTION_MODEL = 'gemini-2.0-flash';
const MAX_TRANSCRIPT_SIZE = 200_000; // 200KB — matches client-side cap

const EXTRACTION_PROMPT = `You are a memory extraction assistant. Analyze the conversation transcript below and extract facts about the SPEAKERS (the humans), NOT about the characters they are talking to.

Use category prefixes to organize facts:
- [FAMILY] Names, ages, family relationships ("Damian is 5 years old", "Dad's name is Michael")
- [LIKES] Preferences and favorites ("Damian's favorite color is blue", "Damian loves skiing")
- [CAN-DO] Skills and abilities ("Damian can count to 20", "Damian knows the word 'brave'")
- [EXPERIENCE] Experiences and events ("Damian went skiing in Hokkaido")
- [LEARNING] English words clearly learned or practiced ("Damian learned the word 'brave'", "Damian practiced counting animals")
- [PERSONALITY] Emotions and personality traits ("Damian is shy at first but warms up")

Rules:
- Extract facts about the HUMAN speakers only, not the AI character
- Keep each fact as a single short sentence, prefixed with a category tag
- Merge similar facts into one (e.g. "likes blue" + "favorite color is blue" → one fact: "[LIKES] Damian's favorite color is blue")
- If an existing fact is contradicted by the transcript, REPLACE it with the new version
- If the transcript confirms an existing fact, keep it unchanged
- Existing facts without category prefixes are valid — keep them as-is or add a prefix when updating
- For words Damian clearly learned or used correctly, add a [LEARNING] fact
- Maximum 50 facts total
- Return ONLY a JSON array of strings, no other text

EXISTING FACTS:
{existingFacts}

TRANSCRIPT:
{transcript}

Return ONLY the updated JSON array of fact strings:`;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not set' },
      { status: 500 }
    );
  }

  // I3 fix: reject requests without internal app header
  if (request.headers.get('X-App-Source') !== 'ai-dream-buddies') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const transcript = body.transcript;
    const existingFacts: string[] = Array.isArray(body.existingFacts) ? body.existingFacts : [];

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'transcript is required' },
        { status: 400 }
      );
    }

    if (transcript.length > MAX_TRANSCRIPT_SIZE) {
      return NextResponse.json(
        { error: 'Transcript too large' },
        { status: 413 }
      );
    }

    const existingFactsStr = existingFacts.length > 0
      ? existingFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')
      : '(none yet)';

    const prompt = EXTRACTION_PROMPT
      .replace('{existingFacts}', existingFactsStr)
      .replace('{transcript}', transcript);

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: EXTRACTION_MODEL,
      contents: prompt,
    });

    const text = result.text?.trim() || '';
    // I5 fix: empty/missing response preserves existing facts
    if (!text) {
      return NextResponse.json({ facts: existingFacts });
    }
    // Extract JSON array from response (handle markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ facts: existingFacts });
    }

    const facts: string[] = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(facts)) {
      return NextResponse.json({ facts: existingFacts });
    }

    // Cap at 50 and ensure all entries are strings
    const cleanFacts = facts.filter(f => typeof f === 'string').slice(0, 50);

    return NextResponse.json({ facts: cleanFacts });
  } catch (error) {
    console.error('Failed to extract memories:', error);
    return NextResponse.json(
      { error: 'Failed to extract memories' },
      { status: 500 }
    );
  }
}
