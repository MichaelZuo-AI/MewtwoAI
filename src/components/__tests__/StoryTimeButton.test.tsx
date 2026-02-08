import { render, screen, fireEvent } from '@testing-library/react'
import StoryTimeButton from '../StoryTimeButton'

describe('StoryTimeButton', () => {
  it('should render with story mode off aria-label', () => {
    render(<StoryTimeButton onToggle={jest.fn()} isStoryMode={false} />)
    expect(screen.getByRole('button', { name: 'Start story mode' })).toBeInTheDocument()
  })

  it('should render with story mode on aria-label', () => {
    render(<StoryTimeButton onToggle={jest.fn()} isStoryMode={true} />)
    expect(screen.getByRole('button', { name: 'Exit story mode' })).toBeInTheDocument()
  })

  it('should not render text labels', () => {
    render(<StoryTimeButton onToggle={jest.fn()} isStoryMode={false} />)
    expect(screen.queryByText(/Story Time/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Story Mode ON/)).not.toBeInTheDocument()
  })

  it('should render SVG icon', () => {
    const { container } = render(<StoryTimeButton onToggle={jest.fn()} isStoryMode={false} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should call onToggle with true when turning on', () => {
    const onToggle = jest.fn()
    render(<StoryTimeButton onToggle={onToggle} isStoryMode={false} />)

    fireEvent.click(screen.getByRole('button'))

    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('should call onToggle with false when turning off', () => {
    const onToggle = jest.fn()
    render(<StoryTimeButton onToggle={onToggle} isStoryMode={true} />)

    fireEvent.click(screen.getByRole('button'))

    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('should apply different styles for on vs off', () => {
    const { container, rerender } = render(
      <StoryTimeButton onToggle={jest.fn()} isStoryMode={false} />
    )

    const offClasses = container.querySelector('button')?.className || ''

    rerender(<StoryTimeButton onToggle={jest.fn()} isStoryMode={true} />)

    const onClasses = container.querySelector('button')?.className || ''

    expect(offClasses).not.toEqual(onClasses)
  })

  it('should be a circle button', () => {
    const { container } = render(
      <StoryTimeButton onToggle={jest.fn()} isStoryMode={false} />
    )

    const button = container.querySelector('.rounded-full.w-12.h-12')
    expect(button).toBeInTheDocument()
  })

  it('should apply glow effect when active', () => {
    const { container } = render(
      <StoryTimeButton onToggle={jest.fn()} isStoryMode={true} />
    )

    const button = container.querySelector('button')
    expect(button?.className).toContain('bg-yellow-500/30')
  })
})
