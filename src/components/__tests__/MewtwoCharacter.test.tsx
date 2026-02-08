import { render, screen } from '@testing-library/react'
import MewtwoCharacter from '../MewtwoCharacter'
import { VoiceState } from '@/types/chat'

describe('MewtwoCharacter', () => {
  describe('rendering', () => {
    it('should render the character container', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const character = container.querySelector('.rounded-full')
      expect(character).toBeInTheDocument()
    })

    it('should render the DNA emoji placeholder', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      expect(container.textContent).toContain('🧬')
    })

    it('should render psychic aura effect', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const aura = container.querySelector('.blur-xl')
      expect(aura).toBeInTheDocument()
    })
  })

  describe('state indicator text', () => {
    it('should show "Mewtwo is ready" when idle', () => {
      render(<MewtwoCharacter state="idle" />)

      expect(screen.getByText('Mewtwo is ready')).toBeInTheDocument()
    })

    it('should show "Mewtwo is listening..." when listening', () => {
      render(<MewtwoCharacter state="listening" />)

      expect(screen.getByText('Mewtwo is listening...')).toBeInTheDocument()
    })

    it('should show "Mewtwo is speaking..." when speaking', () => {
      render(<MewtwoCharacter state="speaking" />)

      expect(screen.getByText('Mewtwo is speaking...')).toBeInTheDocument()
    })

    it('should show "Mewtwo is thinking..." when processing', () => {
      render(<MewtwoCharacter state="processing" />)

      expect(screen.getByText('Mewtwo is thinking...')).toBeInTheDocument()
    })
  })

  describe('animation classes', () => {
    it('should apply float animation when idle', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const character = container.querySelector('.animate-float')
      expect(character).toBeInTheDocument()
    })

    it('should apply pulse and scale animation when listening', () => {
      const { container } = render(<MewtwoCharacter state="listening" />)

      const character = container.querySelector('.animate-pulse')
      expect(character).toBeInTheDocument()

      const scaled = container.querySelector('.scale-110')
      expect(scaled).toBeInTheDocument()
    })

    it('should apply bounce animation when speaking', () => {
      const { container } = render(<MewtwoCharacter state="speaking" />)

      const character = container.querySelector('.animate-bounce')
      expect(character).toBeInTheDocument()
    })

    it('should apply slow spin animation when processing', () => {
      const { container } = render(<MewtwoCharacter state="processing" />)

      const character = container.querySelector('.animate-spin-slow')
      expect(character).toBeInTheDocument()
    })
  })

  describe('glow color effects', () => {
    it('should apply purple shadow when idle', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const character = container.querySelector('.shadow-mewtwo-purple')
      expect(character).toBeInTheDocument()
    })

    it('should apply blue shadow when listening', () => {
      const { container } = render(<MewtwoCharacter state="listening" />)

      const character = container.querySelector('.shadow-blue-500')
      expect(character).toBeInTheDocument()
    })

    it('should apply purple shadow when speaking', () => {
      const { container } = render(<MewtwoCharacter state="speaking" />)

      const character = container.querySelector('.shadow-purple-500')
      expect(character).toBeInTheDocument()
    })

    it('should apply yellow shadow when processing', () => {
      const { container } = render(<MewtwoCharacter state="processing" />)

      const character = container.querySelector('.shadow-yellow-500')
      expect(character).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should apply gradient background', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const character = container.querySelector('.bg-gradient-to-br')
      expect(character).toBeInTheDocument()
    })

    it('should apply shadow effect', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const character = container.querySelector('.shadow-2xl')
      expect(character).toBeInTheDocument()
    })

    it('should apply transition effects', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const character = container.querySelector('.transition-all')
      expect(character).toBeInTheDocument()
    })

    it('should have responsive sizing', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const character = container.querySelector('.md\\:w-64')
      expect(character).toBeInTheDocument()
    })
  })

  describe('state indicator styling', () => {
    it('should style state text with Mewtwo purple', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const stateText = container.querySelector('.text-mewtwo-purple')
      expect(stateText).toBeInTheDocument()
    })

    it('should apply font weight to state text', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const stateText = container.querySelector('.font-semibold')
      expect(stateText).toBeInTheDocument()
    })

    it('should have responsive text size', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const stateText = container.querySelector('.md\\:text-xl')
      expect(stateText).toBeInTheDocument()
    })
  })

  describe('custom animations', () => {
    // styled-jsx is not processed in jsdom test environment,
    // so we verify animation classes are applied to elements instead

    it('should apply float animation class when idle', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const character = container.querySelector('.animate-float')
      expect(character).toBeInTheDocument()
    })

    it('should apply spin-slow animation class when processing', () => {
      const { container } = render(<MewtwoCharacter state="processing" />)

      const character = container.querySelector('.animate-spin-slow')
      expect(character).toBeInTheDocument()
    })

    it('should apply pulse animation class when listening', () => {
      const { container } = render(<MewtwoCharacter state="listening" />)

      const character = container.querySelector('.animate-pulse')
      expect(character).toBeInTheDocument()
    })

    it('should apply bounce animation class when speaking', () => {
      const { container } = render(<MewtwoCharacter state="speaking" />)

      const character = container.querySelector('.animate-bounce')
      expect(character).toBeInTheDocument()
    })
  })

  describe('aura effect', () => {
    it('should render psychic aura layer', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const aura = container.querySelector('.bg-mewtwo-purple.opacity-20')
      expect(aura).toBeInTheDocument()
    })

    it('should apply blur to aura', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const aura = container.querySelector('.blur-xl')
      expect(aura).toBeInTheDocument()
    })

    it('should animate aura', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const aura = container.querySelector('.animate-pulse')
      expect(aura).toBeInTheDocument()
    })

    it('should position aura absolutely', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const aura = container.querySelector('.absolute.inset-0')
      expect(aura).toBeInTheDocument()
    })
  })

  describe('state transitions', () => {
    it('should update animation when state changes', () => {
      const { container, rerender } = render(<MewtwoCharacter state="idle" />)

      expect(container.querySelector('.animate-float')).toBeInTheDocument()

      rerender(<MewtwoCharacter state="listening" />)

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
      expect(container.querySelector('.animate-float')).not.toBeInTheDocument()
    })

    it('should update text when state changes', () => {
      const { rerender } = render(<MewtwoCharacter state="idle" />)

      expect(screen.getByText('Mewtwo is ready')).toBeInTheDocument()

      rerender(<MewtwoCharacter state="speaking" />)

      expect(screen.getByText('Mewtwo is speaking...')).toBeInTheDocument()
      expect(screen.queryByText('Mewtwo is ready')).not.toBeInTheDocument()
    })

    it('should update glow color when state changes', () => {
      const { container, rerender } = render(<MewtwoCharacter state="idle" />)

      expect(container.querySelector('.shadow-mewtwo-purple')).toBeInTheDocument()

      rerender(<MewtwoCharacter state="listening" />)

      expect(container.querySelector('.shadow-blue-500')).toBeInTheDocument()
      expect(container.querySelector('.shadow-mewtwo-purple')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should provide clear state information to users', () => {
      render(<MewtwoCharacter state="listening" />)

      const stateText = screen.getByText('Mewtwo is listening...')
      expect(stateText).toBeVisible()
    })

    it('should have large enough character visual', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const emoji = container.querySelector('.text-6xl')
      expect(emoji).toBeInTheDocument()
    })

    it('should center content for easy viewing', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const wrapper = container.querySelector('.items-center.justify-center')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('responsive design', () => {
    it('should have responsive character size', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const character = container.querySelector('.w-48.md\\:w-64')
      expect(character).toBeInTheDocument()
    })

    it('should have responsive emoji size', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const emoji = container.querySelector('.text-6xl.md\\:text-8xl')
      expect(emoji).toBeInTheDocument()
    })

    it('should have responsive state text size', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const stateText = container.querySelector('.text-lg.md\\:text-xl')
      expect(stateText).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle undefined state gracefully', () => {
      // TypeScript would prevent this, but testing runtime behavior
      const { container } = render(<MewtwoCharacter state={undefined as any} />)

      // Should default to some animation (likely float due to default case)
      expect(container.querySelector('[class*="animate-"]')).toBeInTheDocument()
    })

    it('should handle unknown state values', () => {
      const { container } = render(<MewtwoCharacter state={'unknown' as VoiceState} />)

      // Should fall back to default animation
      expect(container.querySelector('.animate-float')).toBeInTheDocument()
    })

    it('should maintain structure across all states', () => {
      const states: VoiceState[] = ['idle', 'listening', 'speaking', 'processing']

      states.forEach(state => {
        const { container } = render(<MewtwoCharacter state={state} />)

        expect(container.querySelector('.rounded-full')).toBeInTheDocument()
        expect(container.textContent).toContain('🧬')
        expect(container.textContent).toContain('Mewtwo')
      })
    })
  })

  describe('layout', () => {
    it('should use flexbox for layout', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const wrapper = container.querySelector('.flex.flex-col')
      expect(wrapper).toBeInTheDocument()
    })

    it('should apply padding', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const wrapper = container.querySelector('.py-8')
      expect(wrapper).toBeInTheDocument()
    })

    it('should center text below character', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const textWrapper = container.querySelector('.text-center')
      expect(textWrapper).toBeInTheDocument()
    })

    it('should space text from character', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)

      const textWrapper = container.querySelector('.mt-6')
      expect(textWrapper).toBeInTheDocument()
    })
  })
})
