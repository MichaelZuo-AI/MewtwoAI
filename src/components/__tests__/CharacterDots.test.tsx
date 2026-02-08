import { render, screen } from '@testing-library/react'
import CharacterDots from '../CharacterDots'
import { mewtwo } from '@/lib/characters/mewtwo'
import { kirby } from '@/lib/characters/kirby'
import { getAllCharacters } from '@/lib/characters'

describe('CharacterDots', () => {
  const allCharacters = getAllCharacters()

  describe('rendering', () => {
    it('should render correct number of dots for character count', () => {
      render(<CharacterDots characters={allCharacters} activeId="mewtwo" />)

      const dots = screen.getAllByRole('tab')
      expect(dots).toHaveLength(allCharacters.length)
    })

    it('should render two dots for mewtwo and kirby', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const dots = screen.getAllByRole('tab')
      expect(dots).toHaveLength(2)
    })

    it('should render single dot for single character', () => {
      render(<CharacterDots characters={[mewtwo]} activeId="mewtwo" />)

      const dots = screen.getAllByRole('tab')
      expect(dots).toHaveLength(1)
    })

    it('should render no dots for empty character array', () => {
      render(<CharacterDots characters={[]} activeId="mewtwo" />)

      const dots = screen.queryAllByRole('tab')
      expect(dots).toHaveLength(0)
    })
  })

  describe('active state', () => {
    it('should mark active dot with aria-selected="true"', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const dots = screen.getAllByRole('tab')
      const activeDot = dots.find(dot => dot.getAttribute('aria-selected') === 'true')

      expect(activeDot).toBeDefined()
      expect(activeDot?.getAttribute('aria-label')).toBe('Mewtwo')
    })

    it('should mark inactive dots with aria-selected="false"', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const dots = screen.getAllByRole('tab')
      const inactiveDots = dots.filter(dot => dot.getAttribute('aria-selected') === 'false')

      expect(inactiveDots).toHaveLength(1)
      expect(inactiveDots[0].getAttribute('aria-label')).toBe('Kirby')
    })

    it('should apply accent color to active dot', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const mewtwoLabel = screen.getByRole('tab', { name: 'Mewtwo' })

      expect(mewtwoLabel).toHaveStyle({
        backgroundColor: mewtwo.theme.accent,
      })
    })

    it('should apply muted color to inactive dot', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const kirbyLabel = screen.getByRole('tab', { name: 'Kirby' })

      expect(kirbyLabel).toHaveStyle({
        backgroundColor: 'rgba(255,255,255,0.3)',
      })
    })

    it('should handle kirby as active character', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="kirby" />)

      const kirbyLabel = screen.getByRole('tab', { name: 'Kirby' })
      const mewtwoLabel = screen.getByRole('tab', { name: 'Mewtwo' })

      expect(kirbyLabel).toHaveAttribute('aria-selected', 'true')
      expect(mewtwoLabel).toHaveAttribute('aria-selected', 'false')
      expect(kirbyLabel).toHaveStyle({
        backgroundColor: kirby.theme.accent,
      })
    })
  })

  describe('sizing', () => {
    it('should make active dot larger (12px)', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const mewtwoLabel = screen.getByRole('tab', { name: 'Mewtwo' })

      expect(mewtwoLabel).toHaveStyle({
        width: '12px',
        height: '12px',
      })
    })

    it('should make inactive dot smaller (8px)', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const kirbyLabel = screen.getByRole('tab', { name: 'Kirby' })

      expect(kirbyLabel).toHaveStyle({
        width: '8px',
        height: '8px',
      })
    })

    it('should apply consistent sizing when different character is active', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="kirby" />)

      const kirbyLabel = screen.getByRole('tab', { name: 'Kirby' })
      const mewtwoLabel = screen.getByRole('tab', { name: 'Mewtwo' })

      expect(kirbyLabel).toHaveStyle({ width: '12px', height: '12px' })
      expect(mewtwoLabel).toHaveStyle({ width: '8px', height: '8px' })
    })
  })

  describe('accessibility', () => {
    it('should have tablist role on container', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const tablist = screen.getByRole('tablist')
      expect(tablist).toBeInTheDocument()
    })

    it('should have aria-label on tablist', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const tablist = screen.getByRole('tablist', { name: 'Characters' })
      expect(tablist).toBeInTheDocument()
    })

    it('should have tab role on each dot', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const dots = screen.getAllByRole('tab')
      dots.forEach(dot => {
        expect(dot).toHaveAttribute('role', 'tab')
      })
    })

    it('should have aria-label with character name on each dot', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      expect(screen.getByRole('tab', { name: 'Mewtwo' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Kirby' })).toBeInTheDocument()
    })

    it('should properly indicate selected state', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const mewtwoTab = screen.getByRole('tab', { name: 'Mewtwo', selected: true })
      const kirbyTab = screen.getByRole('tab', { name: 'Kirby', selected: false })

      expect(mewtwoTab).toBeInTheDocument()
      expect(kirbyTab).toBeInTheDocument()
    })
  })

  describe('visual styling', () => {
    it('should apply rounded-full class to all dots', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const dots = screen.getAllByRole('tab')
      dots.forEach(dot => {
        expect(dot).toHaveClass('rounded-full')
      })
    })

    it('should apply transition classes for smooth animations', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const dots = screen.getAllByRole('tab')
      dots.forEach(dot => {
        expect(dot).toHaveClass('transition-all', 'duration-300')
      })
    })

    it('should maintain flex layout with gap', () => {
      const { container } = render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const tablist = container.querySelector('[role="tablist"]')
      expect(tablist).toHaveClass('flex', 'items-center', 'gap-2')
    })
  })

  describe('character theme colors', () => {
    it('should use mewtwo purple accent when mewtwo is active', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const mewtwoLabel = screen.getByRole('tab', { name: 'Mewtwo' })

      expect(mewtwoLabel).toHaveStyle({
        backgroundColor: '#a855f7', // mewtwo.theme.accent
      })
    })

    it('should use kirby pink accent when kirby is active', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="kirby" />)

      const kirbyLabel = screen.getByRole('tab', { name: 'Kirby' })

      expect(kirbyLabel).toHaveStyle({
        backgroundColor: '#ec4899', // kirby.theme.accent
      })
    })

    it('should apply muted white to all inactive dots', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const kirbyLabel = screen.getByRole('tab', { name: 'Kirby' })

      expect(kirbyLabel).toHaveStyle({
        backgroundColor: 'rgba(255,255,255,0.3)',
      })
    })
  })

  describe('edge cases', () => {
    it('should handle activeId that does not match any character', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="nonexistent" />)

      const dots = screen.getAllByRole('tab')
      const selectedDots = dots.filter(dot => dot.getAttribute('aria-selected') === 'true')

      expect(selectedDots).toHaveLength(0)
    })

    it('should handle empty activeId', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="" />)

      const dots = screen.getAllByRole('tab')
      const selectedDots = dots.filter(dot => dot.getAttribute('aria-selected') === 'true')

      expect(selectedDots).toHaveLength(0)
    })

    it('should handle characters with duplicate ids gracefully', () => {
      const duplicateCharacters = [mewtwo, { ...kirby, id: 'mewtwo' }]

      render(<CharacterDots characters={duplicateCharacters} activeId="mewtwo" />)

      const dots = screen.getAllByRole('tab')
      // Both should be marked as selected due to duplicate id
      const selectedDots = dots.filter(dot => dot.getAttribute('aria-selected') === 'true')

      expect(selectedDots.length).toBeGreaterThan(0)
    })

    it('should render correctly with many characters', () => {
      const manyCharacters = Array.from({ length: 10 }, (_, i) => ({
        ...mewtwo,
        id: `char-${i}`,
        name: `Character ${i}`,
      }))

      render(<CharacterDots characters={manyCharacters} activeId="char-5" />)

      const dots = screen.getAllByRole('tab')
      expect(dots).toHaveLength(10)

      const activeDot = screen.getByRole('tab', { name: 'Character 5' })
      expect(activeDot).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('switching active character', () => {
    it('should update when activeId changes', () => {
      const { rerender } = render(
        <CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />
      )

      let mewtwoLabel = screen.getByRole('tab', { name: 'Mewtwo' })
      let kirbyLabel = screen.getByRole('tab', { name: 'Kirby' })

      expect(mewtwoLabel).toHaveAttribute('aria-selected', 'true')
      expect(kirbyLabel).toHaveAttribute('aria-selected', 'false')

      rerender(<CharacterDots characters={[mewtwo, kirby]} activeId="kirby" />)

      mewtwoLabel = screen.getByRole('tab', { name: 'Mewtwo' })
      kirbyLabel = screen.getByRole('tab', { name: 'Kirby' })

      expect(mewtwoLabel).toHaveAttribute('aria-selected', 'false')
      expect(kirbyLabel).toHaveAttribute('aria-selected', 'true')
    })

    it('should update colors when activeId changes', () => {
      const { rerender } = render(
        <CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />
      )

      let mewtwoLabel = screen.getByRole('tab', { name: 'Mewtwo' })
      expect(mewtwoLabel).toHaveStyle({ backgroundColor: mewtwo.theme.accent })

      rerender(<CharacterDots characters={[mewtwo, kirby]} activeId="kirby" />)

      mewtwoLabel = screen.getByRole('tab', { name: 'Mewtwo' })
      const kirbyLabel = screen.getByRole('tab', { name: 'Kirby' })

      expect(mewtwoLabel).toHaveStyle({ backgroundColor: 'rgba(255,255,255,0.3)' })
      expect(kirbyLabel).toHaveStyle({ backgroundColor: kirby.theme.accent })
    })

    it('should update sizes when activeId changes', () => {
      const { rerender } = render(
        <CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />
      )

      let mewtwoLabel = screen.getByRole('tab', { name: 'Mewtwo' })
      let kirbyLabel = screen.getByRole('tab', { name: 'Kirby' })

      expect(mewtwoLabel).toHaveStyle({ width: '12px', height: '12px' })
      expect(kirbyLabel).toHaveStyle({ width: '8px', height: '8px' })

      rerender(<CharacterDots characters={[mewtwo, kirby]} activeId="kirby" />)

      mewtwoLabel = screen.getByRole('tab', { name: 'Mewtwo' })
      kirbyLabel = screen.getByRole('tab', { name: 'Kirby' })

      expect(mewtwoLabel).toHaveStyle({ width: '8px', height: '8px' })
      expect(kirbyLabel).toHaveStyle({ width: '12px', height: '12px' })
    })
  })

  describe('character order preservation', () => {
    it('should maintain character order from props', () => {
      render(<CharacterDots characters={[mewtwo, kirby]} activeId="mewtwo" />)

      const dots = screen.getAllByRole('tab')

      expect(dots[0]).toHaveAttribute('aria-label', 'Mewtwo')
      expect(dots[1]).toHaveAttribute('aria-label', 'Kirby')
    })

    it('should maintain order when reversed', () => {
      render(<CharacterDots characters={[kirby, mewtwo]} activeId="kirby" />)

      const dots = screen.getAllByRole('tab')

      expect(dots[0]).toHaveAttribute('aria-label', 'Kirby')
      expect(dots[1]).toHaveAttribute('aria-label', 'Mewtwo')
    })

    it('should use getAllCharacters order', () => {
      render(<CharacterDots characters={allCharacters} activeId="mewtwo" />)

      const dots = screen.getAllByRole('tab')

      // Verify dots match the order from getAllCharacters
      allCharacters.forEach((char, index) => {
        expect(dots[index]).toHaveAttribute('aria-label', char.name)
      })
    })
  })
})
