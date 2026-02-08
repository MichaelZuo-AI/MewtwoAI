# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MewtwoAI** - An interactive voice chat web application where kids can talk with Mewtwo, the legendary Pokémon character. Built with Next.js 14, React, TypeScript, and Google Gemini 2.5 Flash Native Audio Dialog for real-time bidirectional voice.

### Key Features
- Real-time bidirectional voice via Gemini Live API (WebSocket)
- AI-powered responses with kid-friendly Mewtwo personality
- Voice Activity Detection handles turn-taking automatically
- Story time mode for bedtime stories
- Conversation history persistence (via transcriptions)
- Mobile-first PWA design

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Create .env.local file with required API keys
cp .env.example .env.local
# Then edit .env.local with your actual API keys
```

### Development
```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
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

### Tech Stack
- **Frontend**: Next.js 14 App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with custom Mewtwo theme
- **AI + Voice**: Google Gemini 2.5 Flash Native Audio Dialog (`@google/genai` SDK)
- **Storage**: LocalStorage for offline-first experience
- **Deployment**: Vercel recommended

### Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── gemini-token/  # Ephemeral token endpoint for Live API
│   ├── page.tsx           # Main page component
│   ├── layout.tsx         # Root layout with PWA config
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── VoiceChat.tsx      # Main voice chat interface
│   ├── MewtwoCharacter.tsx # Animated character display
│   ├── ChatBubble.tsx     # Message bubble component
│   └── StoryTimeButton.tsx # Story mode toggle
├── hooks/                 # Custom React hooks
│   ├── useGeminiLive.ts   # Central hook: token, WebSocket, audio, transcription
│   ├── useAudioCapture.ts # Microphone capture -> PCM 16kHz base64
│   └── useAudioPlayback.ts # PCM 24kHz base64 -> speaker playback queue
├── lib/                   # Utility libraries
│   ├── mewtwo-prompts.ts  # AI personality system prompts
│   └── storage.ts         # LocalStorage utilities
└── types/                 # TypeScript type definitions
    └── chat.ts
```

### Key Design Decisions

1. **Gemini Native Audio Dialog**: Bidirectional WebSocket — no separate STT/TTS services needed
2. **Ephemeral Tokens**: Server-side token creation keeps API key secure; browser connects directly
3. **VAD (Voice Activity Detection)**: Gemini handles turn-taking; 2s silence threshold for kids
4. **LocalStorage First**: Offline-first with conversation persistence via transcriptions
5. **Mobile-First UI**: Large touch targets, responsive design, PWA capabilities
6. **Safety Built-In**: Age-appropriate content filtering in system prompts

### AI Personality Configuration

Mewtwo's personality is defined in `src/lib/mewtwo-prompts.ts`:
- Wise, powerful, but kind and patient
- Kid-friendly language (5-year-old appropriate)
- Short responses (2-4 sentences)
- Encouraging and educational
- Story time mode for longer narratives
- Voice: Fenrir (excitable, kid-friendly — configured in `useGeminiLive.ts`)

### Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Safari (iOS/macOS)**: Full support
- **Android Chrome**: Full support
- **Firefox**: Limited (AudioContext/getUserMedia may vary)

## Important Notes

### When Making Changes

- Always test voice features on actual mobile devices (iOS Safari, Android Chrome)
- Keep responses kid-friendly and age-appropriate
- Large UI elements for 5-year-old usability
- Verify conversation history persists across page reloads
- The `useGeminiLive` hook is the central orchestrator — changes to audio flow go there

### Safety & Content
- All content must be G-rated and educational
- No external links or inappropriate references
- System prompts include content filtering
- Parent controls via conversation history access

### Future Enhancements
- Multiple Pokémon characters
- Voice cloning from movie audio
- Mini-games and activities
- Cloud sync with Supabase
- Parental controls dashboard

### Cost Considerations
- Gemini API: Free tier available
- Vercel: Free for personal use
