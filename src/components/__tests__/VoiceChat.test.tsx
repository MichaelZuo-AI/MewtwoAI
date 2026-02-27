import { render, screen, fireEvent, act } from '@testing-library/react';
import VoiceChat from '../VoiceChat';
import { mewtwo } from '@/lib/characters/mewtwo';
import { kirby } from '@/lib/characters/kirby';

// Mock child components
jest.mock('../CharacterDisplay', () => {
  return function MockCharacterDisplay({ character, state, connectionState }: any) {
    return <div data-testid="character-display" data-state={state} data-connection={connectionState} data-character={character.id}>{character.name}</div>;
  };
});

jest.mock('../MicButton', () => {
  return function MockMicButton({ connectionState, isSupported, onToggle, micGradient }: any) {
    return (
      <button
        data-testid="mic-button"
        data-connection={connectionState}
        data-gradient={micGradient}
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
  return function MockChatPeek({ messages, onOpen, characterName }: any) {
    if (!messages.length) return null;
    return (
      <button data-testid="chat-peek" data-character-name={characterName} onClick={onOpen}>
        {messages[messages.length - 1].content}
      </button>
    );
  };
});

jest.mock('../ChatDrawer', () => {
  return function MockChatDrawer({ messages, isOpen, onClose, onClearHistory, bgColor }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="chat-drawer" data-bg={bgColor}>
        <button data-testid="drawer-close" onClick={onClose}>Close</button>
        <button data-testid="drawer-clear" onClick={onClearHistory}>Clear</button>
        <div data-testid="drawer-messages">{messages.length} messages</div>
      </div>
    );
  };
});

jest.mock('../SettingsMenu', () => {
  return function MockSettingsMenu({ onClearHistory, bgColor }: any) {
    return (
      <button data-testid="settings-menu" data-bg={bgColor} onClick={onClearHistory} aria-label="Settings">
        settings
      </button>
    );
  };
});

jest.mock('../CharacterDots', () => {
  return function MockCharacterDots({ characters, activeId }: any) {
    return (
      <div data-testid="character-dots" data-active={activeId} data-count={characters.length}>
        dots
      </div>
    );
  };
});

jest.mock('../CameraButton', () => {
  return function MockCameraButton({ onCapture, disabled }: any) {
    return (
      <button
        data-testid="camera-button"
        onClick={onCapture}
        disabled={disabled}
        aria-label="Scan Pokemon card"
      >
        camera
      </button>
    );
  };
});

jest.mock('../CameraOverlay', () => {
  return function MockCameraOverlay({ onCapture, onDismiss }: any) {
    return (
      <div data-testid="camera-overlay">
        <button data-testid="camera-overlay-capture" onClick={onCapture}>capture</button>
        <button data-testid="camera-overlay-dismiss" onClick={onDismiss}>dismiss</button>
      </div>
    );
  };
});

jest.mock('@/lib/imageUtils', () => ({
  resizeImage: jest.fn(() => Promise.resolve({ base64: 'test-base64', mimeType: 'image/jpeg' })),
}));

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
const mockSendImage = jest.fn();
const mockResetCameraRequest = jest.fn();
const mockOnBack = jest.fn();

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
  sendImage: mockSendImage,
  cameraRequested: false,
  resetCameraRequest: mockResetCameraRequest,
}));

jest.mock('@/hooks/useGeminiLive', () => ({
  useGeminiLive: (...args: any[]) => mockUseGeminiLive(...args),
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
      sendImage: mockSendImage,
      cameraRequested: false,
      resetCameraRequest: mockResetCameraRequest,
    });
  });

  describe('rendering', () => {
    it('renders character display', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('character-display')).toBeInTheDocument();
    });

    it('renders mic button', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('mic-button')).toBeInTheDocument();
    });

    it('renders settings menu', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('settings-menu')).toBeInTheDocument();
    });

    it('renders story time button', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('story-time-button')).toBeInTheDocument();
    });

    it('renders back button', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByLabelText('Back to character select')).toBeInTheDocument();
    });

    it('renders character dots', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      const dots = screen.getByTestId('character-dots');
      expect(dots).toBeInTheDocument();
      expect(dots).toHaveAttribute('data-active', 'mewtwo');
    });

    it('does not render chat peek when no messages', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
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

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('chat-peek')).toBeInTheDocument();
    });

    it('uses character theme for background', () => {
      const { container } = render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      const root = container.firstChild as HTMLElement;
      expect(root.style.background).toContain(mewtwo.theme.bgDeep);
      expect(root.style.background).toContain(mewtwo.theme.bgMid);
    });
  });

  describe('character prop passing', () => {
    it('passes character to CharacterDisplay', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('character-display')).toHaveAttribute('data-character', 'mewtwo');
    });

    it('passes character name to ChatPeek', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'disconnected',
        messages: [{ id: '1', role: 'assistant', content: 'Hi', timestamp: 1 }],
        error: null,
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
      });

      render(<VoiceChat character={kirby} onBack={mockOnBack} />);
      expect(screen.getByTestId('chat-peek')).toHaveAttribute('data-character-name', 'Kirby');
    });

    it('passes micGradient to MicButton', () => {
      render(<VoiceChat character={kirby} onBack={mockOnBack} />);
      expect(screen.getByTestId('mic-button')).toHaveAttribute('data-gradient', kirby.theme.micGradient);
    });

    it('passes bgColor to SettingsMenu', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('settings-menu')).toHaveAttribute('data-bg', mewtwo.theme.bgMid);
    });

    it('passes character to useGeminiLive', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(mockUseGeminiLive).toHaveBeenCalledWith(mewtwo);
    });
  });

  describe('back button', () => {
    it('calls onBack when clicking back button', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      fireEvent.click(screen.getByLabelText('Back to character select'));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('connection behavior', () => {
    it('calls connect when clicking mic button while disconnected', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
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

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
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

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
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

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('mic-button')).toBeDisabled();
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

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
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

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
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

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.queryByText(/Connection lost/i)).not.toBeInTheDocument();
    });
  });

  describe('chat drawer', () => {
    it('does not show chat drawer by default', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
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

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
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

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
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

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      fireEvent.click(screen.getByTestId('chat-peek'));
      fireEvent.click(screen.getByTestId('drawer-clear'));
      expect(mockClearHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('camera button (Mewtwo only)', () => {
    it('renders camera button for Mewtwo', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('camera-button')).toBeInTheDocument();
    });

    it('does not render camera button for Kirby', () => {
      render(<VoiceChat character={kirby} onBack={mockOnBack} />);
      expect(screen.queryByTestId('camera-button')).not.toBeInTheDocument();
    });

    it('disables camera button when disconnected', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('camera-button')).toBeDisabled();
    });

    it('disables camera button when reconnecting', () => {
      mockUseGeminiLive.mockReturnValue({
        voiceState: 'idle',
        connectionState: 'reconnecting',
        messages: [],
        error: 'Reconnecting...',
        isSupported: true,
        isStoryMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        clearHistory: mockClearHistory,
        switchStoryMode: mockSwitchStoryMode,
        sendImage: mockSendImage,
      });

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('camera-button')).toBeDisabled();
    });

    it('enables camera button when connected', () => {
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
        sendImage: mockSendImage,
      });

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('camera-button')).not.toBeDisabled();
    });
  });

  describe('hidden file input (Mewtwo only)', () => {
    it('renders hidden file input for Mewtwo', () => {
      const { container } = render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    it('does not render hidden file input for Kirby', () => {
      const { container } = render(<VoiceChat character={kirby} onBack={mockOnBack} />);
      const input = container.querySelector('input[type="file"]');
      expect(input).not.toBeInTheDocument();
    });

    it('file input accepts images', () => {
      const { container } = render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.accept).toBe('image/*');
    });

    it('file input does not force camera capture (allows gallery picker)', () => {
      const { container } = render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      const input = container.querySelector('input[type="file"]');
      expect(input?.getAttribute('capture')).toBeNull();
    });

    it('file input is visually hidden', () => {
      const { container } = render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      const input = container.querySelector('input[type="file"]');
      expect(input?.className).toContain('hidden');
    });

    it('file input has aria-hidden attribute', () => {
      const { container } = render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      const input = container.querySelector('input[type="file"]');
      expect(input?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('handleFileSelected', () => {
    const { resizeImage: mockResizeImage } = require('@/lib/imageUtils');

    beforeEach(() => {
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
        sendImage: mockSendImage,
      });
    });

    it('calls resizeImage and then sendImage when a file is selected', async () => {
      const { container } = render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(['test'], 'card.jpg', { type: 'image/jpeg' });
      Object.defineProperty(input, 'files', { value: [file], configurable: true });

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      expect(mockResizeImage).toHaveBeenCalledWith(file);
      expect(mockSendImage).toHaveBeenCalledWith('test-base64', 'image/jpeg');
    });

    it('does nothing when no file is selected', async () => {
      const { container } = render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(input, { target: { files: [] } });
      });

      expect(mockResizeImage).not.toHaveBeenCalled();
      expect(mockSendImage).not.toHaveBeenCalled();
    });

    it('rejects non-image files', async () => {
      const { container } = render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(['test'], 'doc.pdf', { type: 'application/pdf' });

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      expect(mockResizeImage).not.toHaveBeenCalled();
      expect(mockSendImage).not.toHaveBeenCalled();
    });

    it('rejects files over 10MB', async () => {
      const { container } = render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });

      await act(async () => {
        fireEvent.change(input, { target: { files: [bigFile] } });
      });

      expect(mockResizeImage).not.toHaveBeenCalled();
      expect(mockSendImage).not.toHaveBeenCalled();
    });

    it('silently ignores resizeImage errors', async () => {
      mockResizeImage.mockRejectedValueOnce(new Error('Canvas context failed'));

      const { container } = render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(['test'], 'bad.jpg', { type: 'image/jpeg' });

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      // Should not throw and should not call sendImage
      expect(mockSendImage).not.toHaveBeenCalled();
    });
  });

  describe('settings and story mode', () => {
    it('calls clearHistory from settings menu', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      fireEvent.click(screen.getByTestId('settings-menu'));
      expect(mockClearHistory).toHaveBeenCalledTimes(1);
    });

    it('calls switchStoryMode when toggling story button', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      fireEvent.click(screen.getByTestId('story-time-button'));
      expect(mockSwitchStoryMode).toHaveBeenCalledTimes(1);
    });
  });

  describe('camera overlay (voice-triggered)', () => {
    it('does not render overlay by default', () => {
      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.queryByTestId('camera-overlay')).not.toBeInTheDocument();
    });

    it('renders overlay when cameraRequested + Mewtwo + connected', () => {
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
        sendImage: mockSendImage,
        cameraRequested: true,
        resetCameraRequest: mockResetCameraRequest,
      });

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.getByTestId('camera-overlay')).toBeInTheDocument();
    });

    it('does not render overlay for Kirby even when cameraRequested', () => {
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
        sendImage: mockSendImage,
        cameraRequested: true,
        resetCameraRequest: mockResetCameraRequest,
      });

      render(<VoiceChat character={kirby} onBack={mockOnBack} />);
      expect(screen.queryByTestId('camera-overlay')).not.toBeInTheDocument();
    });

    it('does not render overlay when disconnected even when cameraRequested', () => {
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
        sendImage: mockSendImage,
        cameraRequested: true,
        resetCameraRequest: mockResetCameraRequest,
      });

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      expect(screen.queryByTestId('camera-overlay')).not.toBeInTheDocument();
    });

    it('calls resetCameraRequest when overlay capture is tapped', () => {
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
        sendImage: mockSendImage,
        cameraRequested: true,
        resetCameraRequest: mockResetCameraRequest,
      });

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      fireEvent.click(screen.getByTestId('camera-overlay-capture'));
      expect(mockResetCameraRequest).toHaveBeenCalledTimes(1);
    });

    it('calls resetCameraRequest when overlay dismiss is tapped', () => {
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
        sendImage: mockSendImage,
        cameraRequested: true,
        resetCameraRequest: mockResetCameraRequest,
      });

      render(<VoiceChat character={mewtwo} onBack={mockOnBack} />);
      fireEvent.click(screen.getByTestId('camera-overlay-dismiss'));
      expect(mockResetCameraRequest).toHaveBeenCalledTimes(1);
    });
  });
});
