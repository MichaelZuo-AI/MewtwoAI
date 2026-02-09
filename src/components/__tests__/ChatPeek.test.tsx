import { render, screen, fireEvent } from '@testing-library/react';
import ChatPeek from '../ChatPeek';
import { Message } from '@/types/chat';

describe('ChatPeek', () => {
  const defaultProps = {
    messages: [] as Message[],
    onOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('returns null when messages is empty', () => {
      const { container } = render(<ChatPeek {...defaultProps} messages={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when there are messages', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: 1000 },
      ];
      render(<ChatPeek {...defaultProps} messages={messages} />);
      expect(screen.getByLabelText('Open chat history')).toBeInTheDocument();
    });
  });

  describe('message display', () => {
    it('shows "You: " prefix for user messages', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello Mewtwo', timestamp: 1000 },
      ];
      render(<ChatPeek {...defaultProps} messages={messages} />);
      expect(screen.getByText(/You:.*Hello Mewtwo/)).toBeInTheDocument();
    });

    it('shows character name prefix for assistant messages', () => {
      const messages: Message[] = [
        { id: '1', role: 'assistant', content: 'Greetings', timestamp: 1000 },
      ];
      render(<ChatPeek {...defaultProps} messages={messages} characterName="Mewtwo" />);
      expect(screen.getByText(/Mewtwo:.*Greetings/)).toBeInTheDocument();
    });

    it('defaults characterName to "Mewtwo"', () => {
      const messages: Message[] = [
        { id: '1', role: 'assistant', content: 'Hello', timestamp: 1000 },
      ];
      render(<ChatPeek {...defaultProps} messages={messages} />);
      expect(screen.getByText(/Mewtwo:.*Hello/)).toBeInTheDocument();
    });

    it('uses custom characterName', () => {
      const messages: Message[] = [
        { id: '1', role: 'assistant', content: 'Poyo!', timestamp: 1000 },
      ];
      render(<ChatPeek {...defaultProps} messages={messages} characterName="Kirby" />);
      expect(screen.getByText(/Kirby:.*Poyo!/)).toBeInTheDocument();
    });

    it('shows only the last message', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'First', timestamp: 1000 },
        { id: '2', role: 'assistant', content: 'Second', timestamp: 2000 },
        { id: '3', role: 'user', content: 'Third', timestamp: 3000 },
      ];
      render(<ChatPeek {...defaultProps} messages={messages} />);
      expect(screen.getByText(/You:.*Third/)).toBeInTheDocument();
      expect(screen.queryByText('First')).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('fires onOpen when clicked', () => {
      const onOpen = jest.fn();
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: 1000 },
      ];
      render(<ChatPeek {...defaultProps} messages={messages} onOpen={onOpen} />);
      fireEvent.click(screen.getByLabelText('Open chat history'));
      expect(onOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('truncation', () => {
    it('applies truncate class for long messages', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'A'.repeat(500), timestamp: 1000 },
      ];
      const { container } = render(<ChatPeek {...defaultProps} messages={messages} />);
      expect(container.querySelector('.truncate')).toBeInTheDocument();
    });
  });
});
