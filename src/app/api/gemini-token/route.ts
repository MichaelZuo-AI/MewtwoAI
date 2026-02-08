import { GoogleGenAI, Modality } from '@google/genai';
import { NextResponse } from 'next/server';
import { getSystemPrompt } from '@/lib/mewtwo-prompts';

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not set. Add it to your .env.local file.' },
      { status: 500 }
    );
  }

  try {
    // Read story mode flag from request body
    const body = await request.json().catch(() => ({}));
    const isStoryMode = body.isStoryMode === true;

    const ai = new GoogleGenAI({ apiKey });
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: getSystemPrompt(isStoryMode),
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
