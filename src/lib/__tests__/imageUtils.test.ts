import { resizeImage } from '../imageUtils'

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = jest.fn()
Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL })
Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL })

// Mock canvas context
const mockDrawImage = jest.fn()
const mockToDataURL = jest.fn(() => 'data:image/jpeg;base64,dGVzdA==')
const mockGetContext = jest.fn(() => ({
  drawImage: mockDrawImage,
}))

// Mock document.createElement for canvas
const originalCreateElement = document.createElement.bind(document)
jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') {
    const canvas = originalCreateElement('canvas')
    Object.defineProperty(canvas, 'getContext', { value: mockGetContext })
    Object.defineProperty(canvas, 'toDataURL', { value: mockToDataURL })
    return canvas
  }
  return originalCreateElement(tag)
})

// Helper to create a mock Image that fires onload
let capturedImage: HTMLImageElement | null = null
const OriginalImage = globalThis.Image

beforeEach(() => {
  jest.clearAllMocks()
  capturedImage = null

  // Mock Image constructor to capture instance and auto-fire onload
  globalThis.Image = class MockImage extends OriginalImage {
    constructor() {
      super()
      capturedImage = this
    }
  } as typeof Image
})

afterAll(() => {
  globalThis.Image = OriginalImage
})

function triggerImageLoad(width: number, height: number) {
  if (capturedImage) {
    Object.defineProperty(capturedImage, 'width', { value: width, configurable: true })
    Object.defineProperty(capturedImage, 'height', { value: height, configurable: true })
    capturedImage.onload?.(new Event('load') as any)
  }
}

function triggerImageError() {
  if (capturedImage) {
    capturedImage.onerror?.(new Event('error') as any)
  }
}

describe('resizeImage', () => {
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

  it('should return base64 and mimeType', async () => {
    const promise = resizeImage(mockFile)
    triggerImageLoad(800, 600)
    const result = await promise

    expect(result.base64).toBe('dGVzdA==')
    expect(result.mimeType).toBe('image/jpeg')
  })

  it('should scale down large images preserving aspect ratio', async () => {
    const promise = resizeImage(mockFile, 1024)
    triggerImageLoad(2048, 1024)
    const result = await promise

    expect(result.base64).toBeDefined()
    // Canvas should be set to scaled dimensions
    expect(mockDrawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1024, 512)
  })

  it('should scale down tall images preserving aspect ratio', async () => {
    const promise = resizeImage(mockFile, 1024)
    triggerImageLoad(500, 2000)
    const result = await promise

    expect(result.base64).toBeDefined()
    expect(mockDrawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 256, 1024)
  })

  it('should not upscale small images', async () => {
    const promise = resizeImage(mockFile, 1024)
    triggerImageLoad(200, 150)
    const result = await promise

    expect(result.base64).toBeDefined()
    expect(mockDrawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 200, 150)
  })

  it('should not scale image that is exactly at maxDimension', async () => {
    const promise = resizeImage(mockFile, 1024)
    triggerImageLoad(1024, 768)
    const result = await promise

    expect(result.base64).toBeDefined()
    // Width is exactly at maxDimension but not > maxDimension, so no scaling
    expect(mockDrawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1024, 768)
  })

  it('should scale down a large square image correctly', async () => {
    const promise = resizeImage(mockFile, 1024)
    // Square image: width === height > maxDimension
    // width > height is false (they're equal), so the else branch fires
    triggerImageLoad(2000, 2000)
    const result = await promise

    expect(result.base64).toBeDefined()
    expect(mockDrawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1024, 1024)
  })

  it('should not scale an image that fits within maxDimension on both axes', async () => {
    const promise = resizeImage(mockFile, 1024)
    triggerImageLoad(512, 512)
    const result = await promise

    expect(result.base64).toBeDefined()
    expect(mockDrawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 512, 512)
  })

  it('should always return mimeType image/jpeg regardless of input file type', async () => {
    const pngFile = new File(['test'], 'test.png', { type: 'image/png' })
    const promise = resizeImage(pngFile)
    triggerImageLoad(100, 100)
    const result = await promise

    expect(result.mimeType).toBe('image/jpeg')
  })

  it('should strip the data URI prefix from base64 output', async () => {
    // toDataURL returns 'data:image/jpeg;base64,dGVzdA==' — only the part after comma should be in base64
    const promise = resizeImage(mockFile)
    triggerImageLoad(800, 600)
    const result = await promise

    expect(result.base64).not.toContain('data:')
    expect(result.base64).not.toContain('base64,')
    expect(result.base64).toBe('dGVzdA==')
  })

  it('should pass custom quality to toDataURL', async () => {
    const promise = resizeImage(mockFile, 1024, 0.5)
    triggerImageLoad(800, 600)
    await promise

    expect(mockToDataURL).toHaveBeenCalledWith('image/jpeg', 0.5)
  })

  it('should use default quality 0.8 when not specified', async () => {
    const promise = resizeImage(mockFile)
    triggerImageLoad(800, 600)
    await promise

    expect(mockToDataURL).toHaveBeenCalledWith('image/jpeg', 0.8)
  })

  it('should reject when canvas context is unavailable', async () => {
    // Override getContext to return null for this test only
    mockGetContext.mockReturnValueOnce(null)

    const promise = resizeImage(mockFile)
    triggerImageLoad(800, 600)

    await expect(promise).rejects.toThrow('Failed to get canvas context')
  })

  it('should reject when image has zero width', async () => {
    const promise = resizeImage(mockFile)
    triggerImageLoad(0, 600)

    await expect(promise).rejects.toThrow('Image has zero dimensions')
  })

  it('should reject when image has zero height', async () => {
    const promise = resizeImage(mockFile)
    triggerImageLoad(800, 0)

    await expect(promise).rejects.toThrow('Image has zero dimensions')
  })

  it('should reject on image load error', async () => {
    const promise = resizeImage(mockFile)
    triggerImageError()

    await expect(promise).rejects.toThrow('Failed to load image')
  })

  it('should clean up object URL on success', async () => {
    const promise = resizeImage(mockFile)
    triggerImageLoad(800, 600)
    await promise

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('should clean up object URL on error', async () => {
    const promise = resizeImage(mockFile)
    triggerImageError()

    await expect(promise).rejects.toThrow()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('should clean up object URL on canvas context error', async () => {
    mockGetContext.mockReturnValueOnce(null)

    const promise = resizeImage(mockFile)
    triggerImageLoad(800, 600)

    await expect(promise).rejects.toThrow()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
