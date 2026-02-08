import { render, screen, fireEvent } from '@testing-library/react';
import VoiceChat from '../VoiceChat';

// Mock child components
jest.mock('../MewtwoCharacter', () => {
  return function MockMewtwoCharacter({ state, connectionState }: { state: string; connectionState?: string }) {
    return <div data-testid="mewtwo-character" data-state={state} data-connection={connectionState}>Mewtwo</div>;
  };
});

jest.mock('../MicButton', () => {
  return function MockMicButton({ connectionState, isSupported, onToggle }: any) {
    return (
      <button
        data-testid="mic-button"
        data-connection={connectionState}
        disabled={!isSupported}
        onClick={onToggle}
        aria-label={connectionState === 'connected' ? 'Stop talking' : 'Start talking'}
      >
        mic
      </button>
    );
  };
});

jest.mock('../ChatPeek', () => {
  return function MockChatPeek({ messages, onOpen }: any) {
    if (!messages.length) return null;
    return (
      <button data-testid="chat-peek" onClick={onOpen}>
        {messages[messages.length - 1].content}
      </button>
    );
  };
});

jest.mock('../ChatDrawer', () => {
  return function MockChatDrawer({ messages, isOpen, onClose, onClearHistory }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="chat-drawer">
        <button data-testid="drawer-close" onClick={onClose}>Close</button>
        <button data-testid="drawer-clear" onClick={onClearHistory}>Clear</button>
        <div data-testid="drawer-messages">{messages.length} messages</div>
      </div>
    );
  };
});

jest.mock('../SettingsMenu', () => {
  return function MockSettingsMenu({ onClearHistory }: any) {
    return (
      <button data-testid="settings-menu" onClick={onClearHistory} aria-label="Settings">
        settings
      </button>
    );
  };
});

jest.mock('../StoryTimeButton', () => {
  return function MockStoryTimeButton({ onToggle, isStoryMode }: any) {
    return (
      <button
        data-testid="story-time-button"
        onClick={() => onToggle(!isStoryMode)}
        aria-label={isStoryMode ? 'Exit story mode' : 'Start story mode'}
      >
        story
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
    it('renders Mewtwo character', () => {
      render(<VoiceChat />);
      expect(screen.getByTestId('mewtwo-character')).toBeInTheDocument();
    });

    it('renders mic button', () => {
      render(<VoiceChat />);
      expect(screen.getByTestId('mic-button')).toBeInTheDocument();
    });

    it('renders settings menu', () => {
      render(<VoiceChat />);
      expect(screen.getByTestId('settings-menu')).toBeInTheDocument();
    });

    it('renders story time button', () => {
      render(<VoiceChat />);
      expect(screen.getByTestId('story-time-button')).toBeInTheDocument();
    });

    it('does not render chat peek when no messages', () => {
      render(<VoiceChat />);
      expect(screen.queryByTestId('chat-peek')).not.toBeInTheDocument();
    });

    it('renders chat peek when messages exist', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'disconnected',
        messages: [
          { id: '1', role: 'user', content: 'Hello Mewtwo', timestamp: 1 },
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
      expect(screen.getByTestId('chat-peek')).toBeInTheDocument();
    });

    it('does not show header title or Clear History button', () => {
      render(<VoiceChat />);
      expect(screen.queryByText('Talk with Mewtwo')).not.toBeInTheDocument();
      expect(screen.queryByText('Clear History')).not.toBeInTheDocument();
    });

    it('does not show placeholder text', () => {
      render(<VoiceChat />);
      expect(screen.queryByText(/Press the connect button/i)).not.toBeInTheDocument();
    });

    it('does not show voice state text pills', () => {
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
      expect(screen.queryByText('Listening...')).not.toBeInTheDocument();
      expect(screen.queryByText('Mewtwo is speaking...')).not.toBeInTheDocument();
      expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    });

    it('uses dark background', () => {
      const { container } = render(<VoiceChat />);
      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain('from-mewtwo-bg-deep');
      expect(root.className).toContain('to-mewtwo-bg-mid');
    });
  });

  describe('connection behavior', () => {
    it('calls connect when clicking mic button while disconnected', () => {
      render(<VoiceChat />);
      fireEvent.click(screen.getByTestId('mic-button'));
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('calls disconnect when clicking mic button while connected', () => {
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
      fireEvent.click(screen.getByTestId('mic-button'));
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('calls disconnect when clicking mic button while reconnecting', () => {
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
      fireEvent.click(screen.getByTestId('mic-button'));
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('disables mic button when not supported', () => {
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
      expect(screen.getByTestId('mic-button')).toBeDisabled();
    });
  });

  describe('Mewtwo character state', () => {
    it('passes idle state to Mewtwo character when disconnected', () => {
      render(<VoiceChat />);
      const character = screen.getByTestId('mewtwo-character');
      expect(character).toHaveAttribute('data-state', 'idle');
    });

    it('passes connectionState to Mewtwo character', () => {
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
      expect(character).toHaveAttribute('data-connection', 'connected');
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

  describe('error display', () => {
    it('shows error banner when reconnecting', () => {
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
      expect(screen.getByText('Connection lost — reconnecting...')).toBeInTheDocument();
    });

    it('shows error banner in error state', () => {
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
      expect(screen.getByText('Connection lost. Please try again.')).toBeInTheDocument();
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
  });

  describe('chat drawer', () => {
    it('does not show chat drawer by default', () => {
      render(<VoiceChat />);
      expect(screen.queryByTestId('chat-drawer')).not.toBeInTheDocument();
    });

    it('opens chat drawer when clicking chat peek', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'disconnected',
        messages: [
          { id: '1', role: 'assistant', content: 'Hello trainer', timestamp: 1 },
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
      fireEvent.click(screen.getByTestId('chat-peek'));
      expect(screen.getByTestId('chat-drawer')).toBeInTheDocument();
    });

    it('closes chat drawer when clicking close', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'disconnected',
        messages: [
          { id: '1', role: 'assistant', content: 'Hello trainer', timestamp: 1 },
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
      fireEvent.click(screen.getByTestId('chat-peek'));
      expect(screen.getByTestId('chat-drawer')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('drawer-close'));
      expect(screen.queryByTestId('chat-drawer')).not.toBeInTheDocument();
    });

    it('calls clearHistory from drawer', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'disconnected',
        messages: [
          { id: '1', role: 'assistant', content: 'Hello trainer', timestamp: 1 },
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
      fireEvent.click(screen.getByTestId('chat-peek'));
      fireEvent.click(screen.getByTestId('drawer-clear'));
      expect(mockClearHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('settings and story mode', () => {
    it('calls clearHistory from settings menu', () => {
      render(<VoiceChat />);
      fireEvent.click(screen.getByTestId('settings-menu'));
      expect(mockClearHistory).toHaveBeenCalledTimes(1);
    });

    it('calls switchStoryMode when toggling story button', () => {
      render(<VoiceChat />);
      fireEvent.click(screen.getByTestId('story-time-button'));
      expect(mockSwitchStoryMode).toHaveBeenCalledTimes(1);
    });
  });
});
