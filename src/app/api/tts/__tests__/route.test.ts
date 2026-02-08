/**
 * @jest-environment node
 */
import { POST } from '../route'
import { NextRequest } from 'next/server'

describe('TTS API route', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    global.fetch = jest.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('should return 400 if text is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/tts', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Text is required')
  })

  it('should return 501 when ElevenLabs key is not configured', async () => {
    delete process.env.ELEVENLABS_API_KEY

    const req = new NextRequest('http://localhost:3000/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello' }),
    })

    const response = await POST(req)

    expect(response.status).toBe(501)
    const data = await response.json()
    expect(data.useFallback).toBe(true)
  })

  it('should call ElevenLabs API when key is configured', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'
    const mockAudioBuffer = new ArrayBuffer(100)

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => mockAudioBuffer,
    })

    const req = new NextRequest('http://localhost:3000/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello Mewtwo' }),
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('audio/mpeg')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.elevenlabs.io'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'xi-api-key': 'test-key',
        }),
      })
    )
  })

  it('should return 500 on ElevenLabs API error', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
    })

    const req = new NextRequest('http://localhost:3000/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello' }),
    })

    const response = await POST(req)

    expect(response.status).toBe(500)
  })

  it('should pass text in ElevenLabs request body', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
    })

    const req = new NextRequest('http://localhost:3000/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text: 'I am Mewtwo' }),
    })

    await POST(req)

    const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(callBody.text).toBe('I am Mewtwo')
  })
})
