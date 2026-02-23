import { LearningProfile, VocabularyEntry, SessionSummary, CurriculumPlan } from '@/types/learning';
import type { LearningAnalysisResult } from '@/app/api/analyze-learning/route';

// Status transitions: new (1 use) → learning (2) → reviewing (3+) → mastered (5+ uses, struggles < correctUses/2)
function computeStatus(entry: VocabularyEntry): VocabularyEntry['status'] {
  if (entry.correctUses >= 5 && entry.struggles < entry.correctUses / 2) {
    return 'mastered';
  }
  if (entry.correctUses >= 3) {
    return 'reviewing';
  }
  if (entry.correctUses >= 2) {
    return 'learning';
  }
  return 'new';
}

export function updateLearningProfile(
  profile: LearningProfile | null,
  analysis: LearningAnalysisResult,
  characterId: string,
  transcriptLength: number
): LearningProfile {
  const now = Date.now();
  const existing = profile || {
    vocabulary: [],
    sessions: [],
    currentFocus: [],
    lastUpdated: now,
  };

  const vocabMap = new Map<string, VocabularyEntry>();
  for (const entry of existing.vocabulary) {
    vocabMap.set(entry.word.toLowerCase(), entry);
  }

  // Process new words
  for (const word of analysis.newWords) {
    const key = word.toLowerCase();
    if (!vocabMap.has(key)) {
      vocabMap.set(key, {
        word: key,
        firstSeen: now,
        lastSeen: now,
        correctUses: 1,
        struggles: 0,
        status: 'new',
      });
    } else {
      const entry = vocabMap.get(key)!;
      entry.correctUses++;
      entry.lastSeen = now;
      entry.status = computeStatus(entry);
    }
  }

  // Process reviewed words
  for (const word of analysis.reviewedWords) {
    const key = word.toLowerCase();
    if (vocabMap.has(key)) {
      const entry = vocabMap.get(key)!;
      entry.correctUses++;
      entry.lastSeen = now;
      entry.status = computeStatus(entry);
    } else {
      // Known word we hadn't tracked yet — start with 2 uses (already known + this review)
      vocabMap.set(key, {
        word: key,
        firstSeen: now,
        lastSeen: now,
        correctUses: 2,
        struggles: 0,
        status: 'learning',
      });
    }
  }

  // Process struggles
  for (const word of analysis.struggles) {
    const key = word.toLowerCase();
    if (vocabMap.has(key)) {
      const entry = vocabMap.get(key)!;
      entry.struggles++;
      entry.lastSeen = now;
      entry.status = computeStatus(entry);
    } else {
      vocabMap.set(key, {
        word: key,
        firstSeen: now,
        lastSeen: now,
        correctUses: 0,
        struggles: 1,
        status: 'new',
      });
    }
  }

  // Build session summary
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(now));
  const session: SessionSummary = {
    id: crypto.randomUUID(),
    date: dateStr,
    timestamp: now,
    characterId,
    newWords: analysis.newWords.map(w => w.toLowerCase()),
    reviewedWords: analysis.reviewedWords.map(w => w.toLowerCase()),
    struggles: analysis.struggles.map(w => w.toLowerCase()),
    topicsCovered: analysis.topicsCovered,
    grammarNotes: analysis.grammarNotes,
    transcriptLength,
  };

  const sessions = [...existing.sessions, session].slice(-50);

  // Update current focus: top 3 struggling words
  const currentFocus = Array.from(vocabMap.values())
    .filter(e => e.struggles > 0 && e.status !== 'mastered')
    .sort((a, b) => b.struggles - a.struggles)
    .slice(0, 3)
    .map(e => e.word);

  return {
    vocabulary: Array.from(vocabMap.values()),
    sessions,
    currentFocus,
    lastUpdated: now,
  };
}

// ~150 age-appropriate words by category
export const WORD_BANK: Record<string, string[]> = {
  colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black', 'white', 'brown', 'gray', 'rainbow'],
  animals: ['cat', 'dog', 'fish', 'bird', 'bear', 'lion', 'tiger', 'elephant', 'rabbit', 'monkey', 'duck', 'frog', 'snake', 'horse', 'cow'],
  food: ['apple', 'banana', 'cake', 'cookie', 'milk', 'water', 'rice', 'bread', 'egg', 'cheese', 'pizza', 'noodle', 'chicken', 'ice cream', 'candy'],
  actions: ['run', 'jump', 'swim', 'fly', 'eat', 'drink', 'sleep', 'play', 'sing', 'dance', 'read', 'draw', 'climb', 'throw', 'catch'],
  feelings: ['happy', 'sad', 'angry', 'scared', 'brave', 'tired', 'hungry', 'silly', 'excited', 'surprised', 'kind', 'proud'],
  family: ['mom', 'dad', 'brother', 'sister', 'grandma', 'grandpa', 'baby', 'friend', 'teacher', 'family'],
  nature: ['sun', 'moon', 'star', 'tree', 'flower', 'rain', 'snow', 'wind', 'cloud', 'ocean', 'mountain', 'river', 'sky', 'grass', 'rock'],
  body: ['head', 'hand', 'foot', 'eye', 'ear', 'nose', 'mouth', 'arm', 'leg', 'hair', 'finger', 'tooth'],
  toys: ['ball', 'car', 'train', 'doll', 'robot', 'block', 'puzzle', 'game', 'book', 'crayon', 'kite', 'drum'],
  weather: ['hot', 'cold', 'sunny', 'rainy', 'windy', 'snowy', 'cloudy', 'warm', 'cool', 'foggy'],
  numbers: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  places: ['home', 'school', 'park', 'store', 'beach', 'zoo', 'library', 'garden', 'kitchen', 'bedroom'],
};

const ACTIVITY_MAP: Record<string, string> = {
  colors: 'What Color Game — point to things and name their colors!',
  animals: 'Animal Sound Game — make animal sounds and guess the animal!',
  food: 'Food Quiz — describe a food and guess what it is!',
  actions: 'Simon Says — practice action words with Simon Says!',
  feelings: 'Feelings Check-in — how are you feeling today? Use feeling words!',
  numbers: 'Counting Adventure — count things around you!',
  default: 'Would You Rather — pick between two fun choices!',
};

export function computeCurriculum(profile: LearningProfile): CurriculumPlan {
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  const knownWords = profile.vocabulary
    .filter(e => e.status === 'mastered' || e.status === 'reviewing')
    .map(e => e.word);

  // Words to review: mastered/reviewing words not seen in 7+ days
  const wordsToReview = profile.vocabulary
    .filter(e => (e.status === 'mastered' || e.status === 'reviewing') && (now - e.lastSeen) > SEVEN_DAYS)
    .sort((a, b) => a.lastSeen - b.lastSeen)
    .slice(0, 3)
    .map(e => e.word);

  // All known words (for excluding from word bank)
  const allKnownSet = new Set(profile.vocabulary.map(e => e.word));

  // Find recent topics to prefer related categories
  const recentTopics = profile.sessions
    .slice(-3)
    .flatMap(s => s.topicsCovered)
    .map(t => t.toLowerCase());

  // Pick a new word suggestion
  let newWordSuggestion = '';
  const categories = Object.keys(WORD_BANK);

  // Try to find a word from a category related to recent topics first
  const preferredCategories = categories.filter(cat =>
    recentTopics.some(topic => topic.includes(cat) || cat.includes(topic))
  );

  const categoryOrder = [
    ...preferredCategories,
    ...categories.filter(c => !preferredCategories.includes(c)),
  ];

  for (const category of categoryOrder) {
    const unknownWords = WORD_BANK[category].filter(w => !allKnownSet.has(w));
    if (unknownWords.length > 0) {
      newWordSuggestion = unknownWords[Math.floor(Math.random() * unknownWords.length)];
      break;
    }
  }

  if (!newWordSuggestion) {
    newWordSuggestion = 'wonderful'; // fallback if all words are known
  }

  // Suggest activity based on struggle patterns
  let suggestedActivity = ACTIVITY_MAP.default;
  const recentStruggles = profile.sessions
    .slice(-3)
    .flatMap(s => s.struggles);

  if (recentStruggles.length > 0) {
    // Check if struggles match any category
    for (const [category, words] of Object.entries(WORD_BANK)) {
      if (recentStruggles.some(s => words.includes(s))) {
        suggestedActivity = ACTIVITY_MAP[category] || ACTIVITY_MAP.default;
        break;
      }
    }
  }

  return {
    wordsToReview,
    newWordSuggestion,
    suggestedActivity,
    knownWordsSnapshot: knownWords,
  };
}
