import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoiceChat from '../VoiceChat';

// Mock child components
jest.mock('../MewtwoCharacter', () => {
  return function MockMewtwoCharacter({ state }: { state: string }) {
    return <div data-testid="mewtwo-character" data-state={state}>Mewtwo</div>;
  };
});

jest.mock('../ChatBubble', () => {
  return function MockChatBubble({ message }: any) {
    return (
      <div data-testid="chat-bubble" data-role={message.role}>
        {message.content}
      </div>
    );
  };
});

jest.mock('../StoryTimeButton', () => {
  return function MockStoryTimeButton({ onToggle, isStoryMode }: any) {
    return (
      <button
        data-testid="story-time-button"
        onClick={() => onToggle(!isStoryMode)}
      >
        {isStoryMode ? 'Exit Story' : 'Story Time'}
      </button>
    );
  };
});

// Mock useGeminiLive hook
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockClearHistory = jest.fn();
const mockSwitchStoryMode = jest.fn();

const mockUseGeminiLive = jest.fn(() => ({
  voiceState: 'idle',
  connectionState: 'disconnected',
  messages: [],
  error: null,
  isSupported: true,
  isStoryMode: false,
  connect: mockConnect,
  disconnect: mockDisconnect,
  clearHistory: mockClearHistory,
  switchStoryMode: mockSwitchStoryMode,
}));

jest.mock('@/hooks/useGeminiLive', () => ({
  useGeminiLive: () => mockUseGeminiLive(),
}));

describe('VoiceChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock scrollIntoView (not implemented in jsdom)
    Element.prototype.scrollIntoView = jest.fn();

    mockUseGeminiLive.mockReturnValue({
      voiceState: 'idle',
      connectionState: 'disconnected',
      messages: [],
      error: null,
      isSupported: true,
      isStoryMode: false,
      connect: mockConnect,
      disconnect: mockDisconnect,
      clearHistory: mockClearHistory,
      switchStoryMode: mockSwitchStoryMode,
    });
  });

  describe('rendering', () => {
    it('renders header with title', () => {
      render(<VoiceChat />);
      expect(screen.getByText('Talk with Mewtwo')).toBeInTheDocument();
    });

    it('renders Clear History button', () => {
      render(<VoiceChat />);
      expect(screen.getByText('Clear History')).toBeInTheDocument();
    });

    it('renders Mewtwo character', () => {
      render(<VoiceChat />);
      expect(screen.getByTestId('mewtwo-character')).toBeInTheDocument();
    });

    it('renders story time button', () => {
      render(<VoiceChat />);
      expect(screen.getByTestId('story-time-button')).toBeInTheDocument();
    });

    it('renders connect button when disconnected', () => {
      render(<VoiceChat />);
      const button = screen.getByRole('button', { name: /🎤/i });
      expect(button).toBeInTheDocument();
    });

    it('shows placeholder text when no messages', () => {
      render(<VoiceChat />);
      expect(
        screen.getByText(/Press the connect button to start talking with Mewtwo/i)
      ).toBeInTheDocument();
    });

    it('renders chat messages when they exist', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'disconnected',
        messages: [
          { id: '1', role: 'user', content: 'Hello Mewtwo', timestamp: 1 },
          { id: '2', role: 'assistant', content: 'Greetings trainer', timestamp: 2 },
        ],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const bubbles = screen.getAllByTestId('chat-bubble');
      expect(bubbles).toHaveLength(2);
    });
  });

  describe('connection states', () => {
    it('shows microphone emoji when disconnected', () => {
      render(<VoiceChat />);
      expect(screen.getByText('🎤')).toBeInTheDocument();
    });

    it('shows stop emoji when connected', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      expect(screen.getByText('🛑')).toBeInTheDocument();
    });

    it('shows ... when connecting', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'connecting',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('shows ... when reconnecting', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'reconnecting',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('applies yellow pulse animation when reconnecting', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'reconnecting',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const button = screen.getByRole('button', { name: /\.\.\./i });
      expect(button).toHaveClass('bg-yellow-500');
      expect(button).toHaveClass('animate-pulse');
    });

    it('applies yellow pulse animation when connecting', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'connecting',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const button = screen.getByRole('button', { name: /\.\.\./i });
      expect(button).toHaveClass('bg-yellow-500');
      expect(button).toHaveClass('animate-pulse');
    });

    it('applies red background when connected', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const button = screen.getByRole('button', { name: /🛑/i });
      expect(button).toHaveClass('bg-red-500');
    });

    it('applies blue background when disconnected', () => {
      render(<VoiceChat />);
      const button = screen.getByRole('button', { name: /🎤/i });
      expect(button).toHaveClass('bg-blue-500');
    });
  });

  describe('reconnecting UI state', () => {
    it('shows yellow error banner when reconnecting', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'reconnecting',
        messages: [],
        error: 'Connection lost — reconnecting...',
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const errorBanner = screen.getByText('Connection lost — reconnecting...');
      expect(errorBanner).toHaveClass('text-yellow-700');
      expect(errorBanner.parentElement).toHaveClass('bg-yellow-50');
    });

    it('shows red error banner when in error state', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'error',
        messages: [],
        error: 'Connection lost. Please try again.',
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const errorBanner = screen.getByText('Connection lost. Please try again.');
      expect(errorBanner).toHaveClass('text-red-600');
      expect(errorBanner.parentElement).toHaveClass('bg-red-50');
    });

    it('does not show error banner when no error', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      expect(screen.queryByText(/Connection lost/i)).not.toBeInTheDocument();
    });

    it('calls disconnect when clicking button during reconnecting', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'reconnecting',
        messages: [],
        error: 'Connection lost — reconnecting...',
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const button = screen.getByRole('button', { name: /\.\.\./i });
      fireEvent.click(button);

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(mockConnect).not.toHaveBeenCalled();
    });
  });

  describe('voice state indicator', () => {
    it('shows "Connected" when idle and connected', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('shows "Listening..." when listening', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'listening',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      expect(screen.getByText('Listening...')).toBeInTheDocument();
    });

    it('shows "Mewtwo is speaking..." when speaking', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'speaking',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      expect(screen.getByText('Mewtwo is speaking...')).toBeInTheDocument();
    });

    it('does not show voice state indicator when disconnected', () => {
      render(<VoiceChat />);
      expect(screen.queryByText('Connected')).not.toBeInTheDocument();
      expect(screen.queryByText('Listening...')).not.toBeInTheDocument();
      expect(screen.queryByText('Mewtwo is speaking...')).not.toBeInTheDocument();
    });

    it('applies green styling when listening', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'listening',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const indicator = screen.getByText('Listening...');
      expect(indicator).toHaveClass('bg-green-100');
      expect(indicator).toHaveClass('text-green-700');
    });

    it('applies purple styling when speaking', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'speaking',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const indicator = screen.getByText('Mewtwo is speaking...');
      expect(indicator).toHaveClass('bg-purple-100');
      expect(indicator).toHaveClass('text-purple-700');
    });

    it('applies gray styling when idle', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const indicator = screen.getByText('Connected');
      expect(indicator).toHaveClass('bg-gray-100');
      expect(indicator).toHaveClass('text-gray-600');
    });
  });

  describe('user interactions', () => {
    it('calls connect when clicking microphone button', () => {
      render(<VoiceChat />);
      const button = screen.getByRole('button', { name: /🎤/i });
      fireEvent.click(button);

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('calls disconnect when clicking stop button', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const button = screen.getByRole('button', { name: /🛑/i });
      fireEvent.click(button);

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('calls clearHistory when clicking Clear History button', () => {
      render(<VoiceChat />);
      const button = screen.getByText('Clear History');
      fireEvent.click(button);

      expect(mockClearHistory).toHaveBeenCalledTimes(1);
    });

    it('calls switchStoryMode when toggling story button', () => {
      render(<VoiceChat />);
      const button = screen.getByTestId('story-time-button');
      fireEvent.click(button);

      expect(mockSwitchStoryMode).toHaveBeenCalledTimes(1);
    });

    it('disables connect button when not supported', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'disconnected',
        messages: [],
        error: null,
        isSupported: false,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const button = screen.getByRole('button', { name: /🎤/i });
      expect(button).toBeDisabled();
    });

    it('disables connect button when connecting', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'connecting',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const button = screen.getByRole('button', { name: /\.\.\./i });
      expect(button).toBeDisabled();
    });

    it('shows browser support warning when not supported', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'disconnected',
        messages: [],
        error: null,
        isSupported: false,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      expect(
        screen.getByText(/Microphone is not supported in your browser/i)
      ).toBeInTheDocument();
    });
  });

  describe('Mewtwo character state', () => {
    it('passes idle state to Mewtwo character when disconnected', () => {
      render(<VoiceChat />);
      const character = screen.getByTestId('mewtwo-character');
      expect(character).toHaveAttribute('data-state', 'idle');
    });

    it('passes listening state to Mewtwo character', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'listening',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const character = screen.getByTestId('mewtwo-character');
      expect(character).toHaveAttribute('data-state', 'listening');
    });

    it('passes speaking state to Mewtwo character', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'speaking',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      const character = screen.getByTestId('mewtwo-character');
      expect(character).toHaveAttribute('data-state', 'speaking');
    });
  });

  describe('message placeholder text', () => {
    it('shows connected placeholder when connected', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'connected',
        messages: [],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat />);
      expect(
        screen.getByText('Start talking! Mewtwo is listening...')
      ).toBeInTheDocument();
    });

    it('shows disconnected placeholder when disconnected', () => {
      render(<VoiceChat />);
      expect(
        screen.getByText(/Press the connect button to start talking with Mewtwo/i)
      ).toBeInTheDocument();
    });
  });

  describe('auto-scroll behavior', () => {
    it('calls scrollIntoView when messages change', async () => {
      const scrollIntoViewMock = jest.fn();

      const { rerender } = render(<VoiceChat />);

      // Add messages
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'connected',
        messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: 1 }],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      // Replace the mock with our spy
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      rerender(<VoiceChat />);

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });
  });
});
