/**
 * @jest-environment node
 */

import { POST } from '../route';

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request('http://localhost/api/extract-memories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/extract-memories', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 500 when GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await POST(makeRequest({ transcript: 'hello' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('GEMINI_API_KEY');
  });

  it('returns 400 when transcript is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('transcript');
  });

  it('returns 400 when transcript is empty string', async () => {
    const res = await POST(makeRequest({ transcript: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when transcript is not a string', async () => {
    const res = await POST(makeRequest({ transcript: 123 }));
    expect(res.status).toBe(400);
  });

  it('returns extracted facts on success', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '["Damian loves skiing", "Favorite color is blue"]',
    });
    const res = await POST(makeRequest({
      transcript: 'Speaker: I love skiing!\nMewtwo: That is amazing!',
      existingFacts: [],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.facts).toEqual(['Damian loves skiing', 'Favorite color is blue']);
  });

  it('passes existing facts to the prompt', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '["Damian loves skiing", "Dad is Michael"]',
    });
    await POST(makeRequest({
      transcript: 'Speaker: Hello',
      existingFacts: ['Damian loves skiing'],
    }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents).toContain('Damian loves skiing');
  });

  it('handles markdown code block in response', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '```json\n["Damian is 5 years old"]\n```',
    });
    const res = await POST(makeRequest({
      transcript: 'Speaker: I am 5!',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.facts).toEqual(['Damian is 5 years old']);
  });

  it('returns existing facts when response has no JSON array', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'No facts found',
    });
    const res = await POST(makeRequest({
      transcript: 'Speaker: ...',
      existingFacts: ['existing fact'],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.facts).toEqual(['existing fact']);
  });

  it('caps facts at 50', async () => {
    const manyFacts = Array.from({ length: 60 }, (_, i) => `Fact ${i}`);
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(manyFacts),
    });
    const res = await POST(makeRequest({
      transcript: 'Speaker: lots of stuff',
    }));
    const body = await res.json();
    expect(body.facts).toHaveLength(50);
  });

  it('filters out non-string entries', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '["valid fact", 123, null, "another fact"]',
    });
    const res = await POST(makeRequest({
      transcript: 'Speaker: hello',
    }));
    const body = await res.json();
    expect(body.facts).toEqual(['valid fact', 'another fact']);
  });

  it('returns 500 when Gemini API fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API error'));
    const res = await POST(makeRequest({
      transcript: 'Speaker: hello',
    }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to extract memories');
  });

  it('handles malformed request body gracefully', async () => {
    const req = new Request('http://localhost/api/extract-memories', {
      method: 'POST',
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('defaults existingFacts to empty array when not provided', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '["Damian said hello"]',
    });
    await POST(makeRequest({
      transcript: 'Speaker: hello',
    }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents).toContain('(none yet)');
  });

  it('uses gemini-2.0-flash model', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '["fact"]',
    });
    await POST(makeRequest({
      transcript: 'Speaker: hello',
    }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.model).toBe('gemini-2.0-flash');
  });

  it('handles empty text response', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '',
    });
    const res = await POST(makeRequest({
      transcript: 'Speaker: hello',
      existingFacts: ['old fact'],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    // Empty text defaults to '[]' which parses to empty array
    expect(body.facts).toEqual([]);
  });
});
