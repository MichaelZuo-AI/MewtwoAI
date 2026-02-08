import { render, screen, fireEvent } from '@testing-library/react'
import StoryTimeButton from '../StoryTimeButton'

describe('StoryTimeButton', () => {
  it('should render with story mode off', () => {
    render(<StoryTimeButton onToggle={jest.fn()} isStoryMode={false} />)

    expect(screen.getByText(/Story Time/)).toBeInTheDocument()
  })

  it('should render with story mode on', () => {
    render(<StoryTimeButton onToggle={jest.fn()} isStoryMode={true} />)

    expect(screen.getByText(/Story Mode ON/)).toBeInTheDocument()
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

  it('should be positioned fixed', () => {
    const { container } = render(
      <StoryTimeButton onToggle={jest.fn()} isStoryMode={false} />
    )

    const button = container.querySelector('.fixed')
    expect(button).toBeInTheDocument()
  })
})
