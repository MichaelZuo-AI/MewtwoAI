import { render, screen, fireEvent } from '@testing-library/react';
import ChatDrawer from '../ChatDrawer';
import { Message } from '@/types/chat';

describe('ChatDrawer', () => {
  const mockMessages: Message[] = [
    { id: '1', role: 'user', content: 'Hello Mewtwo', timestamp: 1000 },
    { id: '2', role: 'assistant', content: 'Greetings, young trainer', timestamp: 2000 },
  ];

  const defaultProps = {
    messages: mockMessages,
    isOpen: true,
    onClose: jest.fn(),
    onClearHistory: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView which is not available in jsdom
    Element.prototype.scrollIntoView = jest.fn();
  });

  describe('visibility', () => {
    it('returns null when isOpen is false', () => {
      const { container } = render(<ChatDrawer {...defaultProps} isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders content when isOpen is true', () => {
      render(<ChatDrawer {...defaultProps} isOpen={true} />);
      expect(screen.getByLabelText('Close chat')).toBeInTheDocument();
    });
  });

  describe('messages', () => {
    it('shows "No messages yet" when messages is empty', () => {
      render(<ChatDrawer {...defaultProps} messages={[]} />);
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });

    it('renders chat bubbles for each message', () => {
      render(<ChatDrawer {...defaultProps} />);
      expect(screen.getByText('Hello Mewtwo')).toBeInTheDocument();
      expect(screen.getByText('Greetings, young trainer')).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('fires onClose when clicking the backdrop', () => {
      const onClose = jest.fn();
      const { container } = render(<ChatDrawer {...defaultProps} onClose={onClose} />);
      const backdrop = container.querySelector('.bg-black\\/60');
      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('fires onClose when clicking the close button', () => {
      const onClose = jest.fn();
      render(<ChatDrawer {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByLabelText('Close chat'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('fires onClearHistory when clicking Clear', () => {
      const onClearHistory = jest.fn();
      render(<ChatDrawer {...defaultProps} onClearHistory={onClearHistory} />);
      fireEvent.click(screen.getByLabelText('Clear chat history'));
      expect(onClearHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('bgColor prop', () => {
    it('applies background style when bgColor is provided', () => {
      const { container } = render(<ChatDrawer {...defaultProps} bgColor="#2d1b4e" />);
      const drawer = container.querySelector('.backdrop-blur-lg') as HTMLElement;
      // jsdom normalizes hex+alpha (#2d1b4ef2) to rgba
      expect(drawer.style.background).toContain('rgba');
    });

    it('does not apply background style when bgColor is not provided', () => {
      const { container } = render(<ChatDrawer {...defaultProps} />);
      const drawer = container.querySelector('.backdrop-blur-lg') as HTMLElement;
      expect(drawer.style.background).toBe('');
    });
  });

  describe('auto-scroll', () => {
    it('calls scrollIntoView when open', () => {
      const scrollIntoViewMock = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      render(<ChatDrawer {...defaultProps} isOpen={true} />);
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });
});
