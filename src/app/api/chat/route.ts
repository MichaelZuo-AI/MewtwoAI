import { NextRequest } from 'next/server';
import { createChatCompletion } from '@/lib/gemini';
import { getSystemPrompt } from '@/lib/mewtwo-prompts';

export async function POST(req: NextRequest) {
  try {
    const { messages, isStoryMode = false } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get system prompt
    const systemPrompt = getSystemPrompt(isStoryMode);

    // Create streaming response with Gemini
    const stream = await createChatCompletion(messages, systemPrompt);

    // Convert Gemini stream to Response stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.text();
            if (content) {
              const data = JSON.stringify({ choices: [{ delta: { content } }] });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
