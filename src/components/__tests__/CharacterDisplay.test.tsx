import { render, screen } from '@testing-library/react';
import CharacterDisplay, { resolveImage } from '../CharacterDisplay';
import { VoiceState } from '@/types/chat';
import { CharacterStateImages } from '@/types/character';
import { mewtwo } from '@/lib/characters/mewtwo';
import { kirby } from '@/lib/characters/kirby';

describe('CharacterDisplay', () => {
  describe('rendering', () => {
    it('should render the character image with correct alt text', () => {
      render(<CharacterDisplay character={mewtwo} state="idle" />);
      expect(screen.getByAltText('Mewtwo')).toBeInTheDocument();
    });

    it('should render the aura element', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="idle" />);
      expect(container.querySelector('.blur-3xl')).toBeInTheDocument();
    });

    it('should render with Kirby character', () => {
      render(<CharacterDisplay character={kirby} state="idle" />);
      expect(screen.getByAltText('Kirby')).toBeInTheDocument();
    });
  });

  describe('animation classes', () => {
    it('should apply float animation when idle', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="idle" />);
      expect(container.querySelector('.mewtwo-float')).toBeInTheDocument();
    });

    it('should apply listen animation when listening', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="listening" />);
      expect(container.querySelector('.mewtwo-listen')).toBeInTheDocument();
    });

    it('should apply speak animation when speaking', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="speaking" />);
      expect(container.querySelector('.mewtwo-speak')).toBeInTheDocument();
    });

    it('should apply think animation when processing', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="processing" />);
      expect(container.querySelector('.mewtwo-think')).toBeInTheDocument();
    });
  });

  describe('aura effects', () => {
    it('should apply idle aura class when idle', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="idle" />);
      expect(container.querySelector('.mewtwo-aura-idle')).toBeInTheDocument();
    });

    it('should apply listening aura class when listening', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="listening" />);
      expect(container.querySelector('.mewtwo-aura-listening')).toBeInTheDocument();
    });

    it('should apply speaking aura class when speaking', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="speaking" />);
      expect(container.querySelector('.mewtwo-aura-speaking')).toBeInTheDocument();
    });

    it('should apply processing aura class when processing', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="processing" />);
      expect(container.querySelector('.mewtwo-aura-processing')).toBeInTheDocument();
    });

    it('uses character-specific aura colors', () => {
      const { container } = render(<CharacterDisplay character={kirby} state="speaking" />);
      const aura = container.querySelector('.blur-3xl') as HTMLElement;
      expect(aura.style.background).toBe(kirby.theme.aura.speaking);
    });
  });

  describe('voice state ring indicator', () => {
    it('should not show ring when idle and connected', () => {
      render(<CharacterDisplay character={mewtwo} state="idle" connectionState="connected" />);
      expect(screen.queryByTestId('voice-ring')).not.toBeInTheDocument();
    });

    it('should not show ring when disconnected', () => {
      render(<CharacterDisplay character={mewtwo} state="listening" connectionState="disconnected" />);
      expect(screen.queryByTestId('voice-ring')).not.toBeInTheDocument();
    });

    it('should not show ring when connectionState is not provided', () => {
      render(<CharacterDisplay character={mewtwo} state="listening" />);
      expect(screen.queryByTestId('voice-ring')).not.toBeInTheDocument();
    });

    it('should show ring when listening and connected', () => {
      render(<CharacterDisplay character={mewtwo} state="listening" connectionState="connected" />);
      expect(screen.getByTestId('voice-ring')).toBeInTheDocument();
    });

    it('should show ring when speaking and connected', () => {
      render(<CharacterDisplay character={mewtwo} state="speaking" connectionState="connected" />);
      expect(screen.getByTestId('voice-ring')).toBeInTheDocument();
    });

    it('should show ring when processing and connected', () => {
      render(<CharacterDisplay character={mewtwo} state="processing" connectionState="connected" />);
      expect(screen.getByTestId('voice-ring')).toBeInTheDocument();
    });

    it('uses character-specific ring colors', () => {
      const { container } = render(<CharacterDisplay character={kirby} state="speaking" connectionState="connected" />);
      expect(container.querySelector('.bg-pink-400')).toBeInTheDocument();
    });

    it('should use fast ring animation when speaking', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="speaking" connectionState="connected" />);
      expect(container.querySelector('.voice-ring-fast')).toBeInTheDocument();
    });

    it('should use normal ring animation when listening', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="listening" connectionState="connected" />);
      expect(container.querySelector('.voice-ring')).toBeInTheDocument();
      expect(container.querySelector('.voice-ring-fast')).not.toBeInTheDocument();
    });
  });

  describe('state transitions', () => {
    it('should update animation when state changes', () => {
      const { container, rerender } = render(<CharacterDisplay character={mewtwo} state="idle" />);
      expect(container.querySelector('.mewtwo-float')).toBeInTheDocument();

      rerender(<CharacterDisplay character={mewtwo} state="listening" />);
      expect(container.querySelector('.mewtwo-listen')).toBeInTheDocument();
      expect(container.querySelector('.mewtwo-float')).not.toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should use flexbox column layout', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="idle" />);
      expect(container.querySelector('.flex.flex-col')).toBeInTheDocument();
    });

    it('should center content', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="idle" />);
      expect(container.querySelector('.items-center.justify-center')).toBeInTheDocument();
    });

    it('should have hero-sized image', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="idle" />);
      expect(container.querySelector('.w-64.md\\:w-80.lg\\:w-96')).toBeInTheDocument();
    });

    it('should have larger aura with -inset-8', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="idle" />);
      expect(container.querySelector('.-inset-8')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply drop shadow to image', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state="idle" />);
      expect(container.querySelector('.drop-shadow-2xl')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle unknown state values', () => {
      const { container } = render(<CharacterDisplay character={mewtwo} state={'unknown' as VoiceState} />);
      expect(container.querySelector('.mewtwo-float')).not.toBeInTheDocument();
      expect(screen.getByAltText('Mewtwo')).toBeInTheDocument();
    });

    it('should maintain structure across all states', () => {
      const states: VoiceState[] = ['idle', 'listening', 'speaking', 'processing'];
      states.forEach(state => {
        const { container, unmount } = render(<CharacterDisplay character={mewtwo} state={state} />);
        expect(container.querySelector(`img[alt="Mewtwo"]`)).toBeInTheDocument();
        unmount();
      });
    });
  });
});

describe('resolveImage', () => {
  const stateImages: CharacterStateImages = {
    idle: '/mewtwo/mewtwo.png',
    listening: '/mewtwo/mewtwo.png',
    speaking: '/mewtwo/mega-mewtwo-y.png',
    processing: '/mewtwo/mewtwo-attack.png',
  };

  it('returns the string directly for string images', () => {
    expect(resolveImage('/kirby/kirby.png', 'idle')).toBe('/kirby/kirby.png');
    expect(resolveImage('/kirby/kirby.png', 'speaking')).toBe('/kirby/kirby.png');
  });

  it('returns idle image for idle state', () => {
    expect(resolveImage(stateImages, 'idle')).toBe('/mewtwo/mewtwo.png');
  });

  it('returns listening image for listening state', () => {
    expect(resolveImage(stateImages, 'listening')).toBe('/mewtwo/mewtwo.png');
  });

  it('returns speaking image for speaking state', () => {
    expect(resolveImage(stateImages, 'speaking')).toBe('/mewtwo/mega-mewtwo-y.png');
  });

  it('returns processing image for processing state', () => {
    expect(resolveImage(stateImages, 'processing')).toBe('/mewtwo/mewtwo-attack.png');
  });

  it('falls back to idle when state image is not defined', () => {
    const partial: CharacterStateImages = { idle: '/char/idle.png' };
    expect(resolveImage(partial, 'speaking')).toBe('/char/idle.png');
    expect(resolveImage(partial, 'processing')).toBe('/char/idle.png');
  });
});
