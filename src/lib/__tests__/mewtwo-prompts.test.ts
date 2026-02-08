import {
  MEWTWO_SYSTEM_PROMPT,
  STORY_TIME_PROMPT,
  getSystemPrompt,
} from '../mewtwo-prompts'

describe('mewtwo-prompts', () => {
  describe('MEWTWO_SYSTEM_PROMPT', () => {
    it('should contain character traits', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('CHARACTER TRAITS')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('wise')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('powerful')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('kind')
    })

    it('should mention the child by name', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Damian')
    })

    it('should specify age-appropriate language', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('5-year-old')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('simple, clear language')
    })

    it('should include communication style guidelines', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('COMMUNICATION STYLE')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('2-4 sentences')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('encouraging')
    })

    it('should list topics Mewtwo enjoys', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('TOPICS YOU ENJOY')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Pokémon')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Friendship')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('kindness')
    })

    it('should include safety guidelines', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('SAFETY GUIDELINES')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('age-appropriate')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('positive')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('scary or violent')
    })

    it('should be a non-empty string', () => {
      expect(typeof MEWTWO_SYSTEM_PROMPT).toBe('string')
      expect(MEWTWO_SYSTEM_PROMPT.length).toBeGreaterThan(0)
    })

    it('should emphasize being a caring friend', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('caring friend')
    })
  })

  describe('STORY_TIME_PROMPT', () => {
    it('should indicate story time mode', () => {
      expect(STORY_TIME_PROMPT).toContain('Story Time mode')
    })

    it('should specify story length requirements', () => {
      expect(STORY_TIME_PROMPT).toContain('3-5 minutes')
      expect(STORY_TIME_PROMPT).toContain('300-500 words')
    })

    it('should include story structure requirements', () => {
      expect(STORY_TIME_PROMPT).toContain('beginning, middle, and end')
    })

    it('should require Pokémon characters', () => {
      expect(STORY_TIME_PROMPT).toContain('Pokémon characters')
    })

    it('should require positive message', () => {
      expect(STORY_TIME_PROMPT).toContain('positive message')
      expect(STORY_TIME_PROMPT).toContain('happy, positive note')
    })

    it('should list story themes', () => {
      expect(STORY_TIME_PROMPT).toContain('STORY THEMES')
      expect(STORY_TIME_PROMPT).toContain('adventure')
      expect(STORY_TIME_PROMPT).toContain('friends')
      expect(STORY_TIME_PROMPT).toContain('teamwork')
    })

    it('should ensure stories are not scary', () => {
      expect(STORY_TIME_PROMPT).toContain('not scary')
      expect(STORY_TIME_PROMPT).toContain('exciting but not scary')
    })

    it('should instruct natural storytelling', () => {
      expect(STORY_TIME_PROMPT).toContain('Begin the story naturally')
      expect(STORY_TIME_PROMPT).toContain('as Mewtwo would tell it')
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

    it('should return story prompt when isStoryMode is true', () => {
      const prompt = getSystemPrompt(true)
      expect(prompt).toBe(STORY_TIME_PROMPT)
    })

    it('should default to normal prompt when no argument provided', () => {
      const prompt = getSystemPrompt()
      expect(prompt).toBe(MEWTWO_SYSTEM_PROMPT)
    })

    it('should return normal prompt when isStoryMode is undefined', () => {
      const prompt = getSystemPrompt(undefined)
      expect(prompt).toBe(MEWTWO_SYSTEM_PROMPT)
    })

    it('should handle boolean values correctly', () => {
      expect(getSystemPrompt(true)).toBe(STORY_TIME_PROMPT)
      expect(getSystemPrompt(false)).toBe(MEWTWO_SYSTEM_PROMPT)
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

    it('should emphasize child safety in both prompts', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('appropriate')
      expect(STORY_TIME_PROMPT).toContain('appropriate')
    })

    it('should maintain consistent character voice', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Mewtwo')
      expect(STORY_TIME_PROMPT).toContain('Mewtwo')
    })

    it('should specify 5-year-old as target age', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('5-year-old')
      expect(STORY_TIME_PROMPT).toContain('5-year-old')
    })
  })

  describe('edge cases', () => {
    it('should handle truthy non-boolean values', () => {
      // In JavaScript, truthy values should behave like true
      const prompt = getSystemPrompt(1 as any)
      expect(prompt).toBe(STORY_TIME_PROMPT)
    })

    it('should handle falsy non-boolean values', () => {
      // In JavaScript, falsy values should behave like false
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
