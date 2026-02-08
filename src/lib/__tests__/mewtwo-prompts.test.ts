import {
  MEWTWO_SYSTEM_PROMPT,
  STORY_TIME_PROMPT,
  getSystemPrompt,
} from '../mewtwo-prompts'

describe('mewtwo-prompts', () => {
  describe('MEWTWO_SYSTEM_PROMPT', () => {
    it('should establish Mewtwo identity with Pokemon lore', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Mewtwo')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Psychic')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Mew')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('New Island')
    })

    it('should include backstory and key memories', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('laboratory')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('clone')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('circumstances of one\'s birth')
    })

    it('should include Pokemon world knowledge', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Psystrike')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Shadow Ball')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Pokédex')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Ash Ketchum')
    })

    it('should mention the child by name', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Damian')
    })

    it('should specify age-appropriate communication', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('5-year-old')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('simple words')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('2-4 sentences')
    })

    it('should include personality traits', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('philosophical')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Proud')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Protective')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('courage')
    })

    it('should enforce never breaking character', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('NEVER break character')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('NEVER say "I\'m an AI"')
    })

    it('should include safety rules', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('age-appropriate')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('positive')
    })

    it('should be a non-empty string', () => {
      expect(typeof MEWTWO_SYSTEM_PROMPT).toBe('string')
      expect(MEWTWO_SYSTEM_PROMPT.length).toBeGreaterThan(0)
    })
  })

  describe('STORY_TIME_PROMPT', () => {
    it('should indicate story telling mode', () => {
      expect(STORY_TIME_PROMPT).toContain('bedtime story')
    })

    it('should specify story length', () => {
      expect(STORY_TIME_PROMPT).toContain('3-5 minutes')
    })

    it('should require happy ending', () => {
      expect(STORY_TIME_PROMPT).toContain('happy ending')
    })

    it('should maintain Mewtwo voice', () => {
      expect(STORY_TIME_PROMPT).toContain('Mewtwo')
      expect(STORY_TIME_PROMPT).toContain('your voice')
    })

    it('should tell stories as personal memories', () => {
      expect(STORY_TIME_PROMPT).toContain('YOUR memory')
      expect(STORY_TIME_PROMPT).toContain('witnessed or experienced')
    })

    it('should include Pokémon story ideas', () => {
      expect(STORY_TIME_PROMPT).toContain('Caterpie')
      expect(STORY_TIME_PROMPT).toContain('Pikachu')
      expect(STORY_TIME_PROMPT).toContain('Cubone')
    })

    it('should keep stories not scary', () => {
      expect(STORY_TIME_PROMPT).toContain('never scary')
    })

    it('should target 5-year-old audience', () => {
      expect(STORY_TIME_PROMPT).toContain('5 years old')
    })

    it('should be a non-empty string', () => {
      expect(typeof STORY_TIME_PROMPT).toBe('string')
      expect(STORY_TIME_PROMPT.length).toBeGreaterThan(0)
    })
  })

  describe('getSystemPrompt', () => {
    it('should return normal prompt when isStoryMode is false', () => {
      const prompt = getSystemPrompt(false)
      expect(prompt).toBe(MEWTWO_SYSTEM_PROMPT)
    })

    it('should include both prompts when isStoryMode is true', () => {
      const prompt = getSystemPrompt(true)
      expect(prompt).toContain(MEWTWO_SYSTEM_PROMPT)
      expect(prompt).toContain(STORY_TIME_PROMPT)
    })

    it('should default to normal prompt when no argument provided', () => {
      const prompt = getSystemPrompt()
      expect(prompt).toBe(MEWTWO_SYSTEM_PROMPT)
    })

    it('should return normal prompt when isStoryMode is undefined', () => {
      const prompt = getSystemPrompt(undefined)
      expect(prompt).toBe(MEWTWO_SYSTEM_PROMPT)
    })

    it('should always return a string', () => {
      expect(typeof getSystemPrompt(true)).toBe('string')
      expect(typeof getSystemPrompt(false)).toBe('string')
    })

    it('should return non-empty prompts', () => {
      expect(getSystemPrompt(true).length).toBeGreaterThan(0)
      expect(getSystemPrompt(false).length).toBeGreaterThan(0)
    })
  })

  describe('prompt content validation', () => {
    it('should not contain profanity or inappropriate content', () => {
      const inappropriateWords = ['damn', 'hell', 'stupid', 'hate']

      inappropriateWords.forEach(word => {
        expect(MEWTWO_SYSTEM_PROMPT.toLowerCase()).not.toContain(word)
        expect(STORY_TIME_PROMPT.toLowerCase()).not.toContain(word)
      })
    })

    it('should emphasize child safety', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('appropriate')
    })

    it('should maintain consistent character voice', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Mewtwo')
      expect(STORY_TIME_PROMPT).toContain('Mewtwo')
    })
  })

  describe('edge cases', () => {
    it('should handle truthy non-boolean values', () => {
      const prompt = getSystemPrompt(1 as any)
      expect(prompt).toContain(MEWTWO_SYSTEM_PROMPT)
      expect(prompt).toContain(STORY_TIME_PROMPT)
    })

    it('should handle falsy non-boolean values', () => {
      const prompt = getSystemPrompt(0 as any)
      expect(prompt).toBe(MEWTWO_SYSTEM_PROMPT)
    })

    it('should not modify prompt constants', () => {
      const originalNormal = MEWTWO_SYSTEM_PROMPT
      const originalStory = STORY_TIME_PROMPT

      getSystemPrompt(true)
      getSystemPrompt(false)

      expect(MEWTWO_SYSTEM_PROMPT).toBe(originalNormal)
      expect(STORY_TIME_PROMPT).toBe(originalStory)
    })
  })

  describe('prompt structure', () => {
    it('should have proper formatting with sections', () => {
      const normalSections = MEWTWO_SYSTEM_PROMPT.split('\n\n')
      expect(normalSections.length).toBeGreaterThan(3)

      const storySections = STORY_TIME_PROMPT.split('\n\n')
      expect(storySections.length).toBeGreaterThan(2)
    })

    it('should use uppercase for section headers', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toMatch(/[A-Z\s]+:/)
      expect(STORY_TIME_PROMPT).toMatch(/[A-Z\s]+:/)
    })

    it('should include bullet points for lists', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('-')
      expect(STORY_TIME_PROMPT).toContain('-')
    })
  })
})
