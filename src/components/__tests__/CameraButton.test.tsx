import { render, screen, fireEvent } from '@testing-library/react'
import CameraButton from '../CameraButton'

describe('CameraButton', () => {
  it('should render with correct aria-label', () => {
    render(<CameraButton onCapture={jest.fn()} disabled={false} />)
    expect(screen.getByRole('button', { name: 'Scan Pokemon card' })).toBeInTheDocument()
  })

  it('should render SVG icon', () => {
    const { container } = render(<CameraButton onCapture={jest.fn()} disabled={false} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should call onCapture when clicked', () => {
    const onCapture = jest.fn()
    render(<CameraButton onCapture={onCapture} disabled={false} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onCapture).toHaveBeenCalledTimes(1)
  })

  it('should not call onCapture when disabled', () => {
    const onCapture = jest.fn()
    render(<CameraButton onCapture={onCapture} disabled={true} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onCapture).not.toHaveBeenCalled()
  })

  it('should be a circle button', () => {
    const { container } = render(<CameraButton onCapture={jest.fn()} disabled={false} />)
    const button = container.querySelector('.rounded-full.w-12.h-12')
    expect(button).toBeInTheDocument()
  })

  it('should apply cursor-not-allowed when disabled', () => {
    const { container } = render(<CameraButton onCapture={jest.fn()} disabled={true} />)
    const button = container.querySelector('button')
    expect(button?.className).toContain('cursor-not-allowed')
  })

  it('should apply reduced opacity when disabled', () => {
    const { container } = render(<CameraButton onCapture={jest.fn()} disabled={true} />)
    const button = container.querySelector('button')
    expect(button?.className).toContain('text-white/30')
  })

  it('should apply normal text opacity when enabled', () => {
    const { container } = render(<CameraButton onCapture={jest.fn()} disabled={false} />)
    const button = container.querySelector('button')
    expect(button?.className).toContain('text-white/70')
  })

  it('should apply hover style when enabled', () => {
    const { container } = render(<CameraButton onCapture={jest.fn()} disabled={false} />)
    const button = container.querySelector('button')
    expect(button?.className).toContain('hover:bg-white/20')
  })

  it('should not apply cursor-not-allowed when enabled', () => {
    const { container } = render(<CameraButton onCapture={jest.fn()} disabled={false} />)
    const button = container.querySelector('button')
    expect(button?.className).not.toContain('cursor-not-allowed')
  })

  it('should render SVG icon with correct size class', () => {
    const { container } = render(<CameraButton onCapture={jest.fn()} disabled={false} />)
    const svg = container.querySelector('svg')
    // SVGAnimatedString — use getAttribute or .baseVal
    const svgClass = svg?.getAttribute('class') ?? ''
    expect(svgClass).toContain('w-6')
    expect(svgClass).toContain('h-6')
  })

  it('should have transition styles for smooth animation', () => {
    const { container } = render(<CameraButton onCapture={jest.fn()} disabled={false} />)
    const button = container.querySelector('button')
    expect(button?.className).toContain('transition-all')
  })

  it('should not call onCapture multiple times on double-click while disabled', () => {
    const onCapture = jest.fn()
    render(<CameraButton onCapture={onCapture} disabled={true} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button'))
    expect(onCapture).not.toHaveBeenCalled()
  })
})
