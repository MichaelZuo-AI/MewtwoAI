# AI Dream Buddies

An interactive voice chat app where kids talk with their favorite characters to **learn English**. Powered by Gemini 2.5 Flash Native Audio Dialog for real-time bidirectional voice -- completely free.

**4 characters** | **Swipe to switch** | **Bedtime mode** | **Persistent memory** | **$0 cost**

## Quick Start

```bash
git clone https://github.com/AIDreamWorks/MewtwoAI.git
cd MewtwoAI
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY
npm run dev                   # open http://localhost:3000
```

Get a free API key at [aistudio.google.com](https://aistudio.google.com/app/apikey).

## Characters

| Character | Personality | Voice |
|-----------|-------------|-------|
| **Mewtwo** | Wise, philosophical protector | Fenrir |
| **Kirby** | Happy, bubbly, food-obsessed | Puck |
| **Dragonite** | Warm, gentle, huggable giant | Aoede |
| **Magolor** | Clever, magical, reformed trickster | Kore |

Each character has unique theme colors, personality, mini-games, and story style. Swipe left/right to switch characters during a conversation.

## Features

- **Real-Time Voice** -- Bidirectional audio via Gemini Live API (WebSocket, no text intermediary)
- **English Learning** -- Gentle correction, simple words, one new word at a time, two-choice questions
- **Chinese-English Bridge** -- Characters naturally bridge Chinese words to English for bilingual families
- **Persistent Memory** -- Characters remember facts about your child across sessions via lazy fact extraction
- **Mini-Games** -- 5 themed games per character (quizzes, counting, sounds, would-you-rather)
- **Mood Awareness** -- Characters adapt when the child is sad, shy, or excited
- **Story Time** -- Each character tells original bedtime stories in their voice (3-5 min)
- **Bedtime Mode** -- After 8:30 PM KST, characters gently encourage sleep
- **Time-of-Day Greetings** -- Morning energy, afternoon play, evening calm
- **Speaker Recognition** -- Detects child vs. parent voices; speaks normally to adults
- **Auto-Reconnect** -- 3 retries with exponential backoff on connection drops
- **Mobile-First PWA** -- Large touch targets, installable to home screen

## How It Works

```
Browser mic -> PCM 16kHz -> Gemini WebSocket -> PCM 24kHz -> speaker
                                             -> transcriptions -> chat bubbles
```

Audio goes directly from the microphone to Gemini's WebSocket. No separate STT/TTS services needed. An ephemeral token endpoint keeps the API key secure.

### Memory System

Characters accumulate facts about your child across sessions:
1. On disconnect: raw transcript saved to localStorage (synchronous, crash-safe)
2. On next connect: Gemini Flash extracts facts, merges with existing knowledge
3. Facts are shared across all characters -- tell Mewtwo something, Kirby knows too

## Requirements

| Requirement | Details |
|------------|---------|
| Node.js | v18+ |
| GEMINI_API_KEY | Free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| Browser | Chrome, Edge, or Safari (needs microphone) |

## Commands

```bash
npm run dev        # Development server on :3000
npm run build      # Production build
npm test           # 511 unit tests
npm run lint       # ESLint
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript, React 18 |
| AI + Voice | Gemini 2.5 Flash Native Audio Dialog |
| Styling | Tailwind CSS |
| Storage | localStorage (offline-first) |
| Testing | Jest 30, React Testing Library |
| Deployment | Vercel (auto-deploys on push) |

## Project Structure

```
src/
  app/
    api/
      gemini-token/route.ts       # Ephemeral token endpoint
      extract-memories/route.ts   # Fact extraction via Gemini Flash
    page.tsx                      # Character selection + swipe wrapper
  components/
    VoiceChat.tsx                 # Main voice chat interface
    CharacterDisplay.tsx          # Animated character + aura + crossfade
    CharacterSelect.tsx           # Character selection grid
    CharacterDots.tsx             # Active character indicator
  hooks/
    useGeminiLive.ts              # Central orchestrator: WebSocket, audio, memory, bedtime
    useAudioCapture.ts            # Mic -> PCM 16kHz base64
    useAudioPlayback.ts           # PCM 24kHz base64 -> speaker
    useSwipeGesture.ts            # Touch swipe with direction locking
  lib/
    characters/                   # One config file per character
      index.ts                    # Registry + navigation helpers
      mewtwo.ts, kirby.ts, dragonite.ts, magolor.ts
    storage.ts                    # localStorage: conversations, memory, facts
  types/
    character.ts                  # CharacterConfig, CharacterTheme
    chat.ts                       # Message, VoiceState, LiveConnectionState
```

## Adding a Character

1. Create `src/lib/characters/newchar.ts` with a `CharacterConfig`
2. Add one import in `src/lib/characters/index.ts`
3. Drop artwork at `public/newchar/newchar.png`

That's it -- selection screen, swipe navigation, themes, and bedtime mode all auto-adapt.

## Deploy

```bash
vercel
```

Add `GEMINI_API_KEY` in Vercel dashboard > Settings > Environment Variables.

**Install as PWA:**
- iOS: Safari > Share > Add to Home Screen
- Android: Chrome > Menu > Install App

## Cost

| Service | Cost |
|---------|------|
| Gemini API | Free tier |
| Vercel | Free for personal use |

## Safety

All content is G-rated and educational:
- System prompts enforce age-appropriate, positive responses
- Characters never break character or reference being AI
- No external links, no scary content
- Parents can access conversation history in the browser

---

## Changelog

### v0.9.0 -- 2026-02-12
**Persistent Memory + Enhanced Prompts**
- Persistent character memory: facts accumulate across sessions via lazy Gemini extraction
- Memory robustness: 200KB size cap, duplicate save prevention, crash-safe checkpoints, 5s fetch timeout, auth on extraction API
- Enhanced prompts: mood-responsive behavior, vocabulary progression, Chinese-English bridge, 5 mini-games per character, time-of-day awareness
- `clearAll()` now properly clears all storage keys
- Magolor duplicate prompt section fixed
- Empty API response no longer wipes existing facts
- 511 tests

### v0.8.0 -- 2026-02-09
**Speaker Recognition + Carousel Navigation**
- Voice-based speaker detection: Damian (child), Dad/Michael (adult male), Mom (adult female)
- Adults get normal conversation; child gets learning mode
- Carousel-style character switching with adjacent previews
- Cross-session character memory via localStorage
- Bedtime mode scoped to child voice only (parents can chat normally)

### v0.7.0 -- 2026-02-09
**Educational Depth**
- Science exploration, values, and life wisdom woven into all character prompts
- Gaming redirection: characters gently steer from pure game talk to real-world wonder
- Mewtwo enhanced with deeper educational content
- 91 new tests across 7 suites

### v0.6.0 -- 2026-02-08
**Bedtime Mode**
- Bedtime detection at 8:30 PM KST using `Intl.DateTimeFormat.formatToParts()`
- Per-character bedtime addendum with actual KST time in prompt
- Explicit model clock override (Gemini has UTC internal clock)
- Extended to 8:30 PM -- 7:30 AM window
- Runtime fixes: corrupted audio crash, race conditions, leaked resources

### v0.5.0 -- 2026-02-08
**4 Characters + English Learning**
- Added Dragonite (Aoede voice, orange theme) and Magolor (Kore voice, indigo theme)
- Replaced all placeholder SVGs with official game artwork
- English learning focus: simple words, gentle correction, patterns, two-choice questions
- Per-character themes, aura colors, and ring indicators

### v0.4.0 -- 2026-02-08
**Multi-Character + Swipe Navigation**
- Multi-character system: Mewtwo + Kirby with character selection screen
- Swipe left/right to switch characters (80px threshold, direction locking)
- Per-character voice, theme colors, and system prompts
- Circular navigation with slide-in animations
- Character dot indicators

### v0.3.0 -- 2026-02-08
**Kid-Friendly Redesign**
- Visual-first UI with animated 2D character and state indicators
- Story time mode with auto-continuation (up to 10 segments)
- Screen wake lock for iPad
- Auto-reconnect with exponential backoff (3 retries)
- PWA icons and home screen install

### v0.2.0 -- 2026-02-08
**Gemini Live API Migration**
- Migrated from OpenAI to Gemini 2.5 Flash Native Audio Dialog
- Bidirectional WebSocket audio (no separate STT/TTS)
- Ephemeral token endpoint for secure browser connections
- Voice Activity Detection for natural turn-taking

### v0.1.0 -- 2026-02-08
**Initial Release**
- Single-character voice chat with Mewtwo
- Real-time audio via WebSocket
- Conversation history in localStorage
- Basic PWA support

## License

This project is for personal and educational use. Pokemon characters are trademarks of Nintendo / Game Freak / Creatures Inc. Kirby characters are trademarks of Nintendo / HAL Laboratory.
