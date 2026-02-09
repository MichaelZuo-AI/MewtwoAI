import { render, screen, fireEvent } from '@testing-library/react';
import MicButton from '../MicButton';
import { LiveConnectionState } from '@/types/chat';

describe('MicButton', () => {
  const defaultProps = {
    connectionState: 'disconnected' as LiveConnectionState,
    isSupported: true,
    onToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders a button element', () => {
      render(<MicButton {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders microphone icon when disconnected', () => {
      const { container } = render(<MicButton {...defaultProps} connectionState="disconnected" />);
      // MicrophoneIcon has a <rect> inside svg
      expect(container.querySelector('svg rect')).toBeInTheDocument();
    });

    it('renders stop icon when connected', () => {
      const { container } = render(<MicButton {...defaultProps} connectionState="connected" />);
      expect(container.querySelector('svg rect')).toBeInTheDocument();
    });

    it('renders loading dots icon when connecting', () => {
      const { container } = render(<MicButton {...defaultProps} connectionState="connecting" />);
      // LoadingDotsIcon has 3 circle elements
      const circles = container.querySelectorAll('svg circle');
      expect(circles.length).toBe(3);
    });

    it('renders loading dots icon when reconnecting', () => {
      const { container } = render(<MicButton {...defaultProps} connectionState="reconnecting" />);
      const circles = container.querySelectorAll('svg circle');
      expect(circles.length).toBe(3);
    });
  });

  describe('aria-label', () => {
    it('shows "Start talking" when disconnected', () => {
      render(<MicButton {...defaultProps} connectionState="disconnected" />);
      expect(screen.getByLabelText('Start talking')).toBeInTheDocument();
    });

    it('shows "Stop talking" when connected', () => {
      render(<MicButton {...defaultProps} connectionState="connected" />);
      expect(screen.getByLabelText('Stop talking')).toBeInTheDocument();
    });

    it('shows "Connecting" when connecting', () => {
      render(<MicButton {...defaultProps} connectionState="connecting" />);
      expect(screen.getByLabelText('Connecting')).toBeInTheDocument();
    });

    it('shows "Connecting" when reconnecting', () => {
      render(<MicButton {...defaultProps} connectionState="reconnecting" />);
      expect(screen.getByLabelText('Connecting')).toBeInTheDocument();
    });

    it('shows "Start talking" when in error state', () => {
      render(<MicButton {...defaultProps} connectionState="error" />);
      expect(screen.getByLabelText('Start talking')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('is disabled when isSupported is false', () => {
      render(<MicButton {...defaultProps} isSupported={false} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when connecting', () => {
      render(<MicButton {...defaultProps} connectionState="connecting" />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is not disabled when reconnecting with isSupported true', () => {
      render(<MicButton {...defaultProps} connectionState="reconnecting" />);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('is not disabled when disconnected with isSupported true', () => {
      render(<MicButton {...defaultProps} connectionState="disconnected" />);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('is not disabled when connected with isSupported true', () => {
      render(<MicButton {...defaultProps} connectionState="connected" />);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('onClick', () => {
    it('fires onToggle when clicked', () => {
      const onToggle = jest.fn();
      render(<MicButton {...defaultProps} onToggle={onToggle} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('does not fire onToggle when disabled', () => {
      const onToggle = jest.fn();
      render(<MicButton {...defaultProps} onToggle={onToggle} isSupported={false} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('applies pulse animation when loading', () => {
      const { container } = render(<MicButton {...defaultProps} connectionState="connecting" />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('animate-pulse');
    });

    it('applies red gradient when connected', () => {
      const { container } = render(<MicButton {...defaultProps} connectionState="connected" />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('from-red-500');
    });

    it('applies custom micGradient when disconnected', () => {
      const { container } = render(<MicButton {...defaultProps} micGradient="from-pink-500 to-rose-700" />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('from-pink-500 to-rose-700');
    });

    it('uses default purple gradient when micGradient not provided', () => {
      const { container } = render(<MicButton {...defaultProps} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('from-purple-500');
    });

    it('applies opacity when not supported', () => {
      const { container } = render(<MicButton {...defaultProps} isSupported={false} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('opacity-30');
      expect(button?.className).toContain('cursor-not-allowed');
    });

    it('does not apply opacity when supported', () => {
      const { container } = render(<MicButton {...defaultProps} isSupported={true} />);
      const button = container.querySelector('button');
      expect(button?.className).not.toContain('opacity-30');
    });
  });
});
