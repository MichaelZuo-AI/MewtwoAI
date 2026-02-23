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
  return new Request('http://localhost/api/parent-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Source': 'ai-dream-buddies',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const validSession = {
  date: '2026-01-01',
  characterId: 'mewtwo',
  newWords: ['cat'],
  reviewedWords: [],
  struggles: [],
  topicsCovered: ['animals'],
};

describe('/api/parent-report', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 403 when X-App-Source header is missing', async () => {
    const req = new Request('http://localhost/api/parent-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vocabulary: [{ word: 'cat' }], sessions: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 500 when GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await POST(makeRequest({ vocabulary: [{ word: 'cat' }], sessions: [validSession] }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('GEMINI_API_KEY');
  });

  it('returns 400 when no learning data provided', async () => {
    const res = await POST(makeRequest({ vocabulary: [], sessions: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No learning data');
  });

  it('returns generated report on success', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '## 📚 词汇进展\n很棒！Damian 学了5个新单词。',
    });
    const res = await POST(makeRequest({
      vocabulary: [
        { word: 'cat', status: 'mastered', correctUses: 5, struggles: 0 },
      ],
      sessions: [{
        date: '2026-01-01',
        characterId: 'mewtwo',
        newWords: ['cat'],
        reviewedWords: [],
        struggles: [],
        topicsCovered: ['animals'],
      }],
      facts: ['Damian loves skiing'],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report).toContain('词汇进展');
  });

  it('handles empty facts gracefully', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '## Report content',
    });
    const res = await POST(makeRequest({
      vocabulary: [{ word: 'cat', status: 'new', correctUses: 1, struggles: 0 }],
      sessions: [{ date: '2026-01-01', characterId: 'mewtwo', newWords: ['cat'], reviewedWords: [], struggles: [], topicsCovered: [] }],
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report).toBeTruthy();
  });

  it('returns 500 when Gemini API fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API error'));
    const res = await POST(makeRequest({
      vocabulary: [{ word: 'cat', status: 'new', correctUses: 1, struggles: 0 }],
      sessions: [validSession],
    }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to generate report');
  });

  it('returns 500 when response text is empty', async () => {
    mockGenerateContent.mockResolvedValue({ text: '' });
    const res = await POST(makeRequest({
      vocabulary: [{ word: 'cat', status: 'new', correctUses: 1, struggles: 0 }],
      sessions: [validSession],
    }));
    expect(res.status).toBe(500);
  });

  it('uses gemini-2.0-flash model', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Report' });
    await POST(makeRequest({
      vocabulary: [{ word: 'cat', status: 'new', correctUses: 1, struggles: 0 }],
      sessions: [validSession],
    }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.model).toBe('gemini-2.0-flash');
  });

  it('handles malformed request body gracefully', async () => {
    const req = new Request('http://localhost/api/parent-report', {
      method: 'POST',
      headers: { 'X-App-Source': 'ai-dream-buddies' },
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('defaults vocabulary and sessions to empty arrays', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Report content' });
    // Only vocabulary provided, sessions defaults to []
    const res = await POST(makeRequest({ vocabulary: [{ word: 'cat', status: 'new', correctUses: 1, struggles: 0 }] }));
    // vocabulary.length > 0 so it passes the check
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report).toBe('Report content');
  });

  it('includes facts in the prompt when provided', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Report' });
    await POST(makeRequest({
      vocabulary: [{ word: 'cat', status: 'new', correctUses: 1, struggles: 0 }],
      sessions: [validSession],
      facts: ['Damian loves skiing'],
    }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents).toContain('Damian loves skiing');
  });

  it('includes vocabulary summary in correct format', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Report' });
    await POST(makeRequest({
      vocabulary: [{ word: 'cat', status: 'mastered', correctUses: 5, struggles: 1 }],
      sessions: [validSession],
    }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents).toContain('cat (mastered, 5 correct, 1 struggles)');
  });

  it('uses "(none)" for facts placeholder when facts array is empty', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Report' });
    await POST(makeRequest({
      vocabulary: [{ word: 'cat', status: 'new', correctUses: 1, struggles: 0 }],
      sessions: [validSession],
      facts: [],
    }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents).toContain('(none)');
  });

  it('only includes the last 5 sessions in the prompt', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Report' });
    const manySessions = Array.from({ length: 8 }, (_, i) => ({
      date: `2026-01-0${i + 1}`,
      characterId: 'mewtwo',
      newWords: [`word${i}`],
      reviewedWords: [],
      struggles: [],
      topicsCovered: [],
    }));
    await POST(makeRequest({
      vocabulary: [{ word: 'cat', status: 'new', correctUses: 1, struggles: 0 }],
      sessions: manySessions,
    }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    // Session index 0 (date 2026-01-01) should NOT appear, session index 3+ should appear
    expect(callArg.contents).not.toContain('2026-01-01');
    expect(callArg.contents).toContain('2026-01-08');
  });

  it('accepts request with only sessions and no vocabulary', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Report content' });
    const res = await POST(makeRequest({ sessions: [validSession] }));
    // sessions.length > 0 passes the check
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report).toBe('Report content');
  });

  it('defaults facts to empty array when not provided in request body', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Report' });
    await POST(makeRequest({
      vocabulary: [{ word: 'cat', status: 'new', correctUses: 1, struggles: 0 }],
      sessions: [validSession],
      // no facts key
    }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents).toContain('(none)');
  });

  it('uses "(no vocabulary data yet)" placeholder when vocabulary array is empty', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Report' });
    await POST(makeRequest({
      sessions: [validSession],
      vocabulary: [],
    }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents).toContain('(no vocabulary data yet)');
  });
});
