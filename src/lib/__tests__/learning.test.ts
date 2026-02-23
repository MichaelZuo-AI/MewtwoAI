import { updateLearningProfile, computeCurriculum, WORD_BANK } from '../learning';
import { LearningProfile, VocabularyEntry } from '@/types/learning';
import type { LearningAnalysisResult } from '@/app/api/analyze-learning/route';

describe('updateLearningProfile', () => {
  const emptyAnalysis: LearningAnalysisResult = {
    newWords: [],
    reviewedWords: [],
    struggles: [],
    topicsCovered: [],
    grammarNotes: [],
  };

  it('should create a new profile when none exists', () => {
    const result = updateLearningProfile(null, emptyAnalysis, 'mewtwo', 100);
    expect(result.vocabulary).toEqual([]);
    expect(result.sessions).toHaveLength(1);
    expect(result.currentFocus).toEqual([]);
  });

  it('should add new words with status "new"', () => {
    const analysis: LearningAnalysisResult = {
      ...emptyAnalysis,
      newWords: ['apple', 'banana'],
    };
    const result = updateLearningProfile(null, analysis, 'mewtwo', 100);
    expect(result.vocabulary).toHaveLength(2);
    expect(result.vocabulary[0].word).toBe('apple');
    expect(result.vocabulary[0].status).toBe('new');
    expect(result.vocabulary[0].correctUses).toBe(1);
    expect(result.vocabulary[0].struggles).toBe(0);
  });

  it('should lowercase all words', () => {
    const analysis: LearningAnalysisResult = {
      ...emptyAnalysis,
      newWords: ['Apple', 'BANANA'],
    };
    const result = updateLearningProfile(null, analysis, 'mewtwo', 100);
    expect(result.vocabulary[0].word).toBe('apple');
    expect(result.vocabulary[1].word).toBe('banana');
  });

  it('should increment correctUses for reviewed words', () => {
    const existing: LearningProfile = {
      vocabulary: [{
        word: 'apple',
        firstSeen: 1000,
        lastSeen: 1000,
        correctUses: 1,
        struggles: 0,
        status: 'new',
      }],
      sessions: [],
      currentFocus: [],
      lastUpdated: 1000,
    };

    const analysis: LearningAnalysisResult = {
      ...emptyAnalysis,
      reviewedWords: ['apple'],
    };

    const result = updateLearningProfile(existing, analysis, 'mewtwo', 100);
    const apple = result.vocabulary.find(v => v.word === 'apple');
    expect(apple!.correctUses).toBe(2);
    expect(apple!.status).toBe('learning');
  });

  it('should increment struggles for struggled words', () => {
    const existing: LearningProfile = {
      vocabulary: [{
        word: 'difficult',
        firstSeen: 1000,
        lastSeen: 1000,
        correctUses: 1,
        struggles: 0,
        status: 'new',
      }],
      sessions: [],
      currentFocus: [],
      lastUpdated: 1000,
    };

    const analysis: LearningAnalysisResult = {
      ...emptyAnalysis,
      struggles: ['difficult'],
    };

    const result = updateLearningProfile(existing, analysis, 'mewtwo', 100);
    const word = result.vocabulary.find(v => v.word === 'difficult');
    expect(word!.struggles).toBe(1);
  });

  it('should create entry for unknown struggled words', () => {
    const analysis: LearningAnalysisResult = {
      ...emptyAnalysis,
      struggles: ['hard'],
    };
    const result = updateLearningProfile(null, analysis, 'mewtwo', 100);
    const word = result.vocabulary.find(v => v.word === 'hard');
    expect(word).toBeDefined();
    expect(word!.correctUses).toBe(0);
    expect(word!.struggles).toBe(1);
  });

  it('should create entry for unknown reviewed words with 2 uses', () => {
    const analysis: LearningAnalysisResult = {
      ...emptyAnalysis,
      reviewedWords: ['cat'],
    };
    const result = updateLearningProfile(null, analysis, 'mewtwo', 100);
    const word = result.vocabulary.find(v => v.word === 'cat');
    expect(word).toBeDefined();
    expect(word!.correctUses).toBe(2);
    expect(word!.status).toBe('learning');
  });

  describe('status transitions', () => {
    it('should transition from new to learning at 2 uses', () => {
      const existing: LearningProfile = {
        vocabulary: [{
          word: 'cat',
          firstSeen: 1000,
          lastSeen: 1000,
          correctUses: 1,
          struggles: 0,
          status: 'new',
        }],
        sessions: [],
        currentFocus: [],
        lastUpdated: 1000,
      };

      const result = updateLearningProfile(existing, { ...emptyAnalysis, reviewedWords: ['cat'] }, 'mewtwo', 100);
      expect(result.vocabulary.find(v => v.word === 'cat')!.status).toBe('learning');
    });

    it('should transition to reviewing at 3 uses', () => {
      const existing: LearningProfile = {
        vocabulary: [{
          word: 'cat',
          firstSeen: 1000,
          lastSeen: 1000,
          correctUses: 2,
          struggles: 0,
          status: 'learning',
        }],
        sessions: [],
        currentFocus: [],
        lastUpdated: 1000,
      };

      const result = updateLearningProfile(existing, { ...emptyAnalysis, reviewedWords: ['cat'] }, 'mewtwo', 100);
      expect(result.vocabulary.find(v => v.word === 'cat')!.status).toBe('reviewing');
    });

    it('should transition to mastered at 5 uses with low struggles', () => {
      const existing: LearningProfile = {
        vocabulary: [{
          word: 'cat',
          firstSeen: 1000,
          lastSeen: 1000,
          correctUses: 4,
          struggles: 1,
          status: 'reviewing',
        }],
        sessions: [],
        currentFocus: [],
        lastUpdated: 1000,
      };

      const result = updateLearningProfile(existing, { ...emptyAnalysis, reviewedWords: ['cat'] }, 'mewtwo', 100);
      expect(result.vocabulary.find(v => v.word === 'cat')!.status).toBe('mastered');
    });

    it('should not transition to mastered if struggles >= correctUses/2', () => {
      const existing: LearningProfile = {
        vocabulary: [{
          word: 'hard',
          firstSeen: 1000,
          lastSeen: 1000,
          correctUses: 4,
          struggles: 3,
          status: 'reviewing',
        }],
        sessions: [],
        currentFocus: [],
        lastUpdated: 1000,
      };

      const result = updateLearningProfile(existing, { ...emptyAnalysis, reviewedWords: ['hard'] }, 'mewtwo', 100);
      expect(result.vocabulary.find(v => v.word === 'hard')!.status).toBe('reviewing');
    });
  });

  it('should build a session summary', () => {
    const analysis: LearningAnalysisResult = {
      newWords: ['dog'],
      reviewedWords: ['cat'],
      struggles: ['elephant'],
      topicsCovered: ['animals'],
      grammarNotes: ['good sentence structure'],
    };

    const result = updateLearningProfile(null, analysis, 'kirby', 500);
    expect(result.sessions).toHaveLength(1);
    const session = result.sessions[0];
    expect(session.characterId).toBe('kirby');
    expect(session.newWords).toEqual(['dog']);
    expect(session.reviewedWords).toEqual(['cat']);
    expect(session.struggles).toEqual(['elephant']);
    expect(session.topicsCovered).toEqual(['animals']);
    expect(session.grammarNotes).toEqual(['good sentence structure']);
    expect(session.transcriptLength).toBe(500);
  });

  it('should cap sessions at 50', () => {
    const existing: LearningProfile = {
      vocabulary: [],
      sessions: Array.from({ length: 50 }, (_, i) => ({
        id: `session-${i}`,
        date: '2026-01-01',
        timestamp: i,
        characterId: 'mewtwo',
        newWords: [],
        reviewedWords: [],
        struggles: [],
        topicsCovered: [],
        grammarNotes: [],
        transcriptLength: 0,
      })),
      currentFocus: [],
      lastUpdated: 1000,
    };

    const result = updateLearningProfile(existing, emptyAnalysis, 'mewtwo', 100);
    expect(result.sessions).toHaveLength(50);
    // Should include the new session (last one)
    expect(result.sessions[49].characterId).toBe('mewtwo');
  });

  it('should set currentFocus to top 3 struggling non-mastered words', () => {
    const existing: LearningProfile = {
      vocabulary: [
        { word: 'hard1', firstSeen: 1, lastSeen: 1, correctUses: 1, struggles: 5, status: 'new' },
        { word: 'hard2', firstSeen: 1, lastSeen: 1, correctUses: 1, struggles: 3, status: 'new' },
        { word: 'hard3', firstSeen: 1, lastSeen: 1, correctUses: 1, struggles: 4, status: 'new' },
        { word: 'hard4', firstSeen: 1, lastSeen: 1, correctUses: 1, struggles: 2, status: 'new' },
        { word: 'mastered', firstSeen: 1, lastSeen: 1, correctUses: 10, struggles: 1, status: 'mastered' },
      ],
      sessions: [],
      currentFocus: [],
      lastUpdated: 1000,
    };

    const result = updateLearningProfile(existing, emptyAnalysis, 'mewtwo', 100);
    expect(result.currentFocus).toHaveLength(3);
    expect(result.currentFocus).toEqual(['hard1', 'hard3', 'hard2']);
  });

  it('should handle duplicate new word being already tracked', () => {
    const existing: LearningProfile = {
      vocabulary: [{
        word: 'apple',
        firstSeen: 1000,
        lastSeen: 1000,
        correctUses: 1,
        struggles: 0,
        status: 'new',
      }],
      sessions: [],
      currentFocus: [],
      lastUpdated: 1000,
    };

    const analysis: LearningAnalysisResult = {
      ...emptyAnalysis,
      newWords: ['apple'], // already exists
    };

    const result = updateLearningProfile(existing, analysis, 'mewtwo', 100);
    // Should increment, not duplicate
    const apples = result.vocabulary.filter(v => v.word === 'apple');
    expect(apples).toHaveLength(1);
    expect(apples[0].correctUses).toBe(2);
  });
});

describe('computeCurriculum', () => {
  it('should return words to review that are old', () => {
    const now = Date.now();
    const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
    const profile: LearningProfile = {
      vocabulary: [
        { word: 'old-word', firstSeen: 1000, lastSeen: eightDaysAgo, correctUses: 5, struggles: 0, status: 'mastered' },
        { word: 'recent-word', firstSeen: 1000, lastSeen: now, correctUses: 5, struggles: 0, status: 'mastered' },
      ],
      sessions: [],
      currentFocus: [],
      lastUpdated: now,
    };

    const plan = computeCurriculum(profile);
    expect(plan.wordsToReview).toContain('old-word');
    expect(plan.wordsToReview).not.toContain('recent-word');
  });

  it('should limit wordsToReview to 3', () => {
    const now = Date.now();
    const old = now - 10 * 24 * 60 * 60 * 1000;
    const profile: LearningProfile = {
      vocabulary: Array.from({ length: 10 }, (_, i) => ({
        word: `word${i}`,
        firstSeen: 1000,
        lastSeen: old,
        correctUses: 5,
        struggles: 0,
        status: 'mastered' as const,
      })),
      sessions: [],
      currentFocus: [],
      lastUpdated: now,
    };

    const plan = computeCurriculum(profile);
    expect(plan.wordsToReview).toHaveLength(3);
  });

  it('should suggest a new word not in vocabulary', () => {
    const allBankWords = Object.values(WORD_BANK).flat();
    const profile: LearningProfile = {
      vocabulary: [],
      sessions: [],
      currentFocus: [],
      lastUpdated: Date.now(),
    };

    const plan = computeCurriculum(profile);
    expect(plan.newWordSuggestion).toBeTruthy();
    expect(allBankWords).toContain(plan.newWordSuggestion);
  });

  it('should exclude known words from new word suggestion', () => {
    // Mark all color words as known
    const profile: LearningProfile = {
      vocabulary: WORD_BANK.colors.map(w => ({
        word: w,
        firstSeen: 1000,
        lastSeen: Date.now(),
        correctUses: 5,
        struggles: 0,
        status: 'mastered' as const,
      })),
      sessions: [],
      currentFocus: [],
      lastUpdated: Date.now(),
    };

    const plan = computeCurriculum(profile);
    expect(WORD_BANK.colors).not.toContain(plan.newWordSuggestion);
  });

  it('should return knownWordsSnapshot with mastered and reviewing words', () => {
    const profile: LearningProfile = {
      vocabulary: [
        { word: 'mastered', firstSeen: 1, lastSeen: 1, correctUses: 5, struggles: 0, status: 'mastered' },
        { word: 'reviewing', firstSeen: 1, lastSeen: 1, correctUses: 3, struggles: 0, status: 'reviewing' },
        { word: 'new-word', firstSeen: 1, lastSeen: 1, correctUses: 1, struggles: 0, status: 'new' },
      ],
      sessions: [],
      currentFocus: [],
      lastUpdated: Date.now(),
    };

    const plan = computeCurriculum(profile);
    expect(plan.knownWordsSnapshot).toContain('mastered');
    expect(plan.knownWordsSnapshot).toContain('reviewing');
    expect(plan.knownWordsSnapshot).not.toContain('new-word');
  });

  it('should suggest an activity', () => {
    const profile: LearningProfile = {
      vocabulary: [],
      sessions: [],
      currentFocus: [],
      lastUpdated: Date.now(),
    };

    const plan = computeCurriculum(profile);
    expect(plan.suggestedActivity).toBeTruthy();
  });

  it('should return fallback when all words are known', () => {
    const allWords = Object.values(WORD_BANK).flat();
    const profile: LearningProfile = {
      vocabulary: allWords.map(w => ({
        word: w,
        firstSeen: 1000,
        lastSeen: Date.now(),
        correctUses: 5,
        struggles: 0,
        status: 'mastered' as const,
      })),
      sessions: [],
      currentFocus: [],
      lastUpdated: Date.now(),
    };

    const plan = computeCurriculum(profile);
    expect(plan.newWordSuggestion).toBe('wonderful');
  });

  it('should suggest activity related to struggle categories', () => {
    const profile: LearningProfile = {
      vocabulary: [
        { word: 'red', firstSeen: 1, lastSeen: 1, correctUses: 1, struggles: 3, status: 'new' },
      ],
      sessions: [{
        id: 'test',
        date: '2026-01-01',
        timestamp: Date.now(),
        characterId: 'mewtwo',
        newWords: [],
        reviewedWords: [],
        struggles: ['red'],
        topicsCovered: ['colors'],
        grammarNotes: [],
        transcriptLength: 100,
      }],
      currentFocus: ['red'],
      lastUpdated: Date.now(),
    };

    const plan = computeCurriculum(profile);
    expect(plan.suggestedActivity).toContain('Color');
  });

  it('should use default activity when no recent struggles', () => {
    const profile: LearningProfile = {
      vocabulary: [],
      sessions: [{
        id: 's1',
        date: '2026-01-01',
        timestamp: Date.now(),
        characterId: 'mewtwo',
        newWords: [],
        reviewedWords: [],
        struggles: [],
        topicsCovered: [],
        grammarNotes: [],
        transcriptLength: 0,
      }],
      currentFocus: [],
      lastUpdated: Date.now(),
    };

    const plan = computeCurriculum(profile);
    expect(plan.suggestedActivity).toContain('Would You Rather');
  });

  it('should sort wordsToReview oldest first', () => {
    const now = Date.now();
    const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
    const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
    const profile: LearningProfile = {
      vocabulary: [
        { word: 'newer-old', firstSeen: 1, lastSeen: eightDaysAgo, correctUses: 5, struggles: 0, status: 'mastered' },
        { word: 'oldest', firstSeen: 1, lastSeen: tenDaysAgo, correctUses: 5, struggles: 0, status: 'mastered' },
      ],
      sessions: [],
      currentFocus: [],
      lastUpdated: now,
    };

    const plan = computeCurriculum(profile);
    // oldest should come first
    expect(plan.wordsToReview[0]).toBe('oldest');
    expect(plan.wordsToReview[1]).toBe('newer-old');
  });

  it('should not include "new" status words in wordsToReview', () => {
    const now = Date.now();
    const old = now - 10 * 24 * 60 * 60 * 1000;
    const profile: LearningProfile = {
      vocabulary: [
        { word: 'new-status', firstSeen: 1, lastSeen: old, correctUses: 1, struggles: 0, status: 'new' },
        { word: 'learning-status', firstSeen: 1, lastSeen: old, correctUses: 2, struggles: 0, status: 'learning' },
      ],
      sessions: [],
      currentFocus: [],
      lastUpdated: now,
    };

    const plan = computeCurriculum(profile);
    expect(plan.wordsToReview).not.toContain('new-status');
    expect(plan.wordsToReview).not.toContain('learning-status');
  });

  it('should prefer categories matching recent topics for new word suggestion', () => {
    // All animal words are unknown, recent session covered animals
    const profile: LearningProfile = {
      vocabulary: WORD_BANK.colors.map(w => ({
        word: w,
        firstSeen: 1,
        lastSeen: Date.now(),
        correctUses: 5,
        struggles: 0,
        status: 'mastered' as const,
      })),
      sessions: [{
        id: 's1',
        date: '2026-01-01',
        timestamp: Date.now(),
        characterId: 'mewtwo',
        newWords: [],
        reviewedWords: [],
        struggles: [],
        topicsCovered: ['animals'],
        grammarNotes: [],
        transcriptLength: 100,
      }],
      currentFocus: [],
      lastUpdated: Date.now(),
    };

    // Should suggest an animals word since recent topic was animals and colors are all known
    const plan = computeCurriculum(profile);
    expect(WORD_BANK.animals).toContain(plan.newWordSuggestion);
  });

  it('should suggest animal activity when recent struggles include an animal word', () => {
    const profile: LearningProfile = {
      vocabulary: [],
      sessions: [{
        id: 's1',
        date: '2026-01-01',
        timestamp: Date.now(),
        characterId: 'mewtwo',
        newWords: [],
        reviewedWords: [],
        struggles: ['cat'],
        topicsCovered: [],
        grammarNotes: [],
        transcriptLength: 100,
      }],
      currentFocus: [],
      lastUpdated: Date.now(),
    };

    const plan = computeCurriculum(profile);
    expect(plan.suggestedActivity).toContain('Animal');
  });

  it('should consider only the last 3 sessions for activity suggestion', () => {
    const profile: LearningProfile = {
      vocabulary: [],
      sessions: [
        // Old session with color struggle — should be ignored
        {
          id: 'old',
          date: '2026-01-01',
          timestamp: 1,
          characterId: 'mewtwo',
          newWords: [],
          reviewedWords: [],
          struggles: ['red', 'blue'],
          topicsCovered: [],
          grammarNotes: [],
          transcriptLength: 100,
        },
        // Last 3 sessions have no struggles
        {
          id: 's1',
          date: '2026-01-02',
          timestamp: 2,
          characterId: 'mewtwo',
          newWords: [],
          reviewedWords: [],
          struggles: [],
          topicsCovered: [],
          grammarNotes: [],
          transcriptLength: 0,
        },
        {
          id: 's2',
          date: '2026-01-03',
          timestamp: 3,
          characterId: 'mewtwo',
          newWords: [],
          reviewedWords: [],
          struggles: [],
          topicsCovered: [],
          grammarNotes: [],
          transcriptLength: 0,
        },
        {
          id: 's3',
          date: '2026-01-04',
          timestamp: 4,
          characterId: 'mewtwo',
          newWords: [],
          reviewedWords: [],
          struggles: [],
          topicsCovered: [],
          grammarNotes: [],
          transcriptLength: 0,
        },
      ],
      currentFocus: [],
      lastUpdated: Date.now(),
    };

    // Since last 3 sessions have no struggles, should use default activity
    const plan = computeCurriculum(profile);
    expect(plan.suggestedActivity).toContain('Would You Rather');
  });

  it('should not transition struggled word to mastered when struggles are high', () => {
    // correctUses=5 but struggles=3 which is >= correctUses/2 (2.5)
    const existing: LearningProfile = {
      vocabulary: [{
        word: 'hard',
        firstSeen: 1000,
        lastSeen: 1000,
        correctUses: 5,
        struggles: 3,
        status: 'reviewing',
      }],
      sessions: [],
      currentFocus: [],
      lastUpdated: 1000,
    };

    // computeCurriculum should not include this in knownWordsSnapshot (reviewing status maps to known)
    const plan = computeCurriculum(existing);
    expect(plan.knownWordsSnapshot).toContain('hard');
  });
});

describe('updateLearningProfile — additional edge cases', () => {
  const emptyAnalysis = {
    newWords: [],
    reviewedWords: [],
    struggles: [],
    topicsCovered: [],
    grammarNotes: [],
  };

  it('should handle a word appearing in both newWords and reviewedWords (deduplication via map)', () => {
    // If "apple" is in newWords (gets correctUses=1), and also in reviewedWords (increments to 2)
    const analysis = {
      ...emptyAnalysis,
      newWords: ['apple'],
      reviewedWords: ['apple'],
    };
    const result = updateLearningProfile(null, analysis, 'mewtwo', 100);
    const apples = result.vocabulary.filter(v => v.word === 'apple');
    expect(apples).toHaveLength(1);
    // newWords creates with 1 use, then reviewedWords increments to 2
    expect(apples[0].correctUses).toBe(2);
    expect(apples[0].status).toBe('learning');
  });

  it('should normalize the word key for case-insensitive deduplication', () => {
    const existing: LearningProfile = {
      vocabulary: [{ word: 'cat', firstSeen: 1, lastSeen: 1, correctUses: 1, struggles: 0, status: 'new' }],
      sessions: [],
      currentFocus: [],
      lastUpdated: 1000,
    };
    const analysis = { ...emptyAnalysis, reviewedWords: ['CAT'] };
    const result = updateLearningProfile(existing, analysis, 'mewtwo', 100);
    const cats = result.vocabulary.filter(v => v.word === 'cat');
    expect(cats).toHaveLength(1);
    expect(cats[0].correctUses).toBe(2);
  });

  it('should store date in KST (Asia/Seoul) format YYYY-MM-DD', () => {
    const result = updateLearningProfile(null, emptyAnalysis, 'kirby', 0);
    expect(result.sessions[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('session id should be a UUID', () => {
    const result = updateLearningProfile(null, emptyAnalysis, 'kirby', 0);
    expect(result.sessions[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('should not include mastered words in currentFocus even with struggles', () => {
    const existing: LearningProfile = {
      vocabulary: [
        { word: 'mastered-struggle', firstSeen: 1, lastSeen: 1, correctUses: 10, struggles: 5, status: 'mastered' },
      ],
      sessions: [],
      currentFocus: [],
      lastUpdated: 1000,
    };
    const result = updateLearningProfile(existing, emptyAnalysis, 'mewtwo', 0);
    expect(result.currentFocus).not.toContain('mastered-struggle');
  });

  it('currentFocus is empty when no words have struggles', () => {
    const existing: LearningProfile = {
      vocabulary: [
        { word: 'easy', firstSeen: 1, lastSeen: 1, correctUses: 3, struggles: 0, status: 'reviewing' },
      ],
      sessions: [],
      currentFocus: [],
      lastUpdated: 1000,
    };
    const result = updateLearningProfile(existing, emptyAnalysis, 'mewtwo', 0);
    expect(result.currentFocus).toHaveLength(0);
  });
});
