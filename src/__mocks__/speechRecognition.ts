// Mock SpeechRecognition for tests
export class MockSpeechRecognition {
  continuous = false
  interimResults = false
  lang = 'en-US'

  private listeners: { [key: string]: Function[] } = {}

  constructor() {
    // Track the last created instance for tests to access
    MockSpeechRecognition.lastInstance = this
    MockSpeechRecognition.instances.push(this)
  }

  static lastInstance: MockSpeechRecognition | null = null
  static instances: MockSpeechRecognition[] = []

  static resetInstances() {
    MockSpeechRecognition.lastInstance = null
    MockSpeechRecognition.instances = []
  }

  addEventListener(event: string, handler: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(handler)
  }

  removeEventListener(event: string, handler: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(h => h !== handler)
    }
  }

  start() {
    this.dispatchEvent('start')
  }

  stop() {
    this.dispatchEvent('end')
  }

  abort() {
    this.dispatchEvent('end')
  }

  // Helper method to simulate recognition results
  mockResult(transcript: string, isFinal: boolean = true) {
    const resultItem: any = [{ transcript, confidence: 0.9 }]
    resultItem.isFinal = isFinal

    const event = {
      resultIndex: 0,
      results: [resultItem],
    }

    this.dispatchEvent('result', event)
  }

  // Helper method to simulate errors
  mockError(error: string) {
    this.dispatchEvent('error', { error })
  }

  private dispatchEvent(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(handler => handler(data || {}))
    }
  }
}

// Global mock setup
export const setupSpeechRecognitionMock = () => {
  MockSpeechRecognition.resetInstances()
  // @ts-ignore
  window.SpeechRecognition = MockSpeechRecognition
  // @ts-ignore
  window.webkitSpeechRecognition = MockSpeechRecognition
}

export const cleanupSpeechRecognitionMock = () => {
  MockSpeechRecognition.resetInstances()
  // @ts-ignore
  delete window.SpeechRecognition
  // @ts-ignore
  delete window.webkitSpeechRecognition
}
