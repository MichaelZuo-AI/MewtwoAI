import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set. Add it to your .env.local file. ' +
        'Get a key at https://aistudio.google.com/app/apikey'
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: string;
}

export const createChatCompletion = async (
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
) => {
  const client = getClient();

  // Use Gemini 1.5 Flash (fastest, free, great for conversations)
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
  });

  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const lastMessage = messages[messages.length - 1]?.content || '';

  // Start chat with history
  const chat = model.startChat({
    history,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
    },
  });

  // Stream the response
  const result = await chat.sendMessageStream(lastMessage);
  return result.stream;
};
