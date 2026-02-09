import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock VoiceChat
jest.mock('@/components/VoiceChat', () => {
  return function MockVoiceChat({ character, onBack }: any) {
    return (
      <div data-testid="voice-chat">
        <span data-testid="voice-chat-character">{character.name}</span>
        <button data-testid="voice-chat-back" onClick={onBack}>Back</button>
      </div>
    );
  };
});

// Mock CharacterSelect
jest.mock('@/components/CharacterSelect', () => {
  return function MockCharacterSelect({ onSelect }: any) {
    return (
      <div data-testid="character-select">
        <button data-testid="select-mewtwo" onClick={() => onSelect('mewtwo')}>Mewtwo</button>
        <button data-testid="select-kirby" onClick={() => onSelect('kirby')}>Kirby</button>
      </div>
    );
  };
});

// Mock useSwipeGesture
jest.mock('@/hooks/useSwipeGesture', () => ({
  useSwipeGesture: jest.fn(() => ({
    handlers: {},
    offsetX: 0,
    isSwiping: false,
  })),
}));

import Home from '../page';

describe('Home page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('hydration', () => {
    it('renders CharacterSelect after hydration', () => {
      render(<Home />);
      expect(screen.getByTestId('character-select')).toBeInTheDocument();
    });
  });

  describe('character selection', () => {
    it('shows CharacterSelect when no character is selected', () => {
      render(<Home />);
      expect(screen.getByTestId('character-select')).toBeInTheDocument();
      expect(screen.queryByTestId('voice-chat')).not.toBeInTheDocument();
    });

    it('shows VoiceChat when a character is selected', () => {
      render(<Home />);
      fireEvent.click(screen.getByTestId('select-mewtwo'));
      expect(screen.getByTestId('voice-chat')).toBeInTheDocument();
      expect(screen.getByTestId('voice-chat-character')).toHaveTextContent('Mewtwo');
    });

    it('switches to another character', () => {
      render(<Home />);
      fireEvent.click(screen.getByTestId('select-kirby'));
      expect(screen.getByTestId('voice-chat-character')).toHaveTextContent('Kirby');
    });
  });

  describe('localStorage persistence', () => {
    it('persists selected character to localStorage', () => {
      render(<Home />);
      fireEvent.click(screen.getByTestId('select-mewtwo'));
      expect(localStorage.getItem('selected-character-id')).toBe('mewtwo');
    });

    it('loads persisted character on mount', () => {
      localStorage.setItem('selected-character-id', 'mewtwo');
      render(<Home />);
      expect(screen.getByTestId('voice-chat')).toBeInTheDocument();
      expect(screen.getByTestId('voice-chat-character')).toHaveTextContent('Mewtwo');
    });

    it('ignores invalid persisted character id', () => {
      localStorage.setItem('selected-character-id', 'pikachu');
      render(<Home />);
      expect(screen.getByTestId('character-select')).toBeInTheDocument();
    });

    it('clears localStorage when going back', () => {
      render(<Home />);
      fireEvent.click(screen.getByTestId('select-mewtwo'));
      fireEvent.click(screen.getByTestId('voice-chat-back'));
      expect(localStorage.getItem('selected-character-id')).toBeNull();
      expect(screen.getByTestId('character-select')).toBeInTheDocument();
    });
  });
});
