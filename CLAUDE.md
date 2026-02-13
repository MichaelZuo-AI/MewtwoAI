# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Dream Buddies** — An interactive voice chat web app where kids talk with their favorite characters to **improve English**. Built with Next.js 14, React, TypeScript, and Google Gemini 2.5 Flash Native Audio Dialog for real-time bidirectional voice.

### Key Features
- 6 characters: Mewtwo, Kirby, Dragonite, Magolor, Minions, Snorlax — each with unique voice, personality, and theme
- Swipe left/right to switch characters with slide animations
- Real-time bidirectional voice via Gemini Live API (WebSocket)
- English learning focus: gentle correction, simple words, one new word at a time
- Story time mode for bedtime stories (3-5 min, continuous)
- Bedtime mode (8:30 PM KST): all characters gently encourage sleep
- Voice Activity Detection handles turn-taking (2s chat, 5s story)
- Conversation history persistence via transcriptions
- Mobile-first PWA design, large touch targets for 5-year-olds

## Development Commands

### Setup
```bash
npm install
cp .env.example .env.local   # Then edit with your API key
```

### Development
```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run linter
npm test           # Run all 591 unit tests (14 suites)
```

### Environment Variables Required
- `GEMINI_API_KEY`: Google Gemini API key (free at https://aistudio.google.com/app/apikey)
- `NEXT_PUBLIC_APP_URL`: App URL (default: http://localhost:3000)

## Architecture

### Audio Flow
```
Browser microphone -> PCM 16kHz -> Gemini WebSocket -> PCM 24kHz -> speaker
                                                    -> transcriptions -> chat bubbles
```

### Component Tree
```
page.tsx (selectedCharacterId in localStorage)
  ├── CharacterSelect (2×3 grid of tappable portraits)
  └── VoiceChat(character, onBack) ← swipe left/right to switch
       ├── useSwipeGesture hook (touch events, 80px threshold)
       ├── CharacterDisplay (animated character + aura + crossfade)
       ├── CharacterDots (active character indicator)
       ├── useGeminiLive(character) → WebSocket + audio + KST bedtime
       └── MicButton, ChatPeek, ChatDrawer, SettingsMenu, StoryTimeButton
```

### Tech Stack
- **Frontend**: Next.js 14 App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with per-character themes
- **AI + Voice**: Google Gemini 2.5 Flash Native Audio Dialog (`@google/genai` v1.5.0)
- **Storage**: LocalStorage for offline-first experience
- **Testing**: Jest 30, React Testing Library (591 tests)
- **Deployment**: Vercel (auto-deploys on push to main)

### Project Structure
```
src/
├── app/
│   ├── api/gemini-token/     # Ephemeral token endpoint (validates characterId, passes bedtime)
│   ├── page.tsx              # Character selection + swipe wrapper + slide animations
│   ├── layout.tsx            # Root layout with PWA config
│   └── globals.css           # All animations (float, speak, listen, think, slide, aura)
├── components/
│   ├── VoiceChat.tsx         # Main voice chat interface
│   ├── CharacterDisplay.tsx  # Animated character + aura + resolveImage() + crossfade
│   ├── CharacterSelect.tsx   # Character selection grid
│   ├── CharacterDots.tsx     # Active character dot indicator
│   ├── ChatDrawer.tsx        # Expandable chat transcript
│   ├── ChatPeek.tsx          # Latest message peek
│   ├── MicButton.tsx         # Microphone control
│   ├── SettingsMenu.tsx      # Settings panel
│   └── StoryTimeButton.tsx   # Story mode toggle
├── hooks/
│   ├── useGeminiLive.ts      # Central orchestrator: token, WebSocket, audio, bedtime
│   ├── useAudioCapture.ts    # Microphone capture -> PCM 16kHz base64
│   ├── useAudioPlayback.ts   # PCM 24kHz base64 -> speaker playback queue
│   └── useSwipeGesture.ts    # Touch swipe detection (horizontal/vertical locking)
├── lib/
│   ├── characters/           # Character configs (one file per character)
│   │   ├── index.ts          # Registry: getCharacter, getAllCharacters, getNext/Previous
│   │   ├── mewtwo.ts         # Mewtwo: Fenrir voice, purple theme, bedtime addendum
│   │   ├── kirby.ts          # Kirby: Puck voice, pink theme, bedtime addendum
│   │   ├── dragonite.ts      # Dragonite: Aoede voice, orange theme, bedtime addendum
│   │   ├── magolor.ts        # Magolor: Kore voice, indigo theme, bedtime addendum
│   │   ├── minions.ts        # Minions: Zephyr voice, yellow theme, bedtime addendum
│   │   └── snorlax.ts        # Snorlax: Charon voice, teal theme, bedtime addendum
│   └── storage.ts            # LocalStorage utilities
└── types/
    ├── character.ts           # CharacterConfig, CharacterTheme, CharacterStateImages
    └── chat.ts                # Message, VoiceState, LiveConnectionState
```

### Key Design Decisions

1. **Multi-character system**: Each character is a self-contained config file. Adding a character = new file + one import. No type changes needed
2. **Gemini Native Audio Dialog**: Bidirectional WebSocket — no separate STT/TTS services, $0 cost
3. **Ephemeral Tokens**: Server-side token creation keeps API key secure; browser connects directly
4. **VAD**: Gemini handles turn-taking; 2s silence for chat, 5s for story mode
5. **Bedtime via KST**: Uses `Intl.DateTimeFormat.formatToParts()` with `Asia/Seoul` timezone — NOT device local time, NOT `new Date(toLocaleString())`
6. **State-based images ready**: `CharacterStateImages` type + `resolveImage()` + crossfade infrastructure exists. Currently all characters use single image string
7. **Swipe navigation**: Circular character switching with direction locking, drag resistance, 80px threshold

### Character System

Each character file (`src/lib/characters/*.ts`) exports a `CharacterConfig` with:
- `id`, `name`, `image` (path to artwork in `public/`)
- `voice` (Gemini voice name)
- `theme` (background colors, aura colors per voice state, ring colors, mic gradient)
- `getSystemPrompt(isStoryMode, isBedtime?, kstTimeString?)` — returns full system instruction

| Character | Voice | Theme Color | Personality |
|-----------|-------|-------------|-------------|
| Mewtwo | Fenrir | Purple | Wise, philosophical protector |
| Kirby | Puck | Pink | Happy, bubbly, food-obsessed |
| Dragonite | Aoede | Orange | Warm, gentle, huggable giant |
| Magolor | Kore | Indigo | Clever, magical, reformed trickster |
| Minions | Zephyr | Yellow | Silly, chaotic, banana-loving trio |
| Snorlax | Charon | Teal | Sleepy, gentle, cozy giant |

### Bedtime Mode

Triggers at 8:30 PM KST. Each character has a `bedtimeAddendum(kstTimeString)` function that appends to the system prompt. The addendum includes:
- The actual Korean time (e.g. "20:45")
- Explicit instruction: "do NOT use any other time source"
- "It IS nighttime" assertion (prevents Gemini from using its UTC clock)
- In-character sleep encouragement

**Why this matters**: Gemini has an internal UTC clock and WILL tell the child "it's morning" if you don't override it with the actual local time.

## Important Notes

### When Making Changes
- Always test voice features on actual mobile devices (iOS Safari, Android Chrome)
- Keep responses kid-friendly and age-appropriate for a 5-year-old
- Large UI elements for small fingers
- The `useGeminiLive` hook is the central orchestrator — audio flow changes go there
- Character prompts focus on English learning — preserve the "HELPING DAMIAN WITH ENGLISH" section
- Use `@google/genai` SDK (NOT `@google/generative-ai`)
- AudioContext MUST use native sample rate (48kHz), downsample to 16kHz

### Adding a New Character
1. Create `src/lib/characters/newchar.ts` with `CharacterConfig`
2. Add import + entry in `src/lib/characters/index.ts`
3. Drop artwork at `public/newchar/newchar.png`
4. That's it — circular navigation, selection screen, and theme all auto-adapt

### Safety & Content
- All content must be G-rated and educational
- No external links or inappropriate references
- System prompts include content filtering and "never break character" rules
- Parent has access to conversation history

### Cost Considerations
- Gemini API: Free tier (no cost)
- Vercel: Free for personal use
