import { render, screen } from '@testing-library/react'
import MewtwoCharacter from '../MewtwoCharacter'
import { VoiceState } from '@/types/chat'

describe('MewtwoCharacter', () => {
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

  describe('rendering', () => {
    it('should render the Mewtwo image', () => {
      render(<MewtwoCharacter state="idle" />)
      const img = screen.getByAltText('Mewtwo')
      expect(img).toBeInTheDocument()
    })

    it('should render the aura element', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.blur-2xl')).toBeInTheDocument()
    })
  })

  describe('animation classes', () => {
    it('should apply float animation when idle', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.mewtwo-float')).toBeInTheDocument()
    })

    it('should apply listen animation when listening', () => {
      const { container } = render(<MewtwoCharacter state="listening" />)
      expect(container.querySelector('.mewtwo-listen')).toBeInTheDocument()
    })

    it('should apply speak animation when speaking', () => {
      const { container } = render(<MewtwoCharacter state="speaking" />)
      expect(container.querySelector('.mewtwo-speak')).toBeInTheDocument()
    })

    it('should apply think animation when processing', () => {
      const { container } = render(<MewtwoCharacter state="processing" />)
      expect(container.querySelector('.mewtwo-think')).toBeInTheDocument()
    })
  })

  describe('aura effects', () => {
    it('should apply idle aura class when idle', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.mewtwo-aura-idle')).toBeInTheDocument()
    })

    it('should apply listening aura class when listening', () => {
      const { container } = render(<MewtwoCharacter state="listening" />)
      expect(container.querySelector('.mewtwo-aura-listening')).toBeInTheDocument()
    })

    it('should apply speaking aura class when speaking', () => {
      const { container } = render(<MewtwoCharacter state="speaking" />)
      expect(container.querySelector('.mewtwo-aura-speaking')).toBeInTheDocument()
    })

    it('should apply processing aura class when processing', () => {
      const { container } = render(<MewtwoCharacter state="processing" />)
      expect(container.querySelector('.mewtwo-aura-processing')).toBeInTheDocument()
    })
  })

  describe('state transitions', () => {
    it('should update animation when state changes', () => {
      const { container, rerender } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.mewtwo-float')).toBeInTheDocument()

      rerender(<MewtwoCharacter state="listening" />)
      expect(container.querySelector('.mewtwo-listen')).toBeInTheDocument()
      expect(container.querySelector('.mewtwo-float')).not.toBeInTheDocument()
    })

    it('should update text when state changes', () => {
      const { rerender } = render(<MewtwoCharacter state="idle" />)
      expect(screen.getByText('Mewtwo is ready')).toBeInTheDocument()

      rerender(<MewtwoCharacter state="speaking" />)
      expect(screen.getByText('Mewtwo is speaking...')).toBeInTheDocument()
      expect(screen.queryByText('Mewtwo is ready')).not.toBeInTheDocument()
    })
  })

  describe('layout', () => {
    it('should use flexbox column layout', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.flex.flex-col')).toBeInTheDocument()
    })

    it('should center content', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.items-center.justify-center')).toBeInTheDocument()
    })

    it('should have responsive image size', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.w-48.md\\:w-64')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should style state text with Mewtwo purple', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.text-mewtwo-purple')).toBeInTheDocument()
    })

    it('should apply font weight to state text', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.font-semibold')).toBeInTheDocument()
    })

    it('should apply drop shadow to image', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.drop-shadow-2xl')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle unknown state values', () => {
      render(<MewtwoCharacter state={'unknown' as VoiceState} />)
      expect(screen.getByText('Mewtwo is ready')).toBeInTheDocument()
    })

    it('should maintain structure across all states', () => {
      const states: VoiceState[] = ['idle', 'listening', 'speaking', 'processing']
      states.forEach(state => {
        const { container, unmount } = render(<MewtwoCharacter state={state} />)
        expect(container.querySelector('img[alt="Mewtwo"]')).toBeInTheDocument()
        expect(container.textContent).toContain('Mewtwo')
        unmount()
      })
    })
  })
})
