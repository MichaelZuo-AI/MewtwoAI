import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const EXTRACTION_MODEL = 'gemini-2.0-flash';

const EXTRACTION_PROMPT = `You are a memory extraction assistant. Analyze the conversation transcript below and extract facts about the SPEAKERS (the humans), NOT about the characters they are talking to.

Extract facts like:
- Names, ages, family relationships ("Damian is 5 years old", "Dad's name is Michael")
- Preferences and favorites ("Damian's favorite color is blue", "Damian loves skiing")
- Experiences and achievements ("Damian went skiing in Hokkaido", "Damian learned the word 'brave'")
- Interests and hobbies ("Damian likes Pikachu", "Damian is learning to swim")
- Emotions and personality ("Damian was excited about his birthday")
- Any other personal details shared by the speakers

Rules:
- Extract facts about the HUMAN speakers only, not the AI character
- Keep each fact as a single short sentence
- If a new fact contradicts an existing fact, keep only the new one (e.g. if existing says "favorite color is blue" but transcript says "favorite color is red", keep only "red")
- Merge duplicates — don't repeat the same fact
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
