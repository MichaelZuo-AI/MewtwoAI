# Changelog

All notable changes to MewtwoAI will be documented in this file.

## [0.6.0] - 2026-02-09

### Added
- **Science & exploration prompts** -- each character inspires real-world curiosity through their unique lens: Mewtwo (DNA, space, physics), Kirby (nature, food science, ecology), Dragonite (geography, weather, oceans, animals), Magolor (engineering, inventions, space)
- **Values & character education** -- all 4 characters now teach kindness, honesty, sharing, empathy, perseverance, and gratitude through in-character stories. Magolor also teaches saying sorry (fits his redemption arc)
- **Gaming redirection** -- characters gently steer pure gaming talk toward real-world wonder, outdoor exploration, and hands-on experiments without shaming

### Changed
- Expanded "YOUR MISSION WITH DAMIAN" section in all 4 character prompts from 3 themes to 5+
- Each character's science theme is unique to their world and personality

## [0.5.0] - 2026-02-08

### Added
- **Bedtime mode (8:30 PM KST)** -- all 4 characters gently encourage Damian to go to sleep after bedtime
- Bedtime detection uses `Intl.DateTimeFormat.formatToParts()` with `Asia/Seoul` timezone for reliable KST time
- Each character has in-character bedtime addendum with the actual Korean time embedded in the prompt
- Explicit "do NOT use any other time source" instruction overrides Gemini's internal UTC clock
- `isBedtime` and `kstTimeString` passed through token API to system prompt

### Added (infrastructure)
- `CharacterStateImages` type for per-state character artwork (idle, listening, speaking, processing)
- `resolveImage()` helper exported from CharacterDisplay for image resolution
- Image crossfade (150ms opacity transition) and preloading support in CharacterDisplay
- Currently unused (all characters use single image string) — ready for when proper artwork is available

### Fixed
- Bedtime prompt no longer uses `new Date(toLocaleString())` which re-parses in device local timezone
- Gemini no longer contradicts bedtime by saying "it's morning" — actual KST time is embedded in prompt

### Changed
- `CharacterConfig.getSystemPrompt` signature: `(isStoryMode, isBedtime?, kstTimeString?)`
- `CharacterConfig.image` type: `string | CharacterStateImages`
- Token API accepts `isBedtime` and `kstTimeString` in request body
- `CharacterSelect` uses `resolveImage()` for image source

## [0.4.0] - 2026-02-08

### Added
- **4 playable characters**: Mewtwo, Kirby, Dragonite, Magolor — each with unique voice, personality, theme, and prompts
- **Swipe-to-switch characters** -- horizontal swipe with direction locking, drag resistance, 80px threshold, circular navigation
- **Character selection screen** -- grid of tappable portraits with accent color glow
- **Character dot indicators** -- shows active character during voice chat
- **English learning focus** -- all 4 characters have "HELPING DAMIAN WITH ENGLISH" prompt sections with techniques: simple words, gentle correction, one new word at a time, two-choice questions, celebrate effort
- **Per-character themes** -- background colors, aura colors, ring colors, mic gradients unique to each character
- **Per-character voices** -- Mewtwo (Fenrir), Kirby (Puck), Dragonite (Aoede), Magolor (Kore)
- **Per-character story mode** -- each character tells bedtime stories in their own voice and world
- **Slide-in animations** -- CSS slide transitions when switching characters
- `useSwipeGesture` hook for touch gesture detection
- `CharacterDots` component for active character indicator
- `CharacterDisplay` component with animated aura effects per voice state
- Server-side characterId validation in token API (rejects unknown IDs with 400)
- Official artwork for all 4 characters (replaced SVG placeholders)
- 431 unit tests across 13 suites (up from 283 across 10)

### Changed
- Architecture refactored from single-character to multi-character system
- Character configs are self-contained files in `src/lib/characters/`
- `useGeminiLive` accepts `CharacterConfig` parameter instead of hardcoded Mewtwo
- Token API reads `characterId` from request body
- VoiceChat unmounts/remounts on character switch for clean WebSocket teardown
- Selection persisted in localStorage

### Removed
- Old `src/lib/mewtwo-prompts.ts` (prompts now live in character config files)
- Unused SVG placeholder files for Kirby, Dragonite, Magolor

## [0.3.1] - 2026-02-08

### Added
- **Screen Wake Lock** -- keeps iPad/phone screen on during voice chat so the connection stays alive; automatically re-acquires lock after screen unlock

## [0.3.0] - 2026-02-08

### Added
- **Auto-reconnect on WebSocket drop** -- 3 retries with exponential backoff (1s, 2s, 4s) for reliable connections on mobile/Vercel
- **Reconnecting UI state** -- yellow pulsing button and status banner when reconnecting; users can cancel by tapping stop
- **Kid-friendly Fenrir voice** -- switched from Charon (Informative) to Fenrir (Excitable) for warmer, more animated conversations
- **Voice acting directions** -- new HOW YOU SPEAK section in system prompt: enthusiastic expressions, sound effects ("WHOOSH!", "BOOM!"), warm address ("young trainer", "brave one")
- **Parental goals** -- new YOUR MISSION WITH DAMIAN section encouraging bravery, learning, and sports through Pokemon analogies
- **Story mode continuous narration** -- Mewtwo now tells complete 3-5 minute stories without stopping mid-story
- **Adaptive VAD silence** -- 2s silence threshold for chat, 5s for story mode so Mewtwo keeps talking
- **VoiceChat unit tests** -- 39 new tests covering rendering, connection states, reconnecting UI, and user interactions
- **Expanded test coverage** -- 283 tests across 10 suites (up from 204 across 9 suites)

### Fixed
- **Connection drops on Vercel/iPad** -- auto-reconnect handles network switches, screen locks, and Safari backgrounding
- **Story mode interruptions** -- explicit prompt override bypasses "2-4 sentences" rule during story time
- **switchStoryMode race condition** -- tracked timeout prevents zombie sessions from double-tap
- **Concurrent connect() calls** -- isConnectingRef guard prevents overlapping WebSocket connections
- **Stale audio on reconnect** -- audio queue cleared in onclose handler before reconnecting
- **Lost transcripts on disconnect** -- pending transcripts flushed in onclose before reconnection
- **Reconnect failure gives up too early** -- catch block now retries on reconnect failures instead of stopping immediately
- **onopen after manual disconnect** -- guard prevents state update if user disconnected during connection

### Changed
- `LiveConnectionState` type now includes `'reconnecting'` state
- System prompt is more expressive and animated for kid-friendly voice interaction
- VoiceChat button behavior updated to allow canceling reconnection attempts

## [0.2.0] - 2026-02-07

### Added
- PWA icons (192x192 and 512x512) for home screen installation
- Animated 2D Mewtwo character with CSS animations per voice state (idle, listening, speaking, processing)
- Official Ken Sugimori Mewtwo artwork

### Removed
- 3D character components (MewtwoCharacter3D, MewtwoModel, etc.)
- three.js, @react-three/fiber, @react-three/drei dependencies
- Unused R3F jest mocks and mewtwo.glb model

## [0.1.0] - 2026-02-06

### Added
- Real-time bidirectional voice chat via Gemini Live API (WebSocket)
- AI-powered responses with Google Gemini 2.5 Flash Native Audio Dialog
- Kid-friendly Mewtwo personality system prompts
- Voice Activity Detection for automatic turn-taking
- Story time mode for bedtime stories
- Conversation history persistence via localStorage
- Ephemeral token endpoint for secure API key handling
- Mobile-first PWA design with large touch targets
- Audio capture (PCM 16kHz) and playback (PCM 24kHz) hooks
- 204 unit tests across 9 test suites
