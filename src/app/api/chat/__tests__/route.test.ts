/**
 * @jest-environment node
 */
import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock the gemini module
jest.mock('@/lib/gemini', () => ({
  createChatCompletion: jest.fn(),
}))

// Mock the prompts module
jest.mock('@/lib/mewtwo-prompts', () => ({
  getSystemPrompt: jest.fn((isStoryMode: boolean) =>
    isStoryMode ? 'Story prompt' : 'Default prompt'
  ),
}))

import { createChatCompletion } from '@/lib/gemini'
import { getSystemPrompt } from '@/lib/mewtwo-prompts'

describe('Chat API route', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock: successful streaming response
    const mockStream = (async function* () {
      yield { text: () => 'Hello ' }
      yield { text: () => 'there!' }
    })()

    ;(createChatCompletion as jest.Mock).mockResolvedValue(mockStream)
  })

  it('should return 400 if messages are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
  })

  it('should return 400 for empty messages array', async () => {
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
  })

  it('should call createChatCompletion with messages and prompt', async () => {
    const messages = [{ role: 'user', content: 'Hello' }]

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    })

    await POST(req)

    expect(createChatCompletion).toHaveBeenCalledWith(messages, 'Default prompt')
  })

  it('should use story prompt when isStoryMode is true', async () => {
    const messages = [{ role: 'user', content: 'Tell me a story' }]

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, isStoryMode: true }),
    })

    await POST(req)

    expect(getSystemPrompt).toHaveBeenCalledWith(true)
    expect(createChatCompletion).toHaveBeenCalledWith(messages, 'Story prompt')
  })

  it('should return a streaming response', async () => {
    const messages = [{ role: 'user', content: 'Hello' }]

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should stream SSE-formatted data', async () => {
    const messages = [{ role: 'user', content: 'Hello' }]

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    })

    const response = await POST(req)
    const text = await response.text()

    expect(text).toContain('data: ')
    expect(text).toContain('Hello ')
    expect(text).toContain('[DONE]')
  })

  it('should return 500 on error', async () => {
    ;(createChatCompletion as jest.Mock).mockRejectedValue(new Error('API error'))

    const messages = [{ role: 'user', content: 'Hello' }]

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    })

    const response = await POST(req)

    expect(response.status).toBe(500)
  })
})
