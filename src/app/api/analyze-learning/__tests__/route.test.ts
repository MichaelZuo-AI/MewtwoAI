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

function makeRequest(body: Record<string, unknown> = {}, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/analyze-learning', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Source': 'ai-dream-buddies',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('/api/analyze-learning', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 403 when X-App-Source header is missing', async () => {
    const req = new Request('http://localhost/api/analyze-learning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: 'hello' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
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
  });

  it('returns 400 when transcript is empty', async () => {
    const res = await POST(makeRequest({ transcript: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when transcript is not a string', async () => {
    const res = await POST(makeRequest({ transcript: 123 }));
    expect(res.status).toBe(400);
  });

  it('returns analysis result on success', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        newWords: ['brave'],
        reviewedWords: ['cat'],
        struggles: ['elephant'],
        topicsCovered: ['animals'],
        grammarNotes: ['used "I" correctly'],
      }),
    });
    const res = await POST(makeRequest({
      transcript: 'Speaker: I saw a brave cat!',
      existingVocabulary: ['cat'],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.newWords).toEqual(['brave']);
    expect(body.reviewedWords).toEqual(['cat']);
    expect(body.struggles).toEqual(['elephant']);
    expect(body.topicsCovered).toEqual(['animals']);
    expect(body.grammarNotes).toEqual(['used "I" correctly']);
  });

  it('handles markdown code block in response', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '```json\n{"newWords":["dog"],"reviewedWords":[],"struggles":[],"topicsCovered":["pets"],"grammarNotes":[]}\n```',
    });
    const res = await POST(makeRequest({ transcript: 'Speaker: I like dog!' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.newWords).toEqual(['dog']);
  });

  it('returns empty result on empty response', async () => {
    mockGenerateContent.mockResolvedValue({ text: '' });
    const res = await POST(makeRequest({ transcript: 'Speaker: hello' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.newWords).toEqual([]);
    expect(body.reviewedWords).toEqual([]);
    expect(body.struggles).toEqual([]);
    expect(body.topicsCovered).toEqual([]);
    expect(body.grammarNotes).toEqual([]);
  });

  it('returns empty result when response has no JSON', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'No data found' });
    const res = await POST(makeRequest({ transcript: 'Speaker: ...' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.newWords).toEqual([]);
  });

  it('caps each field at 10 items', async () => {
    const manyWords = Array.from({ length: 15 }, (_, i) => `word${i}`);
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        newWords: manyWords,
        reviewedWords: manyWords,
        struggles: manyWords,
        topicsCovered: manyWords,
        grammarNotes: manyWords,
      }),
    });
    const res = await POST(makeRequest({ transcript: 'Speaker: lots of words' }));
    const body = await res.json();
    expect(body.newWords).toHaveLength(10);
    expect(body.reviewedWords).toHaveLength(10);
    expect(body.struggles).toHaveLength(10);
    expect(body.topicsCovered).toHaveLength(10);
    expect(body.grammarNotes).toHaveLength(10);
  });

  it('filters out non-string entries', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        newWords: ['valid', 123, null, 'also-valid'],
        reviewedWords: [],
        struggles: [],
        topicsCovered: [],
        grammarNotes: [],
      }),
    });
    const res = await POST(makeRequest({ transcript: 'Speaker: hello' }));
    const body = await res.json();
    expect(body.newWords).toEqual(['valid', 'also-valid']);
  });

  it('returns 500 when Gemini API fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API error'));
    const res = await POST(makeRequest({ transcript: 'Speaker: hello' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to analyze learning');
  });

  it('handles malformed request body gracefully', async () => {
    const req = new Request('http://localhost/api/analyze-learning', {
      method: 'POST',
      headers: { 'X-App-Source': 'ai-dream-buddies' },
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('passes existing vocabulary to prompt', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '{"newWords":[],"reviewedWords":[],"struggles":[],"topicsCovered":[],"grammarNotes":[]}',
    });
    await POST(makeRequest({
      transcript: 'Speaker: hello',
      existingVocabulary: ['cat', 'dog'],
    }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents).toContain('cat, dog');
  });

  it('defaults existingVocabulary to empty when not provided', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '{"newWords":[],"reviewedWords":[],"struggles":[],"topicsCovered":[],"grammarNotes":[]}',
    });
    await POST(makeRequest({ transcript: 'Speaker: hello' }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents).toContain('(none yet)');
  });

  it('uses gemini-2.0-flash model', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '{"newWords":[],"reviewedWords":[],"struggles":[],"topicsCovered":[],"grammarNotes":[]}',
    });
    await POST(makeRequest({ transcript: 'Speaker: hello' }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.model).toBe('gemini-2.0-flash');
  });

  it('handles missing fields in parsed JSON gracefully', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '{"newWords":["test"]}', // missing other fields
    });
    const res = await POST(makeRequest({ transcript: 'Speaker: hello' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.newWords).toEqual(['test']);
    expect(body.reviewedWords).toEqual([]);
    expect(body.struggles).toEqual([]);
  });

  it('returns 400 when transcript is only whitespace', async () => {
    const res = await POST(makeRequest({ transcript: '   ' }));
    expect(res.status).toBe(400);
  });

  it('returns empty result when parsed JSON is null', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'null' });
    const res = await POST(makeRequest({ transcript: 'Speaker: hello' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.newWords).toEqual([]);
    expect(body.reviewedWords).toEqual([]);
  });

  it('defaults existingVocabulary to empty when it is not an array', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '{"newWords":[],"reviewedWords":[],"struggles":[],"topicsCovered":[],"grammarNotes":[]}',
    });
    await POST(makeRequest({ transcript: 'Speaker: hello', existingVocabulary: 'not-an-array' }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents).toContain('(none yet)');
  });

  it('returns 403 when X-App-Source header is wrong value', async () => {
    const req = new Request('http://localhost/api/analyze-learning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Source': 'wrong' },
      body: JSON.stringify({ transcript: 'hello' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('handles non-array fields in parsed JSON (treats them as empty)', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '{"newWords":"not-an-array","reviewedWords":[],"struggles":[],"topicsCovered":[],"grammarNotes":[]}',
    });
    const res = await POST(makeRequest({ transcript: 'Speaker: hello' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.newWords).toEqual([]);
  });
});
