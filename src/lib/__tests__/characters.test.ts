import { getCharacter, getAllCharacters, getNextCharacter, getPreviousCharacter, CHARACTERS } from '../characters';
import { mewtwo } from '../characters/mewtwo';
import { kirby } from '../characters/kirby';
import { dragonite } from '../characters/dragonite';
import { magolor } from '../characters/magolor';

describe('character registry', () => {
  describe('CHARACTERS', () => {
    it('should contain mewtwo', () => {
      expect(CHARACTERS.mewtwo).toBeDefined();
    });

    it('should contain kirby', () => {
      expect(CHARACTERS.kirby).toBeDefined();
    });

    it('should contain dragonite', () => {
      expect(CHARACTERS.dragonite).toBeDefined();
    });

    it('should contain magolor', () => {
      expect(CHARACTERS.magolor).toBeDefined();
    });

    it('should have at least 4 characters', () => {
      expect(Object.keys(CHARACTERS).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('getCharacter', () => {
    it('returns mewtwo config for "mewtwo"', () => {
      expect(getCharacter('mewtwo')).toBe(mewtwo);
    });

    it('returns kirby config for "kirby"', () => {
      expect(getCharacter('kirby')).toBe(kirby);
    });

    it('returns dragonite config for "dragonite"', () => {
      expect(getCharacter('dragonite')).toBe(dragonite);
    });

    it('returns magolor config for "magolor"', () => {
      expect(getCharacter('magolor')).toBe(magolor);
    });

    it('returns undefined for unknown id', () => {
      expect(getCharacter('pikachu')).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      expect(getCharacter('')).toBeUndefined();
    });
  });

  describe('getNextCharacter', () => {
    it('returns kirby after mewtwo', () => {
      expect(getNextCharacter('mewtwo').id).toBe('kirby');
    });

    it('returns dragonite after kirby', () => {
      expect(getNextCharacter('kirby').id).toBe('dragonite');
    });

    it('returns magolor after dragonite', () => {
      expect(getNextCharacter('dragonite').id).toBe('magolor');
    });

    it('wraps around: returns mewtwo after magolor', () => {
      expect(getNextCharacter('magolor').id).toBe('mewtwo');
    });

    it('returns a valid CharacterConfig', () => {
      const next = getNextCharacter('mewtwo');
      expect(next.name).toBeDefined();
      expect(next.voice).toBeDefined();
      expect(next.theme).toBeDefined();
    });
  });

  describe('getPreviousCharacter', () => {
    it('returns mewtwo before kirby', () => {
      expect(getPreviousCharacter('kirby').id).toBe('mewtwo');
    });

    it('returns kirby before dragonite', () => {
      expect(getPreviousCharacter('dragonite').id).toBe('kirby');
    });

    it('returns dragonite before magolor', () => {
      expect(getPreviousCharacter('magolor').id).toBe('dragonite');
    });

    it('wraps around: returns magolor before mewtwo', () => {
      expect(getPreviousCharacter('mewtwo').id).toBe('magolor');
    });

    it('returns a valid CharacterConfig', () => {
      const prev = getPreviousCharacter('kirby');
      expect(prev.name).toBeDefined();
      expect(prev.voice).toBeDefined();
      expect(prev.theme).toBeDefined();
    });
  });

  describe('getAllCharacters', () => {
    it('returns an array', () => {
      expect(Array.isArray(getAllCharacters())).toBe(true);
    });

    it('returns at least 4 characters', () => {
      expect(getAllCharacters().length).toBeGreaterThanOrEqual(4);
    });

    it('includes all characters', () => {
      const chars = getAllCharacters();
      const ids = chars.map(c => c.id);
      expect(ids).toContain('mewtwo');
      expect(ids).toContain('kirby');
      expect(ids).toContain('dragonite');
      expect(ids).toContain('magolor');
    });
  });
});

describe('mewtwo config', () => {
  it('has correct id', () => {
    expect(mewtwo.id).toBe('mewtwo');
  });

  it('has correct name', () => {
    expect(mewtwo.name).toBe('Mewtwo');
  });

  it('has image path', () => {
    expect(mewtwo.image).toBe('/mewtwo/mewtwo.png');
  });

  it('uses Fenrir voice', () => {
    expect(mewtwo.voice).toBe('Fenrir');
  });

  it('has theme with required colors', () => {
    expect(mewtwo.theme.bgDeep).toBe('#1a0533');
    expect(mewtwo.theme.bgMid).toBe('#2d1b4e');
    expect(mewtwo.theme.accent).toBe('#a855f7');
  });

  it('has aura colors for all voice states', () => {
    expect(mewtwo.theme.aura.idle).toBeDefined();
    expect(mewtwo.theme.aura.listening).toBeDefined();
    expect(mewtwo.theme.aura.speaking).toBeDefined();
    expect(mewtwo.theme.aura.processing).toBeDefined();
  });

  it('has ring colors for all voice states', () => {
    expect(mewtwo.theme.ring.idle).toBeDefined();
    expect(mewtwo.theme.ring.listening).toBeDefined();
    expect(mewtwo.theme.ring.speaking).toBeDefined();
    expect(mewtwo.theme.ring.processing).toBeDefined();
  });

  it('has micGradient', () => {
    expect(mewtwo.theme.micGradient).toContain('purple');
  });

  describe('getSystemPrompt', () => {
    it('returns normal prompt when not story mode', () => {
      const prompt = mewtwo.getSystemPrompt(false);
      expect(prompt).toContain('Mewtwo');
      expect(prompt).toContain('Psychic');
      expect(prompt).not.toContain('bedtime story');
    });

    it('includes story prompt in story mode', () => {
      const prompt = mewtwo.getSystemPrompt(true);
      expect(prompt).toContain('Mewtwo');
      expect(prompt).toContain('bedtime story');
    });

    it('always returns a non-empty string', () => {
      expect(typeof mewtwo.getSystemPrompt(false)).toBe('string');
      expect(mewtwo.getSystemPrompt(false).length).toBeGreaterThan(0);
      expect(typeof mewtwo.getSystemPrompt(true)).toBe('string');
      expect(mewtwo.getSystemPrompt(true).length).toBeGreaterThan(0);
    });
  });

  describe('prompt content', () => {
    const prompt = mewtwo.getSystemPrompt(false);

    it('establishes Mewtwo identity with Pokemon lore', () => {
      expect(prompt).toContain('Mewtwo');
      expect(prompt).toContain('Mew');
      expect(prompt).toContain('New Island');
    });

    it('includes backstory and key memories', () => {
      expect(prompt).toContain('laboratory');
      expect(prompt).toContain('clone');
      expect(prompt).toContain("circumstances of one's birth");
    });

    it('includes Pokemon world knowledge', () => {
      expect(prompt).toContain('Psystrike');
      expect(prompt).toContain('Shadow Ball');
      expect(prompt).toContain('Ash Ketchum');
    });

    it('mentions the child by name', () => {
      expect(prompt).toContain('Damian');
    });

    it('specifies age-appropriate communication', () => {
      expect(prompt).toContain('5-year-old');
      expect(prompt).toContain('simple words');
      expect(prompt).toContain('2-4 sentences');
    });

    it('includes personality traits', () => {
      expect(prompt).toContain('philosophical');
      expect(prompt).toContain('Proud');
      expect(prompt).toContain('Protective');
      expect(prompt).toContain('courage');
    });

    it('includes voice acting directions', () => {
      expect(prompt).toContain('HOW YOU SPEAK');
      expect(prompt).toContain('enthusiastic sounds');
      expect(prompt).toContain('WHOOSH');
      expect(prompt).toContain('young trainer');
    });

    it('includes parental goals', () => {
      expect(prompt).toContain('YOUR MISSION WITH DAMIAN');
      expect(prompt).toContain('BRAVERY');
      expect(prompt).toContain('LEARNING');
      expect(prompt).toContain('SPORTS');
    });

    it('enforces never breaking character', () => {
      expect(prompt).toContain('NEVER break character');
      expect(prompt).toContain('NEVER say "I\'m an AI"');
    });

    it('includes safety rules', () => {
      expect(prompt).toContain('age-appropriate');
      expect(prompt).toContain('positive');
    });

    it('does not contain profanity or inappropriate content', () => {
      const inappropriateWords = ['damn', 'hell', 'stupid', 'hate'];
      inappropriateWords.forEach(word => {
        expect(prompt.toLowerCase()).not.toContain(word);
      });
    });
  });

  describe('story prompt content', () => {
    const storyPrompt = mewtwo.getSystemPrompt(true);

    it('indicates story telling mode', () => {
      expect(storyPrompt).toContain('bedtime story');
    });

    it('specifies story length', () => {
      expect(storyPrompt).toContain('3-5 minutes');
    });

    it('requires happy ending', () => {
      expect(storyPrompt).toContain('happy ending');
    });

    it('maintains Mewtwo voice', () => {
      expect(storyPrompt).toContain('Mewtwo');
    });

    it('keeps stories not scary', () => {
      expect(storyPrompt).toContain('never scary');
    });

    it('targets 5-year-old audience', () => {
      expect(storyPrompt).toContain('5 and learning English');
    });
  });

  describe('bedtime prompt', () => {
    it('appends bedtime addendum when isBedtime is true', () => {
      const prompt = mewtwo.getSystemPrompt(false, true);
      expect(prompt).toContain('BEDTIME MODE');
      expect(prompt).toContain('8:30 PM');
    });

    it('does not include bedtime addendum when isBedtime is false', () => {
      const prompt = mewtwo.getSystemPrompt(false, false);
      expect(prompt).not.toContain('BEDTIME MODE');
    });

    it('does not include bedtime addendum when isBedtime is undefined', () => {
      const prompt = mewtwo.getSystemPrompt(false);
      expect(prompt).not.toContain('BEDTIME MODE');
    });

    it('includes bedtime addendum with story mode', () => {
      const prompt = mewtwo.getSystemPrompt(true, true);
      expect(prompt).toContain('bedtime story');
      expect(prompt).toContain('BEDTIME MODE');
    });

    it('has in-character bedtime language', () => {
      const prompt = mewtwo.getSystemPrompt(false, true);
      expect(prompt).toContain('legendary');
    });
  });
});

describe('kirby config', () => {
  it('has correct id', () => {
    expect(kirby.id).toBe('kirby');
  });

  it('has correct name', () => {
    expect(kirby.name).toBe('Kirby');
  });

  it('has image path', () => {
    expect(kirby.image).toContain('/kirby/kirby');
  });

  it('uses Puck voice', () => {
    expect(kirby.voice).toBe('Puck');
  });

  it('has theme with warm pink Dream Land colors', () => {
    expect(kirby.theme.bgDeep).toBe('#1a0515');
    expect(kirby.theme.bgMid).toBe('#2e1228');
    expect(kirby.theme.accent).toBe('#f472b6');
  });

  it('has aura colors for all voice states', () => {
    expect(kirby.theme.aura.idle).toBeDefined();
    expect(kirby.theme.aura.listening).toBeDefined();
    expect(kirby.theme.aura.speaking).toBeDefined();
    expect(kirby.theme.aura.processing).toBeDefined();
  });

  it('has ring colors for all voice states', () => {
    expect(kirby.theme.ring.idle).toBeDefined();
    expect(kirby.theme.ring.listening).toBeDefined();
    expect(kirby.theme.ring.speaking).toBeDefined();
    expect(kirby.theme.ring.processing).toBeDefined();
  });

  it('has pink micGradient', () => {
    expect(kirby.theme.micGradient).toContain('pink');
  });

  describe('getSystemPrompt', () => {
    it('returns normal prompt when not story mode', () => {
      const prompt = kirby.getSystemPrompt(false);
      expect(prompt).toContain('Kirby');
      expect(prompt).toContain('Dream Land');
      expect(prompt).not.toContain('bedtime story');
    });

    it('includes story prompt in story mode', () => {
      const prompt = kirby.getSystemPrompt(true);
      expect(prompt).toContain('Kirby');
      expect(prompt).toContain('bedtime story');
    });

    it('always returns a non-empty string', () => {
      expect(typeof kirby.getSystemPrompt(false)).toBe('string');
      expect(kirby.getSystemPrompt(false).length).toBeGreaterThan(0);
    });
  });

  describe('prompt content', () => {
    const prompt = kirby.getSystemPrompt(false);

    it('establishes Kirby identity', () => {
      expect(prompt).toContain('Kirby');
      expect(prompt).toContain('Star Warrior');
      expect(prompt).toContain('Dream Land');
    });

    it('includes Kirby world knowledge', () => {
      expect(prompt).toContain('King Dedede');
      expect(prompt).toContain('Meta Knight');
      expect(prompt).toContain('Copy Ability');
      expect(prompt).toContain('Warp Star');
    });

    it('includes personality traits', () => {
      expect(prompt).toContain('Happy');
      expect(prompt).toContain('bubbly');
      expect(prompt).toContain('food');
    });

    it('includes Poyo catchphrase', () => {
      expect(prompt).toContain('Poyo!');
    });

    it('mentions Damian', () => {
      expect(prompt).toContain('Damian');
    });

    it('specifies age-appropriate communication', () => {
      expect(prompt).toContain('5-year-old');
      expect(prompt).toContain('2-4 sentences');
    });

    it('includes parental goals', () => {
      expect(prompt).toContain('BRAVERY');
      expect(prompt).toContain('LEARNING');
      expect(prompt).toContain('SPORTS');
    });

    it('enforces never breaking character', () => {
      expect(prompt).toContain('NEVER break character');
      expect(prompt).toContain('NEVER say "I\'m an AI"');
    });

    it('does not contain profanity or inappropriate content', () => {
      const inappropriateWords = ['damn', 'hell', 'stupid', 'hate'];
      inappropriateWords.forEach(word => {
        expect(prompt.toLowerCase()).not.toContain(word);
      });
    });
  });

  describe('bedtime prompt', () => {
    it('appends bedtime addendum when isBedtime is true', () => {
      const prompt = kirby.getSystemPrompt(false, true);
      expect(prompt).toContain('BEDTIME MODE');
      expect(prompt).toContain('8:30 PM');
    });

    it('does not include bedtime addendum when isBedtime is false', () => {
      const prompt = kirby.getSystemPrompt(false, false);
      expect(prompt).not.toContain('BEDTIME MODE');
    });

    it('has in-character bedtime language', () => {
      const prompt = kirby.getSystemPrompt(false, true);
      expect(prompt).toContain('sleepy');
      expect(prompt).toContain('Dream Land');
    });
  });
});

describe('dragonite config', () => {
  it('has correct id', () => {
    expect(dragonite.id).toBe('dragonite');
  });

  it('has correct name', () => {
    expect(dragonite.name).toBe('Dragonite');
  });

  it('has image path', () => {
    expect(dragonite.image).toContain('/dragonite/dragonite');
  });

  it('uses Aoede voice', () => {
    expect(dragonite.voice).toBe('Aoede');
  });

  it('has theme with warm orange colors', () => {
    expect(dragonite.theme.bgDeep).toBe('#1a0d05');
    expect(dragonite.theme.bgMid).toBe('#2e1a0a');
    expect(dragonite.theme.accent).toBe('#fb923c');
  });

  it('has aura colors for all voice states', () => {
    expect(dragonite.theme.aura.idle).toBeDefined();
    expect(dragonite.theme.aura.listening).toBeDefined();
    expect(dragonite.theme.aura.speaking).toBeDefined();
    expect(dragonite.theme.aura.processing).toBeDefined();
  });

  it('has ring colors for all voice states', () => {
    expect(dragonite.theme.ring.idle).toBeDefined();
    expect(dragonite.theme.ring.listening).toBeDefined();
    expect(dragonite.theme.ring.speaking).toBeDefined();
    expect(dragonite.theme.ring.processing).toBeDefined();
  });

  it('has orange micGradient', () => {
    expect(dragonite.theme.micGradient).toContain('orange');
  });

  describe('getSystemPrompt', () => {
    it('returns normal prompt when not story mode', () => {
      const prompt = dragonite.getSystemPrompt(false);
      expect(prompt).toContain('Dragonite');
      expect(prompt).toContain('Dragon');
      expect(prompt).not.toContain('bedtime story');
    });

    it('includes story prompt in story mode', () => {
      const prompt = dragonite.getSystemPrompt(true);
      expect(prompt).toContain('Dragonite');
      expect(prompt).toContain('bedtime story');
    });

    it('always returns a non-empty string', () => {
      expect(typeof dragonite.getSystemPrompt(false)).toBe('string');
      expect(dragonite.getSystemPrompt(false).length).toBeGreaterThan(0);
    });
  });

  describe('prompt content', () => {
    const prompt = dragonite.getSystemPrompt(false);

    it('establishes Dragonite identity with Pokemon lore', () => {
      expect(prompt).toContain('Dragonite');
      expect(prompt).toContain('Dragon');
      expect(prompt).toContain('149');
    });

    it('includes key character traits', () => {
      expect(prompt).toContain('fly');
      expect(prompt).toContain('gentle');
      expect(prompt).toContain('mail');
    });

    it('includes Pokemon world knowledge', () => {
      expect(prompt).toContain('Lance');
      expect(prompt).toContain('Hyper Beam');
      expect(prompt).toContain('Dratini');
    });

    it('mentions Damian', () => {
      expect(prompt).toContain('Damian');
    });

    it('specifies age-appropriate communication', () => {
      expect(prompt).toContain('5-year-old');
      expect(prompt).toContain('2-4 sentences');
    });

    it('includes parental goals', () => {
      expect(prompt).toContain('BRAVERY');
      expect(prompt).toContain('LEARNING');
      expect(prompt).toContain('SPORTS');
    });

    it('enforces never breaking character', () => {
      expect(prompt).toContain('NEVER break character');
      expect(prompt).toContain('NEVER say "I\'m an AI"');
    });

    it('does not contain profanity or inappropriate content', () => {
      const inappropriateWords = ['damn', 'hell', 'stupid', 'hate'];
      inappropriateWords.forEach(word => {
        expect(prompt.toLowerCase()).not.toContain(word);
      });
    });
  });

  describe('bedtime prompt', () => {
    it('appends bedtime addendum when isBedtime is true', () => {
      const prompt = dragonite.getSystemPrompt(false, true);
      expect(prompt).toContain('BEDTIME MODE');
      expect(prompt).toContain('8:30 PM');
    });

    it('does not include bedtime addendum when isBedtime is false', () => {
      const prompt = dragonite.getSystemPrompt(false, false);
      expect(prompt).not.toContain('BEDTIME MODE');
    });

    it('has in-character bedtime language', () => {
      const prompt = dragonite.getSystemPrompt(false, true);
      expect(prompt).toContain('fly');
      expect(prompt).toContain('sleep');
    });
  });
});

describe('magolor config', () => {
  it('has correct id', () => {
    expect(magolor.id).toBe('magolor');
  });

  it('has correct name', () => {
    expect(magolor.name).toBe('Magolor');
  });

  it('has image path', () => {
    expect(magolor.image).toContain('/magolor/magolor');
  });

  it('uses Kore voice', () => {
    expect(magolor.voice).toBe('Kore');
  });

  it('has theme with deep blue-violet colors', () => {
    expect(magolor.theme.bgDeep).toBe('#0a0520');
    expect(magolor.theme.bgMid).toBe('#1a1035');
    expect(magolor.theme.accent).toBe('#818cf8');
  });

  it('has aura colors for all voice states', () => {
    expect(magolor.theme.aura.idle).toBeDefined();
    expect(magolor.theme.aura.listening).toBeDefined();
    expect(magolor.theme.aura.speaking).toBeDefined();
    expect(magolor.theme.aura.processing).toBeDefined();
  });

  it('has ring colors for all voice states', () => {
    expect(magolor.theme.ring.idle).toBeDefined();
    expect(magolor.theme.ring.listening).toBeDefined();
    expect(magolor.theme.ring.speaking).toBeDefined();
    expect(magolor.theme.ring.processing).toBeDefined();
  });

  it('has indigo micGradient', () => {
    expect(magolor.theme.micGradient).toContain('indigo');
  });

  describe('getSystemPrompt', () => {
    it('returns normal prompt when not story mode', () => {
      const prompt = magolor.getSystemPrompt(false);
      expect(prompt).toContain('Magolor');
      expect(prompt).toContain('Another Dimension');
      expect(prompt).not.toContain('bedtime story');
    });

    it('includes story prompt in story mode', () => {
      const prompt = magolor.getSystemPrompt(true);
      expect(prompt).toContain('Magolor');
      expect(prompt).toContain('bedtime story');
    });

    it('always returns a non-empty string', () => {
      expect(typeof magolor.getSystemPrompt(false)).toBe('string');
      expect(magolor.getSystemPrompt(false).length).toBeGreaterThan(0);
    });
  });

  describe('prompt content', () => {
    const prompt = magolor.getSystemPrompt(false);

    it('establishes Magolor identity with Kirby lore', () => {
      expect(prompt).toContain('Magolor');
      expect(prompt).toContain('Another Dimension');
      expect(prompt).toContain('Lor Starcutter');
    });

    it('includes reformed trickster backstory', () => {
      expect(prompt).toContain('Master Crown');
      expect(prompt).toContain('tricked');
      expect(prompt).toContain('friend');
    });

    it('includes Kirby world knowledge', () => {
      expect(prompt).toContain('Kirby');
      expect(prompt).toContain('King Dedede');
      expect(prompt).toContain('Meta Knight');
    });

    it('mentions Damian', () => {
      expect(prompt).toContain('Damian');
    });

    it('specifies age-appropriate communication', () => {
      expect(prompt).toContain('5-year-old');
      expect(prompt).toContain('2-4 sentences');
    });

    it('includes magic sounds', () => {
      expect(prompt).toContain('POOF!');
      expect(prompt).toContain('TA-DA!');
    });

    it('includes parental goals', () => {
      expect(prompt).toContain('BRAVERY');
      expect(prompt).toContain('LEARNING');
      expect(prompt).toContain('SPORTS');
    });

    it('enforces never breaking character', () => {
      expect(prompt).toContain('NEVER break character');
      expect(prompt).toContain('NEVER say "I\'m an AI"');
    });

    it('does not contain profanity or inappropriate content', () => {
      const inappropriateWords = ['damn', 'hell', 'stupid', 'hate'];
      inappropriateWords.forEach(word => {
        expect(prompt.toLowerCase()).not.toContain(word);
      });
    });
  });

  describe('bedtime prompt', () => {
    it('appends bedtime addendum when isBedtime is true', () => {
      const prompt = magolor.getSystemPrompt(false, true);
      expect(prompt).toContain('BEDTIME MODE');
      expect(prompt).toContain('8:30 PM');
    });

    it('does not include bedtime addendum when isBedtime is false', () => {
      const prompt = magolor.getSystemPrompt(false, false);
      expect(prompt).not.toContain('BEDTIME MODE');
    });

    it('has in-character bedtime language', () => {
      const prompt = magolor.getSystemPrompt(false, true);
      expect(prompt).toContain('dream spell');
      expect(prompt).toContain('magic');
    });
  });
});
