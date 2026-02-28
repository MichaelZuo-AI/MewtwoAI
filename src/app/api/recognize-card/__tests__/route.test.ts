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
  return new Request('http://localhost/api/recognize-card', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Source': 'ai-dream-buddies',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('/api/recognize-card', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 403 when X-App-Source header is missing', async () => {
    const req = new Request('http://localhost/api/recognize-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'abc' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when X-App-Source header is wrong', async () => {
    const req = new Request('http://localhost/api/recognize-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Source': 'wrong' },
      body: JSON.stringify({ imageBase64: 'abc' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 500 when GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await POST(makeRequest({ imageBase64: 'abc' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('GEMINI_API_KEY');
  });

  it('returns 400 when imageBase64 is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('imageBase64');
  });

  it('returns 400 when imageBase64 is not a string', async () => {
    const res = await POST(makeRequest({ imageBase64: 123 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when imageBase64 is empty string', async () => {
    const res = await POST(makeRequest({ imageBase64: '' }));
    expect(res.status).toBe(400);
  });

  it('returns description on successful recognition', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'This is Pikachu, an Electric type Pokemon with 60 HP. It has the move Thunderbolt.',
    });
    const res = await POST(makeRequest({
      imageBase64: 'base64imagedata',
      mimeType: 'image/jpeg',
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.description).toBe('This is Pikachu, an Electric type Pokemon with 60 HP. It has the move Thunderbolt.');
  });

  it('passes image as inlineData to generateContent', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'Charizard, Fire type.',
    });
    await POST(makeRequest({
      imageBase64: 'test-base64-data',
      mimeType: 'image/png',
    }));

    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.model).toBe('gemini-2.5-flash');
    expect(callArg.contents[0].parts[0]).toEqual({
      inlineData: { data: 'test-base64-data', mimeType: 'image/png' },
    });
    expect(callArg.contents[0].parts[1].text).toContain('Pokemon card');
  });

  it('defaults mimeType to image/jpeg when not provided', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'Mewtwo, Psychic type.',
    });
    await POST(makeRequest({ imageBase64: 'data' }));

    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents[0].parts[0].inlineData.mimeType).toBe('image/jpeg');
  });

  it('returns 500 when Gemini API fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API error'));
    const res = await POST(makeRequest({ imageBase64: 'data' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Card recognition failed');
  });

  it('returns 500 when Gemini returns empty text', async () => {
    mockGenerateContent.mockResolvedValue({ text: '' });
    const res = await POST(makeRequest({ imageBase64: 'data' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to analyze card');
  });

  it('returns 500 when Gemini returns null text', async () => {
    mockGenerateContent.mockResolvedValue({ text: null });
    const res = await POST(makeRequest({ imageBase64: 'data' }));
    expect(res.status).toBe(500);
  });

  it('handles malformed request body gracefully', async () => {
    const req = new Request('http://localhost/api/recognize-card', {
      method: 'POST',
      headers: { 'X-App-Source': 'ai-dream-buddies' },
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('trims whitespace from description', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '  Snorlax, Normal type with 150 HP.  \n',
    });
    const res = await POST(makeRequest({ imageBase64: 'data' }));
    const body = await res.json();
    expect(body.description).toBe('Snorlax, Normal type with 150 HP.');
  });

  it('uses gemini-2.0-flash model', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Pikachu' });
    await POST(makeRequest({ imageBase64: 'data' }));
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.model).toBe('gemini-2.5-flash');
  });
});
