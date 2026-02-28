import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const VISION_MODEL = 'gemini-2.5-flash';

const CARD_PROMPT = `You are analyzing a Pokemon card photo taken by a 5-year-old child.

Describe what you see on the card concisely:
1. Pokemon NAME
2. Pokemon TYPE(s)
3. HP number if visible
4. One or two MOVE names if visible
5. Any other notable detail (evolution stage, weakness, etc.)

Keep your response to 2-3 short sentences. Be factual and specific.
If the image is blurry, partially visible, or not a Pokemon card, say "UNCLEAR" and describe what you can see.

Example good response: "This is Charizard, a Fire and Flying type Pokemon with 180 HP. It has the moves Flamethrower and Fire Spin. It is a Stage 2 evolution."`;

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
    const imageBase64 = body.imageBase64;
    const mimeType = body.mimeType || 'image/jpeg';

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'imageBase64 is required' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: CARD_PROMPT },
        ],
      }],
    });

    const description = result.text?.trim() || '';
    if (!description) {
      return NextResponse.json(
        { error: 'Failed to analyze card' },
        { status: 500 }
      );
    }

    return NextResponse.json({ description });
  } catch (error) {
    console.error('Card recognition failed:', error);
    return NextResponse.json(
      { error: 'Card recognition failed' },
      { status: 500 }
    );
  }
}
