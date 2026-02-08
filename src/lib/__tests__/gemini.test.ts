// Mock the Google Generative AI package
jest.mock('@google/generative-ai')

describe('gemini', () => {
  let mockChat: any
  let mockModel: any
  let mockGenAI: any
  let mockStream: any
  let GoogleGenerativeAI: any

  beforeEach(() => {
    // Reset module cache so the singleton genAI is cleared
    jest.resetModules()
    jest.clearAllMocks()

    // Mock stream
    mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield { text: () => 'Hello ' }
        yield { text: () => 'there!' }
      },
    }

    // Mock chat
    mockChat = {
      sendMessageStream: jest.fn().mockResolvedValue({
        stream: mockStream,
      }),
    }

    // Mock model
    mockModel = {
      startChat: jest.fn().mockReturnValue(mockChat),
    }

    // Mock GoogleGenerativeAI instance
    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel),
    }

    // Re-require the mock and set up the constructor
    GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI
    ;(GoogleGenerativeAI as jest.Mock).mockImplementation(() => mockGenAI)
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
  })

  // Helper to import fresh module (singleton reset each time)
  const getModule = () => require('../gemini')

  describe('createChatCompletion', () => {
    const systemPrompt = 'You are Mewtwo, a helpful assistant.'
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'How are you?' },
    ]

    it('should create GoogleGenerativeAI instance with API key from env', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key'
      const { createChatCompletion } = getModule()

      await createChatCompletion(messages, systemPrompt)

      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-api-key')
    })

    it('should throw when API key is missing', async () => {
      delete process.env.GEMINI_API_KEY
      const { createChatCompletion } = getModule()

      await expect(
        createChatCompletion(messages, systemPrompt)
      ).rejects.toThrow('GEMINI_API_KEY is not set')
    })

    it('should use Gemini 1.5 Flash model', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()

      await createChatCompletion(messages, systemPrompt)

      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
      })
    })

    it('should pass system prompt as systemInstruction', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      const customPrompt = 'Custom system prompt'

      await createChatCompletion(messages, customPrompt)

      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          systemInstruction: customPrompt,
        })
      )
    })

    it('should convert message history to Gemini format', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()

      await createChatCompletion(messages, systemPrompt)

      expect(mockModel.startChat).toHaveBeenCalledWith(
        expect.objectContaining({
          history: [
            {
              role: 'user',
              parts: [{ text: 'Hello' }],
            },
            {
              role: 'model',
              parts: [{ text: 'Hi there!' }],
            },
          ],
        })
      )
    })

    it('should convert assistant role to model role', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      const messagesWithAssistant = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
        { role: 'user', content: 'Last' },
      ]

      await createChatCompletion(messagesWithAssistant, systemPrompt)

      const callArgs = mockModel.startChat.mock.calls[0][0]
      expect(callArgs.history[1].role).toBe('model')
    })

    it('should exclude last message from history', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()

      await createChatCompletion(messages, systemPrompt)

      const callArgs = mockModel.startChat.mock.calls[0][0]
      expect(callArgs.history).toHaveLength(2)
      expect(callArgs.history[1].parts[0].text).toBe('Hi there!')
    })

    it('should send last message separately', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()

      await createChatCompletion(messages, systemPrompt)

      expect(mockChat.sendMessageStream).toHaveBeenCalledWith('How are you?')
    })

    it('should configure generation settings', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()

      await createChatCompletion(messages, systemPrompt)

      expect(mockModel.startChat).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
          },
        })
      )
    })

    it('should return stream from sendMessageStream', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()

      const result = await createChatCompletion(messages, systemPrompt)

      expect(result).toBe(mockStream)
    })

    it('should handle single message', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      const singleMessage = [{ role: 'user', content: 'Hello' }]

      await createChatCompletion(singleMessage, systemPrompt)

      const callArgs = mockModel.startChat.mock.calls[0][0]
      expect(callArgs.history).toHaveLength(0)
      expect(mockChat.sendMessageStream).toHaveBeenCalledWith('Hello')
    })

    it('should handle empty messages array', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      const emptyMessages: Array<{ role: string; content: string }> = []

      await createChatCompletion(emptyMessages, systemPrompt)

      expect(mockChat.sendMessageStream).toHaveBeenCalledWith('')
    })

    it('should handle messages with empty content', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      const messagesWithEmpty = [
        { role: 'user', content: '' },
        { role: 'assistant', content: 'Response' },
        { role: 'user', content: 'Question' },
      ]

      await createChatCompletion(messagesWithEmpty, systemPrompt)

      expect(mockChat.sendMessageStream).toHaveBeenCalledWith('Question')
    })

    it('should preserve message order in history', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      const orderedMessages = [
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'Second' },
        { role: 'user', content: 'Third' },
        { role: 'assistant', content: 'Fourth' },
        { role: 'user', content: 'Fifth' },
      ]

      await createChatCompletion(orderedMessages, systemPrompt)

      const callArgs = mockModel.startChat.mock.calls[0][0]
      expect(callArgs.history[0].parts[0].text).toBe('First')
      expect(callArgs.history[1].parts[0].text).toBe('Second')
      expect(callArgs.history[2].parts[0].text).toBe('Third')
      expect(callArgs.history[3].parts[0].text).toBe('Fourth')
    })

    it('should handle long conversation history', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      const longHistory = Array.from({ length: 50 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }))
      longHistory.push({ role: 'user', content: 'Latest message' })

      await createChatCompletion(longHistory, systemPrompt)

      const callArgs = mockModel.startChat.mock.calls[0][0]
      expect(callArgs.history).toHaveLength(50)
      expect(mockChat.sendMessageStream).toHaveBeenCalledWith('Latest message')
    })

    it('should handle special characters in messages', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      const specialMessages = [
        { role: 'user', content: 'Hello! "How are you?" <Test>' },
        { role: 'assistant', content: "I'm great!" },
        { role: 'user', content: 'What about \n newlines \t and tabs?' },
      ]

      await createChatCompletion(specialMessages, systemPrompt)

      expect(mockChat.sendMessageStream).toHaveBeenCalledWith(
        'What about \n newlines \t and tabs?'
      )
    })

    it('should handle very long messages', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      const longContent = 'A'.repeat(10000)
      const messagesWithLong = [{ role: 'user', content: longContent }]

      await createChatCompletion(messagesWithLong, systemPrompt)

      expect(mockChat.sendMessageStream).toHaveBeenCalledWith(longContent)
    })

    it('should cache the client singleton', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()

      await createChatCompletion([{ role: 'user', content: 'First' }], 'Prompt')
      await createChatCompletion([{ role: 'user', content: 'Second' }], 'Prompt')

      // Constructor should only be called once (singleton)
      expect(GoogleGenerativeAI).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('should propagate errors from getGenerativeModel', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      mockGenAI.getGenerativeModel.mockImplementation(() => {
        throw new Error('Model error')
      })

      await expect(
        createChatCompletion([{ role: 'user', content: 'Test' }], 'Prompt')
      ).rejects.toThrow('Model error')
    })

    it('should propagate errors from startChat', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      mockModel.startChat.mockImplementation(() => {
        throw new Error('Chat error')
      })

      await expect(
        createChatCompletion([{ role: 'user', content: 'Test' }], 'Prompt')
      ).rejects.toThrow('Chat error')
    })

    it('should propagate errors from sendMessageStream', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      mockChat.sendMessageStream.mockRejectedValue(new Error('Stream error'))

      await expect(
        createChatCompletion([{ role: 'user', content: 'Test' }], 'Prompt')
      ).rejects.toThrow('Stream error')
    })

    it('should include setup URL in missing key error', async () => {
      delete process.env.GEMINI_API_KEY
      const { createChatCompletion } = getModule()

      await expect(
        createChatCompletion([{ role: 'user', content: 'Test' }], 'Prompt')
      ).rejects.toThrow('aistudio.google.com')
    })
  })

  describe('message format conversion', () => {
    it('should wrap content in parts array with text property', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      const messages = [{ role: 'user', content: 'Test message' }]

      await createChatCompletion(messages, 'Prompt')

      const callArgs = mockModel.startChat.mock.calls[0][0]
      expect(callArgs.history).toEqual([])
    })

    it('should handle multiple user-assistant exchanges', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()
      const messages = [
        { role: 'user', content: 'Q1' },
        { role: 'assistant', content: 'A1' },
        { role: 'user', content: 'Q2' },
        { role: 'assistant', content: 'A2' },
        { role: 'user', content: 'Q3' },
      ]

      await createChatCompletion(messages, 'Prompt')

      const callArgs = mockModel.startChat.mock.calls[0][0]
      expect(callArgs.history).toHaveLength(4)
      expect(callArgs.history[0]).toEqual({
        role: 'user',
        parts: [{ text: 'Q1' }],
      })
      expect(callArgs.history[1]).toEqual({
        role: 'model',
        parts: [{ text: 'A1' }],
      })
    })
  })

  describe('generation configuration', () => {
    it('should use temperature of 0.8', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()

      await createChatCompletion([{ role: 'user', content: 'Test' }], 'Prompt')

      const callArgs = mockModel.startChat.mock.calls[0][0]
      expect(callArgs.generationConfig.temperature).toBe(0.8)
    })

    it('should limit output to 1024 tokens', async () => {
      process.env.GEMINI_API_KEY = 'test-key'
      const { createChatCompletion } = getModule()

      await createChatCompletion([{ role: 'user', content: 'Test' }], 'Prompt')

      const callArgs = mockModel.startChat.mock.calls[0][0]
      expect(callArgs.generationConfig.maxOutputTokens).toBe(1024)
    })
  })
})
