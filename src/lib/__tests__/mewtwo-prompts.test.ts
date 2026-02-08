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

    it('should include voice acting directions for expressive speech', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('HOW YOU SPEAK')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('enthusiastic expressions')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('WHOOSH')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('young trainer')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('sound effects')
    })

    it('should encourage playful and animated interaction', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('playful and animated')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Celebrate his answers')
    })

    it('should include parental goals for bravery, learning, and sports', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('YOUR MISSION WITH DAMIAN')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('BRAVERY')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('LEARNING')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('SPORTS')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('brave')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('learning')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('active')
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

  describe('HOW YOU SPEAK section', () => {
    it('should include enthusiastic expressions guidance', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('enthusiastic expressions')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Hmm!')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Ah!')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Incredible!')
    })

    it('should encourage varied energy levels', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Vary your energy')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('whisper for mysteries')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('get excited for battles')
    })

    it('should include sound effects and onomatopoeia examples', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('sound effects')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('onomatopoeia')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('BOOM!')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('WHOOSH!')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('CRACK!')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Zzzzap!')
    })

    it('should include Mewtwo catchphrases', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Mewtwo catchphrases')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('The circumstances of one\'s birth are irrelevant')
    })

    it('should include warm terms of address for Damian', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('young trainer')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('little one')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('brave one')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('my young friend')
    })

    it('should encourage genuine wonder and celebration', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('genuine wonder')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('celebrate his ideas')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('enthusiastically')
    })

    it('should include laughter guidance', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Laugh occasionally')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('deep, warm laugh')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Heh...')
    })

    it('should emphasize animated and alive delivery', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('animated and alive')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('real conversation')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('not reading from a script')
    })
  })

  describe('YOUR MISSION WITH DAMIAN section', () => {
    it('should include bravery encouragement', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('BRAVERY')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('brave and try new things')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('even small Pokémon')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Caterpie')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('act WHILE they\'re scared')
    })

    it('should include learning motivation', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('LEARNING')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('love learning')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('study types, moves, and strategies')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('reading is like studying the Pokédex')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('math is like calculating move power')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('science is like understanding Pokémon types')
    })

    it('should include sports and exercise encouragement', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('SPORTS')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('active and enjoy sports')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('train their bodies every day')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('soccer is like learning Agility')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('swimming is like a Water-type move')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('running fast is like Quick Attack')
    })

    it('should encourage celebrating real-life achievements', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Celebrate his real-life efforts')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('achievements')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('school, sports, or trying something hard')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('genuine pride and encouragement')
    })

    it('should weave goals naturally into conversations', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('weave these naturally into conversations')
    })

    it('should include motivational quotes for each goal', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('A true trainer doesn\'t wait until they\'re not scared')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Even I must study and learn')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('A strong trainer keeps their body strong too')
    })
  })

  describe('SPEAKING WITH DAMIAN section updates', () => {
    it('should encourage playful and animated interaction', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('playful and animated')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('exclamation marks')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('express excitement')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('show wonder')
    })

    it('should include celebration examples', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Celebrate his answers')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Yes! That is an excellent choice!')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Incredible! You truly think like a champion!')
    })

    it('should include exciting Pokemon sound examples', () => {
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Make Pokémon sound exciting')
      expect(MEWTWO_SYSTEM_PROMPT).toContain('Charizard went WHOOSH with its giant flame wings')
    })
  })

  describe('integration of new sections', () => {
    it('should maintain consistency across all sections', () => {
      const hasHowYouSpeak = MEWTWO_SYSTEM_PROMPT.includes('HOW YOU SPEAK')
      const hasYourMission = MEWTWO_SYSTEM_PROMPT.includes('YOUR MISSION WITH DAMIAN')
      const hasSpeakingWithDamian = MEWTWO_SYSTEM_PROMPT.includes('SPEAKING WITH DAMIAN')

      expect(hasHowYouSpeak).toBe(true)
      expect(hasYourMission).toBe(true)
      expect(hasSpeakingWithDamian).toBe(true)
    })

    it('should not duplicate content across sections', () => {
      const sections = MEWTWO_SYSTEM_PROMPT.split('\n\n')
      const uniqueSections = new Set(sections)

      // Should not have exact duplicate sections
      expect(sections.length).toBe(uniqueSections.size)
    })

    it('should maintain age-appropriate language in new sections', () => {
      const inappropriateWords = ['complicated', 'difficult', 'impossible', 'failure']

      inappropriateWords.forEach(word => {
        // These words might appear but should be in positive context
        if (MEWTWO_SYSTEM_PROMPT.toLowerCase().includes(word)) {
          // Make sure they're not used negatively
          expect(MEWTWO_SYSTEM_PROMPT).not.toContain(`too ${word}`)
          expect(MEWTWO_SYSTEM_PROMPT).not.toContain(`very ${word}`)
        }
      })
    })
  })
})
