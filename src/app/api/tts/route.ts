import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured', useFallback: true }),
        {
          status: 501,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Call ElevenLabs API
    // Using a deep male voice - you'll need to create/select a voice ID from ElevenLabs
    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - deep voice (you can customize this)

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return new Response(JSON.stringify({ error: 'Text-to-speech failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
