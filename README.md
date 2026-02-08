# MewtwoAI

A kid-friendly voice chat application that lets children have real-time conversations with Mewtwo, the legendary psychic Pokemon. Designed for ages 5 and up.

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

- **Voice Conversations** -- Push-to-talk and auto-listen modes using the Web Speech API
- **AI-Powered Responses** -- Google Gemini 1.5 Flash generates age-appropriate, in-character replies
- **Text-to-Speech** -- ElevenLabs integration with automatic browser TTS fallback
- **Story Time Mode** -- Mewtwo tells original Pokemon bedtime stories
- **Conversation History** -- Chat sessions persist in localStorage across page reloads
- **Mobile-First Design** -- Large touch targets, responsive layout, installable as a PWA

## Requirements

| Requirement | Details |
|------------|---------|
| Node.js | v18 or higher |
| GEMINI_API_KEY | Required. Free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| ELEVENLABS_API_KEY | Optional. Falls back to browser speech synthesis if not set |
| Browser | Chrome, Edge, or Safari recommended |

## Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here    # optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to Play

1. **Talk to Mewtwo** -- Press the microphone button and speak. Mewtwo will listen, think, and respond with voice and text.
2. **Auto Mode** -- Toggle auto mode for hands-free back-and-forth conversation. Mewtwo listens again automatically after each response.
3. **Story Time** -- Tap the Story Time button in the top-right corner. Ask Mewtwo to tell a story and it will generate a kid-friendly Pokemon adventure.
4. **Stop** -- Press the Stop button at any time to interrupt speech and listening.

## Commands

```bash
npm run dev            # Start development server on port 3000
npm run build          # Build for production
npm start              # Start production server
npm test               # Run all 258 unit tests
npm run test:coverage  # Run tests with coverage report
npm run lint           # Run ESLint
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript, React 18 |
| AI | Google Gemini 1.5 Flash |
| Voice Input | Web Speech API (browser native) |
| Voice Output | ElevenLabs API / browser speechSynthesis |
| Styling | Tailwind CSS |
| Storage | localStorage (offline-first) |
| Testing | Jest 30, React Testing Library |

## Project Structure

```
src/
  app/
    api/
      chat/route.ts           # Gemini streaming chat endpoint
      tts/route.ts             # ElevenLabs TTS endpoint (501 fallback)
    page.tsx                   # Main page
    layout.tsx                 # Root layout with PWA config
  components/
    VoiceChat.tsx              # Main voice chat interface
    MewtwoCharacter.tsx        # Animated character with state indicators
    ChatBubble.tsx             # User/assistant message bubbles
    StoryTimeButton.tsx        # Story mode toggle
  hooks/
    useConversation.ts         # Chat state management, SSE stream parsing
    useSpeechRecognition.ts    # Web Speech API wrapper (ref-based callbacks)
    useTextToSpeech.ts         # TTS with audio queue and browser fallback
  lib/
    gemini.ts                  # Gemini client (lazy singleton, key validation)
    mewtwo-prompts.ts          # System prompts for Mewtwo personality
    storage.ts                 # localStorage CRUD (UUID-based IDs)
  types/
    chat.ts                    # Message, Conversation, VoiceState types
```

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome / Edge | Full support (recommended) |
| Safari (iOS / macOS) | Full support |
| Android Chrome | Full support |
| Firefox | Limited -- speech recognition not fully supported |

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add `GEMINI_API_KEY` and optionally `ELEVENLABS_API_KEY` in the Vercel dashboard under Settings > Environment Variables.

### Install as PWA

Once deployed, users can install the app to their home screen:

- **iOS**: Safari > Share > Add to Home Screen
- **Android**: Chrome > Menu > Install App

## Cost

| Service | Cost |
|---------|------|
| Google Gemini API | Free tier (15 requests/min, 1M tokens/day) |
| ElevenLabs TTS | Free tier (10,000 characters/month) or browser TTS at $0 |
| Vercel hosting | Free for personal use |

## Testing

258 unit tests across 11 suites cover all application layers:

- **Library modules** -- Storage operations, Gemini client initialization, prompt generation
- **React hooks** -- Conversation management, speech recognition lifecycle, TTS queue and fallback
- **Components** -- ChatBubble rendering, MewtwoCharacter animation states, StoryTimeButton toggling
- **API routes** -- Chat streaming endpoint, TTS endpoint with fallback behavior

```bash
npm test
```

## Safety

All content is designed for children ages 5 and up:

- System prompts enforce age-appropriate, positive, educational responses
- Mewtwo is configured as a kind, patient, and encouraging character
- No external links, no violent or scary themes
- Conversation history is accessible to parents via the browser

## Customization

- **Personality** -- Edit `src/lib/mewtwo-prompts.ts` to adjust Mewtwo's character traits, communication style, or story themes
- **Voice** -- Change the ElevenLabs voice ID in `src/app/api/tts/route.ts`
- **Theme** -- Modify colors and animations in `tailwind.config.js`

## License

This project is for personal and educational use. Pokemon is a trademark of Nintendo / Game Freak / Creatures Inc.
