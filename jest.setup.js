// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for jsdom
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Browser-only mocks (skip in node test environment)
if (typeof window !== 'undefined') {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return []
    }
    unobserve() {}
  }

  // Mock URL.createObjectURL and revokeObjectURL
  global.URL.createObjectURL = jest.fn(() => 'mock-url')
  global.URL.revokeObjectURL = jest.fn()

  // Mock HTMLAudioElement
  global.HTMLAudioElement.prototype.play = jest.fn(() => Promise.resolve())
  global.HTMLAudioElement.prototype.pause = jest.fn()
  global.HTMLAudioElement.prototype.load = jest.fn()

  // Mock AudioContext for audio capture/playback tests
  const mockAudioBufferSource = {
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    onended: null,
  }

  const mockScriptProcessor = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    onaudioprocess: null,
  }

  const mockAudioBuffer = {
    duration: 0.1,
    getChannelData: jest.fn(() => new Float32Array(1024)),
  }

  const mockMediaStreamSource = {
    connect: jest.fn(),
  }

  global.AudioContext = jest.fn().mockImplementation(() => ({
    sampleRate: 16000,
    currentTime: 0,
    state: 'running',
    destination: {},
    createBufferSource: jest.fn(() => ({ ...mockAudioBufferSource })),
    createScriptProcessor: jest.fn(() => ({ ...mockScriptProcessor })),
    createBuffer: jest.fn(() => ({ ...mockAudioBuffer })),
    createMediaStreamSource: jest.fn(() => ({ ...mockMediaStreamSource })),
    close: jest.fn(),
  }))

  // Mock navigator.mediaDevices.getUserMedia
  const mockMediaStream = {
    getTracks: jest.fn(() => [{ stop: jest.fn() }]),
  }

  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {},
    })
  }
  navigator.mediaDevices.getUserMedia = jest.fn(() =>
    Promise.resolve(mockMediaStream)
  )
}

// Suppress console errors in tests (optional)
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
