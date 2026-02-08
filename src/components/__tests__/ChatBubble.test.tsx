import { render, screen } from '@testing-library/react'
import ChatBubble from '../ChatBubble'
import { Message } from '@/types/chat'

describe('ChatBubble', () => {
  const baseMessage: Message = {
    id: '1',
    role: 'user',
    content: 'Hello Mewtwo!',
    timestamp: new Date('2024-01-15T10:30:00').getTime(),
  }

  describe('rendering', () => {
    it('should render user message', () => {
      render(<ChatBubble message={baseMessage} />)

      expect(screen.getByText('Hello Mewtwo!')).toBeInTheDocument()
    })

    it('should render assistant message', () => {
      const assistantMessage: Message = {
        ...baseMessage,
        role: 'assistant',
        content: 'I am Mewtwo!',
      }

      render(<ChatBubble message={assistantMessage} />)

      expect(screen.getByText('I am Mewtwo!')).toBeInTheDocument()
    })

    it('should render timestamp', () => {
      render(<ChatBubble message={baseMessage} />)

      const timestamp = screen.getByText(/\d{1,2}:\d{2}/)
      expect(timestamp).toBeInTheDocument()
    })

    it('should format timestamp correctly', () => {
      const message: Message = {
        ...baseMessage,
        timestamp: new Date('2024-01-15T14:30:00').getTime(),
      }

      render(<ChatBubble message={message} />)

      // Should show time in 12-hour format
      const timestamp = screen.getByText(/2:30/)
      expect(timestamp).toBeInTheDocument()
    })

    it('should render empty content', () => {
      const emptyMessage: Message = {
        ...baseMessage,
        content: '',
      }

      render(<ChatBubble message={emptyMessage} />)

      // Should still render the bubble structure
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
    })

    it('should render multiline content', () => {
      const multilineMessage: Message = {
        ...baseMessage,
        content: 'Hello!\nHow are you?\nI am fine!',
      }

      render(<ChatBubble message={multilineMessage} />)

      expect(screen.getByText(/Hello!.*How are you.*I am fine!/s)).toBeInTheDocument()
    })

    it('should render long content', () => {
      const longMessage: Message = {
        ...baseMessage,
        content: 'A'.repeat(1000),
      }

      render(<ChatBubble message={longMessage} />)

      const content = screen.getByText('A'.repeat(1000))
      expect(content).toBeInTheDocument()
    })

    it('should render special characters', () => {
      const specialMessage: Message = {
        ...baseMessage,
        content: 'Hello! 👋 "How are you?" <Test> & special chars',
      }

      render(<ChatBubble message={specialMessage} />)

      expect(screen.getByText(/Hello! 👋 "How are you\?" <Test> & special chars/)).toBeInTheDocument()
    })
  })

  describe('dark theme styling', () => {
    it('should apply dark user message styles', () => {
      const { container } = render(<ChatBubble message={baseMessage} />)

      const bubble = container.querySelector('[class*="bg-purple-500"]')
      expect(bubble).toBeInTheDocument()
    })

    it('should apply dark assistant message styles', () => {
      const assistantMessage: Message = {
        ...baseMessage,
        role: 'assistant',
      }

      const { container } = render(<ChatBubble message={assistantMessage} />)

      const bubble = container.querySelector('[class*="bg-white\\/15"]')
      expect(bubble).toBeInTheDocument()
    })

    it('should apply white text for assistant messages', () => {
      const assistantMessage: Message = {
        ...baseMessage,
        role: 'assistant',
      }

      const { container } = render(<ChatBubble message={assistantMessage} />)

      const bubble = container.querySelector('[class*="text-white\\/90"]')
      expect(bubble).toBeInTheDocument()
    })

    it('should apply subtle timestamp for user messages', () => {
      render(<ChatBubble message={baseMessage} />)

      const timestamp = screen.getByText(/\d{1,2}:\d{2}/)
      expect(timestamp.className).toContain('text-white/40')
    })

    it('should apply subtle timestamp for assistant messages', () => {
      const assistantMessage: Message = {
        ...baseMessage,
        role: 'assistant',
      }

      render(<ChatBubble message={assistantMessage} />)

      const timestamp = screen.getByText(/\d{1,2}:\d{2}/)
      expect(timestamp.className).toContain('text-white/30')
    })
  })

  describe('layout', () => {
    it('should justify user messages to the right', () => {
      const { container } = render(<ChatBubble message={baseMessage} />)

      const wrapper = container.querySelector('.justify-end')
      expect(wrapper).toBeInTheDocument()
    })

    it('should justify assistant messages to the left', () => {
      const assistantMessage: Message = {
        ...baseMessage,
        role: 'assistant',
      }

      const { container } = render(<ChatBubble message={assistantMessage} />)

      const wrapper = container.querySelector('.justify-start')
      expect(wrapper).toBeInTheDocument()
    })

    it('should apply rounded corner styling for user messages', () => {
      const { container } = render(<ChatBubble message={baseMessage} />)

      const bubble = container.querySelector('.rounded-br-none')
      expect(bubble).toBeInTheDocument()
    })

    it('should apply rounded corner styling for assistant messages', () => {
      const assistantMessage: Message = {
        ...baseMessage,
        role: 'assistant',
      }

      const { container } = render(<ChatBubble message={assistantMessage} />)

      const bubble = container.querySelector('.rounded-bl-none')
      expect(bubble).toBeInTheDocument()
    })

    it('should apply max-width constraints', () => {
      const { container } = render(<ChatBubble message={baseMessage} />)

      const bubble = container.querySelector('[class*="max-w"]')
      expect(bubble).toBeInTheDocument()
    })
  })

  describe('timestamp formatting', () => {
    it('should format AM times correctly', () => {
      const morningMessage: Message = {
        ...baseMessage,
        timestamp: new Date('2024-01-15T09:30:00').getTime(),
      }

      render(<ChatBubble message={morningMessage} />)

      expect(screen.getByText(/9:30/)).toBeInTheDocument()
    })

    it('should format PM times correctly', () => {
      const afternoonMessage: Message = {
        ...baseMessage,
        timestamp: new Date('2024-01-15T15:45:00').getTime(),
      }

      render(<ChatBubble message={afternoonMessage} />)

      expect(screen.getByText(/3:45/)).toBeInTheDocument()
    })

    it('should format midnight correctly', () => {
      const midnightMessage: Message = {
        ...baseMessage,
        timestamp: new Date('2024-01-15T00:00:00').getTime(),
      }

      render(<ChatBubble message={midnightMessage} />)

      expect(screen.getByText(/12:00/)).toBeInTheDocument()
    })

    it('should pad minutes with zero', () => {
      const message: Message = {
        ...baseMessage,
        timestamp: new Date('2024-01-15T14:05:00').getTime(),
      }

      render(<ChatBubble message={message} />)

      expect(screen.getByText(/2:05/)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should render content with proper text formatting', () => {
      render(<ChatBubble message={baseMessage} />)

      const content = screen.getByText('Hello Mewtwo!')
      expect(content).toHaveClass('whitespace-pre-wrap')
    })

    it('should maintain readability with base font size', () => {
      const { container } = render(<ChatBubble message={baseMessage} />)

      const content = container.querySelector('.text-base')
      expect(content).toBeInTheDocument()
    })

    it('should have visible timestamp', () => {
      render(<ChatBubble message={baseMessage} />)

      const timestamp = screen.getByText(/\d{1,2}:\d{2}/)
      expect(timestamp).toHaveClass('text-xs')
    })
  })

  describe('edge cases', () => {
    it('should handle very old timestamps', () => {
      const oldMessage: Message = {
        ...baseMessage,
        timestamp: new Date('1990-01-01T10:00:00').getTime(),
      }

      render(<ChatBubble message={oldMessage} />)

      expect(screen.getByText(/10:00/)).toBeInTheDocument()
    })

    it('should handle future timestamps', () => {
      const futureMessage: Message = {
        ...baseMessage,
        timestamp: new Date('2050-01-01T10:00:00').getTime(),
      }

      render(<ChatBubble message={futureMessage} />)

      expect(screen.getByText(/10:00/)).toBeInTheDocument()
    })

    it('should handle invalid timestamps gracefully', () => {
      const invalidMessage: Message = {
        ...baseMessage,
        timestamp: NaN,
      }

      render(<ChatBubble message={invalidMessage} />)

      // Should still render without crashing
      expect(screen.getByText('Hello Mewtwo!')).toBeInTheDocument()
    })

    it('should handle content with only whitespace', () => {
      const whitespaceMessage: Message = {
        ...baseMessage,
        content: '   \n\n   \t\t   ',
      }

      render(<ChatBubble message={whitespaceMessage} />)

      // Should render the whitespace
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
    })

    it('should handle Unicode characters', () => {
      const unicodeMessage: Message = {
        ...baseMessage,
        content: '你好 Mewtwo! 🎮🎨🎭',
      }

      render(<ChatBubble message={unicodeMessage} />)

      expect(screen.getByText(/你好 Mewtwo! 🎮🎨🎭/)).toBeInTheDocument()
    })

    it('should handle HTML-like content as plain text', () => {
      const htmlMessage: Message = {
        ...baseMessage,
        content: '<script>alert("test")</script>',
      }

      render(<ChatBubble message={htmlMessage} />)

      // Should render as text, not execute
      expect(screen.getByText(/<script>alert\("test"\)<\/script>/)).toBeInTheDocument()
    })
  })

  describe('responsive behavior', () => {
    it('should have responsive text sizes', () => {
      const { container } = render(<ChatBubble message={baseMessage} />)

      const content = container.querySelector('.md\\:text-lg')
      expect(content).toBeInTheDocument()
    })

    it('should have responsive max width', () => {
      const { container } = render(<ChatBubble message={baseMessage} />)

      const bubble = container.querySelector('.md\\:max-w-\\[70\\%\\]')
      expect(bubble).toBeInTheDocument()
    })
  })
})
