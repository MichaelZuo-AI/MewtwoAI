export interface VocabularyEntry {
  word: string;
  firstSeen: number;       // timestamp
  lastSeen: number;        // timestamp
  correctUses: number;
  struggles: number;
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
}

export interface SessionSummary {
  id: string;
  date: string;            // YYYY-MM-DD
  timestamp: number;
  characterId: string;
  newWords: string[];
  reviewedWords: string[];
  struggles: string[];
  topicsCovered: string[];
  grammarNotes: string[];
  transcriptLength: number;
}

export interface LearningProfile {
  vocabulary: VocabularyEntry[];
  sessions: SessionSummary[];
  currentFocus: string[];   // max 3 words
  lastUpdated: number;
}

export interface CurriculumPlan {
  wordsToReview: string[];
  newWordSuggestion: string;
  suggestedActivity: string;
  knownWordsSnapshot: string[];
}
