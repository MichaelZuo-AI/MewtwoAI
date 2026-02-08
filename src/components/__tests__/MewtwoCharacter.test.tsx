import { render, screen } from '@testing-library/react'
import MewtwoCharacter from '../MewtwoCharacter'
import { VoiceState } from '@/types/chat'

describe('MewtwoCharacter', () => {
  describe('rendering', () => {
    it('should render the Mewtwo image', () => {
      render(<MewtwoCharacter state="idle" />)
      const img = screen.getByAltText('Mewtwo')
      expect(img).toBeInTheDocument()
    })

    it('should render the aura element', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.blur-3xl')).toBeInTheDocument()
    })

    it('should not render text labels', () => {
      render(<MewtwoCharacter state="idle" />)
      expect(screen.queryByText('Mewtwo is ready')).not.toBeInTheDocument()
      expect(screen.queryByText('Mewtwo is listening...')).not.toBeInTheDocument()
      expect(screen.queryByText('Mewtwo is speaking...')).not.toBeInTheDocument()
      expect(screen.queryByText('Mewtwo is thinking...')).not.toBeInTheDocument()
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

  describe('voice state ring indicator', () => {
    it('should not show ring when idle and connected', () => {
      render(<MewtwoCharacter state="idle" connectionState="connected" />)
      expect(screen.queryByTestId('voice-ring')).not.toBeInTheDocument()
    })

    it('should not show ring when disconnected', () => {
      render(<MewtwoCharacter state="listening" connectionState="disconnected" />)
      expect(screen.queryByTestId('voice-ring')).not.toBeInTheDocument()
    })

    it('should not show ring when connectionState is not provided', () => {
      render(<MewtwoCharacter state="listening" />)
      expect(screen.queryByTestId('voice-ring')).not.toBeInTheDocument()
    })

    it('should show ring when listening and connected', () => {
      render(<MewtwoCharacter state="listening" connectionState="connected" />)
      expect(screen.getByTestId('voice-ring')).toBeInTheDocument()
    })

    it('should show ring when speaking and connected', () => {
      render(<MewtwoCharacter state="speaking" connectionState="connected" />)
      expect(screen.getByTestId('voice-ring')).toBeInTheDocument()
    })

    it('should show ring when processing and connected', () => {
      render(<MewtwoCharacter state="processing" connectionState="connected" />)
      expect(screen.getByTestId('voice-ring')).toBeInTheDocument()
    })

    it('should apply green ring color when listening', () => {
      const { container } = render(<MewtwoCharacter state="listening" connectionState="connected" />)
      expect(container.querySelector('.bg-green-400')).toBeInTheDocument()
    })

    it('should apply purple ring color when speaking', () => {
      const { container } = render(<MewtwoCharacter state="speaking" connectionState="connected" />)
      expect(container.querySelector('.bg-purple-400')).toBeInTheDocument()
    })

    it('should apply yellow ring color when processing', () => {
      const { container } = render(<MewtwoCharacter state="processing" connectionState="connected" />)
      expect(container.querySelector('.bg-yellow-400')).toBeInTheDocument()
    })

    it('should use fast ring animation when speaking', () => {
      const { container } = render(<MewtwoCharacter state="speaking" connectionState="connected" />)
      expect(container.querySelector('.voice-ring-fast')).toBeInTheDocument()
    })

    it('should use normal ring animation when listening', () => {
      const { container } = render(<MewtwoCharacter state="listening" connectionState="connected" />)
      expect(container.querySelector('.voice-ring')).toBeInTheDocument()
      expect(container.querySelector('.voice-ring-fast')).not.toBeInTheDocument()
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

    it('should have hero-sized image', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.w-64.md\\:w-80.lg\\:w-96')).toBeInTheDocument()
    })

    it('should have larger aura with -inset-8', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.-inset-8')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should apply drop shadow to image', () => {
      const { container } = render(<MewtwoCharacter state="idle" />)
      expect(container.querySelector('.drop-shadow-2xl')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle unknown state values', () => {
      const { container } = render(<MewtwoCharacter state={'unknown' as VoiceState} />)
      expect(container.querySelector('.mewtwo-float')).not.toBeInTheDocument()
      expect(screen.getByAltText('Mewtwo')).toBeInTheDocument()
    })

    it('should maintain structure across all states', () => {
      const states: VoiceState[] = ['idle', 'listening', 'speaking', 'processing']
      states.forEach(state => {
        const { container, unmount } = render(<MewtwoCharacter state={state} />)
        expect(container.querySelector('img[alt="Mewtwo"]')).toBeInTheDocument()
        unmount()
      })
    })
  })
})
