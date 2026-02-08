/**
 * @jest-environment node
 */

import { POST } from '../route';
import { MEWTWO_SYSTEM_PROMPT, STORY_TIME_PROMPT } from '@/lib/mewtwo-prompts';

const mockCreate = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    authTokens: { create: mockCreate },
  })),
}));

function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request('http://localhost/api/gemini-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/gemini-token', () => {
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
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('GEMINI_API_KEY');
  });

  it('returns a token on success', async () => {
    mockCreate.mockResolvedValue({ name: 'ephemeral-token-123' });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe('ephemeral-token-123');
  });

  it('calls authTokens.create with correct config including systemInstruction', async () => {
    mockCreate.mockResolvedValue({ name: 'tok' });
    await POST(makeRequest());
    expect(mockCreate).toHaveBeenCalledWith({
      config: expect.objectContaining({
        uses: 1,
        liveConnectConstraints: {
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: ['AUDIO'],
            systemInstruction: MEWTWO_SYSTEM_PROMPT,
          },
        },
        httpOptions: { apiVersion: 'v1alpha' },
      }),
    });
  });

  it('includes story prompt when isStoryMode is true', async () => {
    mockCreate.mockResolvedValue({ name: 'tok' });
    await POST(makeRequest({ isStoryMode: true }));
    const callArg = mockCreate.mock.calls[0][0];
    const sysInstruction = callArg.config.liveConnectConstraints.config.systemInstruction;
    expect(sysInstruction).toContain(MEWTWO_SYSTEM_PROMPT);
    expect(sysInstruction).toContain(STORY_TIME_PROMPT);
  });

  it('uses normal prompt when isStoryMode is false', async () => {
    mockCreate.mockResolvedValue({ name: 'tok' });
    await POST(makeRequest({ isStoryMode: false }));
    const callArg = mockCreate.mock.calls[0][0];
    const sysInstruction = callArg.config.liveConnectConstraints.config.systemInstruction;
    expect(sysInstruction).toBe(MEWTWO_SYSTEM_PROMPT);
  });

  it('defaults to normal prompt when body has no isStoryMode', async () => {
    mockCreate.mockResolvedValue({ name: 'tok' });
    await POST(makeRequest({}));
    const callArg = mockCreate.mock.calls[0][0];
    const sysInstruction = callArg.config.liveConnectConstraints.config.systemInstruction;
    expect(sysInstruction).toBe(MEWTWO_SYSTEM_PROMPT);
  });

  it('returns 500 when token creation fails', async () => {
    mockCreate.mockRejectedValue(new Error('quota exceeded'));
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to create ephemeral token');
  });

  it('constructs GoogleGenAI with the API key', async () => {
    const { GoogleGenAI } = require('@google/genai');
    mockCreate.mockResolvedValue({ name: 'tok' });
    await POST(makeRequest());
    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-key' });
  });

  it('returns JSON content type', async () => {
    mockCreate.mockResolvedValue({ name: 'tok' });
    const res = await POST(makeRequest());
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('handles non-Error exceptions', async () => {
    mockCreate.mockRejectedValue('string error');
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });

  it('returns single-use token (uses: 1)', async () => {
    mockCreate.mockResolvedValue({ name: 'tok' });
    await POST(makeRequest());
    const callArg = mockCreate.mock.calls[0][0];
    expect(callArg.config.uses).toBe(1);
  });

  it('specifies the native audio dialog model', async () => {
    mockCreate.mockResolvedValue({ name: 'tok' });
    await POST(makeRequest());
    const callArg = mockCreate.mock.calls[0][0];
    expect(callArg.config.liveConnectConstraints.model).toContain('native-audio');
  });

  it('does not expose the API key in the response', async () => {
    mockCreate.mockResolvedValue({ name: 'ephemeral-token' });
    const res = await POST(makeRequest());
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain('test-key');
  });

  it('handles malformed request body gracefully', async () => {
    mockCreate.mockResolvedValue({ name: 'tok' });
    const req = new Request('http://localhost/api/gemini-token', {
      method: 'POST',
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
