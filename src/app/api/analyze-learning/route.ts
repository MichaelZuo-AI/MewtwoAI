import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ANALYSIS_MODEL = 'gemini-2.0-flash';
const MAX_TRANSCRIPT_SIZE = 200_000; // 200KB — matches client-side cap

const ANALYSIS_PROMPT = `You are an English learning analyst for a 5-year-old child named Damian. Analyze this conversation transcript and identify English learning progress.

The child is learning English (his family speaks Chinese at home). Focus on:
1. New English words the child used correctly for the first time (not in the known words list below)
2. Known words the child used again correctly (reviewing/reinforcing)
3. Words or phrases the child struggled with (mispronounced, used incorrectly, needed help)
4. Topics covered in the conversation (2-4 word labels like "animals", "colors", "counting")
5. Notable grammar observations (e.g. "used past tense correctly", "mixing up he/she")

KNOWN WORDS (words the child has used correctly before):
{knownWords}

TRANSCRIPT:
{transcript}

Return ONLY a JSON object with these fields:
{
  "newWords": ["word1", "word2"],
  "reviewedWords": ["word3"],
  "struggles": ["word4"],
  "topicsCovered": ["topic1", "topic2"],
  "grammarNotes": ["note1"]
}

Rules:
- Only include words Damian (the child/speaker) actually used, not words the AI character said
- Keep words lowercase and simple (single words preferred)
- If no items for a category, use an empty array
- Maximum 10 items per category
- Return ONLY the JSON object, no other text`;

export interface LearningAnalysisResult {
  newWords: string[];
  reviewedWords: string[];
  struggles: string[];
  topicsCovered: string[];
  grammarNotes: string[];
}

const EMPTY_RESULT: LearningAnalysisResult = {
  newWords: [],
  reviewedWords: [],
  struggles: [],
  topicsCovered: [],
  grammarNotes: [],
};

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
    const transcript = body.transcript;
    const existingVocabulary: string[] = Array.isArray(body.existingVocabulary) ? body.existingVocabulary : [];

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

    const knownWordsStr = existingVocabulary.length > 0
      ? existingVocabulary.join(', ')
      : '(none yet)';

    const prompt = ANALYSIS_PROMPT
      .replace('{knownWords}', knownWordsStr)
      .replace('{transcript}', transcript);

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: prompt,
    });

    const text = result.text?.trim() || '';
    if (!text) {
      return NextResponse.json(EMPTY_RESULT);
    }

    // Extract JSON object from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(EMPTY_RESULT);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed !== 'object' || parsed === null) {
      return NextResponse.json(EMPTY_RESULT);
    }

    const analysis: LearningAnalysisResult = {
      newWords: Array.isArray(parsed.newWords) ? parsed.newWords.filter((w: unknown) => typeof w === 'string').slice(0, 10) : [],
      reviewedWords: Array.isArray(parsed.reviewedWords) ? parsed.reviewedWords.filter((w: unknown) => typeof w === 'string').slice(0, 10) : [],
      struggles: Array.isArray(parsed.struggles) ? parsed.struggles.filter((w: unknown) => typeof w === 'string').slice(0, 10) : [],
      topicsCovered: Array.isArray(parsed.topicsCovered) ? parsed.topicsCovered.filter((w: unknown) => typeof w === 'string').slice(0, 10) : [],
      grammarNotes: Array.isArray(parsed.grammarNotes) ? parsed.grammarNotes.filter((w: unknown) => typeof w === 'string').slice(0, 10) : [],
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Failed to analyze learning:', error);
    return NextResponse.json(
      { error: 'Failed to analyze learning' },
      { status: 500 }
    );
  }
}
