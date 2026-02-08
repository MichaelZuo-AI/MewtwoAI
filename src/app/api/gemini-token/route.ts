import { GoogleGenAI, Modality } from '@google/genai';
import { NextResponse } from 'next/server';
import { getCharacter } from '@/lib/characters';

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not set. Add it to your .env.local file.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const characterId = body.characterId || 'mewtwo';
    const isStoryMode = body.isStoryMode === true;
    const isBedtime = body.isBedtime === true;
    const kstTimeString = typeof body.kstTimeString === 'string' ? body.kstTimeString : undefined;

    const character = getCharacter(characterId);
    if (!character) {
      return NextResponse.json(
        { error: `Unknown character: ${characterId}` },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: character.getSystemPrompt(isStoryMode, isBedtime, kstTimeString),
          },
        },
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });

    return NextResponse.json({ token: token.name });
  } catch (error) {
    console.error('Failed to create ephemeral token:', error);
    return NextResponse.json(
      { error: 'Failed to create ephemeral token' },
      { status: 500 }
    );
  }
}
