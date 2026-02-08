# MewtwoAI

A kid-friendly voice chat application that lets children have real-time conversations with Mewtwo, the legendary psychic Pokemon. Powered by Gemini 2.5 Flash Native Audio Dialog for low-latency bidirectional voice.

## Quick Start (3 Minutes)

```bash
# 1. Clone and install
git clone https://github.com/AIDreamWorks/MewtwoAI.git
cd MewtwoAI
npm install

# 2. Add your API key
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
# Get a free key at https://aistudio.google.com/app/apikey

# 3. Start the app
npm run dev
```

Open **http://localhost:3000** in Chrome or Safari, tap the microphone button, and start talking to Mewtwo.

## Features

- **Real-Time Voice** -- Bidirectional audio via Gemini Live API (no text intermediary)
- **AI-Powered Responses** -- Google Gemini 2.5 Flash Native Audio Dialog with kid-friendly Mewtwo personality
- **Natural Conversation** -- Voice Activity Detection handles turn-taking automatically
- **Story Time Mode** -- Mewtwo tells original Pokemon bedtime stories
- **Conversation History** -- Transcriptions persist in localStorage across page reloads
- **Mobile-First Design** -- Large touch targets, responsive layout, installable as a PWA

## Requirements

| Requirement | Details |
|------------|---------|
| Node.js | v18 or higher |
| GEMINI_API_KEY | Required. Free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| Browser | Chrome, Edge, or Safari recommended (needs microphone access) |

## Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to Play

1. **Connect** -- Press the microphone button. The app will request microphone permission and connect to Mewtwo.
2. **Talk** -- Just speak naturally. Gemini's Voice Activity Detection handles turn-taking -- it knows when you're done speaking and responds automatically.
3. **Story Time** -- Tap the Story Time button. Mewtwo will reconnect in story mode and tell kid-friendly Pokemon adventures.
4. **Disconnect** -- Press the stop button to end the conversation.

## Architecture

```
Browser microphone -> PCM 16kHz -> Gemini WebSocket -> PCM 24kHz -> speaker
                                                    -> transcriptions -> chat bubbles
```

The app uses Gemini's native audio dialog mode. Audio goes directly from the microphone to Gemini's WebSocket, and Gemini responds with voice audio. No text-to-speech service or speech recognition API is needed -- Gemini handles everything natively.

An ephemeral token endpoint (`/api/gemini-token`) creates single-use tokens so the browser can connect to Gemini's WebSocket without exposing the API key.

## Commands

```bash
npm run dev            # Start development server on port 3000
npm run build          # Build for production
npm start              # Start production server
npm test               # Run unit tests
npm run test:coverage  # Run tests with coverage report
npm run lint           # Run ESLint
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript, React 18 |
| AI + Voice | Google Gemini 2.5 Flash Native Audio Dialog (WebSocket) |
| Styling | Tailwind CSS |
| Storage | localStorage (offline-first) |
| Testing | Jest 30, React Testing Library |

## Project Structure

```
src/
  app/
    api/
      gemini-token/route.ts    # Ephemeral token endpoint for Live API
    page.tsx                   # Main page
    layout.tsx                 # Root layout with PWA config
  components/
    VoiceChat.tsx              # Main voice chat interface
    MewtwoCharacter.tsx        # Animated character with state indicators
    ChatBubble.tsx             # User/assistant message bubbles
    StoryTimeButton.tsx        # Story mode toggle
  hooks/
    useGeminiLive.ts           # Central hook: token, WebSocket, audio, transcription
    useAudioCapture.ts         # Microphone capture -> PCM 16kHz base64
    useAudioPlayback.ts        # PCM 24kHz base64 -> speaker playback queue
  lib/
    mewtwo-prompts.ts          # System prompts for Mewtwo personality
    storage.ts                 # localStorage CRUD (UUID-based IDs)
  types/
    chat.ts                    # Message, Conversation, VoiceState, LiveConnectionState
```

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome / Edge | Full support (recommended) |
| Safari (iOS / macOS) | Full support |
| Android Chrome | Full support |
| Firefox | Limited -- AudioContext/getUserMedia may vary |

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add `GEMINI_API_KEY` in the Vercel dashboard under Settings > Environment Variables.

### Install as PWA

Once deployed, users can install the app to their home screen:

- **iOS**: Safari > Share > Add to Home Screen
- **Android**: Chrome > Menu > Install App

## Cost

| Service | Cost |
|---------|------|
| Google Gemini API | Free tier available |
| Vercel hosting | Free for personal use |

## Safety

All content is designed for children ages 5 and up:

- System prompts enforce age-appropriate, positive, educational responses
- Mewtwo is configured as a kind, patient, and encouraging character
- No external links, no violent or scary themes
- Conversation history is accessible to parents via the browser

## Customization

- **Personality** -- Edit `src/lib/mewtwo-prompts.ts` to adjust Mewtwo's character traits, communication style, or story themes
- **Voice** -- Change the `voiceName` in `src/hooks/useGeminiLive.ts` (e.g., `Charon`, `Kore`, `Fenrir`, `Aoede`)
- **Theme** -- Modify colors and animations in `tailwind.config.js`

## License

This project is for personal and educational use. Pokemon is a trademark of Nintendo / Game Freak / Creatures Inc.
