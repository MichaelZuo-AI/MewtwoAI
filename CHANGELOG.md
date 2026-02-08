# Changelog

All notable changes to MewtwoAI will be documented in this file.

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
